// tslint-disable @typescript-eslint/no-var-requires
const v4 = require('uuid').v4

const WebSocket = require('ws')

const joblist = require('./jobs.json')
const qualificationlist = require('./qualifications.json')


const wss = new WebSocket.Server({ port: process.env.PORT })

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

wss.on('connection', function connection (ws) {
  // Give player unique id.
  const id = v4()
  const isDealer = !Object.keys(state.round.players).length
  state.round.players[id] = { // Set up a player object
    cards: !isDealer ? dealExtra() : [],
    dealer: isDealer // First player becomes dealer
  }
  ws.uuid = id // Add id to connection
  ws.send(JSON.stringify({ id }))

  broadcast() // Updates dealer as well
  // ws.send(JSON.stringify({ round: state.round }))

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
