
const { Resend } = require("resend");

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is missing from .env");
}

const resend = new Resend(process.env.RESEND_API_KEY);

const sendVerificationEmail = async (email, verificationUrl) => {
  const { data, error } = await resend.emails.send({
    from: "JobNest <onboarding@resend.dev>",
    to: [email],
    subject: "Verify your JobNest email",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto; padding: 24px;">
        <h2>Welcome to JobNest!</h2>
        <p>Please verify your email address to activate your account.</p>
        <p>
          <a href="${verificationUrl}"
             style="display:inline-block;padding:12px 20px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;">
            Verify Email
          </a>
        </p>
        <p>If you did not create a JobNest account, you can ignore this email.</p>
        <p>This verification link will expire in 30 minutes.</p>
      </div>
    `,
  });

  if (error) {
    console.error("Resend email error:", error);
    throw new Error("Verification email could not be sent.");
  }

  return data;
};

module.exports = { sendVerificationEmail };
