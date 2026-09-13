// BookingPage.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './book.css';

/* ════════════════════════════════════════════════════════════
   INLINE HOOKS
   ════════════════════════════════════════════════════════════ */

const use3DTilt = (max = 5, withShine = true) => {
    const ref = useRef(null);
    const raf = useRef(null);
    const target = useRef({ rx: 0, ry: 0, mx: 50, my: 50, scale: 1 });
    const current = useRef({ rx: 0, ry: 0, mx: 50, my: 50, scale: 1 });

    const loop = useCallback(() => {
        const el = ref.current;
        if (!el) { raf.current = null; return; }
        const c = current.current, t = target.current;
        const k = 0.16;
        c.rx += (t.rx - c.rx) * k;
        c.ry += (t.ry - c.ry) * k;
        c.mx += (t.mx - c.mx) * k;
        c.my += (t.my - c.my) * k;
        c.scale += (t.scale - c.scale) * k;
        el.style.setProperty('--rx', `${c.rx.toFixed(2)}deg`);
        el.style.setProperty('--ry', `${c.ry.toFixed(2)}deg`);
        el.style.setProperty('--mx', `${c.mx.toFixed(1)}%`);
        el.style.setProperty('--my', `${c.my.toFixed(1)}%`);
        el.style.setProperty('--scale', c.scale.toFixed(3));
        const settled =
            Math.abs(t.rx - c.rx) < 0.02 && Math.abs(t.ry - c.ry) < 0.02 &&
            Math.abs(t.scale - c.scale) < 0.002;
        raf.current = settled ? null : requestAnimationFrame(loop);
    }, []);

    const start = useCallback(() => {
        if (!raf.current) raf.current = requestAnimationFrame(loop);
    }, [loop]);

    const onMouseMove = useCallback((e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        target.current.rx = (0.5 - py) * max * 2;
        target.current.ry = (px - 0.5) * max * 2;
        if (withShine) { target.current.mx = px * 100; target.current.my = py * 100; }
        target.current.scale = 1.01;
        start();
    }, [max, withShine, start]);

    const onMouseLeave = useCallback(() => {
        target.current = { ...target.current, rx: 0, ry: 0, mx: 50, my: 50, scale: 1 };
        start();
    }, [start]);

    useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);

    return { ref, onMouseMove, onMouseLeave };
};

const useMagnetic = (strength = 0.22, radius = 70) => {
    const ref = useRef(null);
    const raf = useRef(null);
    const target = useRef({ x: 0, y: 0 });
    const current = useRef({ x: 0, y: 0 });

    const loop = useCallback(() => {
        const el = ref.current;
        if (!el) { raf.current = null; return; }
        const c = current.current, t = target.current;
        c.x += (t.x - c.x) * 0.18;
        c.y += (t.y - c.y) * 0.18;
        el.style.setProperty('--mx-off', `${c.x.toFixed(2)}px`);
        el.style.setProperty('--my-off', `${c.y.toFixed(2)}px`);
        const settled = Math.abs(t.x - c.x) < 0.05 && Math.abs(t.y - c.y) < 0.05;
        raf.current = settled ? null : requestAnimationFrame(loop);
    }, []);

    const start = useCallback(() => {
        if (!raf.current) raf.current = requestAnimationFrame(loop);
    }, [loop]);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const onMove = (e) => {
            const r = el.getBoundingClientRect();
            const cx = r.left + r.width / 2;
            const cy = r.top + r.height / 2;
            const dx = e.clientX - cx;
            const dy = e.clientY - cy;
            const dist = Math.hypot(dx, dy);
            const reach = Math.max(r.width, r.height) / 2 + radius;
            if (dist < reach) {
                const f = 1 - dist / reach;
                target.current.x = dx * strength * f;
                target.current.y = dy * strength * f;
            } else {
                target.current.x = 0;
                target.current.y = 0;
            }
            start();
        };
        const onLeave = () => { target.current = { x: 0, y: 0 }; start(); };
        window.addEventListener('mousemove', onMove, { passive: true });
        el.addEventListener('mouseleave', onLeave);
        return () => {
            window.removeEventListener('mousemove', onMove);
            el.removeEventListener('mouseleave', onLeave);
            if (raf.current) cancelAnimationFrame(raf.current);
        };
    }, [strength, radius, start]);

    return ref;
};

