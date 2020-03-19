// tslint-disable @typescript-eslint/no-var-requires
const v4 = require('uuid').v4
const http = require('http')
const finalhandler = require('finalhandler')
const serveStatic = require('serve-static')
const WebSocket = require('ws')
const joblist = require('./jobs.json')
const qualificationlist = require('./qualifications.json')

var serve = serveStatic("./dist")

var server = http.createServer(function (req, res) {
  var done = finalhandler(req, res)
  serve(req, res, done)
});

server.listen(process.env.PORT);

const wss = new WebSocket.Server({noServer: true })

// Take over websocket connections
server.on('upgrade', function upgrade(request, socket, head) {
  wss.handleUpgrade(request, socket, head, function done(ws) {
    wss.emit('connection', ws, request);
  })
})

console.log(`Listening on port ${process.env.PORT}`)

const CARDSDEALTCOUNT = 4
const POOLCARDSCOUNT = 10

const state = {
  allJobs: [],
  allQualifications: [],
  round: {
    mode: 'deck', // 'interview'
    qualificationPool: [],
    job: '',
    shownCards: [],
    players: {}
  }
}

// Load data from lists in to memory
state.allJobs = joblist
state.allQualifications = qualificationlist

function broadcast () {
  // Update all players
  wss.clients.forEach(function each (client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ round: state.round }))
    }
  })
}

function playCard (player, payload) {
  if (!player.cards.includes(state.round.shownCards[0])) state.round.shownCards = [] // Reset if new user clicking cards
  if (!state.round.shownCards.includes(payload.handCard)) { // Stop dupes
    state.round.shownCards.push(payload.handCard)
  }
  broadcast()
}

function randomSubCollection (sourceArr, excludeArr, outputLength) {
  const result = []
  if (sourceArr.length < outputLength) throw new Error('Array too short to shuffle')
  while (result.length < outputLength) {
    const candidateItem = sourceArr[Math.floor(Math.random() * sourceArr.length)]
    if (result.includes(candidateItem)) continue
    if (excludeArr.includes(candidateItem)) continue
    result.push(candidateItem) // Add if unique to result array
  }
  return result
}

function resetRound () {
  state.round.job = randomSubCollection(state.allJobs, [], 1)[0]
  const connectedPlayers = Object.keys(state.round.players).length
  const qualificationCardsNeeded = (
    (connectedPlayers - 1 > 0 ? connectedPlayers - 1 : 0) * // Minus dealer
        CARDSDEALTCOUNT // Cards per player
  ) + POOLCARDSCOUNT + // Extra cards to swap
        (connectedPlayers - 1 > 0 ? connectedPlayers - 1 : 0) // Minus dealer
  const roundCards = randomSubCollection(state.allQualifications, [], qualificationCardsNeeded)

  // Divvy them off to players
  Object.entries(state.round.players).forEach(([_, player]) => {
    const cardsToPlayer = player.dealer ? connectedPlayers - 1 : CARDSDEALTCOUNT
    const clientHand = roundCards.splice(0, cardsToPlayer)
    player.cards = clientHand
  })

  state.round.qualificationPool = roundCards.splice(0, POOLCARDSCOUNT) // What's left after dealing is the pool

  state.round.shownCards = []
  state.round.mode = 'deck'

  broadcast()
}

function nextState () {
  state.round.mode = state.round.mode === 'deck' ? 'interview' : 'deck'
  if (state.round.mode === 'deck') {
    resetRound()
  } else {
    broadcast()
  }
}

function swapCards (player, payload) {
  player.cards.splice(player.cards.indexOf(payload.handCard), 1, payload.poolCard)
  state.round.qualificationPool.splice(state.round.qualificationPool.indexOf(payload.poolCard), 1, payload.handCard)
  broadcast()
}

function getDealer () {
  let dealer = {}
  Object.entries(state.round.players).forEach(([_, player]) => {
    if (player.dealer) dealer = player
  })
  return dealer
}

function removePlayer(id) {
  let createNewDealer = false
  if (state.round.players[id].dealer) {
    createNewDealer = true
  }
  delete state.round.players[id]

  if(createNewDealer) {
    firstKey = Object.entries(state.round.players)[0]
    if (firstKey) {
      state.round.players[firstKey].dealer = true // Pass the baton on
    }
  }
}

/**
 * Deals extra cards to a new player
 */
function dealExtra () {
  let excludeArr = []
  Object.entries(state.round.players).forEach(([_, player]) => {
    excludeArr = excludeArr.concat(player.cards)
  })

  const newCards = randomSubCollection(state.allQualifications, excludeArr, CARDSDEALTCOUNT + 1)
  // Add a new card for the dealer to ask in the round
  getDealer().cards.push(newCards.pop())
  return newCards
}

function getPlayer (id) {
  return state.round.players[id]
}

function setDealer (id) {
  // Get current dealer
  getDealer().dealer = false // Disable dealer right
  getPlayer(id).dealer = true
  resetRound()
}

resetRound() // Reset game on startup

function heartbeat() {
  this.isAlive = true;
}

wss.on('connection', function connection (ws) {
  ws.isAlive = true;
  ws.on('pong', heartbeat);
  // Give player unique id.
  const id = v4()
  const isDealer = !Object.entries(state.round.players).length
  state.round.players[id] = { // Set up a player object
    cards: !isDealer ? dealExtra() : [],
    dealer: isDealer // First player becomes dealer
  }
  ws.uuid = id // Add id to connection
  ws.send(JSON.stringify({ id }))

  broadcast() // Updates dealer as well
  // ws.send(JSON.stringify({ round: state.round }))

  ws.on('close', function() {
    removePlayer(ws.uuid)
    broadcast()
  })

  ws.on('message', function incoming (message) {
    console.log(message)
    const parsedMessage = JSON.parse(message)
    switch (parsedMessage.type) {
      case 'RESET': // Update the job role
        resetRound()
        break
      case 'SWAPCARDS': // Update the job role
        swapCards(state.round.players[ws.uuid], parsedMessage.payload)
        break
      case 'NEXT': // Switch to next play state
        nextState()
        break
      case 'PLAYCARD': // Update the job role
        playCard(state.round.players[ws.uuid], parsedMessage.payload)
        break
      case 'DEALER': // Update the job role
        setDealer(parsedMessage.payload)
        break
      default:
        break
    }
    wss.clients.forEach(function each (client) {
      if (client.readyState === WebSocket.OPEN) {
        // client.send(message)
      }
    })
  })

  // TODO periodically send out full state to all players anyway?
})

function noop() {}

// Kill inactive clients
const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) {
      removePlayer(ws.uuid)
      broadcast()
      return ws.terminate()
    }

    ws.isAlive = false;
    ws.ping(noop)
  });
}, 10*1000);

wss.on('close', function close() {
  clearInterval(interval)
});