import { io } from 'socket.io-client'

const socket = io('https://buzzimessenger.onrender.com')

export default socket