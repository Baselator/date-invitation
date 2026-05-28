const RESEND_API_URL = "https://api.resend.com/emails";
const DEFAULT_TO_EMAIL = "basel.260@gmail.com";
const DEFAULT_FROM_EMAIL = "Date Invitation <onboarding@resend.dev>";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

function clean(value) {
  return String(value || "").trim().slice(0, 500);
}

function escapeHtml(value) {
  return clean(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(value) {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  return date.toISOString();
}

export default async (req) => {
  if (req.method !== "POST") {
    return json({ ok: false, error: "Method not allowed" }, 405);
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body" }, 400);
  }

  const apiKey = Netlify.env.get("RESEND_API_KEY");
  if (!apiKey) {
    return json({ ok: false, error: "Missing RESEND_API_KEY" }, 500);
  }

  const answer = clean(payload.answer) || "yes";
  const activity = clean(payload.activity);
  const detail = clean(payload.detail);
  const timestamp = formatDate(payload.timestamp);
  const pagePath = clean(payload.pagePath);
  const userAgent = clean(payload.userAgent);

  if (!activity || !detail) {
    return json({ ok: false, error: "Missing activity or detail" }, 400);
  }

  const to = Netlify.env.get("DATE_RESPONSE_TO") || DEFAULT_TO_EMAIL;
  const from = Netlify.env.get("RESEND_FROM_EMAIL") || DEFAULT_FROM_EMAIL;
  const subject = `Date website response: ${activity} - ${detail}`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #221324;">
      <h1 style="margin: 0 0 16px;">She answered ${escapeHtml(answer)}</h1>
      <p><strong>Activity:</strong> ${escapeHtml(activity)}</p>
      <p><strong>Choice:</strong> ${escapeHtml(detail)}</p>
      <p><strong>Time:</strong> ${escapeHtml(timestamp)}</p>
      <p><strong>Page:</strong> ${escapeHtml(pagePath)}</p>
      <p style="color: #6f5d72;"><strong>User agent:</strong> ${escapeHtml(userAgent)}</p>
    </div>
  `;
  const text = [
    `She answered ${answer}`,
    `Activity: ${activity}`,
    `Choice: ${detail}`,
    `Time: ${timestamp}`,
    `Page: ${pagePath}`,
    `User agent: ${userAgent}`
  ].join("\n");

  const resendResponse = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      text
    })
  });

  if (!resendResponse.ok) {
    const errorText = await resendResponse.text();
    console.error("Resend send failed", errorText);
    return json({ ok: false, error: "Resend send failed" }, 502);
  }

  return json({ ok: true });
};

export const config = {
  path: "/api/send-response",
  method: ["POST"]
};
