const nodemailer = require('nodemailer');

const createTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Fallback transport that logs emails to the console (useful for dev/demo)
  return nodemailer.createTransport({
    streamTransport: true,
    newline: 'unix',
    buffer: true,
  });
};

const transporter = createTransporter();

const sendPasswordResetEmail = async (to, resetUrl) => {
  const from = process.env.MAIL_FROM || 'Workout Planner <no-reply@workout-planner.com>';

  const message = {
    from,
    to,
    subject: 'Reset your Workout Planner password',
    text: `You requested a password reset for your Workout Planner account. Click the link below to set a new password:\n\n${resetUrl}\n\nIf you did not make this request you can safely ignore this email.`,
    html: `
      <p>You requested a password reset for your Workout Planner account.</p>
      <p><a href="${resetUrl}" target="_blank" rel="noopener noreferrer">Click here to set a new password.</a></p>
      <p>If you did not make this request you can safely ignore this email.</p>
    `,
  };

  const info = await transporter.sendMail(message);

  if (transporter.options?.streamTransport) {
    console.log('Password reset email (mock):\n', info.message.toString());
  }

  return info;
};

module.exports = { sendPasswordResetEmail };

