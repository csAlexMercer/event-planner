import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

function EventDetails({ event, userRsvp, rsvps, onBack, onRSVP, isAdmin }) {
  const [allRsvps, setAllRsvps] = useState([]);
  const [users, setUsers] = useState({});

  useEffect(() => {
    if (isAdmin) {
      const rsvpsQuery = query(
        collection(db, 'rsvps'),
        where('eventId', '==', event.id)
      );
      const unsubscribe = onSnapshot(rsvpsQuery, async (snapshot) => {
        const rsvpsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAllRsvps(rsvpsData);

        // Fetching users details
        const userIds = [...new Set(rsvpsData.map(r => r.userId))];
        const usersData = {};
        
        for (const userId of userIds) {
          const userDoc = await db.collection('users').doc(userId).get();
          if (userDoc.exists) {
            usersData[userId] = userDoc.data();
          }
        }
        setUsers(usersData);
      });

      return () => unsubscribe();
    }
  }, [event.id, isAdmin]);

  const getRsvpSummary = () => {
    const rsvpList = isAdmin ? allRsvps : (rsvps || []);
    return {
      going: rsvpList.filter(r => r.status === 'going').length,
      maybe: rsvpList.filter(r => r.status === 'maybe').length,
      declined: rsvpList.filter(r => r.status === 'declined').length,
      total: rsvpList.length
    };
  };

  const summary = getRsvpSummary();

  return (
    <div className="event-details-container">
      <div className="details-header">
        <button onClick={onBack} className="btn-back">← Back</button>
      </div>

      <div className="event-details-card">
        <h2>{event.title}</h2>
        
        <div className="details-section">
          <h3>Description</h3>
          <p>{event.description}</p>
        </div>

        <div className="details-section">
          <h3>Event Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">📅 Date:</span>
              <span className="info-value">
                {new Date(event.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">🕒 Time:</span>
              <span className="info-value">{event.startTime} - {event.endTime}</span>
            </div>
            <div className="info-item">
              <span className="info-label">📍 Location:</span>
              <span className="info-value">{event.location}</span>
            </div>
          </div>
        </div>

        <div className="details-section">
          <h3>RSVP Summary</h3>
          <div className="rsvp-summary-detailed">
            <div className="summary-item going">
              <span className="summary-label">Going</span>
              <span className="summary-count">{summary.going}</span>
            </div>
            <div className="summary-item maybe">
              <span className="summary-label">Maybe</span>
              <span className="summary-count">{summary.maybe}</span>
            </div>
            <div className="summary-item declined">
              <span className="summary-label">Declined</span>
              <span className="summary-count">{summary.declined}</span>
            </div>
            <div className="summary-item total">
              <span className="summary-label">Total</span>
              <span className="summary-count">{summary.total}</span>
            </div>
          </div>
        </div>

        {!isAdmin && (
          <div className="details-section">
            <h3>Your RSVP</h3>
            {userRsvp && (
              <div className="current-rsvp-status">
                Current Status: <strong>{userRsvp.status.toUpperCase()}</strong>
              </div>
            )}
            <div className="rsvp-buttons">
              <button
                onClick={() => onRSVP(event.id, 'going')}
                className={`btn-rsvp ${userRsvp?.status === 'going' ? 'active going' : ''}`}
              >
                Going
              </button>
              <button
                onClick={() => onRSVP(event.id, 'maybe')}
                className={`btn-rsvp ${userRsvp?.status === 'maybe' ? 'active maybe' : ''}`}
              >
                Maybe
              </button>
              <button
                onClick={() => onRSVP(event.id, 'declined')}
                className={`btn-rsvp ${userRsvp?.status === 'declined' ? 'active declined' : ''}`}
              >
                Decline
              </button>
            </div>
          </div>
        )}

        {isAdmin && allRsvps.length > 0 && (
          <div className="details-section">
            <h3>RSVP List</h3>
            <div className="rsvp-list">
              {['going', 'maybe', 'declined'].map(status => {
                const statusRsvps = allRsvps.filter(r => r.status === status);
                if (statusRsvps.length === 0) return null;
                
                return (
                  <div key={status} className="rsvp-group">
                    <h4 className={`status-heading ${status}`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)} ({statusRsvps.length})
                    </h4>
                    <ul className="rsvp-users">
                      {statusRsvps.map(rsvp => (
                        <li key={rsvp.id}>
                          {users[rsvp.userId]?.name || users[rsvp.userId]?.email || 'User'}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EventDetails;