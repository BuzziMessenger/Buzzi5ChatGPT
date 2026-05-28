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