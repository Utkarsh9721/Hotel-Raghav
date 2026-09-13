// AdminLogin.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

/* ════════════════════════════════════════════════════════════
   INLINE HOOKS
   ════════════════════════════════════════════════════════════ */

const use3DTilt = (max = 6, withShine = true) => {
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
        target.current.scale = 1.005;
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

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════ */

const AdminLogin = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [emailFocus, setEmailFocus] = useState(false);
    const [passwordFocus, setPasswordFocus] = useState(false);
    const [shakeCard, setShakeCard] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const tilt = use3DTilt(5, true);
    const submitRef = useMagnetic(0.22, 60);

    /* ── Redirect if already logged in as admin ────────── */
    useEffect(() => {
        const adminToken = localStorage.getItem('adminToken');
        if (adminToken) {
            navigate('/admin/dashboard');
        }
    }, [navigate]);

    /* ── Esc blur ──────────────────────────────────────── */
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') {
                setEmailFocus(false);
                setPasswordFocus(false);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const triggerError = (msg) => {
        setError(msg);
        setShakeCard(true);
        setTimeout(() => setShakeCard(false), 600);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post(
                `${API_URL}/api/auth/admin-login`,
                { email, password },
                {
                    headers: { 'Content-Type': 'application/json' },
                    withCredentials: true
                }
            );

            const data = response.data;

            if (data.success) {
                localStorage.setItem('adminToken', data.token);
                localStorage.setItem('adminUser', JSON.stringify(data.user));
                navigate('/admin/dashboard');
            } else {
                triggerError(data.message || 'Invalid credentials');
            }
        } catch (err) {
            console.error('Admin login error:', err);
            if (err.response) {
                triggerError(err.response.data?.message || 'Invalid credentials');
            } else if (err.request) {
                triggerError('No response from server. Please check your connection.');
            } else {
                triggerError('Failed to login. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-page">
            {/* ── Decorative background layers ─────────────── */}
            <div className="admin-bg" aria-hidden="true">
                <div className="admin-bg-orb admin-bg-orb--1" />
                <div className="admin-bg-orb admin-bg-orb--2" />
                <div className="admin-bg-orb admin-bg-orb--3" />
                <div className="admin-bg-grid" />
                <div className="admin-bg-grain" />
                <div className="admin-bg-vignette" />
            </div>

            {/* ── Card ──────────────────────────────────────── */}
            <div
                className={`admin-login-container ${shakeCard ? 'is-shaking' : ''}`}
                ref={tilt.ref}
                onMouseMove={tilt.onMouseMove}
                onMouseLeave={tilt.onMouseLeave}
            >
                <span className="card-shine" aria-hidden="true" />

                <header className="admin-login-header">
                    <div className="admin-login-logo">
                        <span className="logo-mark" aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="26" height="26">
                                <path d="M12 2 3 7v13h6v-6h6v6h6V7z" fill="currentColor" />
                            </svg>
                        </span>
                        <span className="logo-text">Hotel <em>Raghav</em></span>
                        <span className="logo-stars">★★★★★</span>
                    </div>

                    <h1>Admin Portal</h1>
                    <p>Sign in to manage bookings &amp; rooms</p>
                </header>

                {error && (
                    <div className="admin-login-error" role="alert">
                        <span className="error-icon" aria-hidden="true">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        </span>
                        <span className="error-text">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="admin-login-form" noValidate>
                    {/* Email */}
                    <div className="admin-field">
                        <div className={`admin-input-wrap ${emailFocus ? 'is-focused' : ''} ${email ? 'has-value' : ''}`}>
                            <span className="field-icon" aria-hidden="true">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                    <polyline points="22,6 12,13 2,6" />
                                </svg>
                            </span>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onFocus={() => setEmailFocus(true)}
                                onBlur={() => setEmailFocus(false)}
                                placeholder=" "
                                autoComplete="username"
                                required
                                autoFocus
                            />
                            <label htmlFor="email">Email Address</label>
                        </div>
                    </div>

                    {/* Password */}
                    <div className="admin-field">
                        <div className={`admin-input-wrap ${passwordFocus ? 'is-focused' : ''} ${password ? 'has-value' : ''}`}>
                            <span className="field-icon" aria-hidden="true">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            </span>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                name="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setPasswordFocus(true)}
                                onBlur={() => setPasswordFocus(false)}
                                placeholder=" "
                                autoComplete="current-password"
                                required
                            />
                            <label htmlFor="password">Password</label>
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                tabIndex={-1}
                            >
                                {showPassword ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        ref={submitRef}
                        type="submit"
                        className={`btn-admin-login magnetic ${loading ? 'is-loading' : ''}`}
                        disabled={loading}
                    >
                        <span className="magnetic-inner">
                            {loading ? (
                                <>
                                    <span className="spinner" />
                                    Authenticating…
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <span className="btn-arrow" aria-hidden="true">→</span>
                                </>
                            )}
                        </span>
                    </button>
                </form>

                <footer className="admin-login-footer">
                    <a href="/" className="back-home-link">
                        <span className="back-arrow" aria-hidden="true">←</span>
                        Back to Home
                    </a>
                </footer>

                <div className="admin-login-security">
                    <span className="secure-dot" aria-hidden="true" />
                    <div>
                        <strong>Secure Admin Access</strong>
                        <small>Restricted to authorized personnel only.</small>
                    </div>
                </div>
            </div>

            <style>{`
                /* ═════════════════════════════════════════════════════
                   ADMIN LOGIN — Premium 3D Edition
                   Matches landing/booking page tokens.
                   ═════════════════════════════════════════════════════ */

                .admin-login-page {
                    position: relative;
                    min-height: 100vh;
                    min-height: 100dvh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                    overflow: hidden;
                    background: linear-gradient(180deg, #0d0a07 0%, #1a1510 100%);
                    font-family: 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif;
                    color: #f6f0e5;
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                }

                /* ── Background layers ───────────────────────────── */
                .admin-bg {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    z-index: 0;
                    overflow: hidden;
                }
                .admin-bg-orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(90px);
                    opacity: 0.55;
                }
                .admin-bg-orb--1 {
                    width: 480px; height: 480px;
                    top: -140px; left: -120px;
                    background: radial-gradient(circle, rgba(215, 172, 114, 0.75), transparent 70%);
                    animation: adminOrbFloat 16s ease-in-out infinite;
                }
                .admin-bg-orb--2 {
                    width: 420px; height: 420px;
                    bottom: -120px; right: -100px;
                    background: radial-gradient(circle, rgba(122, 36, 50, 0.65), transparent 70%);
                    animation: adminOrbFloat 20s ease-in-out infinite reverse;
                }
                .admin-bg-orb--3 {
                    width: 320px; height: 320px;
                    top: 45%; left: 55%;
                    background: radial-gradient(circle, rgba(185, 136, 74, 0.45), transparent 70%);
                    animation: adminOrbFloat 14s ease-in-out infinite;
                }
                @keyframes adminOrbFloat {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50%      { transform: translate(28px, -22px) scale(1.08); }
                }

                .admin-bg-grid {
                    position: absolute;
                    inset: 0;
                    background-image:
                        linear-gradient(rgba(246, 240, 229, 0.04) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(246, 240, 229, 0.04) 1px, transparent 1px);
                    background-size: 52px 52px;
                    mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
                    -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
                }

                .admin-bg-grain {
                    position: absolute;
                    inset: 0;
                    opacity: 0.06;
                    mix-blend-mode: overlay;
                    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/></svg>");
                }

                .admin-bg-vignette {
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(ellipse at center, transparent 30%, rgba(0, 0, 0, 0.55) 100%);
                }

                /* ── Card ────────────────────────────────────────── */
                .admin-login-container {
                    position: relative;
                    z-index: 1;
                    width: 100%;
                    max-width: 440px;
                    padding: 44px 40px 36px;
                    border-radius: 18px;
                    background: linear-gradient(180deg, rgba(26, 21, 16, 0.94) 0%, rgba(13, 10, 7, 0.96) 100%);
                    border: 1px solid rgba(246, 240, 229, 0.08);
                    box-shadow:
                        0 40px 100px -40px rgba(0, 0, 0, 0.9),
                        0 0 0 1px rgba(185, 136, 74, 0.14),
                        inset 0 1px 0 rgba(246, 240, 229, 0.06);
                    backdrop-filter: blur(20px) saturate(140%);
                    -webkit-backdrop-filter: blur(20px) saturate(140%);
                    transform:
                        perspective(1200px)
                        rotateX(var(--rx, 0deg))
                        rotateY(var(--ry, 0deg))
                        scale(var(--scale, 1));
                    transform-style: preserve-3d;
                    will-change: transform;
                    overflow: hidden;
                    animation: adminCardIn 640ms cubic-bezier(0.22, 1, 0.36, 1) both;
                }
                @keyframes adminCardIn {
                    from { opacity: 0; transform: translateY(28px) scale(0.96); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }

                .admin-login-container::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    height: 2px;
                    background: linear-gradient(90deg, transparent, #d7ac72, transparent);
                    opacity: 0.9;
                }

                .admin-login-container.is-shaking {
                    animation: adminCardShake 500ms cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
                }
                @keyframes adminCardShake {
                    10%, 90% { transform: translateX(-2px); }
                    20%, 80% { transform: translateX(4px); }
                    30%, 50%, 70% { transform: translateX(-6px); }
                    40%, 60% { transform: translateX(6px); }
                }

                .card-shine {
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(
                        circle at var(--mx, 50%) var(--my, 50%),
                        rgba(255, 255, 255, 0.09) 0%,
                        transparent 45%
                    );
                    opacity: 0;
                    transition: opacity 320ms cubic-bezier(0.4, 0, 0.2, 1);
                    pointer-events: none;
                    mix-blend-mode: overlay;
                }
                .admin-login-container:hover .card-shine { opacity: 1; }

                /* ── Header ──────────────────────────────────────── */
                .admin-login-header {
                    text-align: center;
                    margin-bottom: 32px;
                }
                .admin-login-logo {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 22px;
                }
                .logo-mark {
                    display: grid;
                    place-items: center;
                    width: 56px; height: 56px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #d7ac72, #b9884a);
                    color: #17130f;
                    box-shadow:
                        0 10px 30px -10px rgba(185, 136, 74, 0.9),
                        inset 0 1px 0 rgba(255, 255, 255, 0.35);
                    transition: transform 420ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 420ms cubic-bezier(0.22, 1, 0.36, 1);
                }
                .admin-login-container:hover .logo-mark {
                    transform: rotate(-8deg) scale(1.06);
                    box-shadow:
                        0 14px 40px -10px rgba(185, 136, 74, 1),
                        inset 0 1px 0 rgba(255, 255, 255, 0.35);
                }
                .logo-text {
                    font-family: 'Fraunces', Georgia, serif;
                    font-weight: 600;
                    font-size: 1.35rem;
                    color: #f6f0e5;
                    letter-spacing: 0.01em;
                }
                .logo-text em {
                    font-style: italic;
                    color: #d7ac72;
                    font-weight: 500;
                }
                .logo-stars {
                    font-size: 0.7rem;
                    color: #d7ac72;
                    letter-spacing: 4px;
                }
                .admin-login-header h1 {
                    font-family: 'Fraunces', Georgia, serif;
                    font-weight: 500;
                    font-size: 1.65rem;
                    color: #f6f0e5;
                    margin: 0 0 6px;
                    letter-spacing: -0.015em;
                }
                .admin-login-header p {
                    font-size: 0.9rem;
                    color: rgba(201, 191, 174, 0.8);
                    margin: 0;
                }

                /* ── Error banner ────────────────────────────────── */
                .admin-login-error {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px 14px;
                    margin-bottom: 22px;
                    border-radius: 10px;
                    background: linear-gradient(135deg, rgba(122, 36, 50, 0.22), rgba(122, 36, 50, 0.12));
                    border: 1px solid rgba(122, 36, 50, 0.55);
                    color: #f0c8ce;
                    font-size: 0.86rem;
                    font-weight: 600;
                    animation: adminErrorIn 340ms cubic-bezier(0.22, 1, 0.36, 1) both;
                }
                @keyframes adminErrorIn {
                    from { opacity: 0; transform: translateY(-8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .error-icon {
                    display: grid;
                    place-items: center;
                    width: 24px; height: 24px;
                    border-radius: 50%;
                    background: rgba(122, 36, 50, 0.45);
                    color: #f0c8ce;
                    flex-shrink: 0;
                }
                .error-text { flex: 1; line-height: 1.4; }

                /* ── Form ────────────────────────────────────────── */
                .admin-login-form {
                    display: flex;
                    flex-direction: column;
                    gap: 18px;
                }

                .admin-field {
                    display: flex;
                    flex-direction: column;
                }

                .admin-input-wrap {
                    position: relative;
                    display: flex;
                    align-items: center;
                    padding: 22px 14px 8px 44px;
                    border-radius: 12px;
                    background: rgba(246, 240, 229, 0.04);
                    border: 1.5px solid rgba(246, 240, 229, 0.12);
                    transition:
                        border-color 220ms cubic-bezier(0.4, 0, 0.2, 1),
                        background 220ms cubic-bezier(0.4, 0, 0.2, 1),
                        box-shadow 220ms cubic-bezier(0.4, 0, 0.2, 1),
                        transform 220ms cubic-bezier(0.4, 0, 0.2, 1);
                }
                .admin-input-wrap:hover {
                    border-color: rgba(246, 240, 229, 0.22);
                    background: rgba(246, 240, 229, 0.06);
                }
                .admin-input-wrap.is-focused {
                    border-color: #d7ac72;
                    background: rgba(185, 136, 74, 0.08);
                    box-shadow:
                        0 0 0 4px rgba(185, 136, 74, 0.16),
                        0 8px 24px -12px rgba(185, 136, 74, 0.6);
                    transform: translateY(-1px);
                }

                .field-icon {
                    position: absolute;
                    left: 14px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: rgba(201, 191, 174, 0.55);
                    display: grid;
                    place-items: center;
                    transition: color 220ms cubic-bezier(0.4, 0, 0.2, 1);
                    pointer-events: none;
                }
                .admin-input-wrap.is-focused .field-icon {
                    color: #d7ac72;
                }

                .admin-input-wrap input {
                    flex: 1;
                    background: transparent;
                    border: none;
                    outline: none;
                    color: #f6f0e5;
                    font-family: inherit;
                    font-size: 1rem;
                    padding: 4px 0;
                    min-width: 0;
                    caret-color: #d7ac72;
                }
                .admin-input-wrap input::placeholder {
                    color: transparent;
                }
                /* Hide default autofill background */
                .admin-input-wrap input:-webkit-autofill,
                .admin-input-wrap input:-webkit-autofill:hover,
                .admin-input-wrap input:-webkit-autofill:focus {
                    -webkit-text-fill-color: #f6f0e5;
                    -webkit-box-shadow: 0 0 0 1000px rgba(26, 21, 16, 1) inset;
                    transition: background-color 5000s ease-in-out 0s;
                }

                .admin-input-wrap label {
                    position: absolute;
                    left: 44px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: rgba(201, 191, 174, 0.65);
                    font-size: 0.95rem;
                    font-weight: 500;
                    pointer-events: none;
                    transition:
                        top 200ms cubic-bezier(0.22, 1, 0.36, 1),
                        font-size 200ms cubic-bezier(0.22, 1, 0.36, 1),
                        color 200ms cubic-bezier(0.22, 1, 0.36, 1),
                        letter-spacing 200ms cubic-bezier(0.22, 1, 0.36, 1);
                }
                .admin-input-wrap.is-focused label,
                .admin-input-wrap.has-value label {
                    top: 10px;
                    transform: none;
                    font-size: 0.68rem;
                    color: #d7ac72;
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                    font-weight: 700;
                }

                .password-toggle {
                    position: absolute;
                    right: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 34px;
                    height: 34px;
                    border-radius: 8px;
                    border: none;
                    background: transparent;
                    color: rgba(201, 191, 174, 0.55);
                    cursor: pointer;
                    display: grid;
                    place-items: center;
                    transition:
                        color 220ms cubic-bezier(0.4, 0, 0.2, 1),
                        background 220ms cubic-bezier(0.4, 0, 0.2, 1),
                        transform 220ms cubic-bezier(0.4, 0, 0.2, 1);
                    -webkit-tap-highlight-color: transparent;
                }
                .password-toggle:hover {
                    color: #d7ac72;
                    background: rgba(185, 136, 74, 0.14);
                    transform: translateY(-50%) scale(1.06);
                }
                .password-toggle:active {
                    transform: translateY(-50%) scale(0.94);
                }

                /* ── Submit ──────────────────────────────────────── */
                .btn-admin-login {
                    position: relative;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    width: 100%;
                    padding: 16px 24px;
                    margin-top: 6px;
                    border: none;
                    border-radius: 12px;
                    font-family: inherit;
                    font-weight: 800;
                    font-size: 0.98rem;
                    letter-spacing: 0.02em;
                    color: #17130f;
                    background: linear-gradient(135deg, #d7ac72, #b9884a);
                    box-shadow:
                        0 14px 34px -14px rgba(185, 136, 74, 0.95),
                        inset 0 1px 0 rgba(255, 255, 255, 0.4);
                    cursor: pointer;
                    overflow: hidden;
                    isolation: isolate;
                    transform: translate3d(var(--mx-off, 0), var(--my-off, 0), 0);
                    transition:
                        transform 220ms cubic-bezier(0.4, 0, 0.2, 1),
                        box-shadow 320ms cubic-bezier(0.4, 0, 0.2, 1);
                    will-change: transform;
                    -webkit-tap-highlight-color: transparent;
                    touch-action: manipulation;
                }
                .btn-admin-login .magnetic-inner {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    width: 100%;
                    transform: translate3d(calc(var(--mx-off, 0) * 0.4), calc(var(--my-off, 0) * 0.4), 0);
                    transition: transform 220ms cubic-bezier(0.4, 0, 0.2, 1);
                }

                .btn-admin-login::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(135deg, #eec48f, #d7ac72);
                    opacity: 0;
                    z-index: -1;
                    transition: opacity 260ms cubic-bezier(0.4, 0, 0.2, 1);
                }
                .btn-admin-login:hover::before { opacity: 1; }

                .btn-admin-login::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 0;
                    height: 0;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.35);
                    transform: translate(-50%, -50%);
                    transition: width 480ms cubic-bezier(0.22, 1, 0.36, 1), height 480ms cubic-bezier(0.22, 1, 0.36, 1), opacity 480ms ease;
                    opacity: 0;
                    pointer-events: none;
                }
                .btn-admin-login:active::after {
                    width: 340px;
                    height: 340px;
                    opacity: 1;
                    transition: 0s;
                }

                .btn-admin-login:hover {
                    box-shadow:
                        0 18px 44px -14px rgba(185, 136, 74, 1),
                        inset 0 1px 0 rgba(255, 255, 255, 0.45);
                }
                .btn-admin-login:focus-visible {
                    outline: none;
                    box-shadow:
                        0 0 0 3px rgba(215, 172, 114, 0.4),
                        0 14px 34px -14px rgba(185, 136, 74, 0.95);
                }
                .btn-admin-login:active {
                    transform: translate3d(var(--mx-off, 0), var(--my-off, 0), 0) scale(0.98);
                }
                .btn-admin-login:disabled {
                    cursor: not-allowed;
                    opacity: 0.85;
                }
                .btn-admin-login.is-loading {
                    pointer-events: none;
                }

                .btn-arrow {
                    display: inline-block;
                    transition: transform 220ms cubic-bezier(0.4, 0, 0.2, 1);
                }
                .btn-admin-login:hover .btn-arrow {
                    transform: translateX(4px);
                }

                .spinner {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    border: 2px solid rgba(23, 19, 15, 0.25);
                    border-top-color: #17130f;
                    animation: adminSpin 700ms linear infinite;
                }
                @keyframes adminSpin {
                    to { transform: rotate(360deg); }
                }

                /* ── Footer ──────────────────────────────────────── */
                .admin-login-footer {
                    display: flex;
                    justify-content: center;
                    margin-top: 26px;
                }
                .back-home-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    color: rgba(201, 191, 174, 0.75);
                    font-size: 0.85rem;
                    font-weight: 600;
                    text-decoration: none;
                    transition: color 200ms cubic-bezier(0.4, 0, 0.2, 1), gap 200ms cubic-bezier(0.4, 0, 0.2, 1);
                }
                .back-home-link:hover {
                    color: #d7ac72;
                    gap: 11px;
                }
                .back-arrow {
                    display: inline-block;
                    transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
                }
                .back-home-link:hover .back-arrow {
                    transform: translateX(-3px);
                }

                /* ── Security note ───────────────────────────────── */
                .admin-login-security {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    margin-top: 24px;
                    padding-top: 20px;
                    border-top: 1px solid rgba(246, 240, 229, 0.08);
                }
                .secure-dot {
                    flex-shrink: 0;
                    width: 8px;
                    height: 8px;
                    margin-top: 5px;
                    border-radius: 50%;
                    background: #6fbf7a;
                    box-shadow: 0 0 0 4px rgba(111, 191, 122, 0.18);
                    animation: adminPulseDot 2.4s ease-in-out infinite;
                }
                @keyframes adminPulseDot {
                    0%, 100% { box-shadow: 0 0 0 4px rgba(111, 191, 122, 0.18); }
                    50%      { box-shadow: 0 0 0 7px rgba(111, 191, 122, 0.06); }
                }
                .admin-login-security strong {
                    display: block;
                    font-size: 0.82rem;
                    font-weight: 700;
                    color: rgba(246, 240, 229, 0.9);
                    margin-bottom: 2px;
                }
                .admin-login-security small {
                    display: block;
                    font-size: 0.76rem;
                    color: rgba(201, 191, 174, 0.6);
                    line-height: 1.4;
                }

                /* ── Responsive ──────────────────────────────────── */
                @media (max-width: 480px) {
                    .admin-login-container {
                        padding: 36px 24px 28px;
                        border-radius: 14px;
                    }
                    .admin-login-header h1 {
                        font-size: 1.4rem;
                    }
                    .logo-mark {
                        width: 48px;
                        height: 48px;
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .admin-login-container,
                    .btn-admin-login,
                    .btn-arrow,
                    .back-arrow,
                    .logo-mark,
                    .admin-bg-orb,
                    .secure-dot {
                        animation: none !important;
                        transition: none !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default AdminLogin;