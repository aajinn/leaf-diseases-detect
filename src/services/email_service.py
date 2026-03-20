"""
Email Service for Password Reset
"""
import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.from_email = os.getenv("FROM_EMAIL")
        self.app_url = os.getenv("APP_URL", "http://localhost:8000")
        
    def send_password_reset_email(self, to_email: str, reset_token: str, username: str) -> bool:
        """Send password reset email"""
        try:
            if not all([self.smtp_username, self.smtp_password, self.from_email]):
                logger.error("❌ Email configuration missing in .env file")
                logger.error("Required: SMTP_USERNAME, SMTP_PASSWORD, FROM_EMAIL")
                return False
            
            reset_link = f"{self.app_url}/reset-password?token={reset_token}"
            
            logger.info(f"📧 Attempting to send email to {to_email}")
            logger.info(f"📧 SMTP Server: {self.smtp_server}:{self.smtp_port}")
            logger.info(f"📧 From: {self.from_email}")
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = 'Password Reset - Leaf Disease Detection'
            msg['From'] = self.from_email
            msg['To'] = to_email
            
            # HTML email body
            html = f"""
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1 style="color: white; margin: 0;">🌿 Leaf Disease Detection</h1>
                        </div>
                        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                            <h2 style="color: #10b981;">Password Reset Request</h2>
                            <p>Hello <strong>{username}</strong>,</p>
                            <p>We received a request to reset your password. Click the button below to create a new password:</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="{reset_link}" 
                                   style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                                    Reset Password
                                </a>
                            </div>
                            <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
                            <p style="background: #fff; padding: 10px; border: 1px solid #ddd; border-radius: 5px; word-break: break-all; font-size: 12px;">
                                {reset_link}
                            </p>
                            <p style="color: #666; font-size: 14px; margin-top: 30px;">
                                <strong>Note:</strong> This link will expire in 1 hour for security reasons.
                            </p>
                            <p style="color: #666; font-size: 14px;">
                                If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
                            </p>
                            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                            <p style="color: #999; font-size: 12px; text-align: center;">
                                © 2025 Leaf Disease Detection. All rights reserved.
                            </p>
                        </div>
                    </div>
                </body>
            </html>
            """
            
            # Plain text version
            text = f"""
            Leaf Disease Detection - Password Reset
            
            Hello {username},
            
            We received a request to reset your password. Click the link below to create a new password:
            
            {reset_link}
            
            This link will expire in 1 hour for security reasons.
            
            If you didn't request this password reset, please ignore this email.
            
            © 2025 Leaf Disease Detection
            """
            
            part1 = MIMEText(text, 'plain')
            part2 = MIMEText(html, 'html')
            
            msg.attach(part1)
            msg.attach(part2)
            
            # Send email
            logger.info(f"📧 Connecting to SMTP server...")
            with smtplib.SMTP(self.smtp_server, self.smtp_port, timeout=10) as server:
                server.set_debuglevel(1)  # Enable debug output
                logger.info(f"📧 Starting TLS...")
                server.starttls()
                logger.info(f"📧 Logging in...")
                server.login(self.smtp_username, self.smtp_password)
                logger.info(f"📧 Sending message...")
                server.send_message(msg)
            
            logger.info(f"✅ Password reset email sent to {to_email}")
            return True
            
        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"❌ SMTP Authentication failed: {str(e)}")
            logger.error("💡 For Gmail, you need to:")
            logger.error("   1. Enable 2-Step Verification")
            logger.error("   2. Generate an App Password at: https://myaccount.google.com/apppasswords")
            logger.error("   3. Use the App Password in SMTP_PASSWORD (not your regular password)")
            return False
        except smtplib.SMTPException as e:
            logger.error(f"❌ SMTP error: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"❌ Failed to send password reset email: {str(e)}")
            logger.error(f"❌ Error type: {type(e).__name__}")
            import traceback
            logger.error(traceback.format_exc())
            return False

email_service = EmailService()
