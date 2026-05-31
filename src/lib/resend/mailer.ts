import { Resend } from 'resend';
import { env } from '@/config/env';

export const resend = new Resend(env.RESEND_API_KEY);

export const sendVerificationEmail = async (to: string, token: string) => {
  const verifyLink = `${env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;
  
  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject: 'Verify your email address for Whispr',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #FB2BB6;">Welcome to Whispr!</h1>
          <p>Please verify your email address by clicking the button below:</p>
          <a href="${verifyLink}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #FB2BB6, #D210FA, #3E36FA, #01D7F7); color: white; text-decoration: none; border-radius: 9999px; font-weight: bold; margin-top: 20px;">Verify Email</a>
          <p style="margin-top: 30px; font-size: 12px; color: #9CA3AF;">If you did not request this, please ignore this email. This link expires in 15 minutes.</p>
        </div>
      `,
    });
    
    if (error) {
      console.error('Failed to send verification email:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error sending email:', err);
    return false;
  }
};
