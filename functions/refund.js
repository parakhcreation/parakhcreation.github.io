const {onRequest} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");

const admin = require("firebase-admin");
const Razorpay = require("razorpay");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const razorpayKeyId = defineSecret("RAZORPAY_KEY_ID");
const razorpayKeySecret = defineSecret("RAZORPAY_KEY_SECRET");
const {restoreInventory} = require("./inventory");

exports.createRazorpayRefund = onRequest(
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

        const {orderId} = req.body;

        if (!orderId) {
          return res.status(400).json({
            error: "Missing orderId",
          });
        }

        const orderRef =
        db.collection("orders").doc(orderId);

        const snap = await orderRef.get();

        if (!snap.exists) {
          return res.status(404).json({
            error: "Order not found",
          });
        }

        const order = {

          id: snap.id,

          ...snap.data(),

        };

        if (!order.razorpayPaymentId) {
          return res.status(400).json({
            error: "No Razorpay payment found",
          });
        }

        const razorpay = new Razorpay({

          key_id: razorpayKeyId.value(),

          key_secret: razorpayKeySecret.value(),

        });

        const refund =
        await razorpay.payments.refund(

            order.razorpayPaymentId,

            {

              amount:
              Math.round(order.grandTotal * 100),

            },

        );

        await orderRef.update({

          "paymentStatus": "Refunded",

          "returnRequest.status": "Refund Completed",

          "refund": {

            ...(order.refund || {}),

            status: "Completed",

            refundId: refund.id,

            completedAt:
            admin.firestore.FieldValue.serverTimestamp(),

          },

        });

        await restoreInventory(order);

        return res.json({

          success: true,

          refund,

        });
      } catch (err) {
        console.error(err);

        return res.status(500).json({

          error: err.message,

        });
      }
    },

);
