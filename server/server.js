require('dotenv').config()

const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: '*'
  }
})

app.use(cors())
app.use(express.json())

io.on('connection', (socket) => {
  console.log('Gebruiker verbonden')

  socket.on('message:send', (data) => {
    io.emit('message:new', data)
  })

  socket.on('disconnect', () => {
    console.log('Gebruiker disconnected')
  })
})
app.get('/', (req, res) => {
  res.send('Buzzi Messenger Backend draait 🚀')
})
server.listen(5000, () => {
  console.log('Server draait op poort 5000')
})
