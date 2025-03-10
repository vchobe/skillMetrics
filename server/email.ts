import nodemailer from 'nodemailer';

// For production, use your real SMTP details
// For development, we'll use a console-based approach
const isDevelopment = process.env.NODE_ENV !== 'production';

// Create a transporter for sending emails
const transporter = isDevelopment
  ? {
      sendMail: async (mailOptions: any) => {
        console.log('------- EMAIL (DEVELOPMENT MODE) -------');
        console.log('To:', mailOptions.to);
        console.log('Subject:', mailOptions.subject);
        console.log('HTML Content:', mailOptions.html);
        console.log('----------------------------------------');
        return { messageId: `dev-${Date.now()}` };
      }
    }
  : nodemailer.createTransport({
      // Replace with your SMTP details in production
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      }
    });

export async function sendTemporaryPasswordEmail(email: string, tempPassword: string) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'skills@example.com',
      to: email,
      subject: 'Your Temporary Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #333;">Your Temporary Password</h2>
          <p>You have requested access to the Skills Tracking Platform.</p>
          <p>Here is your temporary password:</p>
          <div style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; margin: 15px 0; text-align: center; font-size: 18px; font-weight: bold;">
            ${tempPassword}
          </div>
          <p>Please log in and change your password as soon as possible for security reasons.</p>
          <p>This password will expire in 24 hours.</p>
          <p>If you didn't request this email, please ignore it.</p>
          <p style="margin-top: 20px; font-size: 12px; color: #777;">
            This is an automated message, please do not reply.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Temporary password email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export async function sendSkillUpdateNotification(email: string, skillName: string, newLevel: string) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'skills@example.com',
      to: email,
      subject: `Skill Update: ${skillName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #333;">Skill Update Notification</h2>
          <p>Your skill proficiency has been updated.</p>
          <div style="margin: 15px 0;">
            <p><strong>Skill:</strong> ${skillName}</p>
            <p><strong>New Level:</strong> ${newLevel}</p>
          </div>
          <p>You can view the details in your skills dashboard.</p>
          <p style="margin-top: 20px; font-size: 12px; color: #777;">
            This is an automated message, please do not reply.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Skill update notification email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export async function sendAdminNotification(adminEmail: string, subject: string, message: string) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'skills@example.com',
      to: adminEmail,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #333;">${subject}</h2>
          <div style="margin: 15px 0;">
            ${message}
          </div>
          <p style="margin-top: 20px; font-size: 12px; color: #777;">
            This is an automated message from the Skills Tracking Platform.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Admin notification email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending admin email:', error);
    return false;
  }
}