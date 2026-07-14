const {onRequest} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const Razorpay = require("razorpay");

const razorpayKeyId = defineSecret("RAZORPAY_KEY_ID");
const razorpayKeySecret = defineSecret("RAZORPAY_KEY_SECRET");

exports.createRazorpayOrder = onRequest(
    {
      cors: true,
      secrets: [razorpayKeyId, razorpayKeySecret],
    },
    async (req, res) => {
      try {
        if (req.method !== "POST") {
          return res.status(405).json({
            error: "Method not allowed",
          });
        }

        const {amount} = req.body;

        if (!amount || amount <= 0) {
          return res.status(400).json({
            error: "Invalid amount",
          });
        }

        const razorpay = new Razorpay({
          key_id: razorpayKeyId.value(),
          key_secret: razorpayKeySecret.value(),
        });

        const order = await razorpay.orders.create({
          amount: Math.round(amount * 100),
          currency: "INR",
          receipt: "receipt_" + Date.now(),
        });

        return res.json({
          success: true,
          order: order,
        });
      } catch (err) {
        console.error(err);

        return res.status(500).json({
          error: err.message,
        });
      }
    },
);
