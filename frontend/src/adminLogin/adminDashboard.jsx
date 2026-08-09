// AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalBookings: 0,
        pendingBookings: 0,
        confirmedBookings: 0,
        cancelledBookings: 0,
        completedBookings: 0,
        totalRevenue: 0,
        todayBookings: 0,
        upcomingBookings: 0
    });
    const [recentBookings, setRecentBookings] = useState([]);
    const [adminUser, setAdminUser] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showContactModal, setShowContactModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [contactData, setContactData] = useState({
        contactMethod: 'phone',
        notes: '',
        outcome: ''
    });
    const [statusUpdateData, setStatusUpdateData] = useState({
        status: '',
        adminNotes: '',
        contactCustomer: true
    });
    const [showStatusModal, setShowStatusModal] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        // Check if admin is logged in
        const token = localStorage.getItem('adminToken');
        const user = localStorage.getItem('adminUser');

        if (!token || !user) {
            navigate('/admin/login');
            return;
        }

        setAdminUser(JSON.parse(user));
        fetchDashboardData();

        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(interval);
    }, [currentPage, filterStatus, searchTerm]);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('adminToken');

            // Fetch stats
            const statsResponse = await fetch(`${API_URL}/api/admin/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const statsData = await statsResponse.json();

            if (statsData.success) {
                setStats(statsData.stats);
            }

            // Fetch bookings with filters
            const queryParams = new URLSearchParams({
                page: currentPage,
                limit: 10,
                status: filterStatus !== 'all' ? filterStatus : '',
                search: searchTerm
            }).toString();

            const bookingsResponse = await fetch(`${API_URL}/api/admin/bookings?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const bookingsData = await bookingsResponse.json();

            if (bookingsData.success) {
                setRecentBookings(bookingsData.bookings || []);
                setTotalPages(bookingsData.totalPages || 1);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/admin/login');
    };

    const handleStatusUpdate = async (bookingId) => {
        try {
            const token = localStorage.getItem('adminToken');

            const response = await fetch(`${API_URL}/api/admin/bookings/${bookingId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: statusUpdateData.status,
                    adminNotes: statusUpdateData.adminNotes,
                    contactCustomer: statusUpdateData.contactCustomer
                })
            });

            const data = await response.json();

            if (data.success) {
                alert('✅ Booking status updated successfully!');
                setShowStatusModal(false);
                fetchDashboardData();
            } else {
                alert('❌ Failed to update status: ' + data.message);
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('❌ Failed to update status. Please try again.');
        }
    };

    const handleContactSubmit = async (bookingId) => {
        try {
            const token = localStorage.getItem('adminToken');

            const response = await fetch(`${API_URL}/api/admin/bookings/${bookingId}/contact`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(contactData)
            });

            const data = await response.json();

            if (data.success) {
                alert('✅ Contact history added successfully!');
                setShowContactModal(false);
                setContactData({
                    contactMethod: 'phone',
                    notes: '',
                    outcome: ''
                });
                fetchDashboardData();
            } else {
                alert('❌ Failed to add contact history: ' + data.message);
            }
        } catch (error) {
            console.error('Error adding contact:', error);
            alert('❌ Failed to add contact history. Please try again.');
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: 'badge-warning',
            confirmed: 'badge-success',
            cancelled: 'badge-danger',
            completed: 'badge-info',
            'checked-in': 'badge-primary',
            'checked-out': 'badge-secondary',
            'no-show': 'badge-dark'
        };
        return badges[status] || 'badge-secondary';
    };

    const getStatusActions = (status) => {
        const actions = {
            pending: ['confirmed', 'cancelled'],
            confirmed: ['checked-in', 'cancelled'],
            'checked-in': ['checked-out'],
            'checked-out': ['completed'],
            completed: [],
            cancelled: [],
            'no-show': []
        };
        return actions[status] || [];
    };

    const getStatusLabel = (status) => {
        const labels = {
            pending: '⏳ Pending',
            confirmed: '✅ Confirmed',
            cancelled: '❌ Cancelled',
            completed: '✨ Completed',
            'checked-in': '🏨 Checked In',
            'checked-out': '📤 Checked Out',
            'no-show': '🚫 No Show'
        };
        return labels[status] || status;
    };

    if (loading) {
        return (
            <div className="admin-loading">
                <div className="admin-loader"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            {/* Navigation */}
            <nav className="admin-nav">
                <div className="admin-nav-container">
                    <div className="admin-nav-logo">
                        <span className="logo-text">🏨 Raghav Hotel</span>
                        <span className="admin-badge">Admin</span>
                    </div>
                    <div className="admin-nav-right">
                        <span className="admin-user">
                            👋 Welcome, {adminUser?.firstName || 'Admin'}
                        </span>
                        <button onClick={handleLogout} className="admin-logout-btn">
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            <div className="admin-dashboard-content">
                {/* Stats Grid */}
                <div className="admin-stats-grid">
                    <div className="stat-card total">
                        <div className="stat-icon">📊</div>
                        <div className="stat-info">
                            <h3>{stats.totalBookings}</h3>
                            <p>Total Bookings</p>
                        </div>
                    </div>
                    <div className="stat-card pending">
                        <div className="stat-icon">⏳</div>
                        <div className="stat-info">
                            <h3>{stats.pendingBookings}</h3>
                            <p>Pending</p>
                        </div>
                    </div>
                    <div className="stat-card confirmed">
                        <div className="stat-icon">✅</div>
                        <div className="stat-info">
                            <h3>{stats.confirmedBookings}</h3>
                            <p>Confirmed</p>
                        </div>
                    </div>
                    <div className="stat-card today">
                        <div className="stat-icon">📅</div>
                        <div className="stat-info">
                            <h3>{stats.todayBookings || 0}</h3>
                            <p>Today's Bookings</p>
                        </div>
                    </div>
                    <div className="stat-card revenue">
                        <div className="stat-icon">💰</div>
                        <div className="stat-info">
                            <h3>${stats.totalRevenue || 0}</h3>
                            <p>Revenue</p>
                        </div>
                    </div>
                    <div className="stat-card upcoming">
                        <div className="stat-icon">🚀</div>
                        <div className="stat-info">
                            <h3>{stats.upcomingBookings || 0}</h3>
                            <p>Upcoming</p>
                        </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="admin-controls">
                    <div className="filter-section">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">All Bookings</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="checked-in">Checked In</option>
                            <option value="checked-out">Checked Out</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="no-show">No Show</option>
                        </select>
                        <input
                            type="text"
                            placeholder="Search by name, email, or reference..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <button className="btn-refresh" onClick={fetchDashboardData}>
                        🔄 Refresh
                    </button>
                </div>

                {/* Bookings Table */}
                <div className="admin-recent-bookings">
                    <h2>📋 Bookings</h2>
                    {recentBookings.length === 0 ? (
                        <p className="no-bookings">No bookings found</p>
                    ) : (
                        <div className="bookings-table-container">
                            <table className="bookings-table">
                                <thead>
                                    <tr>
                                        <th>Reference</th>
                                        <th>Guest</th>
                                        <th>Contact</th>
                                        <th>Room</th>
                                        <th>Check-in</th>
                                        <th>Check-out</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentBookings.map(booking => (
                                        <tr key={booking._id} className="booking-row">
                                            <td>
                                                <strong>{booking.bookingReference}</strong>
                                                <div className="booking-date">
                                                    {new Date(booking.createdAt).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="guest-name">
                                                    {booking.guestDetails.firstName} {booking.guestDetails.lastName}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="contact-info">
                                                    <div>📧 {booking.guestDetails.email}</div>
                                                    <div>📞 {booking.guestDetails.phone}</div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="room-type">{booking.roomType}</span>
                                            </td>
                                            <td>{new Date(booking.checkIn).toLocaleDateString()}</td>
                                            <td>{new Date(booking.checkOut).toLocaleDateString()}</td>
                                            <td className="price">${booking.totalPrice}</td>
                                            <td>
                                                <span className={`status-badge ${booking.bookingStatus}`}>
                                                    {getStatusLabel(booking.bookingStatus)}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    {getStatusActions(booking.bookingStatus).map(action => (
                                                        <button
                                                            key={action}
                                                            className={`btn-action btn-${action}`}
                                                            onClick={() => {
                                                                setSelectedBooking(booking);
                                                                setStatusUpdateData({
                                                                    status: action,
                                                                    adminNotes: '',
                                                                    contactCustomer: true
                                                                });
                                                                setShowStatusModal(true);
                                                            }}
                                                        >
                                                            {action}
                                                        </button>
                                                    ))}
                                                    <button
                                                        className="btn-contact"
                                                        onClick={() => {
                                                            setSelectedBooking(booking);
                                                            setShowContactModal(true);
                                                        }}
                                                    >
                                                        📞
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="pagination">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </button>
                            <span>Page {currentPage} of {totalPages}</span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Contact Modal */}
            {showContactModal && selectedBooking && (
                <div className="modal-overlay" onClick={() => setShowContactModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>📞 Contact Guest</h2>
                        <div className="contact-info-display">
                            <p><strong>Guest:</strong> {selectedBooking.guestDetails.firstName} {selectedBooking.guestDetails.lastName}</p>
                            <p><strong>Phone:</strong> {selectedBooking.guestDetails.phone}</p>
                            <p><strong>Email:</strong> {selectedBooking.guestDetails.email}</p>
                            <p><strong>Booking:</strong> {selectedBooking.bookingReference}</p>
                        </div>

                        <div className="form-group">
                            <label>Contact Method</label>
                            <select
                                value={contactData.contactMethod}
                                onChange={(e) => setContactData({ ...contactData, contactMethod: e.target.value })}
                            >
                                <option value="phone">📞 Phone</option>
                                <option value="email">✉️ Email</option>
                                <option value="sms">📱 SMS</option>
                                <option value="whatsapp">💬 WhatsApp</option>
                                <option value="in-person">🤝 In Person</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Notes</label>
                            <textarea
                                value={contactData.notes}
                                onChange={(e) => setContactData({ ...contactData, notes: e.target.value })}
                                placeholder="Add notes about the conversation..."
                                rows="3"
                            />
                        </div>

                        <div className="form-group">
                            <label>Outcome</label>
                            <input
                                type="text"
                                value={contactData.outcome}
                                onChange={(e) => setContactData({ ...contactData, outcome: e.target.value })}
                                placeholder="e.g., Confirmed, Rescheduled, etc."
                            />
                        </div>

                        <div className="modal-actions">
                            <button
                                className="btn-submit"
                                onClick={() => handleContactSubmit(selectedBooking._id)}
                            >
                                Save Contact History
                            </button>
                            <button
                                className="btn-cancel"
                                onClick={() => setShowContactModal(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Update Modal */}
            {showStatusModal && selectedBooking && (
                <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>📋 Update Booking Status</h2>
                        <div className="contact-info-display">
                            <p><strong>Booking:</strong> {selectedBooking.bookingReference}</p>
                            <p><strong>Guest:</strong> {selectedBooking.guestDetails.firstName} {selectedBooking.guestDetails.lastName}</p>
                            <p><strong>Current Status:</strong> {getStatusLabel(selectedBooking.bookingStatus)}</p>
                            <p><strong>New Status:</strong> <span className="status-badge" style={{ textTransform: 'uppercase' }}>{statusUpdateData.status}</span></p>
                        </div>

                        <div className="form-group">
                            <label>Admin Notes</label>
                            <textarea
                                value={statusUpdateData.adminNotes}
                                onChange={(e) => setStatusUpdateData({ ...statusUpdateData, adminNotes: e.target.value })}
                                placeholder="Add notes about this status change..."
                                rows="3"
                            />
                        </div>

                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={statusUpdateData.contactCustomer}
                                    onChange={(e) => setStatusUpdateData({ ...statusUpdateData, contactCustomer: e.target.checked })}
                                />
                                Notify customer via email
                            </label>
                        </div>

                        <div className="modal-actions">
                            <button
                                className="btn-submit"
                                onClick={() => handleStatusUpdate(selectedBooking._id)}
                            >
                                Update Status
                            </button>
                            <button
                                className="btn-cancel"
                                onClick={() => setShowStatusModal(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');

                :root {
                    --ink: #14213D;
                    --ink-soft: #2B3654;
                    --parchment: #F8F6F1;
                    --card: #FFFFFF;
                    --line: #E7E2D6;
                    --brass: #A9791F;
                    --brass-light: #C89B3C;
                    --wine: #7A2E2E;
                    --wine-light: #9A3B3B;
                    --sage: #3F6B4C;
                    --sage-light: #ECF3EE;
                    --amber: #B4791E;
                    --amber-light: #FBF1DF;
                    --plum: #5B4270;
                    --teal: #2C6A63;
                    --slate: #64748B;
                    --danger-light: #F7E7E4;
                    --shadow-sm: 0 1px 2px rgba(20, 33, 61, 0.06), 0 1px 3px rgba(20, 33, 61, 0.08);
                    --shadow-md: 0 4px 16px rgba(20, 33, 61, 0.08), 0 2px 6px rgba(20, 33, 61, 0.06);
                    --shadow-lg: 0 12px 32px rgba(20, 33, 61, 0.14);
                    --radius: 10px;
                }

                * {
                    box-sizing: border-box;
                }

                .admin-dashboard {
                    min-height: 100vh;
                    background:
                        radial-gradient(ellipse 900px 500px at 10% -10%, rgba(169, 121, 31, 0.06), transparent),
                        var(--parchment);
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    color: var(--ink);
                    -webkit-font-smoothing: antialiased;
                }

                .admin-loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    background: var(--parchment);
                    gap: 4px;
                }

                .admin-loading p {
                    color: var(--slate);
                    font-size: 14px;
                    letter-spacing: 0.02em;
                }

                .admin-loader {
                    width: 42px;
                    height: 42px;
                    border: 3px solid var(--line);
                    border-top: 3px solid var(--brass);
                    border-radius: 50%;
                    animation: spin 0.85s cubic-bezier(0.5, 0.1, 0.5, 0.9) infinite;
                    margin-bottom: 18px;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                /* Navigation */
                .admin-nav {
                    background: linear-gradient(180deg, var(--ink) 0%, #101A31 100%);
                    color: #F4F1E8;
                    padding: 0 24px;
                    box-shadow: var(--shadow-md);
                    position: sticky;
                    top: 0;
                    z-index: 100;
                    border-bottom: 2px solid var(--brass);
                }

                .admin-nav-container {
                    max-width: 1280px;
                    margin: 0 auto;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    height: 68px;
                }

                .admin-nav-logo {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                }

                .admin-nav-logo .logo-text {
                    font-family: 'Playfair Display', Georgia, serif;
                    font-size: 21px;
                    font-weight: 700;
                    letter-spacing: 0.01em;
                    color: #FBF9F3;
                }

                .admin-badge {
                    background: rgba(200, 155, 60, 0.16);
                    color: var(--brass-light);
                    border: 1px solid rgba(200, 155, 60, 0.4);
                    padding: 3px 12px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 600;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                }

                .admin-nav-right {
                    display: flex;
                    align-items: center;
                    gap: 22px;
                }

                .admin-user {
                    font-size: 13.5px;
                    color: rgba(244, 241, 232, 0.78);
                }

                .admin-logout-btn {
                    background: transparent;
                    color: #F4F1E8;
                    border: 1px solid rgba(244, 241, 232, 0.28);
                    padding: 8px 18px;
                    border-radius: 7px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 13px;
                    transition: all 0.2s ease;
                }

                .admin-logout-btn:hover {
                    background: var(--wine);
                    border-color: var(--wine);
                    transform: translateY(-1px);
                }

                .admin-dashboard-content {
                    max-width: 1280px;
                    margin: 0 auto;
                    padding: 32px 24px 60px;
                }

                /* Stats Grid */
                .admin-stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
                    gap: 18px;
                    margin-bottom: 28px;
                }

                .stat-card {
                    background: var(--card);
                    padding: 20px 22px;
                    border-radius: var(--radius);
                    box-shadow: var(--shadow-sm);
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    border: 1px solid var(--line);
                    border-top: 3px solid var(--accent, var(--brass));
                    transition: transform 0.22s ease, box-shadow 0.22s ease;
                    position: relative;
                    overflow: hidden;
                }

                .stat-card::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(135deg, rgba(20,33,61,0.02), transparent 40%);
                    pointer-events: none;
                }

                .stat-card:hover {
                    transform: translateY(-3px);
                    box-shadow: var(--shadow-md);
                }

                .stat-icon {
                    font-size: 24px;
                    width: 46px;
                    height: 46px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 9px;
                    background: var(--tint, var(--amber-light));
                    flex-shrink: 0;
                }

                .stat-info h3 {
                    font-family: 'Playfair Display', Georgia, serif;
                    font-size: 26px;
                    font-weight: 700;
                    margin: 0;
                    color: var(--ink);
                    line-height: 1;
                }

                .stat-info p {
                    margin: 7px 0 0;
                    color: var(--slate);
                    font-size: 12.5px;
                    font-weight: 500;
                    letter-spacing: 0.02em;
                }

                .stat-card.total { --accent: #3E5C86; --tint: #E9EEF6; }
                .stat-card.pending { --accent: var(--amber); --tint: var(--amber-light); }
                .stat-card.confirmed { --accent: var(--sage); --tint: var(--sage-light); }
                .stat-card.today { --accent: var(--plum); --tint: #F1ECF5; }
                .stat-card.revenue { --accent: var(--brass); --tint: #F6EEDB; }
                .stat-card.upcoming { --accent: var(--teal); --tint: #E7F2F0; }

                /* Controls */
                .admin-controls {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: var(--card);
                    padding: 16px 20px;
                    border-radius: var(--radius);
                    margin-bottom: 20px;
                    box-shadow: var(--shadow-sm);
                    border: 1px solid var(--line);
                    flex-wrap: wrap;
                    gap: 12px;
                }

                .filter-section {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                }

                .filter-select,
                .search-input {
                    padding: 9px 14px;
                    border: 1px solid var(--line);
                    border-radius: 7px;
                    font-size: 13.5px;
                    font-family: inherit;
                    color: var(--ink);
                    background: var(--parchment);
                    transition: border-color 0.2s ease, box-shadow 0.2s ease;
                }

                .filter-select:focus,
                .search-input:focus {
                    outline: none;
                    border-color: var(--brass);
                    box-shadow: 0 0 0 3px rgba(169, 121, 31, 0.14);
                    background: var(--card);
                }

                .search-input {
                    min-width: 270px;
                }

                .btn-refresh {
                    padding: 9px 20px;
                    background: var(--ink);
                    color: #F4F1E8;
                    border: none;
                    border-radius: 7px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 13px;
                    transition: all 0.2s ease;
                }

                .btn-refresh:hover {
                    background: var(--ink-soft);
                    transform: translateY(-1px);
                    box-shadow: var(--shadow-sm);
                }

                /* Bookings Table */
                .admin-recent-bookings {
                    background: var(--card);
                    border-radius: var(--radius);
                    padding: 26px;
                    box-shadow: var(--shadow-sm);
                    border: 1px solid var(--line);
                }

                .admin-recent-bookings h2 {
                    margin: 0 0 20px 0;
                    color: var(--ink);
                    font-family: 'Playfair Display', Georgia, serif;
                    font-size: 20px;
                    font-weight: 700;
                    padding-bottom: 14px;
                    border-bottom: 1px solid var(--line);
                }

                .no-bookings {
                    text-align: center;
                    color: var(--slate);
                    padding: 50px 0;
                    font-size: 14px;
                }

                .bookings-table-container {
                    overflow-x: auto;
                }

                .bookings-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 13.5px;
                }

                .bookings-table th {
                    background: var(--parchment);
                    padding: 12px 15px;
                    text-align: left;
                    font-weight: 600;
                    font-size: 11px;
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                    color: var(--slate);
                    border-bottom: 2px solid var(--line);
                    white-space: nowrap;
                }

                .bookings-table td {
                    padding: 13px 15px;
                    border-bottom: 1px solid var(--line);
                    color: var(--ink-soft);
                    vertical-align: middle;
                }

                .booking-row {
                    transition: background 0.15s ease;
                }

                .booking-row:hover {
                    background: rgba(169, 121, 31, 0.045);
                }

                .booking-row strong {
                    font-family: 'IBM Plex Mono', monospace;
                    font-size: 12.5px;
                    color: var(--ink);
                    letter-spacing: 0.01em;
                }

                .booking-date {
                    font-size: 11px;
                    color: #A0A6B4;
                    margin-top: 2px;
                }

                .guest-name {
                    font-weight: 600;
                    color: var(--ink);
                }

                .contact-info {
                    font-size: 11.5px;
                    color: var(--slate);
                }

                .contact-info div {
                    margin: 2px 0;
                }

                .room-type {
                    background: #E9EEF6;
                    padding: 3px 11px;
                    border-radius: 20px;
                    font-size: 11.5px;
                    font-weight: 600;
                    color: #3E5C86;
                    text-transform: capitalize;
                }

                .price {
                    font-family: 'IBM Plex Mono', monospace;
                    font-weight: 600;
                    color: var(--brass);
                    font-size: 13.5px;
                }

                .status-badge {
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 11.5px;
                    font-weight: 600;
                    display: inline-block;
                    white-space: nowrap;
                    letter-spacing: 0.01em;
                }

                .badge-warning { background: var(--amber-light); color: var(--amber); }
                .badge-success { background: var(--sage-light); color: var(--sage); }
                .badge-danger { background: var(--danger-light); color: var(--wine); }
                .badge-info { background: #E4EEF5; color: #2C6A9C; }
                .badge-primary { background: #E9EEF6; color: #3E5C86; }
                .badge-secondary { background: #ECECEC; color: #565656; }
                .badge-dark { background: #E3E3E3; color: #34343A; }

                .action-buttons {
                    display: flex;
                    gap: 6px;
                    flex-wrap: wrap;
                }

                .btn-action {
                    padding: 5px 11px;
                    border: none;
                    border-radius: 6px;
                    font-size: 11px;
                    cursor: pointer;
                    transition: all 0.18s ease;
                    font-weight: 600;
                    text-transform: capitalize;
                    letter-spacing: 0.01em;
                }

                .btn-action:hover {
                    transform: translateY(-1px);
                    box-shadow: var(--shadow-sm);
                }

                .btn-confirmed { background: var(--sage); color: white; }
                .btn-confirmed:hover { background: #35583F; }
                .btn-cancelled { background: var(--wine); color: white; }
                .btn-cancelled:hover { background: #632424; }
                .btn-checked-in { background: #3E5C86; color: white; }
                .btn-checked-in:hover { background: #33496B; }
                .btn-checked-out { background: var(--slate); color: white; }
                .btn-checked-out:hover { background: #566073; }
                .btn-completed { background: var(--teal); color: white; }
                .btn-completed:hover { background: #235550; }

                .btn-contact {
                    background: var(--brass);
                    color: white;
                    padding: 5px 12px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.18s ease;
                }

                .btn-contact:hover {
                    background: #8C6419;
                    transform: translateY(-1px);
                    box-shadow: var(--shadow-sm);
                }

                .pagination {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 16px;
                    margin-top: 22px;
                    padding-top: 20px;
                    border-top: 1px solid var(--line);
                }

                .pagination button {
                    padding: 7px 18px;
                    border: 1px solid var(--line);
                    border-radius: 6px;
                    background: var(--card);
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 500;
                    color: var(--ink-soft);
                    transition: all 0.2s ease;
                }

                .pagination button:hover:not(:disabled) {
                    background: var(--ink);
                    color: #F4F1E8;
                    border-color: var(--ink);
                }

                .pagination button:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }

                .pagination span {
                    color: var(--slate);
                    font-size: 13px;
                }

                /* Modal Styles */
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(20, 33, 61, 0.55);
                    backdrop-filter: blur(2px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 20px;
                    animation: fadeIn 0.18s ease;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .modal-content {
                    background: var(--card);
                    padding: 32px;
                    border-radius: 14px;
                    max-width: 500px;
                    width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: var(--shadow-lg);
                    border-top: 3px solid var(--brass);
                    animation: slideUp 0.2s ease;
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .modal-content h2 {
                    margin-top: 0;
                    color: var(--ink);
                    font-family: 'Playfair Display', Georgia, serif;
                    font-size: 20px;
                    font-weight: 700;
                }

                .contact-info-display {
                    background: var(--parchment);
                    padding: 16px 18px;
                    border-radius: 9px;
                    margin: 16px 0;
                    border: 1px solid var(--line);
                }

                .contact-info-display p {
                    margin: 6px 0;
                    font-size: 13.5px;
                    color: var(--ink-soft);
                }

                .form-group {
                    margin-bottom: 16px;
                }

                .form-group label {
                    display: block;
                    font-weight: 600;
                    margin-bottom: 6px;
                    color: var(--ink);
                    font-size: 13px;
                }

                .form-group select,
                .form-group textarea,
                .form-group input[type="text"] {
                    width: 100%;
                    padding: 10px 13px;
                    border: 1px solid var(--line);
                    border-radius: 7px;
                    font-size: 13.5px;
                    font-family: inherit;
                    color: var(--ink);
                    transition: border-color 0.2s ease, box-shadow 0.2s ease;
                }

                .form-group select:focus,
                .form-group textarea:focus,
                .form-group input[type="text"]:focus {
                    outline: none;
                    border-color: var(--brass);
                    box-shadow: 0 0 0 3px rgba(169, 121, 31, 0.14);
                }

                .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 9px;
                    font-weight: 400 !important;
                    cursor: pointer;
                }

                .checkbox-label input[type="checkbox"] {
                    width: 17px;
                    height: 17px;
                    accent-color: var(--brass);
                }

                .modal-actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 22px;
                }

                .btn-submit {
                    flex: 1;
                    padding: 11px;
                    background: var(--ink);
                    color: #F4F1E8;
                    border: none;
                    border-radius: 7px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 13.5px;
                    transition: all 0.2s ease;
                }

                .btn-submit:hover {
                    background: var(--ink-soft);
                    transform: translateY(-1px);
                }

                .btn-cancel {
                    padding: 11px 26px;
                    background: transparent;
                    color: var(--slate);
                    border: 1px solid var(--line);
                    border-radius: 7px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 13.5px;
                    transition: all 0.2s ease;
                }

                .btn-cancel:hover {
                    background: var(--parchment);
                    border-color: #C7C1B0;
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .admin-nav-container {
                        flex-direction: column;
                        height: auto;
                        padding: 15px 0;
                        gap: 10px;
                    }

                    .admin-stats-grid {
                        grid-template-columns: 1fr 1fr;
                    }

                    .admin-nav-right {
                        width: 100%;
                        justify-content: space-between;
                    }

                    .admin-controls {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .filter-section {
                        flex-direction: column;
                    }

                    .search-input {
                        min-width: auto;
                    }

                    .bookings-table {
                        font-size: 12px;
                    }

                    .bookings-table th,
                    .bookings-table td {
                        padding: 9px 10px;
                    }

                    .action-buttons {
                        flex-direction: column;
                    }

                    .modal-content {
                        padding: 22px;
                        margin: 10px;
                    }
                }

                @media (max-width: 480px) {
                    .admin-stats-grid {
                        grid-template-columns: 1fr;
                    }

                    .stat-card {
                        padding: 16px;
                    }

                    .stat-info h3 {
                        font-size: 21px;
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    * {
                        animation-duration: 0.001ms !important;
                        transition-duration: 0.001ms !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default AdminDashboard;