import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import EventForm from './EventForm';
import EventDetails from './EventDetails';

function AdminDashboard({ user }) {
    const [events, setEvents] = useState([]);
    const [rsvps, setRsvps] = useState([]);
    const [view, setView] = useState('list');
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

        const unsubscribeRsvps = onSnapshot(collection(db, 'rsvps'), (snapshot) => {
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
    }, []);

    const showNotification = (message) => {
        setNotification(message);
        setTimeout(() => setNotification(''), 3000);
    };

    const handleDelete = async (eventId) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
        try {
            await deleteDoc(doc(db, 'events', eventId));
            
            // Delete associated RSVPs
            const eventRsvps = rsvps.filter(r => r.eventId === eventId);
            for (const rsvp of eventRsvps) {
            await deleteDoc(doc(db, 'rsvps', rsvp.id));
            }
            
            showNotification('Event deleted successfully');
        } catch (error) {
            console.error('Error deleting event:', error);
            showNotification('Error deleting event');
        }
        }
    };

    const handleEdit = (event) => {
        setSelectedEvent(event);
        setView('edit');
    };

    const handleViewDetails = (event) => {
        setSelectedEvent(event);
        setView('details');
    };

    const getRsvpSummary = (eventId) => {
        const eventRsvps = rsvps.filter(r => r.eventId === eventId);
        return {
        going: eventRsvps.filter(r => r.status === 'going').length,
        maybe: eventRsvps.filter(r => r.status === 'maybe').length,
        declined: eventRsvps.filter(r => r.status === 'declined').length,
        total: eventRsvps.length
        };
    };

    const getUpcomingEvents = () => {
        const today = new Date().toISOString().split('T')[0];
        return events.filter(event => event.date >= today);
    };

    if (view === 'create' || view === 'edit') {
        return (
        <EventForm
            event={view === 'edit' ? selectedEvent : null}
            onCancel={() => {
            setView('list');
            setSelectedEvent(null);
            }}
            onSuccess={(message) => {
            showNotification(message);
            setView('list');
            setSelectedEvent(null);
            }}
        />
        );
    }

    if (view === 'details') {
        return (
        <EventDetails
            event={selectedEvent}
            rsvps={rsvps.filter(r => r.eventId === selectedEvent.id)}
            onBack={() => {
            setView('list');
            setSelectedEvent(null);
            }}
            isAdmin={true}
        />
        );
    }

    const upcomingEvents = getUpcomingEvents();

    return (
        <div className="dashboard">
        {notification && (
            <div className="notification">{notification}</div>
        )}

        <div className="dashboard-header">
            <h2>Admin Dashboard</h2>
            <button
            onClick={() => setView('create')}
            className="btn-primary"
            >
            + Create Event
            </button>
        </div>

        <div className="events-grid">
            {upcomingEvents.length === 0 ? (
            <div className="empty-state">
                <p>No upcoming events. Create your first event!</p>
            </div>
            ) : (
            upcomingEvents.map(event => {
                const summary = getRsvpSummary(event.id);
                return (
                <div key={event.id} className="event-card">
                    <div className="event-header">
                    <h3>{event.title}</h3>
                    <div className="event-actions">
                        <button
                        onClick={() => handleEdit(event)}
                        className="btn-icon"
                        title="Edit"
                        >
                        ✏️
                        </button>
                        <button
                        onClick={() => handleDelete(event.id)}
                        className="btn-icon"
                        title="Delete"
                        >
                        🗑️
                        </button>
                    </div>
                    </div>

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

                    <div className="rsvp-summary">
                    <h4>RSVP Summary:</h4>
                    <div className="rsvp-stats">
                        <span className="stat going">Going: {summary.going}</span>
                        <span className="stat maybe">Maybe: {summary.maybe}</span>
                        <span className="stat declined">Declined: {summary.declined}</span>
                    </div>
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

export default AdminDashboard;