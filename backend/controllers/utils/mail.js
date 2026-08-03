// utils/emailService.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        // Verify connection on startup
        this.verifyConnection();
    }

    // Verify email connection
    async verifyConnection() {
        try {
            await this.transporter.verify();
            console.log('✅ Email service connected successfully');
        } catch (error) {
            console.error('❌ Email service connection failed:', error.message);
        }
    }

    // ============================================
    // CONTACT FORM NOTIFICATIONS
    // ============================================

    // Send contact form notification to admin
    async sendContactNotificationToAdmin(contactData) {
        try {
            const adminEmail = process.env.ADMIN_EMAIL || 'admin@raghavhotel.com';

            const mailOptions = {
                from: process.env.SMTP_USER,
                to: adminEmail,
                subject: `📩 New Contact Form Message - ${contactData.subject}`,
                html: this.getContactAdminEmailTemplate(contactData)
            };

            await this.transporter.sendMail(mailOptions);
            console.log('📧 Contact notification email sent to admin');
            return true;
        } catch (error) {
            console.error('Error sending contact email:', error);
            throw error;
        }
    }

    // ============================================
    // ADMIN NOTIFICATIONS
    // ============================================

    // Send email to admin about new booking
    async sendBookingNotificationToAdmin(bookingData) {
        try {
            const adminEmail = process.env.ADMIN_EMAIL || 'admin@raghavhotel.com';

            const mailOptions = {
                from: process.env.SMTP_USER,
                to: adminEmail,
                subject: `🔔 New Booking Request - ${bookingData.bookingReference}`,
                html: this.getAdminBookingEmailTemplate(bookingData)
            };

            await this.transporter.sendMail(mailOptions);
            console.log('📧 Admin notification email sent successfully');
            return true;
        } catch (error) {
            console.error('Error sending admin email:', error);
            throw error;
        }
    }

    // ============================================
    // CUSTOMER NOTIFICATIONS
    // ============================================

    // Send confirmation email to customer (when booking is created)
    async sendBookingConfirmationToCustomer(bookingData) {
        try {
            const mailOptions = {
                from: process.env.SMTP_USER,
                to: bookingData.guestDetails.email,
                subject: `✅ Booking Request Received - ${bookingData.bookingReference}`,
                html: this.getCustomerBookingEmailTemplate(bookingData)
            };

            await this.transporter.sendMail(mailOptions);
            console.log('📧 Customer booking confirmation email sent successfully');
            return true;
        } catch (error) {
            console.error('Error sending customer email:', error);
            throw error;
        }
    }

    // Send booking confirmed email to customer (when admin confirms)
    async sendBookingConfirmedEmailToCustomer(bookingData) {
        try {
            const mailOptions = {
                from: process.env.SMTP_USER,
                to: bookingData.guestDetails.email,
                subject: `🎉 Booking Confirmed - ${bookingData.bookingReference}`,
                html: this.getBookingConfirmedEmailTemplate(bookingData)
            };

            await this.transporter.sendMail(mailOptions);
            console.log('📧 Booking confirmed email sent to customer');
            return true;
        } catch (error) {
            console.error('Error sending booking confirmed email:', error);
            throw error;
        }
    }

    // Send status update email to customer
    async sendStatusUpdateToCustomer(bookingData, status, note) {
        try {
            const mailOptions = {
                from: process.env.SMTP_USER,
                to: bookingData.guestDetails.email,
                subject: `📋 Booking Status Update - ${bookingData.bookingReference}`,
                html: this.getStatusUpdateEmailTemplate(bookingData, status, note)
            };

            await this.transporter.sendMail(mailOptions);
            console.log('📧 Status update email sent successfully');
            return true;
        } catch (error) {
            console.error('Error sending status update email:', error);
            throw error;
        }
    }

    // Send booking cancellation email to customer
    async sendBookingCancelledEmailToCustomer(bookingData, reason) {
        try {
            const mailOptions = {
                from: process.env.SMTP_USER,
                to: bookingData.guestDetails.email,
                subject: `❌ Booking Cancelled - ${bookingData.bookingReference}`,
                html: this.getBookingCancelledEmailTemplate(bookingData, reason)
            };

            await this.transporter.sendMail(mailOptions);
            console.log('📧 Booking cancellation email sent to customer');
            return true;
        } catch (error) {
            console.error('Error sending cancellation email:', error);
            throw error;
        }
    }

    // Send booking reminder email to customer (1 day before check-in)
    async sendBookingReminderEmailToCustomer(bookingData) {
        try {
            const mailOptions = {
                from: process.env.SMTP_USER,
                to: bookingData.guestDetails.email,
                subject: `🔔 Reminder: Your Stay at Raghav Hotel - ${bookingData.bookingReference}`,
                html: this.getBookingReminderEmailTemplate(bookingData)
            };

            await this.transporter.sendMail(mailOptions);
            console.log('📧 Booking reminder email sent to customer');
            return true;
        } catch (error) {
            console.error('Error sending reminder email:', error);
            throw error;
        }
    }

    // Send check-in email to customer
    async sendCheckInEmailToCustomer(bookingData) {
        try {
            const mailOptions = {
                from: process.env.SMTP_USER,
                to: bookingData.guestDetails.email,
                subject: `🏨 Welcome to Raghav Hotel - ${bookingData.bookingReference}`,
                html: this.getCheckInEmailTemplate(bookingData)
            };

            await this.transporter.sendMail(mailOptions);
            console.log('📧 Check-in email sent to customer');
            return true;
        } catch (error) {
            console.error('Error sending check-in email:', error);
            throw error;
        }
    }

    // Send check-out email to customer
    async sendCheckOutEmailToCustomer(bookingData) {
        try {
            const mailOptions = {
                from: process.env.SMTP_USER,
                to: bookingData.guestDetails.email,
                subject: `📤 Thank You for Staying at Raghav Hotel - ${bookingData.bookingReference}`,
                html: this.getCheckOutEmailTemplate(bookingData)
            };

            await this.transporter.sendMail(mailOptions);
            console.log('📧 Check-out email sent to customer');
            return true;
        } catch (error) {
            console.error('Error sending check-out email:', error);
            throw error;
        }
    }

    // ============================================
    // AUTHENTICATION EMAILS
    // ============================================

    // Send email verification link
    async sendVerificationEmail(user, verificationUrl) {
        try {
            const mailOptions = {
                from: process.env.SMTP_USER,
                to: user.email,
                subject: '🔐 Verify Your Email - Raghav Hotel',
                html: this.getVerificationEmailTemplate(user, verificationUrl)
            };

            await this.transporter.sendMail(mailOptions);
            console.log('📧 Verification email sent to:', user.email);
            return true;
        } catch (error) {
            console.error('Error sending verification email:', error);
            throw error;
        }
    }

    // Send password reset email
    async sendPasswordResetEmail(user, resetUrl) {
        try {
            const mailOptions = {
                from: process.env.SMTP_USER,
                to: user.email,
                subject: '🔑 Reset Your Password - Raghav Hotel',
                html: this.getPasswordResetEmailTemplate(user, resetUrl)
            };

            await this.transporter.sendMail(mailOptions);
            console.log('📧 Password reset email sent to:', user.email);
            return true;
        } catch (error) {
            console.error('Error sending password reset email:', error);
            throw error;
        }
    }

    // Send welcome email to new user
    async sendWelcomeEmail(user) {
        try {
            const mailOptions = {
                from: process.env.SMTP_USER,
                to: user.email,
                subject: '🎉 Welcome to Raghav Hotel!',
                html: this.getWelcomeEmailTemplate(user)
            };

            await this.transporter.sendMail(mailOptions);
            console.log('📧 Welcome email sent to:', user.email);
            return true;
        } catch (error) {
            console.error('Error sending welcome email:', error);
            throw error;
        }
    }

    // ============================================
    // EMAIL TEMPLATES
    // ============================================

    // Contact Admin Email Template
    getContactAdminEmailTemplate(contact) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #c0392b; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f9f9f9; }
                    .contact-details { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; }
                    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                    .message-box { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #c0392b; }
                    .action-box { background: #e8f4fd; padding: 15px; border-radius: 8px; margin: 20px 0; }
                    .btn { display: inline-block; background: #c0392b; color: white; padding: 10px 25px; text-decoration: none; border-radius: 5px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🏨 Raghav Hotel</h1>
                        <h2>📩 New Contact Form Message</h2>
                    </div>
                    <div class="content">
                        <p style="font-size: 16px;">A new message has been submitted through the contact form.</p>

                        <div class="contact-details">
                            <h3>📋 Sender Details</h3>
                            <div class="detail-row">
                                <span><strong>Name:</strong></span>
                                <span>${contact.name}</span>
                            </div>
                            <div class="detail-row">
                                <span><strong>Email:</strong></span>
                                <span><a href="mailto:${contact.email}">${contact.email}</a></span>
                            </div>
                            ${contact.phone ? `
                                <div class="detail-row">
                                    <span><strong>Phone:</strong></span>
                                    <span><a href="tel:${contact.phone}">${contact.phone}</a></span>
                                </div>
                            ` : ''}
                            <div class="detail-row">
                                <span><strong>Subject:</strong></span>
                                <span>${contact.subject}</span>
                            </div>
                            <div class="detail-row">
                                <span><strong>Submitted:</strong></span>
                                <span>${new Date(contact.createdAt).toLocaleString()}</span>
                            </div>
                        </div>

                        <div class="contact-details">
                            <h3>💬 Message</h3>
                            <div class="message-box">
                                <p style="white-space: pre-line; margin: 0;">${contact.message}</p>
                            </div>
                        </div>

                        <div class="action-box">
                            <h4>📞 Action Required:</h4>
                            <p>Please respond to this inquiry within 24 hours.</p>
                            <p><strong>Reply to:</strong> <a href="mailto:${contact.email}">${contact.email}</a></p>
                        </div>

                        <div style="text-align: center; margin: 20px 0;">
                            <a href="${process.env.ADMIN_URL || 'http://localhost:5173/admin/contacts'}" class="btn">
                                📋 View in Admin Panel
                            </a>
                        </div>
                    </div>
                    <div class="footer">
                        <p>This is an automated notification from Raghav Hotel Booking System</p>
                        <p>${new Date().getFullYear()} Raghav Hotel. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    // Admin booking notification template
    getAdminBookingEmailTemplate(booking) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #c0392b; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f9f9f9; }
                    .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; }
                    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
                    .status { background: #f39c12; color: white; padding: 5px 15px; border-radius: 20px; display: inline-block; font-weight: bold; }
                    .action-required { background: #e74c3c; color: white; padding: 10px; text-align: center; border-radius: 5px; margin: 20px 0; }
                    .btn { display: inline-block; background: #c0392b; color: white; padding: 10px 25px; text-decoration: none; border-radius: 5px; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                    .admin-actions { background: #e8f4fd; padding: 15px; border-radius: 8px; margin: 15px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🏨 Raghav Hotel</h1>
                        <h2>🆕 New Booking Request</h2>
                    </div>
                    <div class="content">
                        <div class="action-required">
                            ⚠️ ACTION REQUIRED: Please contact customer within 24 hours
                        </div>

                        <div class="booking-details">
                            <h3>📋 Booking Details</h3>
                            <div class="detail-row">
                                <span><strong>Booking Reference:</strong></span>
                                <span>${booking.bookingReference}</span>
                            </div>
                            <div class="detail-row">
                                <span><strong>Auth Method:</strong></span>
                                <span>${booking.user?.authMethod || 'Guest'}</span>
                            </div>
                            <div class="detail-row">
                                <span><strong>Status:</strong></span>
                                <span class="status">${booking.bookingStatus?.toUpperCase() || 'PENDING'}</span>
                            </div>
                            <div class="detail-row">
                                <span><strong>Created:</strong></span>
                                <span>${new Date(booking.createdAt).toLocaleString()}</span>
                            </div>
                        </div>

                        <div class="booking-details">
                            <h3>📅 Stay Details</h3>
                            <div class="detail-row">
                                <span><strong>Check-in:</strong></span>
                                <span>${new Date(booking.checkIn).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            <div class="detail-row">
                                <span><strong>Check-out:</strong></span>
                                <span>${new Date(booking.checkOut).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            <div class="detail-row">
                                <span><strong>Nights:</strong></span>
                                <span>${booking.nights || 'N/A'}</span>
                            </div>
                            <div class="detail-row">
                                <span><strong>Guests:</strong></span>
                                <span>${booking.guests}</span>
                            </div>
                            <div class="detail-row">
                                <span><strong>Room Type:</strong></span>
                                <span>${booking.roomType?.toUpperCase() || 'N/A'}</span>
                            </div>
                            <div class="detail-row">
                                <span><strong>Total Price:</strong></span>
                                <span><strong>$${booking.totalPrice || 0}</strong></span>
                            </div>
                        </div>

                        <div class="booking-details">
                            <h3>👤 Guest Information</h3>
                            <div class="detail-row">
                                <span><strong>Name:</strong></span>
                                <span>${booking.guestDetails.firstName} ${booking.guestDetails.lastName}</span>
                            </div>
                            <div class="detail-row">
                                <span><strong>Email:</strong></span>
                                <span><a href="mailto:${booking.guestDetails.email}">${booking.guestDetails.email}</a></span>
                            </div>
                            <div class="detail-row">
                                <span><strong>Phone:</strong></span>
                                <span><a href="tel:${booking.guestDetails.phone}">${booking.guestDetails.phone}</a></span>
                            </div>
                            ${booking.guestDetails.specialRequests && booking.guestDetails.specialRequests !== 'None' ? `
                                <div class="detail-row">
                                    <span><strong>Special Requests:</strong></span>
                                    <span>${booking.guestDetails.specialRequests}</span>
                                </div>
                            ` : ''}
                        </div>

                        <div class="admin-actions">
                            <h4>📞 Admin Actions Required:</h4>
                            <ol>
                                <li><strong>Call Guest:</strong> Contact <strong>${booking.guestDetails.firstName} ${booking.guestDetails.lastName}</strong> at <strong>${booking.guestDetails.phone}</strong></li>
                                <li><strong>Confirm Availability:</strong> Verify room availability for the requested dates</li>
                                <li><strong>Update Status:</strong> Change booking status in the admin panel</li>
                                <li><strong>Send Confirmation:</strong> Confirm the booking with the guest</li>
                            </ol>
                        </div>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.ADMIN_URL || 'http://localhost:5173/admin'}/bookings/${booking._id}" class="btn">
                                📋 View in Admin Panel
                            </a>
                        </div>

                        <div style="background: #d4edda; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: center;">
                            <p style="margin: 0; color: #155724;">
                                ✅ <strong>Payment is not required at this time.</strong> 
                                Please confirm booking before collecting payment.
                            </p>
                        </div>
                    </div>
                    <div class="footer">
                        <p>This is an automated notification from Raghav Hotel Booking System</p>
                        <p>${new Date().getFullYear()} Raghav Hotel. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    // Customer booking confirmation email template (when booking is created)
    getCustomerBookingEmailTemplate(booking) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f9f9f9; }
                    .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; }
                    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
                    .status-pending { background: #f39c12; color: white; padding: 5px 15px; border-radius: 20px; display: inline-block; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                    .thank-you { text-align: center; font-size: 18px; color: #2c3e50; }
                    .info-box { background: #e8f4fd; padding: 15px; border-radius: 8px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🏨 Raghav Hotel</h1>
                        <h2>Booking Request Received</h2>
                    </div>
                    <div class="content">
                        <div class="thank-you">
                            <h3>Hello ${booking.guestDetails.firstName}! 🎉</h3>
                            <p>Thank you for choosing Raghav Hotel. Your booking request has been received and is being processed.</p>
                            <p>Booking Status: <span class="status-pending">⏳ PENDING</span></p>
                        </div>

                        <div class="booking-details">
                            <h3>📋 Booking Details</h3>
                            <div class="detail-row">
                                <span><strong>Booking Reference:</strong></span>
                                <span>${booking.bookingReference}</span>
                            </div>
                            <div class="detail-row">
                                <span><strong>Check-in:</strong></span>
                                <span>${new Date(booking.checkIn).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            <div class="detail-row">
                                <span><strong>Check-out:</strong></span>
                                <span>${new Date(booking.checkOut).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            <div class="detail-row">
                                <span><strong>Nights:</strong></span>
                                <span>${booking.nights || 'N/A'}</span>
                            </div>
                            <div class="detail-row">
                                <span><strong>Guests:</strong></span>
                                <span>${booking.guests}</span>
                            </div>
                            <div class="detail-row">
                                <span><strong>Room Type:</strong></span>
                                <span>${booking.roomType.toUpperCase()}</span>
                            </div>
                            <div class="detail-row">
                                <span><strong>Total Price:</strong></span>
                                <span><strong>$${booking.totalPrice}</strong></span>
                            </div>
                        </div>

                        <div class="info-box">
                            <h4>📞 Next Steps</h4>
                            <ul>
                                <li>Our team will review your booking within 24 hours</li>
                                <li>You will receive a confirmation email once your booking is confirmed</li>
                                <li>We will contact you at <strong>${booking.guestDetails.phone}</strong> for any updates</li>
                            </ul>
                        </div>

                        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 0; color: #856404;">
                                💡 <strong>Tip:</strong> No payment is required at this time. We will confirm your booking before collecting payment.
                            </p>
                        </div>

                        <div style="text-align: center; padding: 10px;">
                            <p><strong>Check-in Time:</strong> 2:00 PM | <strong>Check-out Time:</strong> 12:00 PM</p>
                            <p>📍 123 Luxury Avenue, City Center</p>
                        </div>

                        <div style="text-align: center; margin-top: 20px;">
                            <p>For any questions, please contact us:</p>
                            <p>📞 +1 (555) 123-4567</p>
                            <p>✉️ info@raghavhotel.com</p>
                        </div>
                    </div>
                    <div class="footer">
                        <p>Thank you for choosing Raghav Hotel. We look forward to welcoming you!</p>
                        <p>${new Date().getFullYear()} Raghav Hotel. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    // Booking confirmed email template (when admin confirms)
    getBookingConfirmedEmailTemplate(booking) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #27ae60; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f9f9f9; }
                    .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; }
                    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
                    .status-confirmed { background: #27ae60; color: white; padding: 5px 15px; border-radius: 20px; display: inline-block; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🏨 Raghav Hotel</h1>
                        <h2>🎉 Booking Confirmed!</h2>
                    </div>
                    <div class="content">
                        <h3>Hello ${booking.guestDetails.firstName}!</h3>
                        <p>Great news! Your booking at Raghav Hotel has been <strong>CONFIRMED</strong>.</p>
                        <p>Status: <span class="status-confirmed">✅ CONFIRMED</span></p>

                        <div class="booking-details">
                            <h3>📋 Booking Details</h3>
                            <div class="detail-row">
                                <span><strong>Booking Reference:</strong></span>
                                <span>${booking.bookingReference}</span>
                            </div>
                            <div class="detail-row">
                                <span><strong>Check-in:</strong></span>
                                <span>${new Date(booking.checkIn).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            <div class="detail-row">
                                <span><strong>Check-out:</strong></span>
                                <span>${new Date(booking.checkOut).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            <div class="detail-row">
                                <span><strong>Room Type:</strong></span>
                                <span>${booking.roomType.toUpperCase()}</span>
                            </div>
                            <div class="detail-row">
                                <span><strong>Total Price:</strong></span>
                                <span><strong>$${booking.totalPrice}</strong></span>
                            </div>
                        </div>

                        <div style="text-align: center; margin: 20px 0;">
                            <p><strong>Check-in Time:</strong> 2:00 PM | <strong>Check-out Time:</strong> 12:00 PM</p>
                            <p>📍 123 Luxury Avenue, City Center</p>
                        </div>

                        <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p>📞 Need to make changes? Contact us at: +1 (555) 123-4567</p>
                        </div>
                    </div>
                    <div class="footer">
                        <p>We look forward to welcoming you to Raghav Hotel!</p>
                        <p>${new Date().getFullYear()} Raghav Hotel. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    // Status update email template
    getStatusUpdateEmailTemplate(booking, status, note) {
        const statusMessages = {
            'confirmed': '✅ Your booking has been confirmed!',
            'cancelled': '❌ Your booking has been cancelled.',
            'completed': '🏁 Your stay has been completed. Thank you!',
            'no-show': '⚠️ Your booking has been marked as no-show.'
        };

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f9f9f9; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🏨 Raghav Hotel</h1>
                        <h2>Booking Status Update</h2>
                    </div>
                    <div class="content">
                        <h3>Hello ${booking.guestDetails.firstName}!</h3>
                        <p>${statusMessages[status] || 'Your booking status has been updated'}</p>
                        <p><strong>Booking Reference:</strong> ${booking.bookingReference}</p>
                        <p><strong>New Status:</strong> ${status.toUpperCase()}</p>
                        ${note ? `<p><strong>Note:</strong> ${note}</p>` : ''}
                        <p>For more details, please log in to your account.</p>
                        <p>Thank you for choosing Raghav Hotel!</p>
                    </div>
                    <div class="footer">
                        <p>${new Date().getFullYear()} Raghav Hotel. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    // Booking cancelled email template
    getBookingCancelledEmailTemplate(booking, reason) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #e74c3c; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f9f9f9; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🏨 Raghav Hotel</h1>
                        <h2>❌ Booking Cancelled</h2>
                    </div>
                    <div class="content">
                        <h3>Hello ${booking.guestDetails.firstName},</h3>
                        <p>Your booking at Raghav Hotel has been cancelled.</p>
                        <p><strong>Booking Reference:</strong> ${booking.bookingReference}</p>
                        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
                        <p>If you have any questions, please contact us.</p>
                        <p>We hope to welcome you at Raghav Hotel in the future.</p>
                    </div>
                    <div class="footer">
                        <p>${new Date().getFullYear()} Raghav Hotel. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    // Booking reminder email template
    getBookingReminderEmailTemplate(booking) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f9f9f9; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🏨 Raghav Hotel</h1>
                        <h2>🔔 Reminder: Your Stay Starts Tomorrow!</h2>
                    </div>
                    <div class="content">
                        <h3>Hello ${booking.guestDetails.firstName}!</h3>
                        <p>This is a friendly reminder that your stay at Raghav Hotel starts <strong>tomorrow</strong>!</p>
                        <p><strong>Booking Reference:</strong> ${booking.bookingReference}</p>
                        <p><strong>Check-in Date:</strong> ${new Date(booking.checkIn).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p><strong>Check-in Time:</strong> 2:00 PM</p>
                        <p><strong>Room Type:</strong> ${booking.roomType.toUpperCase()}</p>
                        <p><strong>Location:</strong> 123 Luxury Avenue, City Center</p>
                        <p>We look forward to welcoming you!</p>
                    </div>
                    <div class="footer">
                        <p>${new Date().getFullYear()} Raghav Hotel. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    // Check-in email template
    getCheckInEmailTemplate(booking) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #27ae60; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f9f9f9; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🏨 Raghav Hotel</h1>
                        <h2>🏨 Welcome to Raghav Hotel!</h2>
                    </div>
                    <div class="content">
                        <h3>Welcome ${booking.guestDetails.firstName}!</h3>
                        <p>We're delighted to have you with us at Raghav Hotel.</p>
                        <p><strong>Booking Reference:</strong> ${booking.bookingReference}</p>
                        <p><strong>Room Type:</strong> ${booking.roomType.toUpperCase()}</p>
                        <p>If you need anything during your stay, please don't hesitate to contact our front desk.</p>
                        <p>We hope you have a wonderful stay!</p>
                    </div>
                    <div class="footer">
                        <p>${new Date().getFullYear()} Raghav Hotel. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    // Check-out email template
    getCheckOutEmailTemplate(booking) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f9f9f9; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🏨 Raghav Hotel</h1>
                        <h2>📤 Thank You for Staying With Us!</h2>
                    </div>
                    <div class="content">
                        <h3>Dear ${booking.guestDetails.firstName},</h3>
                        <p>Thank you for choosing Raghav Hotel for your stay.</p>
                        <p><strong>Booking Reference:</strong> ${booking.bookingReference}</p>
                        <p>We hope you enjoyed your time with us and look forward to welcoming you again in the future.</p>
                        <p>If you have any feedback, we'd love to hear from you!</p>
                        <p>📧 feedback@raghavhotel.com</p>
                    </div>
                    <div class="footer">
                        <p>${new Date().getFullYear()} Raghav Hotel. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    // Verification email template
    getVerificationEmailTemplate(user, verificationUrl) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f9f9f9; }
                    .btn { display: inline-block; background: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🏨 Raghav Hotel</h1>
                        <h2>Verify Your Email</h2>
                    </div>
                    <div class="content">
                        <h3>Hello ${user.firstName || 'User'},</h3>
                        <p>Thank you for registering with Raghav Hotel. Please verify your email address to complete your registration.</p>
                        <div style="text-align: center;">
                            <a href="${verificationUrl}" class="btn">✅ Verify Email</a>
                        </div>
                        <p>Or copy and paste this link in your browser:</p>
                        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
                        <p>This link will expire in 24 hours.</p>
                        <p>If you didn't create an account, please ignore this email.</p>
                    </div>
                    <div class="footer">
                        <p>${new Date().getFullYear()} Raghav Hotel. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    // Password reset email template
    getPasswordResetEmailTemplate(user, resetUrl) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f9f9f9; }
                    .btn { display: inline-block; background: #c0392b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🏨 Raghav Hotel</h1>
                        <h2>Reset Your Password</h2>
                    </div>
                    <div class="content">
                        <h3>Hello ${user.firstName || 'User'},</h3>
                        <p>We received a request to reset your password. Click the button below to create a new password.</p>
                        <div style="text-align: center;">
                            <a href="${resetUrl}" class="btn">🔑 Reset Password</a>
                        </div>
                        <p>Or copy and paste this link in your browser:</p>
                        <p><a href="${resetUrl}">${resetUrl}</a></p>
                        <p>This link will expire in 10 minutes.</p>
                        <p>If you didn't request a password reset, please ignore this email.</p>
                    </div>
                    <div class="footer">
                        <p>${new Date().getFullYear()} Raghav Hotel. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    // Welcome email template
    getWelcomeEmailTemplate(user) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #c0392b; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f9f9f9; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🏨 Raghav Hotel</h1>
                        <h2>Welcome Aboard!</h2>
                    </div>
                    <div class="content">
                        <h3>Hello ${user.firstName || 'User'},</h3>
                        <p>Welcome to Raghav Hotel! We're excited to have you as a member.</p>
                        <p>With your account you can:</p>
                        <ul>
                            <li>📅 Book rooms faster</li>
                            <li>⭐ Earn loyalty points</li>
                            <li>📋 View booking history</li>
                            <li>💎 Get exclusive offers</li>
                        </ul>
                        <p>Start exploring our luxury accommodations today!</p>
                        <div style="text-align: center;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="display: inline-block; background: #c0392b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
                                🏨 Book Now
                            </a>
                        </div>
                    </div>
                    <div class="footer">
                        <p>${new Date().getFullYear()} Raghav Hotel. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }
}

export default new EmailService();