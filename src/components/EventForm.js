import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';

function EventForm({ event, onCancel, onSuccess }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        location: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (event) {
        setFormData({
            title: event.title || '',
            description: event.description || '',
            date: event.date || '',
            startTime: event.startTime || '',
            endTime: event.endTime || '',
            location: event.location || ''
        });
        }
    }, [event]);

    const handleChange = (e) => {
        setFormData({
        ...formData,
        [e.target.name]: e.target.value
        });
        if (errors[e.target.name]) {
        setErrors({
            ...errors,
            [e.target.name]: ''
        });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
        newErrors.title = 'Event title is required';
        }

        if (!formData.description.trim()) {
        newErrors.description = 'Event description is required';
        }

        if (!formData.date) {
        newErrors.date = 'Event date is required';
        } else {
        const selectedDate = new Date(formData.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) {
            newErrors.date = 'Event date cannot be in the past';
        }
        }

        if (!formData.startTime) {
        newErrors.startTime = 'Start time is required';
        }

        if (!formData.endTime) {
        newErrors.endTime = 'End time is required';
        }

        if (formData.startTime && formData.endTime) {
        if (formData.startTime >= formData.endTime) {
            newErrors.endTime = 'End time must be after start time';
        }
        }

        if (!formData.location.trim()) {
        newErrors.location = 'Event location is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
        return;
        }

        setLoading(true);

        try {
        if (event) {
            await updateDoc(doc(db, 'events', event.id), {
            ...formData,
            updatedAt: new Date().toISOString()
            });
            onSuccess('Event updated successfully!');
        } else {

            await addDoc(collection(db, 'events'), {
            ...formData,
            createdBy: auth.currentUser.uid,
            createdAt: new Date().toISOString()
            });
            onSuccess('Event created successfully!');
        }
        } catch (error) {
        console.error('Error saving event:', error);
        setErrors({ submit: 'Error saving event. Please try again.' });
        } finally {
        setLoading(false);
        }
    };

    return (
        <div className="form-container">
        <div className="form-header">
            <h2>{event ? 'Edit Event' : 'Create New Event'}</h2>
            <button onClick={onCancel} className="btn-close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="event-form">
            <div className="form-group">
            <label>Event Title *</label>
            <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter event title"
                className={errors.title ? 'error' : ''}
            />
            {errors.title && <span className="error-text">{errors.title}</span>}
            </div>

            <div className="form-group">
            <label>Description *</label>
            <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter event description"
                rows="4"
                className={errors.description ? 'error' : ''}
            />
            {errors.description && <span className="error-text">{errors.description}</span>}
            </div>

            <div className="form-group">
            <label>Date *</label>
            <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className={errors.date ? 'error' : ''}
            />
            {errors.date && <span className="error-text">{errors.date}</span>}
            </div>

            <div className="form-row">
            <div className="form-group">
                <label>Start Time *</label>
                <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className={errors.startTime ? 'error' : ''}
                />
                {errors.startTime && <span className="error-text">{errors.startTime}</span>}
            </div>

            <div className="form-group">
                <label>End Time *</label>
                <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className={errors.endTime ? 'error' : ''}
                />
                {errors.endTime && <span className="error-text">{errors.endTime}</span>}
            </div>
            </div>

            <div className="form-group">
            <label>Location *</label>
            <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Enter event location"
                className={errors.location ? 'error' : ''}
            />
            {errors.location && <span className="error-text">{errors.location}</span>}
            </div>

            {errors.submit && <div className="error-message">{errors.submit}</div>}

            <div className="form-actions">
            <button
                type="button"
                onClick={onCancel}
                className="btn-secondary"
                disabled={loading}
            >
                Cancel
            </button>
            <button
                type="submit"
                className="btn-primary"
                disabled={loading}
            >
                {loading ? 'Saving...' : (event ? 'Update Event' : 'Create Event')}
            </button>
            </div>
        </form>
        </div>
    );
}

export default EventForm;