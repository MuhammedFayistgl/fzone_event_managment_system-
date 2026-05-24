import { getOrgSettings } from "./appSettings.js";
import { logAuditAction } from "./auditLog.js";

async function sendEmail({ to, subject, text }) {
  const settings = await getOrgSettings();
  const n = settings.notifications || {};

  if (!n.emailEnabled || !n.smtpHost || !n.smtpFrom) {
    console.log(`[notify:email:skipped] ${subject} → ${to}`);
    return { sent: false, reason: "email_not_configured" };
  }

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({
      host: n.smtpHost,
      port: Number(n.smtpPort) || 587,
      secure: Number(n.smtpPort) === 465,
      auth: n.smtpUser ? { user: n.smtpUser, pass: n.smtpPass } : undefined,
    });

    await transporter.sendMail({
      from: n.smtpFrom,
      to,
      subject,
      text,
    });

    return { sent: true };
  } catch (err) {
    console.error("NOTIFY_EMAIL_ERROR:", err.message);
    return { sent: false, reason: err.message };
  }
}

async function sendSms({ to, text }) {
  const settings = await getOrgSettings();
  const n = settings.notifications || {};

  if (!n.smsEnabled || !n.twilioAccountSid || !n.twilioAuthToken || !n.twilioFromNumber) {
    console.log(`[notify:sms:skipped] → ${to}`);
    return { sent: false, reason: "sms_not_configured" };
  }

  try {
    const auth = Buffer.from(`${n.twilioAccountSid}:${n.twilioAuthToken}`).toString("base64");
    const body = new URLSearchParams({ To: to, From: n.twilioFromNumber, Body: text });
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${n.twilioAccountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || "Twilio request failed");
    }

    return { sent: true };
  } catch (err) {
    console.error("NOTIFY_SMS_ERROR:", err.message);
    return { sent: false, reason: err.message };
  }
}

export async function notifyUser({
  phone = "",
  email = "",
  eventTitle = "",
  template = "generic",
  message = "",
  metadata = {},
}) {
  const subjectMap = {
    payment_success: `Payment confirmed — ${eventTitle}`,
    refund_processed: `Refund update — ${eventTitle}`,
    pass_ready: `Your entry pass is ready — ${eventTitle}`,
    generic: `FZone notification — ${eventTitle}`,
  };

  const subject = subjectMap[template] || subjectMap.generic;
  const text = message || subject;

  const results = {
    email: email ? await sendEmail({ to: email, subject, text }) : { sent: false },
    sms: phone ? await sendSms({ to: phone, text }) : { sent: false },
  };

  await logAuditAction({
    action: `notification:${template}`,
    category: "payment",
    phone,
    metadata: { ...metadata, template, results },
  });

  return results;
}
