const admin = require("firebase-admin");

const db = admin.firestore();

/**
 * Restores inventory for all items in an order.
 * @param {Object} order Firestore order object.
 */
async function restoreInventory(order) {
  if (order.inventoryRestored) {
    return;
  }

  const batch = db.batch();

  for (const item of order.items) {
    const productRef =
      db.collection("products").doc(item.id);

    const snap = await productRef.get();

    if (!snap.exists) {
      continue;
    }

    batch.update(productRef, {

      stock: admin.firestore.FieldValue.increment(
          item.quantity || 0,
      ),

      available: true,

      updatedAt:
    admin.firestore.FieldValue.serverTimestamp(),

    });
  }

  batch.update(

      db.collection("orders").doc(order.id),

      {

        inventoryRestored: true,

      },

  );

  await batch.commit();
}

module.exports = {

  restoreInventory,

};
