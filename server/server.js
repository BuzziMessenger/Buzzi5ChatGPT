const express = require('express')
const http = require('http')
const cors = require('cors')
const { Server } = require('socket.io')

const app = express()

app.use(cors())

app.get('/', (req, res) => {
  res.send('Buzzi Messenger Backend draait 🚀')
})

const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: '*'
  }
})

io.on('connection', (socket) => {

  console.log('Gebruiker verbonden:', socket.id)

  socket.on('send_message', (data) => {

    console.log('Nieuw bericht:', data)

    io.emit('receive_message', data)
  })

  socket.on('disconnect', () => {
    console.log('Gebruiker disconnected')
  })

})

const PORT = process.env.PORT || 5000

server.listen(PORT, () => {
  console.log(`Server draait op poort ${PORT}`)
})