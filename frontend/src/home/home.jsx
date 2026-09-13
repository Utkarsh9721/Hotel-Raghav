// src/home/home.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import Home from "../assets/home.jpg";
import HotelExterior from "../assets/hotel3.jpeg";
import RoomInterior from "../assets/room4.jpeg";
import Restaurant from "../assets/food.jpg";
import Lobby from "../assets/hotel4.jpeg";
import EventHall from "../assets/hotel7.jpg";
import GardenArea from "../assets/hotel8.jpg";
import Room from "../assets/room5.jpeg";
import Room2 from "../assets/room2.jpeg";
import "./HotelLanding.css";

/* ════════════════════════════════════════════════════════════
   INLINE HOOKS
   ════════════════════════════════════════════════════════════ */

const use3DTilt = (max = 9, withShine = true) => {
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
        el.style.setProperty("--rx", `${c.rx.toFixed(2)}deg`);
        el.style.setProperty("--ry", `${c.ry.toFixed(2)}deg`);
        el.style.setProperty("--mx", `${c.mx.toFixed(1)}%`);
        el.style.setProperty("--my", `${c.my.toFixed(1)}%`);
        el.style.setProperty("--scale", c.scale.toFixed(3));
        const settled =
            Math.abs(t.rx - c.rx) < 0.02 &&
            Math.abs(t.ry - c.ry) < 0.02 &&
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
        target.current.scale = 1.02;
        start();
    }, [max, withShine, start]);

    const onMouseLeave = useCallback(() => {
        target.current = { ...target.current, rx: 0, ry: 0, mx: 50, my: 50, scale: 1 };
        start();
    }, [start]);

    useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);

    return { ref, onMouseMove, onMouseLeave };
};

const useMagnetic = (strength = 0.28, radius = 85) => {
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
        el.style.setProperty("--mx-off", `${c.x.toFixed(2)}px`);
        el.style.setProperty("--my-off", `${c.y.toFixed(2)}px`);
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
        window.addEventListener("mousemove", onMove, { passive: true });
        el.addEventListener("mouseleave", onLeave);
        return () => {
            window.removeEventListener("mousemove", onMove);
            el.removeEventListener("mouseleave", onLeave);
            if (raf.current) cancelAnimationFrame(raf.current);
        };
    }, [strength, radius, start]);

    return ref;
};

