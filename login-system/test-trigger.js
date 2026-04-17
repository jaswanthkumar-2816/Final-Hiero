const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '.env') });

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function triggerTestReward(email) {
  console.log(`🚀 Starting unbreakable table-based reward trigger for: ${email}`);
  
  const rewardCode = `HIERO-FIXED-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const emailHtml = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: 'Inter', Helvetica, Arial, sans-serif; -webkit-text-size-adjust: none; margin: 0; padding: 0; }
  </style>
</head>
<body style="background-color: #f7f9fa; margin: 0; padding: 0;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f7f9fa; padding: 60px 0;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
          
          <!-- BRAND HEADER -->
          <tr>
            <td bgcolor="#000000" style="padding: 35px 50px; border-bottom: 2px solid #07e219;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td width="42">
                    <div style="background-color: #07e219; border-radius: 6px; width: 38px; height: 38px; text-align: center; color: #000000; font-size: 22px; font-weight: 900; line-height: 38px;">H</div>
                  </td>
                  <td style="padding-left: 15px;">
                    <div style="color: #ffffff; font-size: 19px; font-weight: 800; letter-spacing: 1.5px; line-height: 1;">HIERO</div>
                    <div style="color: #555555; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-top: 5px;">Career Assistant</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- HERO SECTION -->
          <tr>
            <td bgcolor="#000000" align="center" style="padding: 90px 50px;">
              <div style="font-size: 10px; font-weight: 700; color: #666666; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 25px;">Verified Milestone Unlock</div>
              <h1 style="color: #ffffff; font-size: 38px; font-weight: 900; margin: 0; line-height: 1.1; letter-spacing: -1px;">Your <span style="color: #07e219;">Premium Pass</span><br />is Secured.</h1>
              <div style="color: #777777; font-size: 16px; margin-top: 30px; font-weight: 400;">10/10 successfully confirmed referrals.</div>
            </td>
          </tr>

          <!-- MAIN BODY -->
          <tr>
            <td style="padding: 70px 50px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="font-size: 18px; font-weight: 400; color: #111111; padding-bottom: 20px;">Hello <b>Shaik Abdul Kalam</b>,</td>
                </tr>
                <tr>
                  <td style="font-size: 15px; line-height: 1.7; color: #666666; padding-bottom: 50px;">
                    Your commitment to the Hiero ecosystem has reached a major milestone. As one of our top referrers, we are officially granting you this exclusive Premium Pass.
                  </td>
                </tr>

                <!-- MILESTONE BOX -->
                <tr>
                  <td style="padding-bottom: 60px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fcfcfc; border: 1px solid #eeeeee; border-left: 5px solid #07e219; border-radius: 6px;">
                      <tr>
                        <td style="padding: 25px;">
                          <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td width="24" valign="top" style="color: #07e219; font-size: 20px; font-weight: 900; line-height: 1;">&checkmark;</td>
                              <td style="padding-left: 15px; color: #333333; font-size: 14px; line-height: 1.5;">
                                <b>Milestone Verified:</b> All 10 referrals have been analyzed and confirmed by our team as genuine and qualified.
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- REWARD PASS CARD -->
                <tr>
                  <td style="padding-bottom: 60px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#020202" style="border-radius: 20px; border: 1px solid #1a1a1a;">
                      <tr>
                        <td style="padding: 50px;">
                          <!-- Card Header -->
                          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 40px;">
                            <tr>
                              <td style="color: #444444; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 3px;">HIERO CORE &middot; 2026</td>
                              <td align="right" style="color: #07e219; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">
                                <table border="0" cellpadding="0" cellspacing="0" align="right">
                                  <tr>
                                    <td width="8" height="8" bgcolor="#07e219" style="border-radius: 50%;"></td>
                                    <td style="padding-left: 8px;">ACTIVE PASS</td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                          
                          <div style="color: #ffffff; font-size: 32px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 5px;">Premium Pass</div>
                          <div style="color: #666666; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 50px;">Verified Career Ambassador</div>

                          <!-- Card Data -->
                          <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td width="60%">
                                <div style="color: #555555; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px;">Authorization Key</div>
                                <div style="color: #07e219; font-family: 'Courier New', monospace; font-size: 17px; font-weight: 700;">${rewardCode}</div>
                              </td>
                              <td>
                                <div style="color: #555555; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px;">Pass Tier</div>
                                <div style="color: #ffffff; font-size: 15px; font-weight: 700;">Ambassador VIP</div>
                              </td>
                            </tr>
                            <tr>
                              <td colspan="2" style="padding-top: 50px;">
                                <div style="color: #555555; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 15px;">Secure Verification OTP</div>
                                <table border="0" cellpadding="0" cellspacing="12">
                                  <tr>
                                    ${otp.split('').map(digit => `
                                      <td width="42" height="55" bgcolor="#080808" align="center" style="border: 1px solid #222222; border-radius: 8px; color: #07e219; font-family: 'Courier New', monospace; font-size: 26px; font-weight: 800; line-height: 55px;">${digit}</td>
                                    `).join('')}
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>

                          <!-- Card Footer -->
                          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 50px; border-top: 1px solid #111111; padding-top: 30px;">
                            <tr>
                              <td style="color: #333333; font-size: 11px;">${email}</td>
                              <td align="right" style="color: #333333; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">ISSUE &middot; 2026</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- REDEMPTION PROTOCOL -->
                <tr>
                  <td style="padding: 50px; border: 1px solid #f0f0f0; border-radius: 12px;">
                    <div style="color: #111111; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 2.5px; margin-bottom: 25px;">Redemption Protocol</div>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr><td style="color: #666666; font-size: 14px; padding-bottom: 15px;">&bullet; Present this digital pass at the partner front desk</td></tr>
                      <tr><td style="color: #666666; font-size: 14px; padding-bottom: 15px;">&bullet; Provide the OTP only during the final verification</td></tr>
                      <tr><td style="color: #666666; font-size: 14px; padding-bottom: 15px;">&bullet; Each pass is unique and tied to your verified profile</td></tr>
                      <tr><td style="color: #666666; font-size: 14px;">&bullet; Auth Keys are for one-time use and non-transferable</td></tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA BUTTON -->
                <tr>
                  <td align="center" style="padding: 60px 0 40px 0;">
                    <a href="#" style="background-color: #000000; color: #ffffff !important; text-decoration: none; padding: 22px 55px; border-radius: 12px; font-weight: 800; font-size: 14px; display: inline-block; letter-spacing: 1.5px; text-transform: uppercase;">View Digital Pass</a>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td bgcolor="#000000" style="padding: 90px 40px; text-align: center;">
              <div style="color: #666666; font-weight: 800; font-size: 14px; letter-spacing: 2px; margin-bottom: 30px; text-transform: uppercase;">HIERO CAREER ASSISTANT</div>
              <div style="color: #444444; font-size: 11px; margin-bottom: 25px;">
                <a href="#" style="color: #444444; text-decoration: none;">Security</a> &nbsp;&middot;&nbsp; 
                <a href="#" style="color: #444444; text-decoration: none;">Privacy</a> &nbsp;&middot;&nbsp; 
                <a href="#" style="color: #444444; text-decoration: none;">Terms</a> &nbsp;&middot;&nbsp; 
                <a href="#" style="color: #444444; text-decoration: none;">Support</a>
              </div>
              <div style="color: #444444; font-size: 11px; line-height: 2; opacity: 0.8;">
                Authorized communication sent to ${email}<br />
                &copy; 2026 Hiero System. All rights reserved.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

  try {
    await transporter.sendMail({
      from: `"Hiero Career Assistant" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🏆 Your Premium Hiero Pass is Ready',
      html: emailHtml
    });
    console.log(`✅ Success! Unbreakable table-based test email sent to ${email}`);
    
    // Update users.json
    const usersFile = path.join(__dirname, 'users.json');
    if (fs.existsSync(usersFile)) {
        let users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
        let user = users.find(u => u.email === email);
        if (!user) {
            user = { id: 999, email, name: 'Shaik Abdul Kalam', referralCount: 10, rewards: [] };
            users.push(user);
        }
        user.rewards.push({ code: rewardCode, otp, isUsed: false, createdAt: new Date().toISOString() });
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    }

  } catch (error) {
    console.error('❌ Failed to send test email:', error.message);
  }
}

triggerTestReward('shaikabdulkalam078@gmail.com');
