import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

console.log('Testing email connection...');
transporter.verify()
    .then(() => {
        console.log('✅ Email connected successfully!');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Email error:', err.message);
        process.exit(1);
    });