const useCountUp = (end, duration = 700) => {
    const [value, setValue] = useState(end);
    const prev = useRef(end);
    useEffect(() => {
        const from = prev.current;
        if (from === end) return;
        let raf;
        const t0 = performance.now();
        const tick = (now) => {
            const p = Math.min(1, (now - t0) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            setValue(from + (end - from) * eased);
            if (p < 1) raf = requestAnimationFrame(tick);
            else prev.current = end;
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [end, duration]);
    return value;
};

const useScrolled = (threshold = 20) => {
    const [scrolled, setScrolled] = useState(false);
    const [pct, setPct] = useState(0);
    useEffect(() => {
        let raf = null;
        const onScroll = () => {
            if (raf) return;
            raf = requestAnimationFrame(() => {
                const y = window.scrollY;
                setScrolled(y > threshold);
                const h = document.documentElement.scrollHeight - window.innerHeight;
                setPct(h > 0 ? Math.min(1, y / h) : 0);
                raf = null;
            });
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
    }, [threshold]);
    return { scrolled, pct };
};

/* ════════════════════════════════════════════════════════════
   REUSABLE WRAPPERS
   ════════════════════════════════════════════════════════════ */

const MagneticButton = ({ children, className = '', onClick, type = 'button', disabled, ...rest }) => {
    const ref = useMagnetic(0.22, 70);
    return (
        <button
            ref={ref}
            type={type}
            className={`magnetic ${className}`}
            onClick={onClick}
            disabled={disabled}
            {...rest}
        >
            <span className="magnetic-inner">{children}</span>
        </button>
    );
};

const TiltSection = ({ children, className = '', intensity = 3, delay = 0 }) => {
    const tilt = use3DTilt(intensity, true);
    return (
        <div
            ref={tilt.ref}
            className={`tilt-section ${className}`}
            onMouseMove={tilt.onMouseMove}
            onMouseLeave={tilt.onMouseLeave}
            style={{ '--enter-delay': `${delay}ms` }}
        >
            {children}
            <span className="tilt-shine" aria-hidden="true" />
        </div>
    );
};

/* ════════════════════════════════════════════════════════════
   CONSTANTS
   ════════════════════════════════════════════════════════════ */

const ROOMS = [
    {
        id: 'standard',
        label: 'Non AC Room',
        price: 800,
        desc: 'Cozy essentials',
        emoji: '🛏️',
        accent: 'linear-gradient(135deg, #7a6a4a, #a08858)'
    },
    {
        id: 'deluxe',
        label: 'Deluxe Room',
        price: 1000,
        desc: 'Spacious & bright',
        emoji: '✨',
        popular: true,
        accent: 'linear-gradient(135deg, #b9884a, #d7ac72)'
    },
    {
        id: 'suite',
        label: 'Executive Suite',
        price: 1500,
        desc: 'Living + bedroom',
        emoji: '👑',
        accent: 'linear-gradient(135deg, #7a2432, #a83a4a)'
    }
];

const TIER_DISCOUNTS = {
    Bronze: 0,
    Silver: 0.05,
    Gold: 0.10,
    Platinum: 0.15
};

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════ */

const BookingPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [authChecked, setAuthChecked] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [shakeField, setShakeField] = useState(null);
    const [progress, setProgress] = useState(0);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const { scrolled, pct } = useScrolled(20);

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

    const [nights, setNights] = useState(0);
    const [subtotal, setSubtotal] = useState(0);
    const [taxes, setTaxes] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [totalPrice, setTotalPrice] = useState(0);
    const animatedTotal = useCountUp(totalPrice, 600);

    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [bookingReference, setBookingReference] = useState('');
    const [copiedRef, setCopiedRef] = useState(false);
    const [countdown, setCountdown] = useState(8);
    const [currentYear] = useState(new Date().getFullYear());

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const currentRoom = useMemo(
        () => ROOMS.find(r => r.id === formData.roomType) || ROOMS[0],
        [formData.roomType]
    );

    const tierDiscountRate = useMemo(() => {
        if (!isAuthenticated || !user?.loyaltyTier) return 0;
        return TIER_DISCOUNTS[user.loyaltyTier] || 0;
    }, [isAuthenticated, user]);

    /* ── AUTH CHECK ─────────────────────────────── */
    useEffect(() => {
        const checkAuthAndRedirect = async () => {
            const token = localStorage.getItem('token');
            let isAuth = false;

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
                        setIsAuthenticated(true);
                        setUser(data.user);
                        setFormData(prev => ({
                            ...prev,
                            firstName: data.user.firstName || '',
                            lastName: data.user.lastName || '',
                            email: data.user.email || '',
                            phone: data.user.phone || ''
                        }));
                    }
                } catch (error) {
                    console.error('Auth check error:', error);
                }
            }

            const isGuest = window.location.pathname.includes('booking-guest');
            const state = location.state;

            if (state) {
                if (state.roomType) setFormData(prev => ({ ...prev, roomType: state.roomType }));
                if (state.user) {
                    setUser(state.user);
                    setIsAuthenticated(true);
                    setFormData(prev => ({
                        ...prev,
                        firstName: state.user.firstName || '',
                        lastName: state.user.lastName || '',
                        email: state.user.email || '',
                        phone: state.user.phone || ''
                    }));
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

    /* ── PRICING ───────────────────────────────── */
    useEffect(() => {
        if (formData.checkIn && formData.checkOut) {
            const ci = new Date(formData.checkIn);
            const co = new Date(formData.checkOut);
            const diffDays = Math.ceil(Math.abs(co - ci) / (1000 * 60 * 60 * 24));

            if (diffDays > 0) {
                setNights(diffDays);
                const base = currentRoom.price * diffDays * formData.guests;
                const tax = Math.round(base * 0.12);
                const disc = Math.round(base * tierDiscountRate);
                setSubtotal(base);
                setTaxes(tax);
                setDiscount(disc);
                setTotalPrice(base + tax - disc);
            } else {
                setNights(0);
                setSubtotal(0);
                setTaxes(0);
                setDiscount(0);
                setTotalPrice(0);
            }
        } else {
            setNights(0);
            setSubtotal(0);
            setTaxes(0);
            setDiscount(0);
            setTotalPrice(0);
        }
    }, [formData.checkIn, formData.checkOut, formData.roomType, formData.guests, currentRoom.price, tierDiscountRate]);

    /* ── PROGRESS ──────────────────────────────── */
    useEffect(() => {
        let prog = 0;
        if (formData.roomType) prog += 20;
        if (formData.checkIn && formData.checkOut) prog += 25;
        if (formData.firstName) prog += 20;
        if (formData.email && formData.phone) prog += 20;
        if (formData.specialRequests) prog += 15;
        setProgress(Math.min(prog, 100));
    }, [formData]);

    /* ── SUCCESS COUNTDOWN ─────────────────────── */
    useEffect(() => {
        if (!bookingSuccess) return;
        setCountdown(8);
        const interval = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
        const timeout = setTimeout(() => {
            setBookingSuccess(false);
            navigate('/', {
                state: { bookingSuccess: true, reference: bookingReference }
            });
        }, 8000);
        return () => { clearInterval(interval); clearTimeout(timeout); };
    }, [bookingSuccess, bookingReference, navigate]);

    const currentStep = useMemo(() => {
        if (progress >= 85) return 4;
        if (progress >= 65) return 3;
        if (progress >= 45) return 2;
        return 1;
    }, [progress]);

    const estimatedTime = useMemo(() => {
        if (currentStep === 4) return 'Ready to submit';
        if (currentStep === 3) return '~1 min left';
        if (currentStep === 2) return '~2 min left';
        return '~3 min left';
    }, [currentStep]);

    /* ── HANDLERS ──────────────────────────────── */
    const handleChange = (e) => {
        const { name, value } = e.target;
        let formatted = value;

        if (name === 'phone') {
            const digits = value.replace(/\D/g, '').slice(0, 10);
            if (digits.length > 0) {
                if (digits.length <= 5) formatted = `+91 ${digits}`;
                else if (digits.length <= 8) formatted = `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
                else formatted = `+91 ${digits.slice(0, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
            } else {
                formatted = '';
            }
        }

        setFormData(prev => ({ ...prev, [name]: formatted }));
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleBlur = (e) => {
        const { name } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.firstName.trim()) errors.firstName = 'First name is required';
        if (!formData.email.trim()) errors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Please enter a valid email';
        if (!formData.phone.trim()) errors.phone = 'Phone number is required';
        else {
            const digits = formData.phone.replace(/\D/g, '');
            if (digits.length < 10) errors.phone = 'Please enter a valid phone number';
        }
        if (!formData.checkIn) errors.checkIn = 'Check-in date is required';
        if (!formData.checkOut) errors.checkOut = 'Check-out date is required';
        if (formData.checkIn && formData.checkOut) {
            if (new Date(formData.checkOut) <= new Date(formData.checkIn)) {
                errors.checkOut = 'Check-out must be after check-in';
            }
        }
        setFormErrors(errors);
        const keys = Object.keys(errors);
        if (keys.length > 0) {
            setShakeField(keys[0]);
            setTimeout(() => setShakeField(null), 600);
        }
        return keys.length === 0;
    };

    const handleGoogleLogin = () => {
        localStorage.setItem('bookingData', JSON.stringify({
            roomType: formData.roomType,
            guests: formData.guests,
            checkIn: formData.checkIn,
            checkOut: formData.checkOut
        }));
        window.location.href = `${API_URL}/api/auth/google`;
    };

    const handleCopyRef = async () => {
        try {
            await navigator.clipboard.writeText(bookingReference);
            setCopiedRef(true);
            setTimeout(() => setCopiedRef(false), 2000);
        } catch { /* ignore */ }
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
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const bookingData = {
                roomType: formData.roomType,
                guests: parseInt(formData.guests),
                checkIn: formData.checkIn,
                checkOut: formData.checkOut,
                totalPrice,
                nights,
                subtotal,
                taxes,
                discount,
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim() || '',
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                specialRequests: formData.specialRequests || 'None',
                isGuest: !isAuthenticated,
                userId: user?._id || null
            };

            const response = await fetch(`${API_URL}/api/bookings/create`, {
                method: 'POST',
                headers,
                body: JSON.stringify(bookingData)
            });
            const data = await response.json();

            if (data.success) {
                setBookingSuccess(true);
                setBookingReference(data.booking?.bookingReference || 'N/A');
                window.scrollTo({ top: 0, behavior: 'smooth' });
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

    if (!authChecked) {
        return (
            <div className="loading-screen">
                <div className="loader"></div>
                <p>Preparing your booking…</p>
            </div>
        );
    }

    if (!isAuthenticated && !window.location.pathname.includes('booking-guest')) {
        return null;
    }

    /* ── FIELD VALIDITY (live) ─────────────────── */
    const fieldIsValid = (name) => {
        if (!touched[name]) return false;
        if (formErrors[name]) return false;
        const v = formData[name];
        return v && v.toString().trim().length > 0;
    };

    return (
        <div className="booking-page">
            <div className="scroll-progress" style={{ transform: `scaleX(${pct})` }} />

            {/* ─── NAV ──────────────────────────────── */}
            <nav className={`booking-nav ${scrolled ? 'is-scrolled' : ''}`}>
                <div className="nav-container">
                    <button className="nav-logo" onClick={() => navigate('/')}>
                        <span className="logo-mark" aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="20" height="20">
                                <path d="M12 2 3 7v13h6v-6h6v6h6V7z" fill="currentColor" />
                            </svg>
                        </span>
                        <span className="logo-text">Hotel <em>Raghav</em></span>
                    </button>

                    <ul className="nav-links">
                        <li><a href="/">Home</a></li>
                        <li><a href="/#rooms">Rooms</a></li>
                        <li><a href="/#amenities">Amenities</a></li>
                        <li><a href="/#contact">Contact</a></li>
                    </ul>

                    <div className="nav-user">
                        {isAuthenticated && user ? (
                            <span className="user-badge">
                                <span className="user-badge-avatar">
                                    {(user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                                </span>
                                <span>{user.firstName || user.email.split('@')[0]}</span>
                            </span>
                        ) : (
                            <span className="guest-badge">
                                <span className="user-badge-dot" />
                                Guest Booking
                            </span>
                        )}
                    </div>
                </div>
            </nav>

            {/* ─── HERO ─────────────────────────────── */}
            <section className="booking-hero">
                <div className="hero-beam" aria-hidden="true" />
                <div className="hero-orb hero-orb--1" aria-hidden="true" />
                <div className="hero-orb hero-orb--2" aria-hidden="true" />
                <div className="hero-orb hero-orb--3" aria-hidden="true" />
                <div className="hero-grid" aria-hidden="true" />

                <div className="booking-hero-content">
                    <div className="hero-badge">
                        <span className="hero-badge-dot" />
                        Live availability
                    </div>
                    <h1>Book Your <span className="highlight">Stay</span></h1>
                    <p>Reserve in under two minutes. No payment required today.</p>
                </div>
            </section>

            {/* ─── PROGRESS ─────────────────────────── */}
            <div className="progress-container">
                <div className="progress-meta">
                    <div className="progress-ring" aria-hidden="true">
                        <svg viewBox="0 0 44 44" width="44" height="44">
                            <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(23,19,15,0.08)" strokeWidth="3" />
                            <circle
                                cx="22" cy="22" r="18" fill="none"
                                stroke="url(#progressGradient)" strokeWidth="3"
                                strokeLinecap="round"
                                strokeDasharray={113}
                                strokeDashoffset={113 - (113 * progress) / 100}
                                transform="rotate(-90 22 22)"
                                style={{ transition: 'stroke-dashoffset 480ms cubic-bezier(0.22, 1, 0.36, 1)' }}
                            />
                            <defs>
                                <linearGradient id="progressGradient" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stopColor="#d7ac72" />
                                    <stop offset="100%" stopColor="#b9884a" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <span className="ring-text">{Math.round(progress)}%</span>
                    </div>
                    <div className="progress-text">
                        <strong>Step {currentStep} of 4</strong>
                        <span>{estimatedTime}</span>
                    </div>
                </div>

                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>

                <div className="progress-steps">
                    {[
                        { n: 1, label: 'Room', at: 20 },
                        { n: 2, label: 'Dates', at: 45 },
                        { n: 3, label: 'Details', at: 65 },
                        { n: 4, label: 'Review', at: 85 }
                    ].map(s => (
                        <span key={s.n} className={progress >= s.at ? 'active' : ''}>
                            <i className="step-num">{s.n}</i>
                            {s.label}
                        </span>
                    ))}
                </div>
            </div>

            {/* ─── FORM ─────────────────────────────── */}
            <section className="booking-form-section">
                <div className="container">
                    <div className="booking-wrapper">
                        <div className="booking-form-container">
                            {bookingSuccess ? (
                                <SuccessPanel
                                    bookingReference={bookingReference}
                                    countdown={countdown}
                                    onHome={() => navigate('/')}
                                    onCopy={handleCopyRef}
                                    copied={copiedRef}
                                />
                            ) : (
                                <form onSubmit={handleSubmit} className="booking-form" noValidate>
                                    <header className="form-header">
                                        <h2>Reservation Details</h2>
                                        <p>Fill in your details — it takes less than 2 minutes.</p>
                                    </header>

                                    {/* ROOM PICKER */}
                                    <TiltSection className="form-section" delay={0}>
                                        <h3>
                                            <span className="section-num">01</span>
                                            Choose Your Room
                                        </h3>

                                        <div className="room-picker">
                                            {ROOMS.map(room => (
                                                <button
                                                    key={room.id}
                                                    type="button"
                                                    className={`room-tile ${formData.roomType === room.id ? 'selected' : ''}`}
                                                    onClick={() => setFormData(p => ({ ...p, roomType: room.id }))}
                                                    aria-pressed={formData.roomType === room.id}
                                                >
                                                    {room.popular && <span className="room-tile-badge">Popular</span>}
                                                    <span className="room-tile-emoji" style={{ background: room.accent }}>
                                                        {room.emoji}
                                                    </span>
                                                    <span className="room-tile-info">
                                                        <strong>{room.label}</strong>
                                                        <span>{room.desc}</span>
                                                    </span>
                                                    <span className="room-tile-price">
                                                        ₹{room.price}
                                                        <em>/night</em>
                                                    </span>
                                                    <span className="room-tile-check" aria-hidden="true">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                    </span>
                                                </button>
                                            ))}
                                        </div>

                                        <div className="form-group" style={{ marginTop: 18 }}>
                                            <div className="float-field">
                                                <select
                                                    id="guests"
                                                    name="guests"
                                                    value={formData.guests}
                                                    onChange={handleChange}
                                                >
                                                    <option value="1">1 Guest</option>
                                                    <option value="2">2 Guests</option>
                                                    <option value="3">3 Guests</option>
                                                    <option value="4">4 Guests</option>
                                                </select>
                                                <label htmlFor="guests">Number of Guests</label>
                                            </div>
                                        </div>
                                    </TiltSection>

                                    {/* DATES */}
                                    <TiltSection className="form-section" delay={60}>
                                        <h3>
                                            <span className="section-num">02</span>
                                            Select Dates
                                        </h3>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <div className={`float-field ${shakeField === 'checkIn' ? 'shake' : ''}`}>
                                                    <input
                                                        type="date"
                                                        id="checkIn"
                                                        name="checkIn"
                                                        value={formData.checkIn}
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                        min={today}
                                                        placeholder=" "
                                                    />
                                                    <label htmlFor="checkIn">Check-in</label>
                                                    {fieldIsValid('checkIn') && <span className="field-check">✓</span>}
                                                </div>
                                                {formErrors.checkIn && <span className="error-message">{formErrors.checkIn}</span>}
                                            </div>
                                            <div className="form-group">
                                                <div className={`float-field ${shakeField === 'checkOut' ? 'shake' : ''}`}>
                                                    <input
                                                        type="date"
                                                        id="checkOut"
                                                        name="checkOut"
                                                        value={formData.checkOut}
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                        min={formData.checkIn || tomorrow}
                                                        placeholder=" "
                                                    />
                                                    <label htmlFor="checkOut">Check-out</label>
                                                    {fieldIsValid('checkOut') && <span className="field-check">✓</span>}
                                                </div>
                                                {formErrors.checkOut && <span className="error-message">{formErrors.checkOut}</span>}
                                            </div>
                                        </div>

                                        {nights > 0 && (
                                            <div className="nights-summary">
                                                <div className="nights-chip">
                                                    🌙 <strong>{nights}</strong> {nights === 1 ? 'night' : 'nights'}
                                                </div>
                                                <div className="nights-perNight">
                                                    ₹{currentRoom.price} × {nights} × {formData.guests} {formData.guests == 1 ? 'guest' : 'guests'}
                                                </div>
                                            </div>
                                        )}
                                    </TiltSection>

                                    {/* PERSONAL */}
                                    <TiltSection className="form-section" delay={120}>
                                        <h3>
                                            <span className="section-num">03</span>
                                            Your Details
                                        </h3>

                                        {!isAuthenticated && (
                                            <div className="guest-notice">
                                                <div className="guest-notice-icon">🔓</div>
                                                <div className="guest-notice-body">
                                                    <strong>Booking as guest</strong>
                                                    <span>Sign in with Google to save preferences and book faster.</span>
                                                </div>
                                                <button type="button" className="btn-create-account" onClick={handleGoogleLogin}>
                                                    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
                                                        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                                                        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                                                        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                                                        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                                                    </svg>
                                                    Sign in
                                                </button>
                                            </div>
                                        )}

                                        <div className="form-row">
                                            <div className="form-group">
                                                <div className={`float-field ${shakeField === 'firstName' ? 'shake' : ''} ${formErrors.firstName ? 'has-error' : ''}`}>
                                                    <input
                                                        type="text"
                                                        id="firstName"
                                                        name="firstName"
                                                        value={formData.firstName}
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                        readOnly={isAuthenticated}
                                                        className={isAuthenticated ? 'auto-filled' : ''}
                                                        placeholder=" "
                                                    />
                                                    <label htmlFor="firstName">
                                                        First Name <span className="required">*</span>
                                                    </label>
                                                    {isAuthenticated && <span className="auto-badge">auto</span>}
                                                    {fieldIsValid('firstName') && !isAuthenticated && <span className="field-check">✓</span>}
                                                </div>
                                                {formErrors.firstName && <span className="error-message">{formErrors.firstName}</span>}
                                            </div>
                                            <div className="form-group">
                                                <div className="float-field">
                                                    <input
                                                        type="text"
                                                        id="lastName"
                                                        name="lastName"
                                                        value={formData.lastName}
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                        readOnly={isAuthenticated}
                                                        className={isAuthenticated ? 'auto-filled' : ''}
                                                        placeholder=" "
                                                    />
                                                    <label htmlFor="lastName">
                                                        Last Name <span className="optional">(optional)</span>
                                                    </label>
                                                    {isAuthenticated && <span className="auto-badge">auto</span>}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group">
                                                <div className={`float-field ${shakeField === 'email' ? 'shake' : ''}`}>
                                                    <input
                                                        type="email"
                                                        id="email"
                                                        name="email"
                                                        value={formData.email}
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                        readOnly={isAuthenticated}
                                                        className={isAuthenticated ? 'auto-filled' : ''}
                                                        placeholder=" "
                                                    />
                                                    <label htmlFor="email">
                                                        Email Address <span className="required">*</span>
                                                    </label>
                                                    {isAuthenticated && <span className="auto-badge">auto</span>}
                                                    {fieldIsValid('email') && !isAuthenticated && <span className="field-check">✓</span>}
                                                </div>
                                                {formErrors.email && <span className="error-message">{formErrors.email}</span>}
                                            </div>
                                            <div className="form-group">
                                                <div className={`float-field ${shakeField === 'phone' ? 'shake' : ''}`}>
                                                    <input
                                                        type="tel"
                                                        id="phone"
                                                        name="phone"
                                                        value={formData.phone}
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                        placeholder=" "
                                                    />
                                                    <label htmlFor="phone">
                                                        Phone Number <span className="required">*</span>
                                                    </label>
                                                    {fieldIsValid('phone') && <span className="field-check">✓</span>}
                                                </div>
                                                {formErrors.phone && <span className="error-message">{formErrors.phone}</span>}
                                            </div>
                                        </div>
                                    </TiltSection>

                                    {/* REQUESTS */}
                                    <TiltSection className="form-section" delay={180}>
                                        <h3>
                                            <span className="section-num">04</span>
                                            Special Requests
                                        </h3>
                                        <div className="form-group">
                                            <div className="float-field">
                                                <textarea
                                                    id="specialRequests"
                                                    name="specialRequests"
                                                    rows="3"
                                                    value={formData.specialRequests}
                                                    onChange={handleChange}
                                                    placeholder=" "
                                                    maxLength={400}
                                                />
                                                <label htmlFor="specialRequests">Anything we should know?</label>
                                                <span className="char-count">
                                                    {formData.specialRequests.length}/400
                                                </span>
                                            </div>
                                        </div>
                                    </TiltSection>

                                    <div className="booking-note">
                                        <span className="note-icon">📋</span>
                                        <p>
                                            <strong>No payment today.</strong> Our team will contact you within 24
                                            hours to confirm your booking.
                                        </p>
                                    </div>

                                    <MagneticButton
                                        type="submit"
                                        className={`btn-book-now ${isLoading ? 'loading' : ''}`}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <span className="spinner" />
                                                Processing…
                                            </>
                                        ) : (
                                            <>
                                                Request Booking
                                                <span className="btn-arrow" aria-hidden="true">→</span>
                                            </>
                                        )}
                                    </MagneticButton>

                                    {!isAuthenticated && (
                                        <div className="guest-booking-note">
                                            💡 <strong>Tip:</strong>{' '}
                                            <span className="clickable" onClick={handleGoogleLogin}>
                                                Sign in with Google
                                            </span>{' '}
                                            to save preferences and book faster.
                                        </div>
                                    )}
                                </form>
                            )}
                        </div>

                        {/* ── SUMMARY ─────────────────── */}
                        <aside className="booking-summary">
                            <div className="summary-inner">
                                <header className="summary-header">
                                    <h3>Booking Summary</h3>
                                    <span className={`summary-badge ${isAuthenticated ? 'registered' : ''}`}>
                                        {isAuthenticated ? 'Registered' : 'Guest'}
                                    </span>
                                </header>

                                <div className="summary-details">
                                    <SummaryRow label="Room" value={currentRoom.label} />
                                    <SummaryRow label="Guests" value={`${formData.guests} ${formData.guests == 1 ? 'guest' : 'guests'}`} />
                                    <SummaryRow label="Check-in" value={formData.checkIn || '—'} />
                                    <SummaryRow label="Check-out" value={formData.checkOut || '—'} />
                                    <SummaryRow label="Nights" value={nights || '—'} />

                                    <div className="summary-divider" />

                                    <div className="summary-line">
                                        <span>Subtotal</span>
                                        <span>₹{subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="summary-line muted">
                                        <span>Taxes (12%)</span>
                                        <span>₹{taxes.toLocaleString()}</span>
                                    </div>
                                    {discount > 0 && (
                                        <div className="summary-line discount">
                                            <span>
                                                {user?.loyaltyTier} discount
                                                <em>−{Math.round(tierDiscountRate * 100)}%</em>
                                            </span>
                                            <span>−₹{discount.toLocaleString()}</span>
                                        </div>
                                    )}

                                    <div className="summary-divider" />

                                    <div className="summary-total">
                                        <span className="total-label">Total</span>
                                        <span className="total-value">
                                            ₹{Math.round(animatedTotal).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="summary-tax">Inclusive of all taxes</p>
                                </div>

                                <div className="summary-amenities">
                                    <h4>Included with every stay</h4>
                                    <ul>
                                        <li>Free high-speed Wi-Fi</li>
                                        <li>Complimentary breakfast</li>
                                        <li>24/7 room service</li>
                                        <li>Valet parking</li>
                                        <li>Restaurant access</li>
                                    </ul>
                                </div>

                                <div className="summary-cancellation">
                                    <div className="cancel-icon">✓</div>
                                    <div>
                                        <p><strong>Free cancellation</strong></p>
                                        <p>Up to 24 hours before check-in.</p>
                                    </div>
                                </div>

                                {isAuthenticated && user && (
                                    <div className="summary-loyalty">
                                        <span className="loyalty-star" aria-hidden="true">⭐</span>
                                        <div className="loyalty-meta">
                                            <strong>{user.loyaltyTier || 'Bronze'} Tier</strong>
                                            <span>{user.loyaltyPoints || 0} points</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </aside>
                    </div>
                </div>
            </section>

            {/* ─── FOOTER ──────────────────────────── */}
            <footer className="booking-footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="footer-section">
                            <h3>Hotel Raghav</h3>
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
                            <p>📞 +91 9335424144</p>
                            <p>✉️ raghavhotel7@gmail.com</p>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>© {currentYear} Hotel Raghav. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

/* ════════════════════════════════════════════════════════════
   SUBCOMPONENTS
   ════════════════════════════════════════════════════════════ */

const SummaryRow = ({ label, value }) => (
    <div className="summary-item">
        <span className="summary-label">{label}</span>
        <span className="summary-value">{value}</span>
    </div>
);

const SuccessPanel = ({ bookingReference, countdown, onHome, onCopy, copied }) => (
    <div className="success-panel">
        <div className="success-burst" aria-hidden="true">
            {Array.from({ length: 16 }).map((_, i) => (
                <span key={i} style={{ '--i': i }} />
            ))}
        </div>

        <div className="success-check">
            <svg viewBox="0 0 52 52" width="84" height="84" aria-hidden="true">
                <circle cx="26" cy="26" r="24" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.22" />
                <circle cx="26" cy="26" r="24" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeDasharray={151} strokeDashoffset={0} opacity="0.4"
                    style={{ animation: 'ringDraw 900ms cubic-bezier(0.22, 1, 0.36, 1) 200ms both' }} />
                <path d="M14 27 L23 36 L39 18" fill="none" stroke="currentColor" strokeWidth="3.5"
                    strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </div>

        <h2>Booking Request Sent</h2>
        <p className="success-sub">Thank you for choosing Hotel Raghav.</p>

        <div className="success-reference">
            <span className="ref-label">Booking Reference</span>
            <div className="ref-row">
                <strong>{bookingReference}</strong>
                <button className={`ref-copy ${copied ? 'copied' : ''}`} onClick={onCopy} aria-label="Copy reference">
                    {copied ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                    )}
                </button>
            </div>
        </div>

        <p className="success-note">Our team will contact you within 24 hours to confirm your stay.</p>
        <p className="success-redirect">
            Redirecting home in <strong>{countdown}s</strong>…
        </p>
        <button onClick={onHome} className="btn-home">
            Return Home Now
        </button>
    </div>
);

export default BookingPage;