const useReveal = () => {
    useEffect(() => {
        if (typeof CSS !== "undefined" && CSS.supports?.("animation-timeline: view()")) return;
        const io = new IntersectionObserver(
            (entries) => entries.forEach((en) => {
                if (en.isIntersecting) {
                    en.target.classList.add("is-visible");
                    io.unobserve(en.target);
                }
            }),
            { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
        );
        document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
        return () => io.disconnect();
    }, []);
};

const useCounter = (end, duration = 1800, start = true) => {
    const [value, setValue] = useState(0);
    useEffect(() => {
        if (!start) return;
        let raf;
        const t0 = performance.now();
        const tick = (now) => {
            const p = Math.min(1, (now - t0) / duration);
            setValue(end * (1 - Math.pow(1 - p, 3)));
            if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [end, duration, start]);
    return value;
};

const useActiveSection = (ids) => {
    const [active, setActive] = useState(ids[0]);
    useEffect(() => {
        const io = new IntersectionObserver(
            (entries) => entries.forEach((en) => {
                if (en.isIntersecting) setActive(en.target.id);
            }),
            { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
        );
        ids.forEach((id) => {
            const el = document.getElementById(id);
            if (el) io.observe(el);
        });
        return () => io.disconnect();
    }, [ids]);
    return active;
};

const useScrolled = (threshold = 24) => {
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
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener("scroll", onScroll);
    }, [threshold]);
    return { scrolled, pct };
};

const useBodyLock = (locked) => {
    useEffect(() => {
        const html = document.documentElement;
        const body = document.body;
        if (!locked) {
            html.classList.remove("nav-locked");
            body.classList.remove("nav-locked");
            body.style.removeProperty("padding-right");
            return;
        }
        const sbw = window.innerWidth - html.clientWidth;
        html.classList.add("nav-locked");
        body.classList.add("nav-locked");
        if (sbw > 0) body.style.paddingRight = `${sbw}px`;
        return () => {
            html.classList.remove("nav-locked");
            body.classList.remove("nav-locked");
            body.style.removeProperty("padding-right");
        };
    }, [locked]);
};

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════ */

const HotelLanding = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentYear] = useState(new Date().getFullYear());
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(null);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const heroRef = useRef(null);
    const navigate = useNavigate();

    const API_URL = import.meta.env.VITE_API_URL || "https://hotel-raghav.onrender.com";

    const [contactForm, setContactForm] = useState({
        name: "", email: "", phone: "", subject: "General Question", message: ""
    });
    const [contactLoading, setContactLoading] = useState(false);
    const [contactSuccess, setContactSuccess] = useState(false);
    const [contactError, setContactError] = useState("");

    const navSections = useMemo(
        () => ["home", "about", "rooms", "amenities", "gallery", "contact"],
        []
    );
    const activeSection = useActiveSection(navSections);
    const { scrolled, pct } = useScrolled(24);

    useReveal();
    useBodyLock(isMenuOpen);

    /* ── Cursor glow (desktop only) ───────────────────── */
    useEffect(() => {
        if (window.matchMedia("(hover: none)").matches) return;
        const glow = document.createElement("div");
        glow.className = "cursor-glow";
        document.body.appendChild(glow);
        let raf = null;
        let x = window.innerWidth / 2, y = window.innerHeight / 2;
        let cx = x, cy = y;
        const onMove = (e) => { x = e.clientX; y = e.clientY; };
        const loop = () => {
            cx += (x - cx) * 0.12;
            cy += (y - cy) * 0.12;
            glow.style.transform = `translate3d(${cx - 300}px, ${cy - 300}px, 0)`;
            raf = requestAnimationFrame(loop);
        };
        window.addEventListener("mousemove", onMove, { passive: true });
        raf = requestAnimationFrame(loop);
        return () => {
            window.removeEventListener("mousemove", onMove);
            cancelAnimationFrame(raf);
            glow.remove();
        };
    }, []);

    /* ── Hero mouse parallax ──────────────────────────── */
    useEffect(() => {
        const el = heroRef.current;
        if (!el) return;
        let raf = null;
        const onMove = (e) => {
            if (raf) return;
            raf = requestAnimationFrame(() => {
                const r = el.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width - 0.5;
                const y = (e.clientY - r.top) / r.height - 0.5;
                el.style.setProperty("--hx", `${x * 26}px`);
                el.style.setProperty("--hy", `${y * 26}px`);
                raf = null;
            });
        };
        el.addEventListener("mousemove", onMove);
        return () => {
            el.removeEventListener("mousemove", onMove);
            if (raf) cancelAnimationFrame(raf);
        };
    }, []);

    /* ── Esc closes drawer / modals ───────────────────── */
    useEffect(() => {
        const onKey = (e) => {
            if (e.key !== "Escape") return;
            setIsMenuOpen(false);
            setShowAuthModal(false);
            setShowLogoutConfirm(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    /* ── Auto-close drawer on resize to desktop ───────── */
    useEffect(() => {
        const onResize = () => { if (window.innerWidth > 760) setIsMenuOpen(false); };
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    /* ── Auth bootstrap ───────────────────────────────── */
    useEffect(() => {
        checkAuthStatus();
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get("token");
        if (token) {
            localStorage.setItem("token", token);
            window.history.replaceState({}, document.title, window.location.pathname);
            checkAuthStatus();
        }
    }, []);

    const checkAuthStatus = async () => {
        try {
            const token = localStorage.getItem("token");
            if (token && token !== "null" && token !== "undefined") {
                const response = await fetch(`${API_URL}/api/auth/status`, {
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
                });
                const data = await response.json();
                if (data.isAuthenticated) {
                    setIsAuthenticated(true); setUser(data.user); setAuthError(null);
                } else {
                    localStorage.removeItem("token"); setIsAuthenticated(false); setUser(null);
                }
            } else {
                localStorage.removeItem("token"); setIsAuthenticated(false); setUser(null);
            }
        } catch {
            localStorage.removeItem("token"); setIsAuthenticated(false); setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const toggleMenu = () => setIsMenuOpen((v) => !v);
    const closeMenu = () => setIsMenuOpen(false);

    const scrollToSection = (id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        closeMenu();
    };

    const handleBookNow = (roomType = null, price = null) => {
        setSelectedRoom({ roomType, price });
        setAuthError(null);
        closeMenu();
        if (!isAuthenticated) setShowAuthModal(true);
        else navigate("/booking", { state: { roomType, price, user } });
    };

    const handleGoogleLogin = () => {
        setAuthError(null);
        localStorage.setItem("returnUrl", window.location.pathname);
        if (selectedRoom) localStorage.setItem("selectedRoom", JSON.stringify(selectedRoom));
        window.location.href = `${API_URL}/api/auth/google`;
    };

    const handleGuestBooking = () => {
        setShowAuthModal(false); setAuthError(null);
        navigate("/booking-guest", { state: { roomType: selectedRoom?.roomType, price: selectedRoom?.price } });
    };

    const handleAdminLogin = () => { closeMenu(); navigate("/admin/login"); };
    const handleLogoutClick = () => { closeMenu(); setShowLogoutConfirm(true); };
    const handleCancelLogout = () => setShowLogoutConfirm(false);

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem("token");
            if (token) {
                await fetch(`${API_URL}/api/auth/logout`, {
                    method: "POST", headers: { Authorization: `Bearer ${token}` }
                });
            }
        } catch { /* ignore */ }
        localStorage.removeItem("token");
        setIsAuthenticated(false); setUser(null); setAuthError(null);
        setShowLogoutConfirm(false); navigate("/");
    };

    const handleContactChange = (e) => {
        const { name, value } = e.target;
        setContactForm((p) => ({ ...p, [name]: value }));
    };

    const handleContactSubmit = async (e) => {
        e.preventDefault();
        setContactLoading(true); setContactError(""); setContactSuccess(false);
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(contactForm.email)) {
            setContactError("Please enter a valid email address");
            setContactLoading(false); return;
        }
        try {
            const response = await fetch(`${API_URL}/api/contact/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(contactForm)
            });
            const data = await response.json();
            if (data.success) {
                setContactSuccess(true);
                setContactForm({ name: "", email: "", phone: "", subject: "General Question", message: "" });
                setTimeout(() => setContactSuccess(false), 5000);
            } else setContactError(data.message || "Failed to send message.");
        } catch {
            setContactError("Network error. Please try again.");
        } finally {
            setContactLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loader" />
                <p>Loading…</p>
            </div>
        );
    }

    const navLinks = [
        { id: "home", label: "Home" },
        { id: "about", label: "About" },
        { id: "rooms", label: "Rooms" },
        { id: "amenities", label: "Amenities" },
        { id: "gallery", label: "Gallery" },
        { id: "contact", label: "Contact" },
    ];

    return (
        <div className={`hotel-landing ${isMenuOpen ? "menu-open" : ""}`}>
            <div className="scroll-progress" style={{ transform: `scaleX(${pct})` }} />

            {/* ─── NAV ─────────────────────────────────────── */}
            <nav className={`navbar ${scrolled ? "is-scrolled" : ""}`}>
                <div className="nav-container">
                    <button className="nav-logo" onClick={() => scrollToSection("home")} aria-label="Hotel Raghav home">
                        <span className="logo-mark">
                            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                                <path d="M12 2 3 7v13h6v-6h6v6h6V7z" fill="currentColor" opacity="0.92" />
                            </svg>
                        </span>
                        <span className="logo-text">
                            Hotel <em>Raghav</em>
                            <span className="logo-stars">★★★★★</span>
                        </span>
                    </button>

                    {/* Desktop links */}
                    <ul className="nav-links-desktop">
                        {navLinks.map((l) => (
                            <li key={l.id}>
                                <a
                                    href={`#${l.id}`}
                                    className={activeSection === l.id ? "is-active" : ""}
                                    onClick={(e) => { e.preventDefault(); scrollToSection(l.id); }}
                                >
                                    <span>{l.label}</span>
                                </a>
                            </li>
                        ))}
                        <li>
                            <a
                                href="/admin/login"
                                className="admin-link"
                                onClick={(e) => { e.preventDefault(); handleAdminLogin(); }}
                            >
                                🔐 Admin
                            </a>
                        </li>
                    </ul>

                    {/* Nav CTA — admin button always visible */}
                    <div className="nav-cta">
                        {isAuthenticated ? (
                            <div className="user-menu">
                                <span className="user-avatar" aria-hidden="true">
                                    {(user?.firstName?.[0] || user?.email?.[0] || "U").toUpperCase()}
                                </span>
                                <span className="user-greeting">
                                    {user?.firstName || user?.email?.split("@")[0] || "User"}
                                </span>
                                <button onClick={handleLogoutClick} className="btn-logout">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                        <polyline points="16 17 21 12 16 7" />
                                        <line x1="21" y1="12" x2="9" y2="12" />
                                    </svg>
                                    <span>Logout</span>
                                </button>
                                <button className="btn-admin-nav" onClick={handleAdminLogin} title="Admin Login" aria-label="Admin Login">
                                    🔐
                                </button>
                            </div>
                        ) : (
                            <>
                                <MagneticButton className="btn-book-now" onClick={() => handleBookNow()}>
                                    Book Now
                                </MagneticButton>
                                <button className="btn-admin-nav" onClick={handleAdminLogin} title="Admin Login" aria-label="Admin Login">
                                    🔐
                                </button>
                            </>
                        )}
                    </div>

                    {/* Hamburger — mobile only */}
                    <button
                        className={`hamburger ${isMenuOpen ? "is-open" : ""}`}
                        onClick={toggleMenu}
                        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                        aria-expanded={isMenuOpen}
                        aria-controls="mobile-drawer"
                    >
                        <span className="bar" />
                        <span className="bar" />
                        <span className="bar" />
                    </button>
                </div>
            </nav>

            {/* ─── MOBILE DRAWER (Portal) ───────────────────── */}
            {typeof document !== "undefined" && createPortal(
                <div
                    id="mobile-drawer"
                    className={`mobile-drawer ${isMenuOpen ? "is-open" : ""}`}
                    aria-hidden={!isMenuOpen}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Main menu"
                >
                    <div
                        className="mobile-drawer__backdrop"
                        onClick={closeMenu}
                        onTouchStart={(e) => e.stopPropagation()}
                        aria-label="Close menu"
                        role="button"
                        tabIndex={-1}
                    />
                    <nav
                        className="mobile-drawer__panel"
                        onTouchStart={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mobile-drawer__header">
                            <span className="mobile-drawer__brand">Hotel <em>Raghav</em></span>
                            <button className="mobile-drawer__close" onClick={closeMenu} aria-label="Close menu">
                                <span /><span />
                            </button>
                        </div>

                        {isAuthenticated && (
                            <div className="mobile-drawer__user">
                                <span className="mobile-drawer__avatar">
                                    {(user?.firstName?.[0] || user?.email?.[0] || "U").toUpperCase()}
                                </span>
                                <div className="mobile-drawer__user-meta">
                                    <strong>{user?.firstName || user?.email?.split("@")[0] || "Guest"}</strong>
                                    <span>{user?.email || "Signed in"}</span>
                                </div>
                            </div>
                        )}

                        {/* Quick admin card — top of drawer */}
                        <button
                            type="button"
                            className="mobile-drawer__quick-btn"
                            onClick={handleAdminLogin}
                        >
                            <span className="quick-icon">🔐</span>
                            <span className="quick-text">
                                <strong>Admin Login</strong>
                                <span>Manage bookings &amp; rooms</span>
                            </span>
                            <span className="quick-arrow" aria-hidden="true">→</span>
                        </button>

                        <ul className="mobile-drawer__links">
                            {navLinks.map((l, i) => (
                                <li
                                    key={l.id}
                                    style={{ "--i": i }}
                                    className={activeSection === l.id ? "is-active" : ""}
                                >
                                    <a href={`#${l.id}`} onClick={(e) => { e.preventDefault(); scrollToSection(l.id); }}>
                                        <span className="mobile-drawer__link-index">
                                            {String(i + 1).padStart(2, "0")}
                                        </span>
                                        <span className="mobile-drawer__link-label">{l.label}</span>
                                        <span className="mobile-drawer__link-arrow" aria-hidden="true">→</span>
                                    </a>
                                </li>
                            ))}
                        </ul>

                        <div className="mobile-drawer__cta" style={{ "--i": navLinks.length }}>
                            {isAuthenticated ? (
                                <button className="mobile-drawer__btn mobile-drawer__btn--ghost" onClick={handleLogoutClick}>
                                    Logout
                                </button>
                            ) : (
                                <button className="mobile-drawer__btn mobile-drawer__btn--primary" onClick={() => handleBookNow()}>
                                    Book Now
                                </button>
                            )}
                            <button className="mobile-drawer__btn mobile-drawer__btn--ghost" onClick={handleAdminLogin}>
                                🔐 Admin Login
                            </button>
                        </div>

                        <div className="mobile-drawer__footer">
                            <p>+91 9335424144</p>
                            <p>raghavhotel7@gmail.com</p>
                        </div>
                    </nav>
                </div>,
                document.body
            )}

            {/* ─── LOGOUT MODAL ────────────────────────────── */}
            {showLogoutConfirm && (
                <div className="logout-modal" onClick={handleCancelLogout} role="dialog" aria-modal="true">
                    <div className="logout-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="logout-modal-header">
                            <span className="logout-icon-big">👋</span>
                            <h2>Logout Confirmation</h2>
                            <p>Are you sure you want to logout?</p>
                        </div>
                        <div className="logout-modal-body">
                            <p>You will be redirected to the home page.</p>
                            {user && <div className="logout-user-info">👤 {user.firstName || user.email}</div>}
                        </div>
                        <div className="logout-modal-footer">
                            <button className="btn-cancel-logout" onClick={handleCancelLogout}>Cancel</button>
                            <button className="btn-confirm-logout" onClick={handleLogout}>Logout</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── AUTH ERROR BANNER ──────────────────────── */}
            {authError && (
                <div className="auth-error-banner">
                    <span>⚠️ {authError}</span>
                    <button onClick={() => setAuthError(null)} aria-label="Dismiss">×</button>
                </div>
            )}

            {/* ─── HERO ────────────────────────────────────── */}
            <section id="home" className="hero-section" ref={heroRef}>
                <div className="hero-background">
                    <img src={Home} alt="Hotel Raghav" className="hero-image" />
                    <div className="hero-overlay" />
                    <div className="hero-grain" />
                    <div className="hero-vignette" />
                </div>
                <div className="hero-content">
                    <p className="hero-eyebrow">
                        <span className="eyebrow-line" />
                        Est. 1998 · Uttar Pradesh
                    </p>
                    <h1 className="hero-title">
                        Welcome to <span className="highlight">Hotel Raghav</span>
                    </h1>
                    <p className="hero-subtitle">
                        Experience luxury &amp; comfort in the heart of the city — where every detail is crafted for you.
                    </p>
                    <div className="hero-buttons">
                        <MagneticButton className="btn-primary" onClick={() => handleBookNow()}>
                            Book Now
                        </MagneticButton>
                        <MagneticButton className="btn-secondary" onClick={() => scrollToSection("gallery")}>
                            View Gallery
                        </MagneticButton>
                    </div>
                    <div className="hero-stats">
                        <StatItem end={500} suffix="+" label="Happy Guests" />
                        <StatItem end={50} suffix="+" label="Luxury Rooms" />
                        <StatItem end={4.8} decimals={1} label="★ Rating" />
                    </div>
                </div>
                <button className="scroll-cue" onClick={() => scrollToSection("about")} aria-label="Scroll to about">
                    <span>Scroll</span>
                </button>
            </section>

            {/* ─── ABOUT ───────────────────────────────────── */}
            <section id="about" className="about-section">
                <div className="container">
                    <div className="section-header" data-reveal>
                        <span className="section-kicker">Our Story</span>
                        <h2>About Hotel Raghav</h2>
                        <p>Discover the perfect blend of luxury and comfort</p>
                    </div>
                    <div className="about-content">
                        <div className="about-text" data-reveal>
                            <h3>Your Home Away From Home</h3>
                            <p>
                                Welcome to Hotel Raghav, where elegance meets comfort. Nestled in the
                                heart of the city, we offer a luxurious retreat for both business and
                                leisure travellers. Our commitment to exceptional service and attention
                                to detail ensures an unforgettable stay.
                            </p>
                            <div className="about-features">
                                {[
                                    ["🏨", "Premium Rooms"],
                                    ["🍽️", "Fine Dining"],
                                    ["🚗", "Valet Parking"],
                                    ["🌐", "Free Wi-Fi"],
                                ].map(([icon, label]) => (
                                    <div className="feature" key={label}>
                                        <span className="feature-icon">{icon}</span>
                                        <span>{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="about-image" data-reveal>
                            <div className="about-image-frame">
                                <img src={HotelExterior} alt="Luxury Interior" className="about-img" />
                                <div className="about-image-glow" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── ROOMS ───────────────────────────────────── */}
            <section id="rooms" className="rooms-section">
                <div className="container">
                    <div className="section-header" data-reveal>
                        <span className="section-kicker">Stay With Us</span>
                        <h2>Our Rooms</h2>
                        <p>Choose from our selection of elegant rooms and suites</p>
                    </div>
                    <div className="rooms-grid">
                        <RoomCard
                            img={RoomInterior} title="Non Air-Conditioner Room"
                            desc="Comfortable and cozy room with essential amenities"
                            price={800} roomType="standard" onBook={handleBookNow}
                        />
                        <RoomCard
                            img={Room2} title="Deluxe Room" featured
                            desc="Spacious room with premium amenities and city view"
                            price={1000} roomType="deluxe" onBook={handleBookNow}
                        />
                        <RoomCard
                            img={Room} title="Executive Suite"
                            desc="Luxurious suite with separate living area and VIP services"
                            price={1500} roomType="suite" onBook={handleBookNow}
                        />
                    </div>
                </div>
            </section>

            {/* ─── AMENITIES ───────────────────────────────── */}
            <section id="amenities" className="amenities-section">
                <div className="container">
                    <div className="section-header" data-reveal>
                        <span className="section-kicker">World-Class Facilities</span>
                        <h2>Amenities</h2>
                        <p>World-class facilities to make your stay extraordinary</p>
                    </div>
                    <div className="amenities-grid">
                        {[
                            ["🍝", "Multi-Cuisine Restaurant", "Award-winning chefs serving global cuisine"],
                            ["🚗", "Valet Parking", "Complimentary valet parking service"],
                            ["🌐", "Free High-Speed Wi-Fi", "Stay connected throughout the property"],
                            ["🛎️", "24/7 Concierge", "Round-the-clock assistance for your needs"],
                            ["🧺", "Laundry Service", "Professional laundry and dry cleaning"],
                            ["🎤", "Event Hall", "Spacious venue for meetings and celebrations"],
                        ].map(([icon, title, desc], i) => (
                            <AmenityCard key={title} icon={icon} title={title} desc={desc} index={i} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── GALLERY ─────────────────────────────────── */}
            <section id="gallery" className="gallery-section">
                <div className="container">
                    <div className="section-header" data-reveal>
                        <span className="section-kicker">A Visual Tour</span>
                        <h2>Gallery</h2>
                        <p>A glimpse of our luxurious property</p>
                    </div>
                    <div className="gallery-grid">
                        {[
                            [HotelExterior, "Hotel Exterior"],
                            [RoomInterior, "Room Interior"],
                            [Restaurant, "Restaurant"],
                            [Lobby, "Lobby"],
                            [EventHall, "Event Hall"],
                            [GardenArea, "Garden Area"],
                        ].map(([img, label], i) => (
                            <GalleryItem key={label} img={img} label={label} index={i} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── CONTACT ─────────────────────────────────── */}
            <section id="contact" className="contact-section">
                <div className="container">
                    <div className="section-header" data-reveal>
                        <span className="section-kicker">Say Hello</span>
                        <h2>Contact Us</h2>
                        <p>Get in touch with us for reservations and inquiries</p>
                    </div>
                    <div className="contact-content">
                        <div className="contact-info" data-reveal>
                            <h3>Visit Us</h3>
                            <p>📍 7W4F+C26, Savhat, Uttar Pradesh 221011</p>
                            <p>📞 +91 9580138151</p>
                            <p>✉️ raghavhotel7@gmail.com</p>
                            <div className="social-links">
                                {["📱", "📘", "📸", "🐦"].map((i) => (
                                    <a href="#" className="social-link" key={i} aria-label="Social link">{i}</a>
                                ))}
                            </div>
                        </div>

                        <form onSubmit={handleContactSubmit} className="contact-form" data-reveal>
                            {contactSuccess && <div className="contact-success-message">✅ Your message has been sent successfully!</div>}
                            {contactError && <div className="contact-error-message">⚠️ {contactError}</div>}
                            <input type="text" name="name" placeholder="Your Name" value={contactForm.name} onChange={handleContactChange} required />
                            <input type="email" name="email" placeholder="Your Email" value={contactForm.email} onChange={handleContactChange} required />
                            <input type="tel" name="phone" placeholder="Phone Number" value={contactForm.phone} onChange={handleContactChange} />
                            <select name="subject" value={contactForm.subject} onChange={handleContactChange}>
                                <option>General Question</option>
                                <option>Room Booking</option>
                                <option>Event Inquiry</option>
                                <option>Feedback</option>
                                <option>Other</option>
                            </select>
                            <textarea name="message" placeholder="Your Message" rows="5" value={contactForm.message} onChange={handleContactChange} required />
                            <button type="submit" className="btn-submit" disabled={contactLoading}>
                                {contactLoading ? "Sending…" : "Send Message"}
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            {/* ─── AUTH MODAL ──────────────────────────────── */}
            {showAuthModal && (
                <div className="auth-modal" onClick={() => setShowAuthModal(false)} role="dialog" aria-modal="true">
                    <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowAuthModal(false)} aria-label="Close">×</button>
                        <div className="auth-modal-header">
                            <h2>🔐 Login Required</h2>
                            <p>Please login to book your stay at Hotel Raghav</p>
                            {selectedRoom?.roomType && (
                                <div className="selected-room-info">
                                    <p>Selected: <strong>{selectedRoom.roomType.toUpperCase()}</strong></p>
                                    <p>Price: <strong>₹{selectedRoom.price}/night</strong></p>
                                </div>
                            )}
                        </div>
                        <div className="auth-options">
                            <button className="btn-google-login" onClick={handleGoogleLogin}>
                                <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                                    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                                    <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
                                    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                                    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
                                </svg>
                                Continue with Google
                            </button>
                            <div className="auth-divider"><span>or</span></div>
                            <button className="btn-guest-login" onClick={handleGuestBooking}>🚀 Continue as Guest</button>
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
                            <p>By continuing, you agree to our <a href="/terms">Terms</a> and <a href="/privacy">Privacy</a>.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── FOOTER ──────────────────────────────────── */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="footer-section">
                            <h3>Hotel Raghav</h3>
                            <p>Luxury redefined. Experience the best of hospitality.</p>
                        </div>
                        <div className="footer-section">
                            <h4>Quick Links</h4>
                            <ul>
                                {navLinks.map((l) => (
                                    <li key={l.id}>
                                        <a href={`#${l.id}`} onClick={(e) => { e.preventDefault(); scrollToSection(l.id); }}>{l.label}</a>
                                    </li>
                                ))}
                                <li>
                                    <a href="/admin/login" onClick={(e) => { e.preventDefault(); handleAdminLogin(); }}>
                                        🔐 Admin Login
                                    </a>
                                </li>
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

const MagneticButton = ({ children, className, onClick, type = "button" }) => {
    const ref = useMagnetic(0.28, 80);
    return (
        <button ref={ref} type={type} className={`${className} magnetic`} onClick={onClick}>
            <span className="magnetic-inner">{children}</span>
        </button>
    );
};

const StatItem = ({ end, suffix = "", decimals = 0, label }) => {
    const value = useCounter(end, 1800);
    const display = decimals > 0
        ? value.toFixed(decimals)
        : Math.round(value).toLocaleString();
    return (
        <div className="stat-item">
            <span className="stat-number">{display}{suffix}</span>
            <span className="stat-label">{label}</span>
        </div>
    );
};

const RoomCard = ({ img, title, desc, price, roomType, featured, onBook }) => {
    const tilt = use3DTilt(9, true);
    return (
        <article
            className={`room-card ${featured ? "featured" : ""}`}
            ref={tilt.ref}
            onMouseMove={tilt.onMouseMove}
            onMouseLeave={tilt.onMouseLeave}
            data-reveal
        >
            {featured && <div className="room-badge">Popular</div>}
            <div className="room-image">
                <img src={img} alt={title} className="room-img" loading="lazy" />
                <div className="room-shine" />
                <div className="room-image-gradient" />
            </div>
            <div className="room-info">
                <h3>{title}</h3>
                <p>{desc}</p>
                <div className="room-price">
                    <span>₹{price}</span>
                    <span>/ night</span>
                </div>
                <button className="btn-book" onClick={() => onBook(roomType, price)}>Book Now</button>
            </div>
        </article>
    );
};

const AmenityCard = ({ icon, title, desc, index }) => {
    const tilt = use3DTilt(6, false);
    return (
        <div
            className="amenity-card"
            ref={tilt.ref}
            onMouseMove={tilt.onMouseMove}
            onMouseLeave={tilt.onMouseLeave}
            data-reveal
            style={{ "--i": index }}
        >
            <div className="amenity-icon">{icon}</div>
            <h3>{title}</h3>
            <p>{desc}</p>
        </div>
    );
};

const GalleryItem = ({ img, label, index }) => {
    const tilt = use3DTilt(5, true);
    return (
        <figure
            className="gallery-item"
            ref={tilt.ref}
            onMouseMove={tilt.onMouseMove}
            onMouseLeave={tilt.onMouseLeave}
            data-reveal
            style={{ "--i": index }}
        >
            <img src={img} alt={label} className="gallery-img" loading="lazy" />
            <div className="gallery-shine" />
            <figcaption className="gallery-overlay"><span>{label}</span></figcaption>
        </figure>
    );
};

export default HotelLanding;