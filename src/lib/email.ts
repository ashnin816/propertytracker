import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "PropertyTracker+ <noreply@smarttimeplus.io>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://propertytracker.vercel.app";
const LOGO_URL = `${APP_URL}/icon.svg`;

function baseTemplate(content: string, accentColor = "#2563eb") {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f0f1f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="height:40px;font-size:0;line-height:0;">&nbsp;</div>

  <div style="max-width:520px;margin:0 auto;background:white;border-radius:20px;overflow:hidden;border:1px solid #e5e7eb;">

    <!-- Header -->
    <div style="background:${accentColor};padding:32px 40px;text-align:center;">
      <img src="${LOGO_URL}" width="48" height="48" alt="" style="display:inline-block;border-radius:12px;margin-bottom:12px;" />
      <div style="color:white;font-size:20px;font-weight:700;letter-spacing:-0.3px;">PropertyTracker+</div>
    </div>

    <!-- Body -->
    <div style="padding:40px;">
      ${content}
    </div>

    <!-- Footer -->
    <div style="padding:24px 40px;background:#fafafa;border-top:1px solid #f0f0f0;text-align:center;">
      <p style="color:#aaa;font-size:11px;margin:0 0 4px;letter-spacing:0.3px;text-transform:uppercase;">PropertyTracker+</p>
      <p style="color:#bbb;font-size:11px;margin:0;">AI-powered property document management</p>
    </div>
  </div>

  <div style="height:40px;font-size:0;line-height:0;">&nbsp;</div>
</body>
</html>`;
}

function button(href: string, label: string, bgColor = "#2563eb") {
  // Using table-based button for maximum email client compatibility
  return `
    <div style="text-align:center;margin:32px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
        <tr>
          <td style="background:${bgColor};border-radius:12px;">
            <a href="${href}" style="display:inline-block;color:white;text-decoration:none;padding:14px 40px;font-size:15px;font-weight:600;letter-spacing:-0.2px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
              ${label}
            </a>
          </td>
        </tr>
      </table>
    </div>`;
}

function divider() {
  return '<div style="border-top:1px solid #f0f0f0;margin:24px 0;"></div>';
}

export async function sendWelcomeEmail(to: string, name: string, setupToken: string) {
  const setupUrl = `${APP_URL}/setup?token=${setupToken}`;
  return resend.emails.send({
    from: FROM,
    to,
    subject: "Welcome to PropertyTracker+ — Set up your account",
    html: baseTemplate(`
      <h1 style="color:#1a1a1a;font-size:22px;font-weight:700;margin:0 0 12px;letter-spacing:-0.3px;">Welcome, ${name}!</h1>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 4px;">
        Your organization has invited you to PropertyTracker+, the AI-powered platform for managing property documents.
      </p>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0;">
        Click below to create your password and get started.
      </p>
      ${button(setupUrl, "Set Up Your Account")}
      ${divider()}
      <p style="color:#999;font-size:12px;line-height:1.6;margin:0;text-align:center;">
        This link expires in 7 days. If it doesn&rsquo;t work, ask your admin to resend the invite.
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
      <h1 style="color:#1a1a1a;font-size:22px;font-weight:700;margin:0 0 12px;letter-spacing:-0.3px;">Password Reset</h1>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0;">
        Hi ${name}, your admin has initiated a password reset for your account. Click below to set a new password.
      </p>
      ${button(setupUrl, "Set New Password")}
      ${divider()}
      <p style="color:#999;font-size:12px;line-height:1.6;margin:0;text-align:center;">
        This link expires in 7 days. If you didn&rsquo;t request this, you can safely ignore this email.
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
      <h1 style="color:#1a1a1a;font-size:22px;font-weight:700;margin:0 0 12px;letter-spacing:-0.3px;">Account Deactivated</h1>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 20px;">
        Hi ${name}, your PropertyTracker+ account has been deactivated by your organization admin. You will no longer be able to sign in.
      </p>
      <div style="background:#fef3f2;border-radius:12px;padding:16px 20px;border-left:4px solid #ef4444;">
        <p style="color:#991b1b;font-size:13px;margin:0;line-height:1.6;">
          If you believe this is a mistake, please reach out to your organization admin to have your access restored.
        </p>
      </div>
    `, "#ef4444"),
  });
}

export async function sendReactivatedEmail(to: string, name: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: "Your account has been reactivated — PropertyTracker+",
    html: baseTemplate(`
      <h1 style="color:#1a1a1a;font-size:22px;font-weight:700;margin:0 0 12px;letter-spacing:-0.3px;">Welcome Back, ${name}!</h1>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0;">
        Great news &mdash; your PropertyTracker+ account has been reactivated. You can sign in again with your existing credentials.
      </p>
      ${button(APP_URL, "Sign In to PropertyTracker+", "#16a34a")}
    `, "#16a34a"),
  });
}
