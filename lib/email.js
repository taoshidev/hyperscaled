import nodemailer from "nodemailer";

let _transporter;

function getTransporter() {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      service: "Gmail",
      host: "smtp-relay.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: (process.env.SMTP_PASS || "").replace(/\s+/g, ""),
      },
    });
  }
  return _transporter;
}

export async function sendEmail({ from, to, subject, html }) {
  const transporter = getTransporter();
  return transporter.sendMail({
    from: from || `Hyperscaled <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}
