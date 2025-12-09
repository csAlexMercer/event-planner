import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        role: 'user'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
        ...formData,
        [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validation
        if (!formData.email || !formData.password) {
        setError('Email and password are required');
        setLoading(false);
        return;
        }

        if (!isLogin && !formData.name) {
        setError('Name is required for signup');
        setLoading(false);
        return;
        }

        if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
        }

        try {
        if (isLogin) {
            // Login
            await signInWithEmailAndPassword(auth, formData.email, formData.password);
        } else {
            // Signup
            const userCredential = await createUserWithEmailAndPassword(
            auth,
            formData.email,
            formData.password
            );
            
            // Save user data to Firestore
            await setDoc(doc(db, 'users', userCredential.user.uid), {
            name: formData.name,
            email: formData.email,
            role: formData.role,
            createdAt: new Date().toISOString()
            });
        }
        } catch (error) {
        setError(error.message);
        } finally {
        setLoading(false);
        }
    };

    return (
        <div className="login-container">
        <div className="login-card">
            <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
            
            <form onSubmit={handleSubmit} className="login-form">
            {!isLogin && (
                <div className="form-group">
                <label>Name</label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    required={!isLogin}
                />
                </div>
            )}

            <div className="form-group">
                <label>Email</label>
                <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                />
            </div>

            <div className="form-group">
                <label>Password</label>
                <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                />
            </div>

            {!isLogin && (
                <div className="form-group">
                <label>Role</label>
                <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                </select>
                </div>
            )}

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Sign Up')}
            </button>
            </form>

            <div className="toggle-auth">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
                type="button"
                onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                }}
                className="link-button"
            >
                {isLogin ? 'Sign Up' : 'Login'}
            </button>
            </div>
        </div>
        </div>
    );
}

export default Login;