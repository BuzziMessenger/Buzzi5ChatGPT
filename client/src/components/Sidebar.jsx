import React from 'react'

export default function Sidebar() {
  return (
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
  )
}
