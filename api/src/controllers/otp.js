const OTP = require("../models/otp");
const sendEmail = require("../utils/email/sendEmail");

exports.generateOtp = async (req, res) => {
  try {
    const { userId, email, sessionId, otp } = req.body;

    // Validate input
    if (!userId || !email || !sessionId || !otp) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Set expiry time (e.g., 5 minutes from now)
    const expiryTime = new Date(Date.now() + 5 * 60 * 1000);

    // Create and save the OTP
    const newOtp = new OTP({
      userId,
      otp,
      email,
      sessionId,
      expiryTime,
    });

    await newOtp.save();

    // HTML email content with CSS
    const emailContent = `
         <html>
         <head>
         <meta http-equiv="Content-type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="format-detection" content="date=no" />
    <meta name="format-detection" content="address=no" />
    <meta name="format-detection" content="telephone=no" />
    <meta name="x-apple-disable-message-reformatting" />
        <link href="https://fonts.googleapis.com/css?family=PT+Sans:400,400i,700,700i&display=swap" rel="stylesheet" />
<title>OTP Email Template</title>
            <style type="text/css" media="screen">
      body {
        padding: 0 !important;
        margin: 0 auto !important;
        display: block !important;
        min-width: 100% !important;
        width: 100% !important;
        background: #f3189e;
        -webkit-text-size-adjust: none;
        padding-top: 25px;
      }
      a {
        color: #f3189e;
        text-decoration: none;
      }
      p {
        padding: 0 !important;
        margin: 0 !important;
      }
      img {
        margin: 0 !important;
        -ms-interpolation-mode: bicubic; /* Allow smoother rendering of resized image in Internet Explorer */
      }

      a[x-apple-data-detectors] {
        color: inherit !important;
        text-decoration: inherit !important;
        font-size: inherit !important;
        font-family: inherit !important;
        font-weight: inherit !important;
        line-height: inherit !important;
      }

      .btn-16 a {
        display: block;
        padding: 15px 35px;
        text-decoration: none;
      }
      .btn-20 a {
        display: block;
        padding: 15px 35px;
        text-decoration: none;
      }

      .l-white a {
        color: #ffffff;
      }
      .l-black a {
        color: #282828;
      }
      .l-pink a {
        color: #f3189e;
      }
      .l-grey a {
        color: #6e6e6e;
      }
      .l-purple a {
        color: #9128df;
      }

      .gradient {
        background: #ae70dd;
      }
      .pt-15
      {
        padding-top: 15px;
      }

      /* .btn-secondary {
        border-radius: 10px;
        background: linear-gradient(to right, #9028df 0%, #f3189e 100%);
      } */

      /* Mobile styles */
      @media only screen and (max-device-width: 480px), only screen and (max-width: 480px) {
        .mpx-10 {
          padding-left: 10px !important;
          padding-right: 10px !important;
        }

        .mpx-15 {
          padding-left: 15px !important;
          padding-right: 15px !important;
        }

        u + .body .gwfw {
          width: 100% !important;
          width: 100vw !important;
        }

        .td,
        .m-shell {
          width: 100% !important;
          min-width: 100% !important;
        }

        .mt-left {
          text-align: left !important;
        }
        .mt-center {
          text-align: center !important;
        }
        .mt-right {
          text-align: right !important;
        }

        .me-left {
          margin-right: auto !important;
        }
        .me-center {
          margin: 0 auto !important;
        }
        .me-right {
          margin-left: auto !important;
        }

        .mh-auto {
          height: auto !important;
        }
        .mw-auto {
          width: auto !important;
        }

        .fluid-img img {
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
        }

        .column,
        .column-top,
        .column-dir-top {
          float: left !important;
          width: 100% !important;
          display: block !important;
        }

        .m-hide {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
          font-size: 0 !important;
          line-height: 0 !important;
          min-height: 0 !important;
        }
        .m-block {
          display: block !important;
        }

        .mw-15 {
          width: 15px !important;
        }

        .mw-2p {
          width: 2% !important;
        }
        .mw-32p {
          width: 32% !important;
        }
        .mw-49p {
          width: 49% !important;
        }
        .mw-50p {
          width: 50% !important;
        }
        .mw-100p {
          width: 100% !important;
        }

        .mmt-0 {
          margin-top: 0 !important;
        }
      }
    </style>
         </head>
         <body class="body" style="padding: 0 !important; margin: 0 auto !important; display: block !important; min-width: 100% !important; width: 100% !important; background: #f4ecfa; -webkit-text-size-adjust: none">
    <center>
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 0; padding: 0; width: 100%; height: 100%" bgcolor="#f4ecfa" class="gwfw">
        <tr>
          <td style="margin: 0; padding: 0; width: 100%; height: 100%" align="center" valign="top">
            <table width="600" border="0" cellspacing="0" cellpadding="0" class="m-shell">
              <tr>
                <td class="td " style="width: 600px; min-width: 600px; font-size: 0pt; line-height: 0pt; padding: 75px; margin: 0; font-weight: normal">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td class="mpx-10">
                        <!-- Container -->
                        <table width="100%" border="0" cellspacing="0" cellpadding="0">
                          <tr>
                            <td class="gradient pt-10" style="border-radius: 10px 10px 0 0; padding-top: 10px" bgcolor="#f3189e">
                              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                  <td style="border-radius: 10px 10px 0 0" bgcolor="#ffffff">
                                    <!-- Logo -->
                                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                      <!-- <tr>
                                        <td class="img-center p-30 px-15" style="font-size: 0pt; line-height: 0pt; text-align: center; padding: 30px; padding-left: 15px; padding-right: 15px">
                                          <a href="#" target="_blank"><img src="https://www.gurug.com/img/cust-img/guruGroup-logo-new.svg" width="112" height="43" border="0" alt="" /></a>
                                           
                                        </td>
                                      </tr> -->
                                      <tr>
                                        <td class="title-36 pt-15 a-center pb-15" style="font-size: 36px; line-height: 40px; color: #AE70DD; font-family: 'PT Sans', Arial, sans-serif; min-width: auto !important; text-align: center; padding-bottom: 15px">
                                          <strong> Alex Grant</strong>
                                        </td>
                                      </tr>
                                    </table>
                                    <!-- Logo -->

                                    <!-- Main -->
                                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                      <tr>
                                        <td class="px-50 mpx-15" style="padding-left: 50px; padding-right: 50px">
                                          <!-- Section - Intro -->
                                          <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                            <tr>
                                              <td class="pb-50" style="padding-bottom: 50px">
                                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                                  <!-- <tr>
                                                    <td class="fluid-img img-center pb-50" style="font-size: 0pt; line-height: 0pt; text-align: center; padding-bottom: 50px">
                                                      <img src="../images/img_intro_5.png" width="264" height="300" border="0" alt="" />
                                                    </td>
                                                  </tr> -->
                                                  <tr>
                                                    <td class="title-36 a-center pb-15" style="font-size: 36px; line-height: 40px; color: #282828; font-family: 'PT Sans', Arial, sans-serif; min-width: auto !important; text-align: center; padding-bottom: 15px">
                                                      <strong>Verification Code</strong>
                                                    </td>
                                                  </tr>
                                                   <tr>
                                                    <td class="text-16 lh-26 a-center pb-25" style="font-size: 16px; color: #6e6e6e; font-family: 'PT Sans', Arial, sans-serif; min-width: auto !important; line-height: 26px; text-align: left; ">
                                                      <strong>Hello ${email},</strong>
                                                    </td>
                                                  </tr>
                                                  <tr>
                                                    <td class="text-16 lh-26 a-center pb-25" style="font-size: 16px; color: #6e6e6e; font-family: 'PT Sans', Arial, sans-serif; min-width: auto !important; line-height: 26px; text-align: left; padding-bottom: 25px">
                                                     To verify your account, enter this code in Alex Grant Ai:
                                                    </td>
                                                  </tr>
                                                  <tr>
                                                    <td class="pb-30" style="padding-bottom: 30px">
                                                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                                        <tr>
                                                          <td
                                                            class="title-22 a-center py-20 px-50 mpx-15"
                                                            style="
                                                              border-radius: 10px;
                                                              border: 1px dashed #b4b4d4;
                                                              font-size: 22px;
                                                              line-height: 26px;
                                                              color: #282828;
                                                              font-family: 'PT Sans', Arial, sans-serif;
                                                              min-width: auto !important;
                                                              text-align: center;
                                                              padding-top: 20px;
                                                              padding-bottom: 20px;
                                                              padding-left: 50px;
                                                              padding-right: 50px;
                                                            "
                                                            bgcolor="#f4ecfa">
                                                            <strong>USE CODE : <span class="c-purple" style="color: #9128df">${otp}</span></strong>
                                                          </td>
                                                        </tr>
                                                      </table>
                                                    </td>
                                                  </tr>
                                                   
                                               
                                                </table>
                                              </td>
                                            </tr>
                                          </table>
                                          <!-- END Section - Intro -->
                                        </td>
                                      </tr>
                                    </table>
                                    <!-- END Main -->
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                        <!-- END Container -->
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </center>
  </body>
         </html>
     `;

    // Send OTP email
    const emailResponse = await sendEmail(
      email, // Recipient's email
      "Your OTP Code", // Email subject
      emailContent // HTML Email content
    );

    if (!emailResponse.success) {
      return res.status(500).json({
        message: "OTP generated, but email could not be sent.",
        error: emailResponse.error,
      });
    }

    res.status(201).json({
      message: "OTP generated successfully.",
      data: newOtp,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { otp, uId, sessionId } = req.body;

    // Validate input
    if (!otp || !uId || !sessionId) {
      return res
        .status(400)
        .json({ message: "OTP, uID, and Session ID are required." });
    }

    // Find the OTP entry
    const otpEntry = await OTP.findOne({ otp: otp, sessionId, userId: uId });

    if (!otpEntry) {
      return res
        .status(404)
        .json({ message: "OTP not found or session ID mismatch." });
    }

    // Check if the OTP is already verified
    if (otpEntry.isVerified) {
      return res.status(400).json({ message: "OTP is already verified." });
    }

    // Check if the OTP has expired
    if (new Date() > otpEntry.expiryTime) {
      return res.status(400).json({ message: "OTP has expired." });
    }

    // Check if the OTP matches
    if (otpEntry.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    // Mark as verified
    otpEntry.isVerified = true;
    await otpEntry.save();

    res.status(200).json({ message: "OTP verified successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
};
