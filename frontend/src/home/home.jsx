import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Home from "../assets/home.jpg";
import HotelExterior from "../assets/hotel3.jpeg";
import RoomInterior from "../assets/hotel5.jpeg";
import Restaurant from "../assets/food.jpg";
import Lobby from "../assets/hotel4.jpeg";
import EventHall from "../assets/hotel7.jpg";
import GardenArea from "../assets/hotel8.jpg";
import Room from "../assets/room.jpeg";
import "./HotelLanding.css";
import Room2 from "../assets/room2.jpeg";

const HotelLanding = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null); // ✅ Added
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(null);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const navigate = useNavigate();

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    // Contact form state
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

        // Handle OAuth callback
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        if (token) {
            localStorage.setItem('token', token);
            window.history.replaceState({}, document.title, window.location.pathname);
            checkAuthStatus();
        }
    }, []);

    // ✅ Fixed checkAuthStatus
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
                }
            } else {
                localStorage.removeItem('token');
                setIsAuthenticated(false);
                setUser(null);
            }
        } catch (error) {
            console.error('Auth check error:', error);
            localStorage.removeItem('token');
            setIsAuthenticated(false);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const scrollToSection = (sectionId) => {
        const section = document.getElementById(sectionId);
        if (section) section.scrollIntoView({ behavior: "smooth" });
        setIsMenuOpen(false);
    };

    const handleBookNow = (roomType = null, price = null) => {
        setSelectedRoom({ roomType, price });
        setAuthError(null);
        if (!isAuthenticated) {
            setShowAuthModal(true);
        } else {
            navigate('/booking', { state: { roomType, price, user } });
        }
    };

    // ✅ Fixed handleGoogleLogin
    const handleGoogleLogin = () => {
        setAuthError(null);
        localStorage.setItem('returnUrl', window.location.pathname);
        if (selectedRoom) {
            localStorage.setItem('selectedRoom', JSON.stringify(selectedRoom));
        }
        window.location.href = `${API_URL}/api/auth/google`;
    };

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

    const handleLogoutClick = () => setShowLogoutConfirm(true);
    const handleCancelLogout = () => setShowLogoutConfirm(false);

    // ✅ Fixed handleLogout
    const handleLogout = async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                await fetch(`${API_URL}/api/auth/logout`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
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

    // Contact form handlers
    const handleContactChange = (e) => {
        const { name, value } = e.target;
        setContactForm(prev => ({ ...prev, [name]: value }));
    };

    const handleContactSubmit = async (e) => {
        e.preventDefault();
        setContactLoading(true);
        setContactError('');
        setContactSuccess(false);

        const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(contactForm.email)) {
            setContactError('Please enter a valid email address');
            setContactLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/contact/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
                setTimeout(() => setContactSuccess(false), 5000);
            } else {
                setContactError(data.message || 'Failed to send message.');
            }
        } catch (error) {
            console.error('Contact form error:', error);
            setContactError('Network error. Please try again.');
        } finally {
            setContactLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loader"></div>
                <p>Loading...</p>
            </div>
        );
    }

    // ... rest of your JSX remains the same
    // (Navigation, Hero, About, Rooms, Amenities, Gallery, Contact, Auth Modal, Footer)
    // Make sure to use the updated user state and functions above

    return (
        <div className="hotel-landing">
            {/* ... your existing JSX ... */}
            {/* Replace the user-greeting with the user state */}
            <span className="user-greeting">
                👋 {user?.firstName || user?.email?.split('@')[0] || 'User'}
            </span>
            {/* ... rest of your JSX ... */}
        </div>
    );
};

export default HotelLanding;