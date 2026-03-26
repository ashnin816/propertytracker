import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "PropertyTracker+ <noreply@smarttimeplus.io>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://propertytracker.vercel.app";

function baseTemplate(content: string) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
    <div style="background:#2563eb;padding:24px 32px;">
      <span style="color:white;font-size:18px;font-weight:700;">PropertyTracker+</span>
    </div>
    <div style="padding:32px;">
      ${content}
    </div>
    <div style="padding:16px 32px;border-top:1px solid #f0f0f0;text-align:center;">
      <p style="color:#999;font-size:12px;margin:0;">PropertyTracker+ &middot; Property document management</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendWelcomeEmail(to: string, name: string, setupToken: string) {
  const setupUrl = `${APP_URL}/setup?token=${setupToken}`;
  return resend.emails.send({
    from: FROM,
    to,
    subject: "Welcome to PropertyTracker+ — Set up your account",
    html: baseTemplate(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 8px;">Welcome, ${name}!</h2>
      <p style="color:#666;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Your admin has created an account for you on PropertyTracker+. Click the button below to set your password and get started.
      </p>
      <a href="${setupUrl}" style="display:inline-block;background:#2563eb;color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:600;">
        Set Up Your Account
      </a>
      <p style="color:#999;font-size:12px;line-height:1.6;margin:24px 0 0;">
        This link expires in 7 days. If it doesn't work, ask your admin to resend the invite.
      </p>
    `),
  });
}

export async function sendPasswordResetEmail(to: string, name: string, setupToken: string) {
  const setupUrl = `${APP_URL}/setup?token=${setupToken}`;
  return resend.emails.send({
    from: FROM,
    to,
    subject: "Reset your password — PropertyTracker+",
    html: baseTemplate(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 8px;">Password Reset</h2>
      <p style="color:#666;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Hi ${name}, your admin has reset your password. Click the button below to set a new one.
      </p>
      <a href="${setupUrl}" style="display:inline-block;background:#2563eb;color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:600;">
        Set New Password
      </a>
      <p style="color:#999;font-size:12px;line-height:1.6;margin:24px 0 0;">
        This link expires in 7 days. If you didn't request this, contact your admin.
      </p>
    `),
  });
}

export async function sendDeactivatedEmail(to: string, name: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: "Your account has been deactivated — PropertyTracker+",
    html: baseTemplate(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 8px;">Account Deactivated</h2>
      <p style="color:#666;font-size:14px;line-height:1.6;margin:0 0 8px;">
        Hi ${name}, your PropertyTracker+ account has been deactivated by your organization admin.
      </p>
      <p style="color:#666;font-size:14px;line-height:1.6;margin:0;">
        If you believe this is a mistake, please contact your admin to restore access.
      </p>
    `),
  });
}

export async function sendReactivatedEmail(to: string, name: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: "Your account has been reactivated — PropertyTracker+",
    html: baseTemplate(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 8px;">Welcome Back, ${name}!</h2>
      <p style="color:#666;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Your PropertyTracker+ account has been reactivated. You can sign in again with your existing credentials.
      </p>
      <a href="${APP_URL}" style="display:inline-block;background:#2563eb;color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:600;">
        Sign In
      </a>
    `),
  });
}
