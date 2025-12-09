import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, where, getDocs } from 'firebase/firestore';
import EventDetails from './EventDetails';

function UserDashboard({ user }) {
    const [events, setEvents] = useState([]);
    const [rsvps, setRsvps] = useState([]);
    const [view, setView] = useState('all');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [notification, setNotification] = useState('');

    useEffect(() => {
        const eventsQuery = query(collection(db, 'events'), orderBy('date', 'asc'));
        const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
        const eventsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        setEvents(eventsData);
        });

        const rsvpsQuery = query(
        collection(db, 'rsvps'),
        where('userId', '==', user.uid)
        );
        const unsubscribeRsvps = onSnapshot(rsvpsQuery, (snapshot) => {
        const rsvpsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        setRsvps(rsvpsData);
        });

        return () => {
        unsubscribeEvents();
        unsubscribeRsvps();
        };
    }, [user.uid]);

    const showNotification = (message) => {
        setNotification(message);
        setTimeout(() => setNotification(''), 3000);
    };

    const handleRSVP = async (eventId, status) => {
        try {
        // Check if RSVP already exists
        const existingRsvp = rsvps.find(r => r.eventId === eventId);

        if (existingRsvp) {
            // Update existing RSVP
            await updateDoc(doc(db, 'rsvps', existingRsvp.id), {
            status: status,
            updatedAt: new Date().toISOString()
            });
            showNotification('RSVP updated successfully!');
        } else {
            // Create new RSVP
            await addDoc(collection(db, 'rsvps'), {
            userId: user.uid,
            eventId: eventId,
            status: status,
            createdAt: new Date().toISOString()
            });
            showNotification('RSVP submitted successfully!');
        }
        } catch (error) {
        console.error('Error handling RSVP:', error);
        showNotification('Error processing RSVP');
        }
    };

    const getUserRsvp = (eventId) => {
        return rsvps.find(r => r.eventId === eventId);
    };

    const getUpcomingEvents = () => {
        const today = new Date().toISOString().split('T')[0];
        return events.filter(event => event.date >= today);
    };

    const getMyRsvpEvents = () => {
        const today = new Date().toISOString().split('T')[0];
        return events
        .filter(event => {
            const hasRsvp = rsvps.some(r => r.eventId === event.id);
            return hasRsvp && event.date >= today;
        })
        .map(event => ({
            ...event,
            rsvpStatus: getUserRsvp(event.id)?.status
        }));
    };

    const handleViewDetails = (event) => {
        setSelectedEvent(event);
        setView('details');
    };

    if (view === 'details') {
        return (
        <EventDetails
            event={selectedEvent}
            userRsvp={getUserRsvp(selectedEvent.id)}
            onBack={() => {
            setView('all');
            setSelectedEvent(null);
            }}
            onRSVP={handleRSVP}
            isAdmin={false}
        />
        );
    }

    const displayEvents = view === 'myRsvps' ? getMyRsvpEvents() : getUpcomingEvents();

    return (
        <div className="dashboard">
        {notification && (
            <div className="notification">{notification}</div>
        )}

        <div className="dashboard-header">
            <h2>Upcoming Events</h2>
            <div className="view-toggle">
            <button
                onClick={() => setView('all')}
                className={view === 'all' ? 'btn-toggle active' : 'btn-toggle'}
            >
                All Events
            </button>
            <button
                onClick={() => setView('myRsvps')}
                className={view === 'myRsvps' ? 'btn-toggle active' : 'btn-toggle'}
            >
                My RSVPs
            </button>
            </div>
        </div>

        <div className="events-grid">
            {displayEvents.length === 0 ? (
            <div className="empty-state">
                <p>
                {view === 'myRsvps'
                    ? "You haven't RSVP'd to any events yet."
                    : 'No upcoming events available.'}
                </p>
            </div>
            ) : (
            displayEvents.map(event => {
                const userRsvp = getUserRsvp(event.id);
                return (
                <div key={event.id} className="event-card">
                    <h3>{event.title}</h3>
                    <p className="event-description">{event.description}</p>

                    <div className="event-details">
                    <div className="detail-item">
                        <span className="icon">📅</span>
                        <span>{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-item">
                        <span className="icon">🕒</span>
                        <span>{event.startTime} - {event.endTime}</span>
                    </div>
                    <div className="detail-item">
                        <span className="icon">📍</span>
                        <span>{event.location}</span>
                    </div>
                    </div>

                    {userRsvp && (
                    <div className="current-rsvp">
                        Current RSVP: <strong>{userRsvp.status.toUpperCase()}</strong>
                    </div>
                    )}

                    <div className="rsvp-buttons">
                    <button
                        onClick={() => handleRSVP(event.id, 'going')}
                        className={`btn-rsvp ${userRsvp?.status === 'going' ? 'active going' : ''}`}
                    >
                        Going
                    </button>
                    <button
                        onClick={() => handleRSVP(event.id, 'maybe')}
                        className={`btn-rsvp ${userRsvp?.status === 'maybe' ? 'active maybe' : ''}`}
                    >
                        Maybe
                    </button>
                    <button
                        onClick={() => handleRSVP(event.id, 'declined')}
                        className={`btn-rsvp ${userRsvp?.status === 'declined' ? 'active declined' : ''}`}
                    >
                        Decline
                    </button>
                    </div>

                    <button
                    onClick={() => handleViewDetails(event)}
                    className="btn-secondary"
                    >
                    View Details
                    </button>
                </div>
                );
            })
            )}
        </div>
        </div>
    );
}

export default UserDashboard;