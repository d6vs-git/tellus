import nodemailer from 'nodemailer';

interface EmailAttachment {
  filename: string;
  content: Buffer;
}

export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  attachments: EmailAttachment[] = []
) {
  // Create transporter using Gmail service
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SENDER_EMAIL,
      pass: process.env.SENDER_PASS,
    },
  });

  // Send email
  await transporter.sendMail({
    from: process.env.SENDER_EMAIL || 'noreply@feedback-analytics.com',
    to,
    subject,
    text,
    html: `<div>${text.replace(/\n/g, '<br>')}</div>`,
    attachments,
  });
}