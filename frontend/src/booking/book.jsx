// BookingPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './book.css';

const BookingPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [authChecked, setAuthChecked] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [currentStep, setCurrentStep] = useState(1);
    const [progress, setProgress] = useState(25);

    // Get backend URL from environment
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    // Form state
    const [formData, setFormData] = useState({
        roomType: 'standard',
        guests: 1,
        checkIn: '',
        checkOut: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        specialRequests: ''
    });

    // Room prices (INR)
    const roomPrices = {
        standard: 800,
        deluxe: 1000,
        suite: 1500
    };

    const roomLabels = {
        standard: 'Non AC Room',
        deluxe: 'Deluxe Room',
        suite: 'Executive Suite'
    };

    // Booking summary
    const [totalPrice, setTotalPrice] = useState(0);
    const [nights, setNights] = useState(0);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [bookingReference, setBookingReference] = useState('');
    const [currentYear] = useState(new Date().getFullYear());

    // Get today's date for min date
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    // Check authentication and redirect in useEffect
    useEffect(() => {
        const checkAuthAndRedirect = async () => {
            const token = localStorage.getItem('token');
            let isAuth = false;
            let userData = null;

            if (token) {
                try {
                    const response = await fetch(`${API_URL}/api/auth/status`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    const data = await response.json();
                    if (data.isAuthenticated) {
                        isAuth = true;
                        userData = data.user;
                        setIsAuthenticated(true);
                        setUser(data.user);
                        setFormData(prev => ({
                            ...prev,
                            firstName: data.user.firstName || '',
                            lastName: data.user.lastName || '',
                            email: data.user.email || ''
                        }));
                    }
                } catch (error) {
                    console.error('Auth check error:', error);
                }
            }

            const isGuest = window.location.pathname.includes('booking-guest');
            const state = location.state;

            if (state) {
                if (state.roomType) {
                    setFormData(prev => ({ ...prev, roomType: state.roomType }));
                }
                if (state.user) {
                    setUser(state.user);
                    setIsAuthenticated(true);
                    setFormData(prev => ({
                        ...prev,
                        firstName: state.user.firstName || '',
                        lastName: state.user.lastName || '',
                        email: state.user.email || ''
                    }));
                }
                if (state.bookingSuccess) {
                    setBookingSuccess(true);
                    setBookingReference(state.reference || 'N/A');
                }
            }

            if (isGuest) {
                setIsAuthenticated(false);
                setAuthChecked(true);
                return;
            }

            if (!isAuth && !isGuest) {
                navigate('/');
                return;
            }

            setAuthChecked(true);
        };

        checkAuthAndRedirect();
    }, [location, API_URL, navigate]);

    // Calculate total price when form changes
    useEffect(() => {
        calculateTotal();
    }, [formData.checkIn, formData.checkOut, formData.roomType, formData.guests]);

    // Update progress
    useEffect(() => {
        let prog = 0;
        if (formData.roomType) prog += 20;
        if (formData.checkIn && formData.checkOut) prog += 25;
        if (formData.firstName && formData.lastName) prog += 20;
        if (formData.email && formData.phone) prog += 20;
        if (formData.specialRequests) prog += 15;
        setProgress(Math.min(prog, 100));
    }, [formData]);

    const calculateTotal = () => {
        if (formData.checkIn && formData.checkOut) {
            const checkInDate = new Date(formData.checkIn);
            const checkOutDate = new Date(formData.checkOut);
            const diffTime = Math.abs(checkOutDate - checkInDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 0) {
                setNights(diffDays);
                const pricePerNight = roomPrices[formData.roomType];
                const total = pricePerNight * diffDays * formData.guests;
                setTotalPrice(total);
            } else {
                setNights(0);
                setTotalPrice(0);
            }
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const errors = {};

        if (!formData.firstName.trim()) {
            errors.firstName = 'First name is required';
        }
        if (!formData.lastName.trim()) {
            errors.lastName = 'Last name is required';
        }
        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }
        if (!formData.phone.trim()) {
            errors.phone = 'Phone number is required';
        } else if (!/^[\+\d\s-]{10,}$/.test(formData.phone.replace(/\s/g, ''))) {
            errors.phone = 'Please enter a valid phone number';
        }
        if (!formData.checkIn) {
            errors.checkIn = 'Check-in date is required';
        }
        if (!formData.checkOut) {
            errors.checkOut = 'Check-out date is required';
        }
        if (formData.checkIn && formData.checkOut) {
            const checkInDate = new Date(formData.checkIn);
            const checkOutDate = new Date(formData.checkOut);
            if (checkOutDate <= checkInDate) {
                errors.checkOut = 'Check-out date must be after check-in date';
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            const firstErrorField = Object.keys(formErrors)[0];
            if (firstErrorField) {
                const element = document.getElementById(firstErrorField);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.focus();
                }
            }
            return;
        }

        setIsLoading(true);

        try {
            const token = localStorage.getItem('token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const bookingData = {
                roomType: formData.roomType,
                guests: parseInt(formData.guests),
                checkIn: formData.checkIn,
                checkOut: formData.checkOut,
                totalPrice: totalPrice,
                nights: nights,
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim() || 'Unknown',
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                specialRequests: formData.specialRequests || 'None',
                isGuest: !isAuthenticated,
                userId: user?._id || null
            };

            const response = await fetch(`${API_URL}/api/bookings/create`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(bookingData)
            });

            const data = await response.json();

            if (data.success) {
                setBookingSuccess(true);
                setBookingReference(data.booking?.bookingReference || 'N/A');
                window.scrollTo({ top: 0, behavior: 'smooth' });

                setTimeout(() => {
                    setBookingSuccess(false);
                    navigate('/', {
                        state: {
                            bookingSuccess: true,
                            reference: data.booking?.bookingReference
                        }
                    });
                }, 5000);
            } else {
                const errorMsg = data.errors ? data.errors.join('\n') : data.message;
                alert('❌ ' + (errorMsg || 'Failed to create booking. Please try again.'));
            }
        } catch (error) {
            console.error('❌ Booking error:', error);
            alert('Failed to create booking. Please check your connection and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const getRoomTypeLabel = (type) => {
        return roomLabels[type] || type;
    };

    // Show loading state while checking auth
    if (!authChecked) {
        return (
            <div className="loading-screen">
                <div className="loader"></div>
                <p>Loading...</p>
            </div>
        );
    }

    if (!isAuthenticated && !window.location.pathname.includes('booking-guest')) {
        return null;
    }

    return (
        <div className="booking-page">
            {/* Navigation */}
            <nav className="booking-nav">
                <div className="nav-container">
                    <div className="nav-logo" onClick={() => navigate('/')}>
                        <span className="logo-text">🏨 Hotel RAGHAV</span>
                        <span className="logo-stars">★★★★★</span>
                    </div>
                    <div className="nav-links">
                        <a href="/">Home</a>
                        <a href="/#rooms">Rooms</a>
                        <a href="/#amenities">Amenities</a>
                        <a href="/#contact">Contact</a>
                        {isAuthenticated && user && (
                            <span className="user-badge">👋 {user.firstName || user.email}</span>
                        )}
                        {!isAuthenticated && (
                            <span className="guest-badge">👤 Guest Booking</span>
                        )}
                    </div>
                </div>
            </nav>

            {/* Booking Hero */}
            <section className="booking-hero">
                <div className="booking-hero-content">
                    <h1>📅 Book Your Stay</h1>
                    <p>Experience luxury and comfort at Hotel RAGHAV</p>
                </div>
            </section>

            {/* Progress Bar */}
            <div className="progress-container">
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="progress-steps">
                    <span className={progress >= 20 ? 'active' : ''}>Room</span>
                    <span className={progress >= 45 ? 'active' : ''}>Dates</span>
                    <span className={progress >= 65 ? 'active' : ''}>Details</span>
                    <span className={progress >= 85 ? 'active' : ''}>Review</span>
                </div>
            </div>

            {/* Booking Form */}
            <section className="booking-form-section">
                <div className="container">
                    <div className="booking-wrapper">
                        <div className="booking-form-container">
                            <h2>Reservation Details</h2>

                            {bookingSuccess && (
                                <div className="success-message">
                                    <span className="success-icon">✅</span>
                                    <h3>Booking Request Sent!</h3>
                                    <p>Your booking reference: <strong>{bookingReference}</strong></p>
                                    <p>Thank you for choosing Hotel RAGHAV. Our team will contact you shortly.</p>
                                    <div className="success-actions">
                                        <button onClick={() => navigate('/')} className="btn-home">
                                            Return Home
                                        </button>
                                    </div>
                                </div>
                            )}

                            {!bookingSuccess && (
                                <form onSubmit={handleSubmit} className="booking-form" noValidate>
                                    {/* Room Selection */}
                                    <div className="form-section">
                                        <h3>🏠 Room Selection</h3>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label htmlFor="roomType">Room Type</label>
                                                <select
                                                    id="roomType"
                                                    name="roomType"
                                                    value={formData.roomType}
                                                    onChange={handleChange}
                                                    required
                                                >
                                                    <option value="standard">Non AC Room - ₹800/night</option>
                                                    <option value="deluxe">Deluxe Room - ₹1000/night</option>
                                                    <option value="suite">Executive Suite - ₹1500/night</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="guests">Number of Guests</label>
                                                <select
                                                    id="guests"
                                                    name="guests"
                                                    value={formData.guests}
                                                    onChange={handleChange}
                                                    required
                                                >
                                                    <option value="1">1 Guest</option>
                                                    <option value="2">2 Guests</option>
                                                    <option value="3">3 Guests</option>
                                                    <option value="4">4 Guests</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Date Selection */}
                                    <div className="form-section">
                                        <h3>📅 Select Dates</h3>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label htmlFor="checkIn">Check-in Date</label>
                                                <input
                                                    type="date"
                                                    id="checkIn"
                                                    name="checkIn"
                                                    value={formData.checkIn}
                                                    onChange={handleChange}
                                                    min={today}
                                                    required
                                                    className={formErrors.checkIn ? 'error' : ''}
                                                />
                                                {formErrors.checkIn && (
                                                    <span className="error-message">{formErrors.checkIn}</span>
                                                )}
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="checkOut">Check-out Date</label>
                                                <input
                                                    type="date"
                                                    id="checkOut"
                                                    name="checkOut"
                                                    value={formData.checkOut}
                                                    onChange={handleChange}
                                                    min={formData.checkIn || tomorrow}
                                                    required
                                                    className={formErrors.checkOut ? 'error' : ''}
                                                />
                                                {formErrors.checkOut && (
                                                    <span className="error-message">{formErrors.checkOut}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Personal Information */}
                                    <div className="form-section">
                                        <h3>👤 Personal Information</h3>
                                        {!isAuthenticated && (
                                            <div className="guest-notice">
                                                <p>🔓 You're booking as a guest. Create an account for faster future bookings!</p>
                                                <button
                                                    type="button"
                                                    className="btn-create-account"
                                                    onClick={() => window.location.href = '/api/auth/google'}
                                                >
                                                    Sign up with Google
                                                </button>
                                            </div>
                                        )}
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label htmlFor="firstName">First Name</label>
                                                <input
                                                    type="text"
                                                    id="firstName"
                                                    name="firstName"
                                                    placeholder="Abhijeet"
                                                    value={formData.firstName}
                                                    onChange={handleChange}
                                                    required
                                                    readOnly={isAuthenticated}
                                                    className={`${isAuthenticated ? 'auto-filled' : ''} ${formErrors.firstName ? 'error' : ''}`}
                                                />
                                                {formErrors.firstName && (
                                                    <span className="error-message">{formErrors.firstName}</span>
                                                )}
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="lastName">Last Name</label>
                                                <input
                                                    type="text"
                                                    id="lastName"
                                                    name="lastName"
                                                    placeholder="Dubay"
                                                    value={formData.lastName}
                                                    onChange={handleChange}
                                                    required
                                                    readOnly={isAuthenticated}
                                                    className={`${isAuthenticated ? 'auto-filled' : ''} ${formErrors.lastName ? 'error' : ''}`}
                                                />
                                                {formErrors.lastName && (
                                                    <span className="error-message">{formErrors.lastName}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label htmlFor="email">Email Address</label>
                                                <input
                                                    type="email"
                                                    id="email"
                                                    name="email"
                                                    placeholder="abhijeet@example.com"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    required
                                                    readOnly={isAuthenticated}
                                                    className={`${isAuthenticated ? 'auto-filled' : ''} ${formErrors.email ? 'error' : ''}`}
                                                />
                                                {formErrors.email && (
                                                    <span className="error-message">{formErrors.email}</span>
                                                )}
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="phone">Phone Number</label>
                                                <input
                                                    type="tel"
                                                    id="phone"
                                                    name="phone"
                                                    placeholder="+91 9876543210"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    required
                                                    className={formErrors.phone ? 'error' : ''}
                                                />
                                                {formErrors.phone && (
                                                    <span className="error-message">{formErrors.phone}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Special Requests */}
                                    <div className="form-section">
                                        <h3>💬 Special Requests</h3>
                                        <div className="form-group">
                                            <label htmlFor="specialRequests">Additional Requests</label>
                                            <textarea
                                                id="specialRequests"
                                                name="specialRequests"
                                                rows="3"
                                                placeholder="Any special requirements or preferences..."
                                                value={formData.specialRequests}
                                                onChange={handleChange}
                                            ></textarea>
                                        </div>
                                    </div>

                                    {/* Booking Note */}
                                    <div className="booking-note">
                                        <p>📋 <strong>Note:</strong> Our team will contact you within 24 hours to confirm your booking. No payment is required at this time.</p>
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        className="btn-book-now"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <span className="loading-spinner">
                                                <span className="spinner"></span>
                                                Processing...
                                            </span>
                                        ) : (
                                            'Request Booking'
                                        )}
                                    </button>

                                    {!isAuthenticated && (
                                        <div className="guest-booking-note">
                                            <p>💡 <strong>Tip:</strong>
                                                <span className="clickable" onClick={() => window.location.href = '/api/auth/google'}>
                                                    Sign in with Google
                                                </span>
                                                to save your preferences and book faster next time!
                                            </p>
                                        </div>
                                    )}
                                </form>
                            )}
                        </div>

                        {/* Booking Summary */}
                        <div className="booking-summary">
                            <h3>📋 Booking Summary</h3>
                            <div className="summary-details">
                                <div className="summary-item">
                                    <span className="summary-label">Booking Type</span>
                                    <span className="summary-value">
                                        {isAuthenticated ? '👤 Registered' : '👤 Guest'}
                                    </span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-label">Room Type</span>
                                    <span className="summary-value">{getRoomTypeLabel(formData.roomType)}</span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-label">Guests</span>
                                    <span className="summary-value">{formData.guests} {formData.guests === 1 ? 'Guest' : 'Guests'}</span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-label">Check-in</span>
                                    <span className="summary-value">{formData.checkIn || 'Select date'}</span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-label">Check-out</span>
                                    <span className="summary-value">{formData.checkOut || 'Select date'}</span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-label">Nights</span>
                                    <span className="summary-value">{nights || 0}</span>
                                </div>
                                <div className="summary-divider"></div>
                                <div className="summary-total">
                                    <span className="total-label">Total Price</span>
                                    <span className="total-value">₹{totalPrice || 0}</span>
                                </div>
                                <div className="summary-tax">
                                    <span>Including taxes & fees</span>
                                </div>
                            </div>

                            <div className="summary-amenities">
                                <h4>✨ Included Amenities</h4>
                                <ul>
                                    <li>✓ Free High-Speed Wi-Fi</li>
                                    <li>✓ Complimentary Breakfast</li>
                                    <li>✓ 24/7 Room Service</li>
                                    <li>✓ Valet Parking</li>
                                    <li>✓ Access to Restaurant</li>
                                </ul>
                            </div>

                            <div className="summary-cancellation">
                                <p><strong>Free Cancellation</strong></p>
                                <p>Cancel up to 24 hours before check-in for a full refund</p>
                            </div>

                            {isAuthenticated && user && (
                                <div className="summary-loyalty">
                                    <p>⭐ Loyalty Points: <strong>{user.loyaltyPoints || 0}</strong></p>
                                    <p>Tier: <strong>{user.loyaltyTier || 'Bronze'}</strong></p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="booking-footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="footer-section">
                            <h3>🏨 Hotel RAGHAV</h3>
                            <p>Luxury redefined. Experience the best of hospitality.</p>
                        </div>
                        <div className="footer-section">
                            <h4>Quick Links</h4>
                            <ul>
                                <li><a href="/">Home</a></li>
                                <li><a href="/#rooms">Rooms</a></li>
                                <li><a href="/#amenities">Amenities</a></li>
                                <li><a href="/#contact">Contact</a></li>
                            </ul>
                        </div>
                        <div className="footer-section">
                            <h4>Contact</h4>
                            <p>📍 7W4F+C26, Savhat, Uttar Pradesh 221011</p>
                            <p>📞 +91 9876543210</p>
                            <p>✉️ raghavhotel7@gmail.com</p>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>© {currentYear} Hotel RAGHAV. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default BookingPage;