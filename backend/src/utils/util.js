import crypto from 'crypto';

export function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

export function getOtpHtml(otp) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #333;">Email Verification</h2>
      <p style="color: #555;">Please use the following OTP code to verify your email address. This code is valid for 5 minutes:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0070f3; padding: 10px 20px; background: #f5f8ff; border-radius: 6px; border: 1px solid #d0e1fd;">${otp}</span>
      </div>
      <p style="color: #888; font-size: 12px;">If you did not request this, please ignore this email.</p>
    </div>
  `;
}
