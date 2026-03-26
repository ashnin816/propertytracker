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

export async function sendWelcomeEmail(to: string, name: string, tempPassword: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: "Welcome to PropertyTracker+",
    html: baseTemplate(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 8px;">Welcome, ${name}!</h2>
      <p style="color:#666;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Your account has been created. Use the credentials below to sign in. You'll be asked to set your own password on first login.
      </p>
      <div style="background:#f8f9fa;border-radius:12px;padding:20px;margin:0 0 24px;">
        <p style="margin:0 0 8px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Your login details</p>
        <p style="margin:0 0 4px;color:#1a1a1a;font-size:14px;"><strong>Email:</strong> ${to}</p>
        <p style="margin:0;color:#1a1a1a;font-size:14px;"><strong>Temporary Password:</strong> ${tempPassword}</p>
      </div>
      <a href="${APP_URL}" style="display:inline-block;background:#2563eb;color:white;text-decoration:none;padding:12px 32px;border-radius:10px;font-size:14px;font-weight:600;">
        Sign In
      </a>
    `),
  });
}

export async function sendPasswordResetEmail(to: string, name: string, tempPassword: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: "Your password has been reset — PropertyTracker+",
    html: baseTemplate(`
      <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 8px;">Password Reset</h2>
      <p style="color:#666;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Hi ${name}, your admin has reset your password. Use the temporary password below to sign in. You'll be asked to set a new password.
      </p>
      <div style="background:#f8f9fa;border-radius:12px;padding:20px;margin:0 0 24px;">
        <p style="margin:0 0 4px;color:#1a1a1a;font-size:14px;"><strong>Temporary Password:</strong> ${tempPassword}</p>
      </div>
      <a href="${APP_URL}" style="display:inline-block;background:#2563eb;color:white;text-decoration:none;padding:12px 32px;border-radius:10px;font-size:14px;font-weight:600;">
        Sign In
      </a>
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
      <a href="${APP_URL}" style="display:inline-block;background:#2563eb;color:white;text-decoration:none;padding:12px 32px;border-radius:10px;font-size:14px;font-weight:600;">
        Sign In
      </a>
    `),
  });
}
