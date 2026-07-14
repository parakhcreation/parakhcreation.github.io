const {onRequest} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const crypto = require("crypto");

const razorpayKeySecret = defineSecret("RAZORPAY_KEY_SECRET");

exports.verifyRazorpayPayment = onRequest(
    {
      region: "asia-south1",
      cors: true,
      secrets: [razorpayKeySecret],
    },
    async (req, res) => {
      try {
        if (req.method !== "POST") {
          return res.status(405).json({
            success: false,
            message: "Only POST requests allowed",
          });
        }

        const {
          orderId,
          paymentId,
          signature,
        } = req.body;

        const expectedSignature = crypto
            .createHmac(
                "sha256",
                razorpayKeySecret.value(),
            )
            .update(`${orderId}|${paymentId}`)
            .digest("hex");

        if (expectedSignature === signature) {
          return res.json({
            success: true,
          });
        }

        return res.status(400).json({
          success: false,
          message: "Invalid signature",
        });
      } catch (err) {
        console.error(err);

        return res.status(500).json({
          success: false,
        });
      }
    },
);
