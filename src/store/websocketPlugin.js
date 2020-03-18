const remoteEvents = ['RESET', 'SWAPCARDS', 'NEXT', 'PLAYCARD', 'DEALER'] // Events we should send to the server

export default function createWebSocketPlugin (socket) {
  return store => {
    socket.addEventListener('message', resp => {
      store.commit('receiveData', JSON.parse(resp.data))
    })
    store.subscribe(mutation => {
      console.log('Mutation event', mutation)
      if (remoteEvents.includes(mutation.type)) {
        socket.send(JSON.stringify(mutation))
      }
    })
  }
}
