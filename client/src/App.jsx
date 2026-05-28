import socket from './socket'
import React from 'react'
import './styles.css'

export default function App() {
  return (
    <div className="messenger-layout">
      <div className="sidebar">
        <div className="profile-box">
          <div className="avatar"></div>
            console.log(socket.connected)

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
        </div>
      </div>

      <div className="main-content">
        <div className="topbar">
          <h2>Buzzi Messenger</h2>

          <div className="top-buttons">
            <button>Video</button>
            <button>Voice</button>
          </div>
        </div>

        <div className="chat-window">
          <div className="message">
            <div className="message-user">Dennis</div>
            Hey 😄 welkom op Buzzi Messenger
          </div>

          <div className="message self">
            <div className="message-user">Jij</div>
            Dit begint echt op MSN te lijken 🔥
          </div>
        </div>

        <div className="input-bar">
          <button>😀</button>

          <input placeholder="Typ een bericht..." />

          <button>Buzz</button>

          <button>Versturen</button>
        </div>
      </div>
    </div>
  )
}