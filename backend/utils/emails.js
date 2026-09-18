const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.resend.com',
  port: process.env.SMTP_PORT || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER, // 'resend'
    pass: process.env.SMTP_PASS, // Resend veya SMTP API şifren
  },
});

async function sendPasswordResetEmail(toEmail, resetCode) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Panovio" <noreply@panovio.com>',
    to: toEmail,
    subject: 'Şifre Sıfırlama Doğrulama Kodunuz',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 30px; background: #080d1a; color: #f8fafc; border-radius: 16px; max-width: 480px; margin: auto; border: 1px solid #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #38bdf8; margin: 0; font-size: 22px; font-weight: 800;">Panovio</h2>
        </div>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
          Hesabınız için bir şifre sıfırlama talebinde bulundunuz. Aşağıdaki 6 haneli doğrulama kodunu ilgili alana girin:
        </p>
        <div style="background: #152033; border: 1.5px solid #233147; padding: 16px; font-size: 28px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; text-align: center; border-radius: 12px; margin: 20px 0;">
          ${resetCode}
        </div>
        <p style="font-size: 12px; color: #64748b; margin-top: 24px; text-align: center;">
          Bu kod 3 dakika süreyle geçerlidir. Talebi siz yapmadıysanız bu e-sayfayı güvenle görmezden gelebilirsiniz.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✓ E-posta başarıyla gönderildi: ${toEmail}`);
  } catch (error) {
    console.error('E-posta gönderim hatası:', error);
    throw new Error('E-posta gönderilemedi.');
  }
}

module.exports = { sendPasswordResetEmail };