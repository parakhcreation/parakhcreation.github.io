const {onRequest} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

const {restoreInventory} = require("./inventory");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Restore inventory for a cancelled order.
 */
exports.restoreInventoryOnly = onRequest(
    {
      cors: true,
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

        const orderRef = db.collection("orders").doc(orderId);

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

        await restoreInventory(order);

        return res.json({
          success: true,
        });
      } catch (err) {
        console.error(err);

        return res.status(500).json({
          error: err.message,
        });
      }
    },
);
