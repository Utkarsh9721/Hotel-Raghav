import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Home from "../assets/home.jpg";
// Import gallery images
import HotelExterior from "../assets/hotel3.jpeg";
import RoomInterior from "../assets/hotel5.jpeg";
import Restaurant from "../assets/food.jpg";
import Lobby from "../assets/hotel4.jpeg";
import EventHall from "../assets/hotel7.jpg";
import GardenArea from "../assets/hotel8.jpg";
import Room from "../assets/room.jpeg";
import "./HotelLanding.css";
import Room2 from "../assets/room2.jpeg"

const HotelLanding = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(null);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const navigate = useNavigate();

    // Get backend URL from environment or use default
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    // ============================================
    // CONTACT FORM STATE
    // ============================================
    const [contactForm, setContactForm] = useState({
        name: '',
        email: '',
        phone: '',
        subject: 'General Question',
        message: ''
    });
    const [contactLoading, setContactLoading] = useState(false);
    const [contactSuccess, setContactSuccess] = useState(false);
    const [contactError, setContactError] = useState('');

    useEffect(() => {
        setCurrentYear(new Date().getFullYear());
        checkAuthStatus();

        // Check if user came from Google OAuth callback
        const urlParams = new URLSearchParams(window.location.search);
        const authSuccess = urlParams.get('auth');
        const token = urlParams.get('token');

        if (token) {
            localStorage.setItem('token', token);
            window.history.replaceState({}, document.title, window.location.pathname);
            checkAuthStatus();
        } else if (authSuccess === 'success') {
            window.history.replaceState({}, document.title, window.location.pathname);
            checkAuthStatus();
        }
    }, []);

    // Check authentication status
    const checkAuthStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            if (token && token !== 'null' && token !== 'undefined') {
                const response = await fetch(`${API_URL}/api/auth/status`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                const data = await response.json();
                if (data.isAuthenticated) {
                    setIsAuthenticated(true);
                    setUser(data.user);
                    setAuthError(null);
                } else {
                    localStorage.removeItem('token');
                    setIsAuthenticated(false);
                    setUser(null);
                    if (data.message) {
                        setAuthError(data.message);
                    }
                }
            } else {
                localStorage.removeItem('token');
                setIsAuthenticated(false);
                setUser(null);
            }
        } catch (error) {
            console.error('Auth check error:', error);
            setAuthError('Failed to check authentication status');
            localStorage.removeItem('token');
            setIsAuthenticated(false);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const scrollToSection = (sectionId) => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: "smooth" });
        }
        setIsMenuOpen(false);
    };

    // Handle Book Now click
    const handleBookNow = (roomType = null, price = null) => {
        setSelectedRoom({ roomType, price });
        setAuthError(null);

        if (!isAuthenticated) {
            setShowAuthModal(true);
        } else {
            navigate('/booking', {
                state: {
                    roomType,
                    price,
                    user
                }
            });
        }
    };

    // Handle Google Login
    const handleGoogleLogin = () => {
        localStorage.setItem('returnUrl', window.location.pathname);
        if (selectedRoom) {
            localStorage.setItem('selectedRoom', JSON.stringify(selectedRoom));
        }
        window.location.href = `${API_URL}/api/auth/google`;
    };

    // Handle Guest Booking (without login)
    const handleGuestBooking = () => {
        setShowAuthModal(false);
        setAuthError(null);
        navigate('/booking-guest', {
            state: {
                roomType: selectedRoom?.roomType,
                price: selectedRoom?.price
            }
        });
    };

    // Handle Logout click - show confirmation
    const handleLogoutClick = () => {
        setShowLogoutConfirm(true);
    };

    // Cancel logout
    const handleCancelLogout = () => {
        setShowLogoutConfirm(false);
    };

    // Handle Logout
    const handleLogout = async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                await fetch(`${API_URL}/api/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
            localStorage.removeItem('token');
            setIsAuthenticated(false);
            setUser(null);
            setAuthError(null);
            setShowLogoutConfirm(false);
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
            localStorage.removeItem('token');
            setIsAuthenticated(false);
            setUser(null);
            setShowLogoutConfirm(false);
        }
    };

    // ============================================
    // CONTACT FORM HANDLERS
    // ============================================
    const handleContactChange = (e) => {
        const { name, value } = e.target;
        setContactForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleContactSubmit = async (e) => {
        e.preventDefault();
        setContactLoading(true);
        setContactError('');
        setContactSuccess(false);

        // Validate email
        const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(contactForm.email)) {
            setContactError('Please enter a valid email address');
            setContactLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/contact/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(contactForm)
            });

            const data = await response.json();

            if (data.success) {
                setContactSuccess(true);
                setContactForm({
                    name: '',
                    email: '',
                    phone: '',
                    subject: 'General Question',
                    message: ''
                });
                // Auto-hide success message after 5 seconds
                setTimeout(() => setContactSuccess(false), 5000);
            } else {
                setContactError(data.message || 'Failed to send message. Please try again.');
            }
        } catch (error) {
            console.error('Contact form error:', error);
            setContactError('Network error. Please check your connection and try again.');
        } finally {
            setContactLoading(false);
        }
    };

    // Show loading state while checking auth
    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loader"></div>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="hotel-landing">
            {/* Navigation */}
            <nav className="navbar">
                <div className="nav-container">
                    <div className="nav-logo">
                        <span className="logo-text">Hotel RAGHAV</span>
                        <span className="logo-stars">★★★★★</span>
                    </div>

                    <div className={`nav-menu ${isMenuOpen ? "active" : ""}`}>
                        <ul className="nav-links">
                            <li><a href="#home" onClick={() => scrollToSection("home")}>Home</a></li>
                            <li><a href="#about" onClick={() => scrollToSection("about")}>About</a></li>
                            <li><a href="#rooms" onClick={() => scrollToSection("rooms")}>Rooms</a></li>
                            <li><a href="#amenities" onClick={() => scrollToSection("amenities")}>Amenities</a></li>
                            <li><a href="#gallery" onClick={() => scrollToSection("gallery")}>Gallery</a></li>
                            <li><a href="#contact" onClick={() => scrollToSection("contact")}>Contact</a></li>
                            <li><a href="/admin/login" className="admin-link">🔐 Admin</a></li>
                        </ul>
                    </div>

                    <div className="nav-cta">
                        {isAuthenticated ? (
                            <div className="user-menu">
                                <span className="user-greeting">
                                    👋 {user?.firstName || user?.email?.split('@')[0]}
                                </span>
                                <button onClick={handleLogoutClick} className="btn-logout">
                                    <svg className="logout-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                        <polyline points="16 17 21 12 16 7" />
                                        <line x1="21" y1="12" x2="9" y2="12" />
                                    </svg>
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <button className="btn-book-now" onClick={() => handleBookNow()}>
                                Book Now
                            </button>
                        )}
                    </div>

                    <div className="hamburger" onClick={toggleMenu}>
                        <span className="bar"></span>
                        <span className="bar"></span>
                        <span className="bar"></span>
                    </div>
                </div>
            </nav>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="logout-modal">
                    <div className="logout-modal-content">
                        <div className="logout-modal-header">
                            <span className="logout-icon-big">👋</span>
                            <h2>Logout Confirmation</h2>
                            <p>Are you sure you want to logout?</p>
                        </div>
                        <div className="logout-modal-body">
                            <p>You will be redirected to the home page.</p>
                            {user && (
                                <div className="logout-user-info">
                                    <span>👤 {user.firstName || user.email}</span>
                                </div>
                            )}
                        </div>
                        <div className="logout-modal-footer">
                            <button className="btn-cancel-logout" onClick={handleCancelLogout}>
                                Cancel
                            </button>
                            <button className="btn-confirm-logout" onClick={handleLogout}>
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Auth Error Banner */}
            {authError && (
                <div className="auth-error-banner">
                    <span>⚠️ {authError}</span>
                    <button onClick={() => setAuthError(null)}>×</button>
                </div>
            )}

            {/* Hero Section */}
            <section id="home" className="hero-section">
                <div className="hero-background">
                    <img src={Home} alt="Raghav Hotel" className="hero-image" />
                    <div className="hero-overlay"></div>
                </div>
                <div className="hero-content">
                    <h1 className="hero-title">Welcome to <span className="highlight">Hotel RAGHAV</span></h1>
                    <p className="hero-subtitle">Experience Luxury &amp; Comfort in the Heart of the City</p>
                    <div className="hero-buttons">
                        <button className="btn-primary" onClick={() => handleBookNow()}>Book Now</button>
                        <button className="btn-secondary" onClick={() => scrollToSection("gallery")}>View Gallery</button>
                    </div>
                    <div className="hero-stats">
                        <div className="stat-item">
                            <span className="stat-number">500+</span>
                            <span className="stat-label">Happy Guests</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">50+</span>
                            <span className="stat-label">Luxury Rooms</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">4.8</span>
                            <span className="stat-label">★ Rating</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="about-section">
                <div className="container">
                    <div className="section-header">
                        <h2>About Hotel RAGHAV</h2>
                        <p>Discover the perfect blend of luxury and comfort</p>
                    </div>
                    <div className="about-content">
                        <div className="about-text">
                            <h3>Your Home Away From Home</h3>
                            <p>
                                Welcome to Hotel RAGHAV, where elegance meets comfort.
                                Nestled in the heart of the city, we offer a luxurious
                                retreat for both business and leisure travelers. Our
                                commitment to exceptional service and attention to detail
                                ensures an unforgettable stay.
                            </p>
                            <div className="about-features">
                                <div className="feature">
                                    <span className="feature-icon">🏨</span>
                                    <span>Premium Rooms</span>
                                </div>
                                <div className="feature">
                                    <span className="feature-icon">🍽️</span>
                                    <span>Fine Dining</span>
                                </div>
                                <div className="feature">
                                    <span className="feature-icon">🚗</span>
                                    <span>Valet Parking</span>
                                </div>
                                <div className="feature">
                                    <span className="feature-icon">🌐</span>
                                    <span>Free Wi-Fi</span>
                                </div>
                            </div>
                        </div>
                        <div className="about-image">
                            <img src={HotelExterior} alt="Luxury Interior" className="about-img" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Rooms Section */}
            <section id="rooms" className="rooms-section">
                <div className="container">
                    <div className="section-header">
                        <h2>Our Rooms</h2>
                        <p>Choose from our selection of elegant rooms and suites</p>
                    </div>
                    <div className="rooms-grid">
                        <div className="room-card">
                            <div className="room-image">
                                <img src={RoomInterior} alt="Standard Room" className="room-img" />
                            </div>
                            <div className="room-info">
                                <h3>Non Air-Conditioner Room</h3>
                                <p>Comfortable and cozy room with essential amenities</p>
                                <div className="room-price">
                                    <span>₹800</span>
                                    <span>/ night</span>
                                </div>
                                <button className="btn-book" onClick={() => handleBookNow('standard', 800)}>
                                    Book Now
                                </button>
                            </div>
                        </div>

                        <div className="room-card featured">
                            <div className="room-badge">Popular</div>
                            <div className="room-image">
                                <img src={Room2} alt="Deluxe Room" className="room-img" />
                            </div>
                            <div className="room-info">
                                <h3>Deluxe Room</h3>
                                <p>Spacious room with premium amenities and city view</p>
                                <div className="room-price">
                                    <span>₹1000</span>
                                    <span>/ night</span>
                                </div>
                                <button className="btn-book" onClick={() => handleBookNow('deluxe', 1000)}>
                                    Book Now
                                </button>
                            </div>
                        </div>

                        <div className="room-card">
                            <div className="room-image">
                                <img src={Room} alt="Executive Suite" className="room-img" />
                            </div>
                            <div className="room-info">
                                <h3>Executive Suite</h3>
                                <p>Luxurious suite with separate living area and VIP services</p>
                                <div className="room-price">
                                    <span>₹1500</span>
                                    <span>/ night</span>
                                </div>
                                <button className="btn-book" onClick={() => handleBookNow('suite', 1500)}>
                                    Book Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Amenities Section */}
            <section id="amenities" className="amenities-section">
                <div className="container">
                    <div className="section-header">
                        <h2>Amenities</h2>
                        <p>World-class facilities to make your stay extraordinary</p>
                    </div>
                    <div className="amenities-grid">
                        <div className="amenity-card">
                            <div className="amenity-icon">🍝</div>
                            <h3>Multi-Cuisine Restaurant</h3>
                            <p>Award-winning chefs serving global cuisine</p>
                        </div>
                        <div className="amenity-card">
                            <div className="amenity-icon">🚗</div>
                            <h3>Valet Parking</h3>
                            <p>Complimentary valet parking service</p>
                        </div>
                        <div className="amenity-card">
                            <div className="amenity-icon">🌐</div>
                            <h3>Free High-Speed Wi-Fi</h3>
                            <p>Stay connected throughout the property</p>
                        </div>
                        <div className="amenity-card">
                            <div className="amenity-icon">🛎️</div>
                            <h3>24/7 Concierge</h3>
                            <p>Round-the-clock assistance for your needs</p>
                        </div>
                        <div className="amenity-card">
                            <div className="amenity-icon">🧺</div>
                            <h3>Laundry Service</h3>
                            <p>Professional laundry and dry cleaning</p>
                        </div>
                        <div className="amenity-card">
                            <div className="amenity-icon">🎤</div>
                            <h3>Event Hall</h3>
                            <p>Spacious venue for meetings and celebrations</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Gallery Section */}
            <section id="gallery" className="gallery-section">
                <div className="container">
                    <div className="section-header">
                        <h2>Gallery</h2>
                        <p>A glimpse of our luxurious property</p>
                    </div>
                    <div className="gallery-grid">
                        <div className="gallery-item">
                            <img src={HotelExterior} alt="Hotel Exterior" className="gallery-img" />
                            <div className="gallery-overlay">
                                <span>Hotel Exterior</span>
                            </div>
                        </div>
                        <div className="gallery-item">
                            <img src={RoomInterior} alt="Room Interior" className="gallery-img" />
                            <div className="gallery-overlay">
                                <span>Room Interior</span>
                            </div>
                        </div>
                        <div className="gallery-item">
                            <img src={Restaurant} alt="Restaurant" className="gallery-img" />
                            <div className="gallery-overlay">
                                <span>Restaurant</span>
                            </div>
                        </div>
                        <div className="gallery-item">
                            <img src={Lobby} alt="Lobby" className="gallery-img" />
                            <div className="gallery-overlay">
                                <span>Lobby</span>
                            </div>
                        </div>
                        <div className="gallery-item">
                            <img src={EventHall} alt="Event Hall" className="gallery-img" />
                            <div className="gallery-overlay">
                                <span>Event Hall</span>
                            </div>
                        </div>
                        <div className="gallery-item">
                            <img src={GardenArea} alt="Garden Area" className="gallery-img" />
                            <div className="gallery-overlay">
                                <span>Garden Area</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Section - UPDATED */}
            <section id="contact" className="contact-section">
                <div className="container">
                    <div className="section-header">
                        <h2>Contact Us</h2>
                        <p>Get in touch with us for reservations and inquiries</p>
                    </div>
                    <div className="contact-content">
                        <div className="contact-info">
                            <h3>Visit Us</h3>
                            <p>📍 7W4F+C26, Savhat, Uttar Pradesh 221011</p>
                            <p>📞 +91 9335424144</p>
                            <p>✉️ raghavhotel7@gmail.com</p>
                            <div className="social-links">
                                <a href="#" className="social-link">📱</a>
                                <a href="#" className="social-link">📘</a>
                                <a href="#" className="social-link">📸</a>
                                <a href="#" className="social-link">🐦</a>
                            </div>
                        </div>

                        <form onSubmit={handleContactSubmit} className="contact-form">
                            {contactSuccess && (
                                <div className="contact-success-message">
                                    ✅ Your message has been sent successfully! We will get back to you soon.
                                </div>
                            )}

                            {contactError && (
                                <div className="contact-error-message">
                                    ⚠️ {contactError}
                                </div>
                            )}

                            <input
                                type="text"
                                name="name"
                                placeholder="Your Name"
                                value={contactForm.name}
                                onChange={handleContactChange}
                                required
                            />
                            <input
                                type="email"
                                name="email"
                                placeholder="Your Email"
                                value={contactForm.email}
                                onChange={handleContactChange}
                                required
                            />
                            <input
                                type="tel"
                                name="phone"
                                placeholder="Phone Number"
                                value={contactForm.phone}
                                onChange={handleContactChange}
                            />
                            <select
                                name="subject"
                                value={contactForm.subject}
                                onChange={handleContactChange}
                            >
                                <option value="General Question">General Question</option>
                                <option value="Room Booking">Room Booking</option>
                                <option value="Event Inquiry">Event Inquiry</option>
                                <option value="Feedback">Feedback</option>
                                <option value="Other">Other</option>
                            </select>
                            <textarea
                                name="message"
                                placeholder="Your Message"
                                rows="5"
                                value={contactForm.message}
                                onChange={handleContactChange}
                                required
                            ></textarea>
                            <button
                                type="submit"
                                className="btn-submit"
                                disabled={contactLoading}
                            >
                                {contactLoading ? 'Sending...' : 'Send Message'}
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            {/* Auth Modal */}
            {showAuthModal && (
                <div className="auth-modal">
                    <div className="auth-modal-content">
                        <button
                            className="modal-close"
                            onClick={() => setShowAuthModal(false)}
                        >
                            ×
                        </button>

                        <div className="auth-modal-header">
                            <h2>🔐 Login Required</h2>
                            <p>Please login to book your stay at Hotel RAGHAV</p>
                            {selectedRoom && (
                                <div className="selected-room-info">
                                    <p>Selected: <strong>{selectedRoom.roomType?.toUpperCase() || 'Room'}</strong></p>
                                    <p>Price: <strong>₹{selectedRoom.price}/night</strong></p>
                                </div>
                            )}
                        </div>

                        <div className="auth-options">
                            <button
                                className="btn-google-login"
                                onClick={handleGoogleLogin}
                            >
                                <svg width="20" height="20" viewBox="0 0 48 48">
                                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                                </svg>
                                Continue with Google
                            </button>

                            <div className="auth-divider">
                                <span>or</span>
                            </div>

                            <button
                                className="btn-guest-login"
                                onClick={handleGuestBooking}
                            >
                                🚀 Continue as Guest
                            </button>
                        </div>

                        <div className="auth-benefits">
                            <h4>Benefits of logging in:</h4>
                            <ul>
                                <li>✓ Faster booking process</li>
                                <li>✓ View booking history</li>
                                <li>✓ Earn loyalty points</li>
                                <li>✓ Special member discounts</li>
                                <li>✓ Save preferences</li>
                            </ul>
                        </div>

                        <div className="auth-footer">
                            <p>
                                By continuing, you agree to our
                                <a href="/terms"> Terms of Service</a> and
                                <a href="/privacy"> Privacy Policy</a>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="footer-section">
                            <h3>Hotel RAGHAV</h3>
                            <p>Luxury redefined. Experience the best of hospitality.</p>
                        </div>
                        <div className="footer-section">
                            <h4>Quick Links</h4>
                            <ul>
                                <li><a href="#home">Home</a></li>
                                <li><a href="#rooms">Rooms</a></li>
                                <li><a href="#about">About</a></li>
                                <li><a href="#contact">Contact</a></li>
                                <li><a href="/admin/login">Admin Login</a></li>
                            </ul>
                        </div>
                        <div className="footer-section">
                            <h4>Business Hours</h4>
                            <p>24/7 Reception</p>
                            <p>Check-in: 2:00 PM</p>
                            <p>Check-out: 12:00 PM</p>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>© {currentYear}Hotel RAGHAV. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HotelLanding;