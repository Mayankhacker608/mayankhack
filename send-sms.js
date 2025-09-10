// api/send-sms.js
// Vercel serverless function to send SMS via Twilio
import Twilio from "twilio";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Basic validation
  const { contacts, message } = req.body || {};
  if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
    return res.status(400).json({ error: "contacts (array) required" });
  }
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "message required" });
  }

  // Load secrets from env (set these in Vercel dashboard)
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER; // must be a Twilio number

  if (!accountSid || !authToken || !fromNumber) {
    return res.status(500).json({ error: "SMS provider not configured" });
  }

  const client = Twilio(accountSid, authToken);

  try {
    const results = [];
    for (const to of contacts) {
      // sanitize / validate phone number as needed
      const sendRes = await client.messages.create({
        body: message,
        from: fromNumber,
        to: to,
      });
      results.push({ to, sid: sendRes.sid, status: sendRes.status });
    }
    return res.status(200).json({ ok: true, results });
  } catch (err) {
    console.error("Twilio send error:", err);
    return res.status(500).json({ error: "Failed to send SMS", details: err.message });
  }
}
