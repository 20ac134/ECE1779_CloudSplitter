import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// If EMAIL_SERVICE=gmail then use Gmail, otherwise use custom SMTP (like Mailhog / other services)
const useGmail = process.env.EMAIL_SERVICE === 'gmail';

const transporter = useGmail
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: Number(process.env.SMTP_PORT || 25),
      secure: process.env.SMTP_SECURE === 'true', // Usually 587 corresponds to false, 465 corresponds to true
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            }
          : undefined, // Services like Mailhog may not require auth
    });

// Optional: Check if configuration is available on startup
transporter.verify().then(() => {
  console.log('[email] SMTP transporter is ready');
}).catch((err) => {
  console.error('[email] SMTP verify failed:', err.message);
});

/**
 * Send plain text email
 * @param {string} to Recipient email address
 * @param {string} subject Subject
 * @param {string} text Text content
 */
export async function sendMail(to, subject, text) {
  const from = process.env.MAIL_FROM || 'no-reply@cloudsplitter.local';

  const mailOptions = {
    from,
    to,
    subject,
    text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[email] sent:', info.messageId, '->', to);
  } catch (error) {
    console.error('[email] send failed:', error);
  }
}