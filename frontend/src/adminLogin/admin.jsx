// AdminLogin.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/api/auth/admin-login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                // Store admin token and info
                localStorage.setItem('adminToken', data.token);
                localStorage.setItem('adminUser', JSON.stringify(data.user));

                // Navigate to admin dashboard
                navigate('/admin/dashboard');
            } else {
                setError(data.message || 'Invalid credentials');
            }
        } catch (error) {
            console.error('Admin login error:', error);
            setError('Failed to login. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-page">
            <div className="admin-login-container">
                <div className="admin-login-header">
                    <div className="admin-login-logo">
                        <span className="logo-text">Raghav Hotel</span>
                        <span className="logo-stars">★★★★★</span>
                    </div>
                    <h2>Admin Login</h2>
                    <p>Enter your credentials to access the admin panel</p>
                </div>

                {error && (
                    <div className="admin-login-error">
                        <span>⚠️ {error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="admin-login-form">
                    <div className="form-group">
                        <label htmlFor="email">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                            </svg>
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@raghavhotel.com"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            Password
                        </label>
                        <div className="password-input-wrapper">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn-admin-login" disabled={loading}>
                        {loading ? (
                            <span className="loading-spinner">
                                <span className="spinner"></span>
                                Logging in...
                            </span>
                        ) : (
                            'Login to Admin Panel'
                        )}
                    </button>
                </form>

                <div className="admin-login-footer">
                    <a href="/">← Back to Home</a>
                    <span>|</span>
                </div>

                <div className="admin-login-security">
                    <p>🔒 Secure Admin Access</p>
                    <small>This area is restricted to authorized personnel only.</small>
                </div>
            </div>

            <style>{`
                .admin-login-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                    padding: 20px;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }

                .admin-login-container {
                    background: white;
                    border-radius: 20px;
                    padding: 50px 40px;
                    max-width: 450px;
                    width: 100%;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    animation: slideUp 0.5s ease;
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .admin-login-header {
                    text-align: center;
                    margin-bottom: 30px;
                }

                .admin-login-logo {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .admin-login-logo .logo-text {
                    font-size: 28px;
                    font-weight: 700;
                    color: #c0392b;
                    letter-spacing: 1px;
                }

                .admin-login-logo .logo-stars {
                    font-size: 16px;
                    color: #f39c12;
                    letter-spacing: 3px;
                }

                .admin-login-header h2 {
                    font-size: 28px;
                    color: #2c3e50;
                    margin-bottom: 8px;
                }

                .admin-login-header p {
                    color: #7f8c8d;
                    font-size: 15px;
                }

                .admin-login-error {
                    background: #f8d7da;
                    color: #721c24;
                    padding: 12px 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    border-left: 4px solid #dc3545;
                    font-size: 14px;
                }

                .admin-login-form .form-group {
                    margin-bottom: 20px;
                }

                .admin-login-form .form-group label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 600;
                    color: #2c3e50;
                    margin-bottom: 8px;
                    font-size: 14px;
                }

                .admin-login-form .form-group label svg {
                    color: #7f8c8d;
                }

                .admin-login-form .form-group input {
                    width: 100%;
                    padding: 12px 15px;
                    border: 2px solid #e0e0e0;
                    border-radius: 10px;
                    font-size: 16px;
                    transition: all 0.3s ease;
                    background: #f8f9fa;
                }

                .admin-login-form .form-group input:focus {
                    outline: none;
                    border-color: #c0392b;
                    box-shadow: 0 0 0 3px rgba(192, 57, 43, 0.1);
                    background: white;
                }

                .password-input-wrapper {
                    position: relative;
                }

                .password-input-wrapper input {
                    padding-right: 45px !important;
                }

                .password-toggle {
                    position: absolute;
                    right: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #7f8c8d;
                    padding: 5px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: color 0.3s ease;
                }

                .password-toggle:hover {
                    color: #2c3e50;
                }

                .btn-admin-login {
                    width: 100%;
                    background: #c0392b;
                    color: white;
                    border: none;
                    padding: 14px;
                    border-radius: 10px;
                    font-size: 18px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    margin-top: 10px;
                }

                .btn-admin-login:hover:not(:disabled) {
                    background: #a93226;
                    transform: translateY(-2px);
                    box-shadow: 0 5px 20px rgba(192, 57, 43, 0.3);
                }

                .btn-admin-login:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .loading-spinner {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                }

                .spinner {
                    width: 20px;
                    height: 20px;
                    border: 3px solid rgba(255, 255, 255, 0.3);
                    border-top: 3px solid white;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .admin-login-footer {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 15px;
                    margin-top: 25px;
                    font-size: 14px;
                }

                .admin-login-footer a {
                    color: #c0392b;
                    text-decoration: none;
                    font-weight: 500;
                    transition: color 0.3s ease;
                }

                .admin-login-footer a:hover {
                    color: #a93226;
                    text-decoration: underline;
                }

                .admin-login-footer span {
                    color: #bdc3c7;
                }

                .admin-login-security {
                    margin-top: 25px;
                    padding-top: 20px;
                    border-top: 1px solid #e0e0e0;
                    text-align: center;
                }

                .admin-login-security p {
                    color: #2c3e50;
                    font-weight: 600;
                    font-size: 14px;
                    margin-bottom: 4px;
                }

                .admin-login-security small {
                    color: #7f8c8d;
                    font-size: 12px;
                }

                @media (max-width: 480px) {
                    .admin-login-container {
                        padding: 30px 20px;
                    }

                    .admin-login-header h2 {
                        font-size: 24px;
                    }

                    .admin-login-footer {
                        flex-direction: column;
                        gap: 8px;
                    }

                    .admin-login-footer span {
                        display: none;
                    }
                }
            `}</style>
        </div>
    );
};

export default AdminLogin;