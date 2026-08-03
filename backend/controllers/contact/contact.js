// controllers/contactController.js (Simplified - No Database)
import EmailService from '../utils/mail.js';

export const submitContact = async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        // Validate required fields
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and message are required'
            });
        }

        // Validate email format
        const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        // Prepare contact data for email
        const contactData = {
            name: name.trim(),
            email: email.toLowerCase().trim(),
            phone: phone ? phone.trim() : 'Not provided',
            subject: subject || 'General Question',
            message: message.trim(),
            createdAt: new Date()
        };

        console.log('📝 Contact Form Submission:', {
            name: contactData.name,
            email: contactData.email,
            subject: contactData.subject
        });

        // ✅ Send email to admin
        try {
            await EmailService.sendContactNotificationToAdmin(contactData);
            console.log('📧 Contact email sent to admin');
        } catch (emailError) {
            console.error('Failed to send email:', emailError);
            return res.status(500).json({
                success: false,
                message: 'Failed to send message. Please try again later.'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Your message has been sent successfully! We will get back to you soon.'
        });

    } catch (error) {
        console.error('❌ Contact submission error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to send message. Please try again.'
        });
    }
};