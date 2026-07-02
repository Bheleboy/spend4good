/**
 * Spend4Good — Supabase Auth Email Templates
 * ------------------------------------------------------------
 * These are REFERENCE COPIES of the branded HTML you should paste
 * into the Supabase Dashboard under:
 *   Authentication → Email Templates
 *
 * For each template:
 *   1. Copy the HTML string below.
 *   2. Paste it into the corresponding template body in Supabase.
 *   3. Set the subject line as noted above each export.
 *
 * Supabase provides {{ .ConfirmationURL }} as the action link
 * variable in every template — do not change it.
 *
 * Design tokens (kept inline because email clients strip <style>):
 *   Background: #0a0a0a
 *   Card:       #111111
 *   Border:     #1f1f1f
 *   Text:       #f5f5f5
 *   Muted:      #888888
 *   Button:     #ffffff bg / #0a0a0a text
 *   Font:       system-ui, -apple-system, sans-serif
 */

const FOOTER = `
  <tr>
    <td style="padding:24px 32px 32px;border-top:1px solid #1f1f1f;color:#666666;font-size:12px;line-height:18px;text-align:center;">
      Spend4Good · <a href="https://spend4good.com" style="color:#888888;text-decoration:none;">spend4good.com</a> · noreply@spend4good.com
    </td>
  </tr>`

const LOGO = `
  <tr>
    <td style="padding:32px 32px 8px;">
      <div style="display:inline-block;width:36px;height:36px;background:#f5f5f5;color:#0a0a0a;font-weight:900;font-size:14px;border-radius:8px;text-align:center;line-height:36px;font-family:system-ui,-apple-system,sans-serif;">S4G</div>
    </td>
  </tr>`

function shell(innerHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#f5f5f5;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#111111;border:1px solid #1f1f1f;border-radius:16px;overflow:hidden;">
          ${LOGO}
          ${innerHtml}
          ${FOOTER}
        </table>
      </td></tr>
    </table>
  </body>
</html>`
}

function button(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;background:#ffffff;color:#0a0a0a;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;font-family:system-ui,-apple-system,sans-serif;">${label}</a>`
}

// ---------------------------------------------------------------
// SUBJECT: Confirm your Spend4Good account
// ---------------------------------------------------------------
export const EMAIL_CONFIRM_TEMPLATE = shell(`
  <tr><td style="padding:8px 32px 0;">
    <h1 style="margin:16px 0 8px;font-size:22px;font-weight:800;color:#f5f5f5;">Confirm your email</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:22px;color:#c5c5c5;">
      Welcome to Spend4Good. Confirm your email to activate your account and start tracking spend transparently.
    </p>
    <p style="margin:0 0 24px;">${button('Confirm my email', '{{ .ConfirmationURL }}')}</p>
    <p style="margin:0 0 8px;font-size:13px;line-height:20px;color:#888888;">
      This link expires in 24 hours. If you didn't create a Spend4Good account, you can safely ignore this email.
    </p>
  </td></tr>
`)

// ---------------------------------------------------------------
// SUBJECT: Reset your Spend4Good password
// ---------------------------------------------------------------
export const PASSWORD_RESET_TEMPLATE = shell(`
  <tr><td style="padding:8px 32px 0;">
    <h1 style="margin:16px 0 8px;font-size:22px;font-weight:800;color:#f5f5f5;">Reset your password</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:22px;color:#c5c5c5;">
      We received a request to reset the password for your Spend4Good account.
    </p>
    <p style="margin:0 0 24px;">${button('Reset my password', '{{ .ConfirmationURL }}')}</p>
    <p style="margin:0 0 8px;font-size:13px;line-height:20px;color:#888888;">
      This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email — your password won't change.
    </p>
  </td></tr>
`)

// ---------------------------------------------------------------
// SUBJECT: Your Spend4Good login link
// ---------------------------------------------------------------
export const MAGIC_LINK_TEMPLATE = shell(`
  <tr><td style="padding:8px 32px 0;">
    <h1 style="margin:16px 0 8px;font-size:22px;font-weight:800;color:#f5f5f5;">Sign in to Spend4Good</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:22px;color:#c5c5c5;">
      Click below to sign in — this link expires in 10 minutes.
    </p>
    <p style="margin:0 0 24px;">${button('Sign in to Spend4Good', '{{ .ConfirmationURL }}')}</p>
    <p style="margin:0 0 8px;font-size:13px;line-height:20px;color:#888888;">
      If you didn't request a login link, you can safely ignore this email.
    </p>
  </td></tr>
`)
