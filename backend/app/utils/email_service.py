import os
import smtplib
import secrets
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings

def generate_otp() -> str:
    """Generate a cryptographically secure 6-digit numeric OTP."""
    return f"{secrets.randbelow(900000) + 100000:06d}"

def send_email_otp(to_email: str, otp: str, purpose: str = "Registration") -> bool:
    """
    Send a 6-digit OTP code to the recipient's Gmail / College email.
    Supports both Gmail SMTP delivery and robust logging fallback for offline / test environments.
    """
    to_email_clean = to_email.strip().lower()
    subject = f"Smart Department Verification Code: {otp}"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>{subject}</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px;">
      <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06);">
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 24px 28px; text-align: center; color: #ffffff;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">Smart Department Academic Portal</h2>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #bfdbfe;">Department of Computer Science & Engineering</p>
        </div>
        
        <div style="padding: 28px; color: #1e293b;">
          <h3 style="margin: 0 0 12px 0; font-size: 17px; color: #0f172a;">{purpose} Verification</h3>
          <p style="margin: 0 0 18px 0; font-size: 14px; line-height: 1.5; color: #475569;">
            Your one-time authentication code for the Smart Department portal is:
          </p>
          
          <div style="text-align: center; margin: 24px 0;">
            <div style="display: inline-block; padding: 14px 28px; background: #eff6ff; border: 2px solid #2563eb; border-radius: 10px; font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 0.35em; color: #1e3a8a;">
              {otp}
            </div>
          </div>
          
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;">
            ⏱️ <strong>This OTP is valid for 5 minutes.</strong> It can only be used once.
          </p>
          <p style="margin: 0; font-size: 12px; color: #94a3b8;">
            If you did not request this verification, please ignore this email or contact your Department Administrator.
          </p>
        </div>
        
        <div style="background: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
          Maharaja Institute of Technology Thandavapura &copy; 2026
        </div>
      </div>
    </body>
    </html>
    """

    text_content = (
        f"Smart Department Verification\n\n"
        f"Your 6-digit OTP code for {purpose} is: {otp}\n\n"
        f"This code will expire in 5 minutes.\n"
        f"Do not share this code with anyone.\n"
    )

    # Check for SMTP credentials in environment or config
    smtp_user = os.environ.get("SMTP_USERNAME") or getattr(settings, "SMTP_USERNAME", "")
    smtp_pass = os.environ.get("SMTP_PASSWORD") or getattr(settings, "SMTP_PASSWORD", "")
    smtp_server = os.environ.get("SMTP_SERVER") or getattr(settings, "SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.environ.get("SMTP_PORT") or getattr(settings, "SMTP_PORT", 587))
    smtp_from = os.environ.get("SMTP_FROM_EMAIL") or getattr(settings, "SMTP_FROM_EMAIL", smtp_user or "noreply.smartdept@gmail.com")

    if smtp_user and smtp_pass:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"Smart Department <{smtp_from}>"
            msg["To"] = to_email_clean

            msg.attach(MIMEText(text_content, "plain"))
            msg.attach(MIMEText(html_content, "html"))

            with smtplib.SMTP(smtp_server, smtp_port, timeout=10) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_from, [to_email_clean], msg.as_string())
            print(f"[SMTP EMAIL SENT] Dispatched OTP {otp} to {to_email_clean}")
            return True
        except Exception as e:
            print(f"[SMTP WARNING] Failed to deliver email via SMTP: {e}. Falling back to server console log.")

    # Logging fallback for offline / test environments
    print(f"\n{'='*60}")
    print(f"[*] GMAIL OTP DISPATCH: To='{to_email_clean}' | Purpose='{purpose}' | OTP='{otp}' (Expires in 5 mins)")
    print(f"{'='*60}\n")
    return True
