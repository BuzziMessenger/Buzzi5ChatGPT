# server/server.js

```js
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
```

---

# server/package.json

```json
{
  "name": "buzzi-server",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.21.2",
    "socket.io": "^4.8.1"
  }
}
```

---

# client/src/socket.js

```js
import { io } from 'socket.io-client'

const socket = io('https://buzzimessenger.onrender.com')

export default socket
```

---

# client/src/App.jsx

```jsx
import React, { useEffect, useState } from 'react'
import socket from './socket'
import './styles.css'

export default function App() {

  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])

  useEffect(() => {

    socket.on('connect', () => {
      console.log('Verbonden met backend 🚀')
    })

    socket.on('receive_message', (data) => {
      setMessages((prev) => [...prev, data])
    })

    return () => {
      socket.off('receive_message')
    }

  }, [])

  const sendMessage = () => {

    if (message.trim() === '') return

    socket.emit('send_message', message)

    setMessage('')
  }

  return (
    <div className="messenger-layout">

      <div className="sidebar">

        <div className="profile-box">
          <div className="avatar"></div>

          <h2>Robbin</h2>

          <p>🟢 Online</p>
        </div>

        <div className="contact-list">

          <div className="contact">
            <div className="status-dot"></div>
            Dennis
          </div>

          <div className="contact">
            <div className="status-dot"></div>
            Laura
          </div>

          <div className="contact">
            <div className="status-dot"></div>
            Kevin
          </div>

        </div>

      </div>

      <div className="main-content">

        <div className="topbar">

          <h2>Buzzi Messenger</h2>

          <div className="top-buttons">
            <button>Video</button>
            <button>Voice</button>
            <button onClick={() => alert('BUZZZ 😄')}>
              Buzz
            </button>
          </div>

        </div>

        <div className="chat-window">

          {messages.map((msg, index) => (
            <div key={index} className="message self">
              <div className="message-user">
                Jij
              </div>

              {msg}
            </div>
          ))}

        </div>

        <div className="input-bar">

          <button>😀</button>

          <input
            placeholder="Typ een bericht..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                sendMessage()
              }
            }}
          />

          <button onClick={sendMessage}>
            Versturen
          </button>

        </div>

      </div>

    </div>
  )
}
```

---

# client/src/styles.css

```css
body {
  margin: 0;
  font-family: 'Segoe UI', sans-serif;
  background: linear-gradient(to bottom, #8db2e3, #5d87c5);
  overflow: hidden;
}

* {
  box-sizing: border-box;
}

.messenger-layout {
  display: flex;
  height: 100vh;
}

.sidebar {
  width: 280px;
  background: linear-gradient(to bottom, #dfeeff, #bdd6ff);
  border-right: 2px solid #7ea2d8;
  display: flex;
  flex-direction: column;
}

.profile-box {
  padding: 20px;
  background: linear-gradient(to bottom, #7aa8ea, #4e7fd1);
  color: white;
}

.avatar {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: white;
  margin-bottom: 10px;
}

.contact-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.contact {
  background: white;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: limegreen;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.topbar {
  height: 70px;
  background: linear-gradient(to bottom, #f2f7ff, #d7e8ff);
  border-bottom: 2px solid #9dbbe8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.top-buttons button {
  margin-left: 10px;
  padding: 10px 16px;
  border: none;
  border-radius: 10px;
  background: #4c80d3;
  color: white;
  cursor: pointer;
}

.chat-window {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.message {
  max-width: 60%;
  background: white;
  padding: 12px 16px;
  margin-bottom: 15px;
  border-radius: 16px;
}

.message.self {
  margin-left: auto;
  background: #d7e8ff;
}

.message-user {
  font-size: 13px;
  color: #4a70b3;
  margin-bottom: 5px;
}

.input-bar {
  height: 80px;
  background: linear-gradient(to bottom, #dcecff, #bdd6ff);
  border-top: 2px solid #8eb1e2;
  display: flex;
  align-items: center;
  padding: 15px;
  gap: 10px;
}

.input-bar input {
  flex: 1;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid #8aaee0;
}

.input-bar button {
  padding: 14px 20px;
  border: none;
  border-radius: 12px;
  background: #4d80d5;
  color: white;
  cursor: pointer;
}
```
