const nodemailer = require("nodemailer");

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }

    async sendVerificationCode(email, code, username) {
        const mailOptions = {
            from: `"StreamVibe" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "🎬 Verify Your StreamVibe Account",
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">🎬 StreamVibe</h1>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${username}! 👋</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Thanks for signing up! To complete your registration, please use the verification code below:
            </p>
            
            <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; text-align: center; margin: 25px 0;">
              <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">Your verification code is:</p>
              <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; font-family: 'Courier New', monospace;">
                ${code}
              </div>
              <p style="color: #999; margin: 10px 0 0 0; font-size: 12px;">This code expires in 1 hour</p>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Enter this code in the verification form to activate your account and start discovering amazing movies! 🍿
            </p>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                <strong>⚠️ Security Note:</strong> Never share this code with anyone. StreamVibe will never ask for your verification code via phone or email.
              </p>
            </div>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              If you didn't create an account with StreamVibe, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p>© 2024 StreamVibe - Your Personal Movie Recommendation Engine</p>
          </div>
        </div>
      `,
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log(`Verification code sent to ${email}`);
        } catch (error) {
            console.error("Error sending verification code:", error);
            throw new Error("Failed to send verification code");
        }
    }

    async sendWelcomeEmail(email, username) {
        const mailOptions = {
            from: `"StreamVibe" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "🎉 Welcome to StreamVibe!",
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">🎬 StreamVibe</h1>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">Welcome to StreamVibe, ${username}! 🎉</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Your account has been successfully verified! You're now ready to discover your next favorite movie.
            </p>
            
            <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #2d5a2d; margin: 0 0 10px 0;">🚀 What's Next?</h3>
              <ul style="color: #666; margin: 0; padding-left: 20px;">
                <li>Set up your movie preferences</li>
                <li>Get personalized recommendations</li>
                <li>Create your watchlist</li>
                <li>Rate movies to improve suggestions</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Start Exploring Movies 🍿
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              Happy watching!<br>
              The StreamVibe Team
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p>© 2024 StreamVibe - Your Personal Movie Recommendation Engine</p>
          </div>
        </div>
      `,
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log(`Welcome email sent to ${email}`);
        } catch (error) {
            console.error("Error sending welcome email:", error);
            throw new Error("Failed to send welcome email");
        }
    }

    async sendPasswordResetCode(email, code, username) {
        const mailOptions = {
            from: `"StreamVibe" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "🔐 StreamVibe Password Reset Code",
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">🎬 StreamVibe</h1>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request 🔐</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Hi ${username}, we received a request to reset your StreamVibe password. Use the code below to reset it:
            </p>
            
            <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; text-align: center; margin: 25px 0;">
              <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">Your password reset code is:</p>
              <div style="font-size: 32px; font-weight: bold; color: #dc3545; letter-spacing: 5px; font-family: 'Courier New', monospace;">
                ${code}
              </div>
              <p style="color: #999; margin: 10px 0 0 0; font-size: 12px;">This code expires in 1 hour</p>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                <strong>⚠️ Security Note:</strong> If you didn't request this password reset, please ignore this email. Your account remains secure.
              </p>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              Enter this code along with your new password to complete the reset process.
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p>© 2024 StreamVibe - Your Personal Movie Recommendation Engine</p>
          </div>
        </div>
      `,
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log(`Password reset code sent to ${email}`);
        } catch (error) {
            console.error("Error sending password reset code:", error);
            throw new Error("Failed to send password reset code");
        }
    }
}

module.exports = new EmailService();