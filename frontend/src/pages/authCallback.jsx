// src/pages/authCallback.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './auth.css'

const AuthCallback = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const processCallback = async () => {
            try {
                const searchParams = new URLSearchParams(location.search);
                const token = searchParams.get('token');
                const errorParam = searchParams.get('error');

                if (errorParam) {
                    setError('Authentication failed: ' + errorParam);
                    setLoading(false);
                    setTimeout(() => navigate('/'), 3000);
                    return;
                }

                if (!token) {
                    setError('No authentication token received');
                    setLoading(false);
                    setTimeout(() => navigate('/'), 3000);
                    return;
                }

                // Store token
                localStorage.setItem('token', token);

                // Check for selected room
                const selectedRoom = localStorage.getItem('selectedRoom');
                if (selectedRoom) {
                    localStorage.removeItem('selectedRoom');
                    const roomData = JSON.parse(selectedRoom);
                    navigate('/booking', {
                        state: {
                            roomType: roomData.roomType,
                            price: roomData.price
                        }
                    });
                } else {
                    // Redirect to home
                    navigate('/');
                }
            } catch (error) {
                console.error('Auth callback error:', error);
                setError(error.message);
                setLoading(false);
                setTimeout(() => navigate('/'), 3000);
            }
        };

        processCallback();
    }, [location, navigate]);

    if (loading) {
        return (
            <div className="auth-callback-container">
                <div className="auth-callback-content">
                    <div className="spinner"></div>
                    <h2>Authenticating...</h2>
                    <p>Please wait while we complete your Google login</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="auth-callback-container">
                <div className="auth-callback-content error">
                    <div className="error-icon">❌</div>
                    <h2>Authentication Failed</h2>
                    <p>{error}</p>
                    <button onClick={() => navigate('/')}>Return to Home</button>
                </div>
            </div>
        );
    }

    return null;
};

export default AuthCallback;