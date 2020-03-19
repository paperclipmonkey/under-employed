/* tslint:disable @typescript-eslint/no-empty-function */
import Vue from 'vue'
import Vuex from 'vuex'
import websocketPlugin from './websocketPlugin'

// const socket = new WebSocket('ws://under-employed.herokuapp.com/')
const socket = new WebSocket('ws://localhost:5000')
// const socket = new WebSocket("ws://" + window.location.host)
const ws = websocketPlugin(socket)

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    id: '', // Players ID in the game
    hand: ['one', 'two', 'three', 'four'],
    player: {},
    round: {
      players: {},
      qualificationPool: [],
      mode: 'deck',
      job: '',
      shownCards: []
    }
  },
  mutations: {
    SWAPCARDS () { }, // eslint-disable-line @typescript-eslint/no-empty-function
    NEXT () { }, // eslint-disable-line @typescript-eslint/no-empty-function
    PLAYCARD () { }, // eslint-disable-line @typescript-eslint/no-empty-function
    DEALER () { }, // eslint-disable-line @typescript-eslint/no-empty-function
    RESET () { }, // eslint-disable-line @typescript-eslint/no-empty-function
    receiveData (state, payload) {
      console.log(payload)
      if (payload.id) {
        state.id = payload.id
        return
      }
      if (payload.round) {
        state.hand = payload.round.players[state.id].cards
        state.player = payload.round.players[state.id]
        state.round = payload.round
      }
    }
  },
  actions: {
    playCard ({ commit }, payload) {
      commit('PLAYCARD', payload)
    },
    swapCards ({ commit }, payload) {
      commit('SWAPCARDS', payload)
    },
    next ({ commit }) {
      commit('NEXT')
    },
    reset ({ commit }) {
      commit('RESET')
    },
    setDealer ({ commit, state }) {
      commit('DEALER', state.id)
    }
  },
  modules: {
  },
  plugins: [ws]
})
