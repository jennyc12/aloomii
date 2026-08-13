export async function onRequestGet(context) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "https://aloomii.com",
    "Access-Control-Allow-Headers": "Authorization",
    "Vary": "Origin",
    "Content-Type": "application/json",
  };

  const expectedToken = context.env.ADMIN_INBOX_AUTH_TOKEN;
  if (!expectedToken) {
    return new Response(JSON.stringify({ error: "Admin inbox authentication is unconfigured" }), {
      status: 503,
      headers: corsHeaders,
    });
  }

  const authHeader = context.request.headers.get("Authorization") || "";
  const suppliedToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const encoder = new TextEncoder();
  const [expectedDigest, suppliedDigest] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(expectedToken)),
    crypto.subtle.digest("SHA-256", encoder.encode(suppliedToken)),
  ]);
  const expectedBytes = new Uint8Array(expectedDigest);
  const suppliedBytes = new Uint8Array(suppliedDigest);
  let mismatch = 0;
  for (let i = 0; i < expectedBytes.length; i++) {
    mismatch |= expectedBytes[i] ^ suppliedBytes[i];
  }

  if (mismatch !== 0) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  try {
    // List all entries from KV (access requests + consultation inquiries + newsletter)
    const prefixes = ["request_", "contact_", "newsletter_"];
    const requests = [];

    for (const prefix of prefixes) {
      const list = await context.env.ACCESS_REQUESTS.list({ prefix });
      for (const key of list.keys) {
        const value = await context.env.ACCESS_REQUESTS.get(key.name);
        if (value) {
          requests.push(JSON.parse(value));
        }
      }
    }

    // Sort by timestamp descending (newest first)
    requests.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return new Response(JSON.stringify({ success: true, requests, count: requests.length }), {
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
