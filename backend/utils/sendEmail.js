import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_Casbmqsi_JMNKRFSq6gX6c7jRc3bHNF5n');

const escapeHtml = (unsafe) =>
  unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const result = await resend.emails.send({
      from: 'Capsandpills <onboarding@resend.dev>',
      to: Array.isArray(to) ? to : [to],
      subject,
      text,
      html,
    });
    if (result.error) {
      console.error('[Email] Resend error:', result.error.message || result.error, 'to:', to);
      return null;
    }
    console.log('[Email] Sent:', result.data?.id, 'to:', to);
    return result;
  } catch (error) {
    console.error('[Email] Failed to send to', to, ':', error.message);
    return null;
  }
};

export const getWelcomeEmailTemplate = (name) => {
  const safeName = escapeHtml(name);
  return `
  <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px;">
    <h2 style="color:#1a4d3a;">Welcome to Capsandpills, ${safeName}!</h2>
    <p>Thank you for joining us. Start exploring genuine medicines and healthcare products.</p>
    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="display:inline-block;padding:12px 24px;background:#1a4d3a;color:#fff;text-decoration:none;border-radius:8px;margin-top:16px;">Shop Now</a>
  </div>
`;
};

export const getOrderConfirmationTemplate = (order) => {
  const safeId = escapeHtml(String(order._id));
  const safeTotal = escapeHtml(String(order.totalPrice));
  const safeStatus = escapeHtml(String(order.status));
  return `
  <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px;">
    <h2 style="color:#1a4d3a;">Order Confirmed!</h2>
    <p>Your order has been placed successfully.</p>
    <p><strong>Order ID:</strong> ${safeId}</p>
    <p><strong>Total:</strong> ₱${safeTotal}</p>
    <p><strong>Status:</strong> ${safeStatus}</p>
  </div>
`;
};

export const getPasswordResetTemplate = (resetUrl) => {
  const safeUrl = escapeHtml(resetUrl);
  return `
  <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;">
    <div style="text-align:center;margin-bottom:24px;">
      <h2 style="color:#1a4d3a;margin:0;">Password Reset Request</h2>
    </div>
    <p style="color:#374151;font-size:16px;line-height:24px;">You requested a password reset for your Capsandpills account. Click the button below to reset your password:</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${safeUrl}" style="display:inline-block;padding:14px 32px;background:#1a4d3a;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">Reset Password</a>
    </div>
    <p style="color:#6b7280;font-size:14px;line-height:20px;">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="color:#374151;font-size:13px;word-break:break-all;background:#f3f4f6;padding:12px;border-radius:6px;">${safeUrl}</p>
    <p style="color:#9ca3af;font-size:13px;margin-top:20px;">This link expires in 30 minutes. If you didn't request this, please ignore this email.</p>
  </div>
`;
};
