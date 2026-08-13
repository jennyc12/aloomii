export const NOTIFICATION_RECIPIENTS = [
  "yohann@aloomii.com",
  "jenny@aloomii.com",
];

export async function sendResendEmail(apiKey, { subject, html }) {
  return fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Aloomii Inbox <inbox@aloomii.com>",
      to: NOTIFICATION_RECIPIENTS,
      subject,
      html,
    }),
  });
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatEmailValue(value, fallback = "N/A") {
  const text = value || fallback;
  return escapeHtml(text).replace(/\r?\n/g, "<br>");
}

export function emailLink(email) {
  const safeEmail = escapeHtml(email);
  return `<a href="mailto:${safeEmail}">${safeEmail}</a>`;
}
