// pages/AuthCallback.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

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

                if (token) {
                    // Store token
                    localStorage.setItem('token', token);

                    // Check for selected room
                    const selectedRoom = localStorage.getItem('selectedRoom');
                    if (selectedRoom) {
                        localStorage.removeItem('selectedRoom');
                        const roomData = JSON.parse(selectedRoom);
                        // Redirect to booking with room selection
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
                } else {
                    setError('No token received');
                    navigate('/login?error=no_token');
                }
            } catch (error) {
                console.error('Auth callback error:', error);
                setError(error.message);
                navigate('/login?error=auth_failed');
            } finally {
                setLoading(false);
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
                    <h2>❌ Authentication Failed</h2>
                    <p>{error}</p>
                    <button onClick={() => navigate('/login')}>Try Again</button>
                </div>
            </div>
        );
    }

    return null;
};

export default AuthCallback;