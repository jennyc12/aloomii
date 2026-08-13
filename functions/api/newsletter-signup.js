import {
  emailLink,
  formatEmailValue,
  YOHANN_RECIPIENTS,
  sendResendEmail,
} from "../lib/notifications.js";

export async function onRequestPost(context) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  try {
    const { email } = await context.request.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Store in KV
    const timestamp = new Date().toISOString();
    const key = `newsletter_${timestamp}_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;

    await context.env.ACCESS_REQUESTS.put(key, JSON.stringify({
      email,
      timestamp,
      type: "newsletter",
      status: "subscribed"
    }));

    // Send email notification via Resend
    try {
      if (context.env.RESEND_API_KEY) {
        await sendResendEmail(context.env.RESEND_API_KEY, {
          to: YOHANN_RECIPIENTS,
          subject: `New newsletter signup: ${email}`,
          html: `
            <h2>New Newsletter Signup</h2>
            <p><strong>Email:</strong> ${emailLink(email)}</p>
            <p><strong>Submitted:</strong> ${formatEmailValue(timestamp)}</p>
            <p><strong>Submission type:</strong> ${formatEmailValue("newsletter")}</p>
            <p><strong>Status:</strong> ${formatEmailValue("subscribed")}</p>
            <hr>
            <p><a href="https://aloomii.com/admin-inbox">View inbox</a></p>
          `,
        });
      }
    } catch (emailErr) {
      console.log("Resend notification failed:", emailErr.message);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
