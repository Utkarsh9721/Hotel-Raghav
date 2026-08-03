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
                .admin-dashboard {
                    min-height: 100vh;
                    background: #f5f7fa;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }

                .admin-loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    background: #f5f7fa;
                }

                .admin-loader {
                    width: 50px;
                    height: 50px;
                    border: 5px solid #f3f3f3;
                    border-top: 5px solid #c0392b;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 20px;
                }

                .admin-nav {
                    background: #2c3e50;
                    color: white;
                    padding: 0 20px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    position: sticky;
                    top: 0;
                    z-index: 100;
                }

                .admin-nav-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    height: 70px;
                }

                .admin-nav-logo {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }

                .admin-nav-logo .logo-text {
                    font-size: 22px;
                    font-weight: 700;
                }

                .admin-badge {
                    background: #c0392b;
                    color: white;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                }

                .admin-nav-right {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }

                .admin-user {
                    font-size: 14px;
                    opacity: 0.9;
                }

                .admin-logout-btn {
                    background: #e74c3c;
                    color: white;
                    border: none;
                    padding: 8px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: background 0.3s ease;
                }

                .admin-logout-btn:hover {
                    background: #c0392b;
                }

                .admin-dashboard-content {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 30px 20px;
                }

                .admin-stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }

                .stat-card {
                    background: white;
                    padding: 20px;
                    border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    transition: all 0.3s ease;
                }

                .stat-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 5px 20px rgba(0,0,0,0.1);
                }

                .stat-icon {
                    font-size: 28px;
                }

                .stat-info h3 {
                    font-size: 24px;
                    margin: 0;
                    color: #2c3e50;
                }

                .stat-info p {
                    margin: 5px 0 0;
                    color: #7f8c8d;
                    font-size: 13px;
                }

                .stat-card.total .stat-info h3 { color: #3498db; }
                .stat-card.pending .stat-info h3 { color: #f39c12; }
                .stat-card.confirmed .stat-info h3 { color: #27ae60; }
                .stat-card.today .stat-info h3 { color: #8e44ad; }
                .stat-card.revenue .stat-info h3 { color: #c0392b; }
                .stat-card.upcoming .stat-info h3 { color: #2ecc71; }

                .admin-controls {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: white;
                    padding: 15px 20px;
                    border-radius: 12px;
                    margin-bottom: 20px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                    flex-wrap: wrap;
                    gap: 10px;
                }

                .filter-section {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                }

                .filter-select,
                .search-input {
                    padding: 8px 15px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 14px;
                }

                .search-input {
                    min-width: 250px;
                }

                .btn-refresh {
                    padding: 8px 20px;
                    background: #3498db;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: background 0.3s ease;
                }

                .btn-refresh:hover {
                    background: #2980b9;
                }

                .admin-recent-bookings {
                    background: white;
                    border-radius: 12px;
                    padding: 25px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                }

                .admin-recent-bookings h2 {
                    margin: 0 0 20px 0;
                    color: #2c3e50;
                }

                .no-bookings {
                    text-align: center;
                    color: #7f8c8d;
                    padding: 40px 0;
                }

                .bookings-table-container {
                    overflow-x: auto;
                }

                .bookings-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 14px;
                }

                .bookings-table th {
                    background: #f8f9fa;
                    padding: 12px 15px;
                    text-align: left;
                    font-weight: 600;
                    color: #2c3e50;
                    border-bottom: 2px solid #e0e0e0;
                    white-space: nowrap;
                }

                .bookings-table td {
                    padding: 12px 15px;
                    border-bottom: 1px solid #e0e0e0;
                    color: #555;
                    vertical-align: middle;
                }

                .booking-row:hover {
                    background: #f8f9fa;
                }

                .booking-date {
                    font-size: 11px;
                    color: #999;
                    margin-top: 2px;
                }

                .guest-name {
                    font-weight: 600;
                    color: #2c3e50;
                }

                .contact-info {
                    font-size: 12px;
                    color: #7f8c8d;
                }

                .contact-info div {
                    margin: 2px 0;
                }

                .room-type {
                    background: #e8f4fd;
                    padding: 2px 10px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 600;
                    color: #2980b9;
                    text-transform: capitalize;
                }

                .price {
                    font-weight: 700;
                    color: #c0392b;
                }

                .status-badge {
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    display: inline-block;
                    white-space: nowrap;
                }

                .badge-warning { background: #fff3cd; color: #856404; }
                .badge-success { background: #d4edda; color: #155724; }
                .badge-danger { background: #f8d7da; color: #721c24; }
                .badge-info { background: #d1ecf1; color: #0c5460; }
                .badge-primary { background: #cce5ff; color: #004085; }
                .badge-secondary { background: #e2e3e5; color: #383d41; }
                .badge-dark { background: #d6d8d9; color: #1b1e21; }

                .action-buttons {
                    display: flex;
                    gap: 4px;
                    flex-wrap: wrap;
                }

                .btn-action {
                    padding: 3px 8px;
                    border: none;
                    border-radius: 4px;
                    font-size: 11px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-weight: 600;
                    text-transform: capitalize;
                }

                .btn-action:hover {
                    transform: scale(1.05);
                }

                .btn-confirmed { background: #27ae60; color: white; }
                .btn-confirmed:hover { background: #229954; }
                .btn-cancelled { background: #e74c3c; color: white; }
                .btn-cancelled:hover { background: #c0392b; }
                .btn-checked-in { background: #3498db; color: white; }
                .btn-checked-in:hover { background: #2980b9; }
                .btn-checked-out { background: #95a5a6; color: white; }
                .btn-checked-out:hover { background: #7f8c8d; }
                .btn-completed { background: #2ecc71; color: white; }
                .btn-completed:hover { background: #27ae60; }

                .btn-contact {
                    background: #f39c12;
                    color: white;
                    padding: 3px 10px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .btn-contact:hover {
                    background: #e67e22;
                    transform: scale(1.05);
                }

                .pagination {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 15px;
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid #e0e0e0;
                }

                .pagination button {
                    padding: 6px 16px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    background: white;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .pagination button:hover:not(:disabled) {
                    background: #c0392b;
                    color: white;
                    border-color: #c0392b;
                }

                .pagination button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .pagination span {
                    color: #7f8c8d;
                }

                /* Modal Styles */
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 20px;
                }

                .modal-content {
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    max-width: 500px;
                    width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                }

                .modal-content h2 {
                    margin-top: 0;
                    color: #2c3e50;
                }

                .contact-info-display {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    margin: 15px 0;
                }

                .contact-info-display p {
                    margin: 5px 0;
                }

                .form-group {
                    margin-bottom: 15px;
                }

                .form-group label {
                    display: block;
                    font-weight: 600;
                    margin-bottom: 5px;
                    color: #2c3e50;
                }

                .form-group select,
                .form-group textarea,
                .form-group input[type="text"] {
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 14px;
                }

                .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 400 !important;
                    cursor: pointer;
                }

                .checkbox-label input[type="checkbox"] {
                    width: 18px;
                    height: 18px;
                    accent-color: #c0392b;
                }

                .modal-actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 20px;
                }

                .btn-submit {
                    flex: 1;
                    padding: 10px;
                    background: #c0392b;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: background 0.3s ease;
                }

                .btn-submit:hover {
                    background: #a93226;
                }

                .btn-cancel {
                    padding: 10px 25px;
                    background: #95a5a6;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: background 0.3s ease;
                }

                .btn-cancel:hover {
                    background: #7f8c8d;
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
                        padding: 8px 10px;
                    }

                    .action-buttons {
                        flex-direction: column;
                    }

                    .modal-content {
                        padding: 20px;
                        margin: 10px;
                    }
                }

                @media (max-width: 480px) {
                    .admin-stats-grid {
                        grid-template-columns: 1fr;
                    }

                    .stat-card {
                        padding: 15px;
                    }

                    .stat-info h3 {
                        font-size: 20px;
                    }
                }
            `}</style>
        </div>
    );
};

export default AdminDashboard;