import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import config from '../config/config.js';

const OAuth2 = google.auth.OAuth2;

const createTransporter = async () => {
  const oauth2Client = new OAuth2(
    config.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
    config.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );

  oauth2Client.setCredentials({
    refresh_token: config.GOOGLE_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN,
  });

  const accessToken = await new Promise((resolve, reject) => {
    oauth2Client.getAccessToken((err, token) => {
      if (err) {
        reject('Failed to create access token: ' + err);
      }
      resolve(token);
    });
  });

  const senderEmail = config.GOOGLE_USER || process.env.EMAIL_USER;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: senderEmail,
      accessToken,
      clientId: config.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: config.GOOGLE_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN,
    },
  });

  return transporter;
};

async function sendEmail(to, subject, text, html) {
  try {
    const senderEmail = config.GOOGLE_USER || process.env.EMAIL_USER;
    const transporter = await createTransporter();
    const mailOptions = {
      from: senderEmail,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

export default sendEmail;
