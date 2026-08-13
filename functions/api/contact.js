import {
  emailLink,
  escapeHtml,
  formatEmailValue,
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
    const { name, email, company, service, budget, timeline, details } = await context.request.json();

    if (!name || !email) {
      return new Response(JSON.stringify({ error: "Name and email are required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Store inquiry in KV
    const timestamp = new Date().toISOString();
    const key = `contact_${timestamp}_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;

    await context.env.ACCESS_REQUESTS.put(key, JSON.stringify({
      name,
      email,
      company: company || "",
      service: service || "",
      budget: budget || "",
      timeline: timeline || "",
      details: details || "",
      timestamp,
      type: "consultation_request",
      status: "new"
    }));

    // Send email notification via Resend
    try {
      if (context.env.RESEND_API_KEY) {
        await sendResendEmail(context.env.RESEND_API_KEY, {
          subject: `New consultation request from ${name}${company ? ` (${company})` : ''}`,
          html: `
            <h2>New Consultation Request</h2>
            <p><strong>Name:</strong> ${escapeHtml(name)}</p>
            <p><strong>Email:</strong> ${emailLink(email)}</p>
            <p><strong>Company:</strong> ${formatEmailValue(company)}</p>
            <p><strong>Service Interest:</strong> ${formatEmailValue(service)}</p>
            <p><strong>Budget Range:</strong> ${formatEmailValue(budget)}</p>
            <p><strong>Timeline:</strong> ${formatEmailValue(timeline)}</p>
            <p><strong>Submitted:</strong> ${formatEmailValue(timestamp)}</p>
            <p><strong>Submission type:</strong> ${formatEmailValue("consultation_request")}</p>
            <p><strong>Status:</strong> ${formatEmailValue("new")}</p>
            <hr>
            <p><strong>Details:</strong><br>${formatEmailValue(details, "No details provided.")}</p>
            <hr>
            <p><a href="mailto:${escapeHtml(email)}">Reply to ${escapeHtml(name)}</a> &middot; <a href="https://aloomii.com/admin-inbox">View inbox</a></p>
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
