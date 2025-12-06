// // backend/src/email.js
// import nodemailer from 'nodemailer';
// import dotenv from 'dotenv';

// dotenv.config();

// // 如果 EMAIL_SERVICE=gmail 就走 Gmail，否则走自定义 SMTP (比如 Mailhog / 其他服务)
// const useGmail = process.env.EMAIL_SERVICE === 'gmail';

// const transporter = useGmail
//   ? nodemailer.createTransport({
//       service: 'gmail',
//       auth: {
//         user: process.env.SMTP_USER,
//         pass: process.env.SMTP_PASS,
//       },
//     })
//   : nodemailer.createTransport({
//       host: process.env.SMTP_HOST || 'localhost',
//       port: Number(process.env.SMTP_PORT || 25),
//       secure: process.env.SMTP_SECURE === 'true', // 一般 587 对应 false，465 对应 true
//       auth:
//         process.env.SMTP_USER && process.env.SMTP_PASS
//           ? {
//               user: process.env.SMTP_USER,
//               pass: process.env.SMTP_PASS,
//             }
//           : undefined, // 像 Mailhog 这种可以不需要 auth
//     });

// // 可选：启动时检查一下配置是否可用
// transporter.verify().then(() => {
//   console.log('[email] SMTP transporter is ready');
// }).catch((err) => {
//   console.error('[email] SMTP verify failed:', err.message);
// });

// /**
//  * 发送纯文本邮件
//  * @param {string} to 收件人邮箱
//  * @param {string} subject 标题
//  * @param {string} text 文本内容
//  */
// export async function sendMail(to, subject, text) {
//   const from = process.env.MAIL_FROM || 'no-reply@cloudsplitter.local';

//   const mailOptions = {
//     from,
//     to,
//     subject,
//     text,
//   };

//   try {
//     const info = await transporter.sendMail(mailOptions);
//     console.log('[email] sent:', info.messageId, '->', to);
//   } catch (error) {
//     console.error('[email] send failed:', error);
//   }
// }
// backend/src/email.js
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