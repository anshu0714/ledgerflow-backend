const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.USER_EMAIL,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.log("Error connecting to email server: ", error);
  } else {
    console.log("Email server is ready!", success);
  }
});

async function sendEmail(to, subject, text, html) {
  try {
    const info = await transporter.sendMail({
      from: `"Ledgerflow" <${process.env.USER_EMAIL}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.log("Error sending email", error);
  }
}

// Registration Email
async function userRegistrationEmail(userName, email) {
  const subject = "Your Ledgerflow Account Has Been Successfully Registered";
  const text = `Hi ${userName},

Welcome to Ledgerflow!

Your account has been successfully created. You can now log in and manage your account securely.

If you did not create this account, please contact our support team immediately.

Thank you for choosing Ledgerflow.

Best regards,
Ledgerflow Team`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Welcome to Ledgerflow</title></head>
<body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color:#f4f6f8;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table width="600" cellpadding="20" cellspacing="0" style="background:#ffffff; margin-top:40px; border-radius:8px;">
          <tr>
            <td align="center" style="background:#1e3a8a; color:#ffffff; border-radius:8px 8px 0 0;">
              <h2>Welcome to Ledgerflow 🎉</h2>
            </td>
          </tr>
          <tr>
            <td style="color:#333333;">
              <p>Hi <strong>${userName}</strong>,</p>
              <p>Your account has been successfully created.</p>
              <p>You can now securely log in and manage your banking services with confidence.</p>
              <p>If you did not create this account, please contact our support team immediately.</p>
              <p>Thank you for choosing <strong>Ledgerflow</strong>.</p>
              <p>Best regards,<br/><strong>Ledgerflow Team</strong></p>
            </td>
          </tr>
          <tr>
            <td align="center" style="font-size:12px; color:#888888; padding-top:20px;">
              © 2026 Ledgerflow. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await sendEmail(email, subject, text, html);
}

// Transaction Success Email
async function transactionSuccessEmail(
  userName,
  email,
  amount,
  fromAccountId,
  toAccountId,
) {
  const subject = "🎉 Transaction Successful - Ledgerflow";

  const text = `Hi ${userName},

Your transaction of ₹${amount} has been successfully processed.

From Account: ${fromAccountId}
To Account: ${toAccountId}

Thank you for using Ledgerflow for your secure banking needs.

Best regards,
Ledgerflow Team`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Transaction Successful - Ledgerflow</title></head>
<body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color:#f4f6f8;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table width="600" cellpadding="20" cellspacing="0" style="background:#ffffff; margin-top:40px; border-radius:8px;">
          <tr>
            <td align="center" style="background:#1e3a8a; color:#ffffff; border-radius:8px 8px 0 0;">
              <h2>Transaction Successful ✅</h2>
            </td>
          </tr>
          <tr>
            <td style="color:#333333;">
              <p>Hi <strong>${userName}</strong>,</p>
              <p>Your transaction has been successfully completed.</p>
              <ul>
                <li><strong>Amount:</strong> ₹${amount}</li>
                <li><strong>From Account:</strong> ${fromAccountId}</li>
                <li><strong>To Account:</strong> ${toAccountId}</li>
              </ul>
              <p>If you did not authorize this transaction, please contact our support team immediately.</p>
              <p>Thank you for trusting <strong>Ledgerflow</strong>.</p>
              <p>Best regards,<br/><strong>Ledgerflow Team</strong></p>
            </td>
          </tr>
          <tr>
            <td align="center" style="font-size:12px; color:#888888; padding-top:20px;">
              © 2026 Ledgerflow. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await sendEmail(email, subject, text, html);
}

// Transaction Failure Email
async function transactionFailureEmail(
  userName,
  email,
  amount,
  fromAccountId,
  toAccountId,
  reason,
) {
  const subject = "⚠️ Transaction Failed - Ledgerflow";

  const text = `Hi ${userName},

Your transaction of ₹${amount} could not be completed.

From Account: ${fromAccountId}
To Account: ${toAccountId}

Reason: ${reason}

Please try again or contact our support team if the problem persists.

Best regards,
Ledgerflow Team`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Transaction Failed - Ledgerflow</title></head>
<body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color:#f4f6f8;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table width="600" cellpadding="20" cellspacing="0" style="background:#ffffff; margin-top:40px; border-radius:8px;">
          <tr>
            <td align="center" style="background:#1e3a8a; color:#ffffff; border-radius:8px 8px 0 0;">
              <h2>Transaction Failed ⚠️</h2>
            </td>
          </tr>
          <tr>
            <td style="color:#333333;">
              <p>Hi <strong>${userName}</strong>,</p>
              <p>Your transaction could not be completed.</p>
              <ul>
                <li><strong>Amount:</strong> ₹${amount}</li>
                <li><strong>From Account:</strong> ${fromAccountId}</li>
                <li><strong>To Account:</strong> ${toAccountId}</li>
                <li><strong>Reason:</strong> ${reason}</li>
              </ul>
              <p>Please try again or contact our support team if the problem persists.</p>
              <p>Thank you for trusting <strong>Ledgerflow</strong>.</p>
              <p>Best regards,<br/><strong>Ledgerflow Team</strong></p>
            </td>
          </tr>
          <tr>
            <td align="center" style="font-size:12px; color:#888888; padding-top:20px;">
              © 2026 Ledgerflow. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await sendEmail(email, subject, text, html);
}

module.exports = {
  userRegistrationEmail,
  transactionSuccessEmail,
  transactionFailureEmail,
};
