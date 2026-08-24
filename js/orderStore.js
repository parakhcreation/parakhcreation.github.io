
console.log("ORDER STORE LOADED");
import { auth, db } from "./firebase.js";

import { Checkout } from "./checkoutStore.js";

import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    addDoc,
    runTransaction,
    serverTimestamp,
    query,
    where,
    getDocs
}
from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

async function generateOrderNumber() {

    const counterRef = doc(db, "counters", "orders");

    const today = new Date();

    const dateString =
        today.getFullYear().toString() +
        String(today.getMonth() + 1).padStart(2, "0") +
        String(today.getDate()).padStart(2, "0");

    return await runTransaction(db, async (transaction) => {

        const snap = await transaction.get(counterRef);

        let last = 0;

        if (snap.exists()) {

            last = snap.data().lastOrderNumber || 0;

        }

        last++;

        transaction.set(counterRef, {

            lastOrderNumber: last

        });

        return `PAR-${dateString}-${String(last).padStart(6, "0")}`;

    });

}

export async function placeOrder(
    paymentMethod = "COD",
    paymentData = {},
    selectedAddress = {}
) {

    const checkout = await Checkout.prepare();

    

    const orderNumber = await generateOrderNumber();

    console.log("paymentData =", paymentData);
    console.log("paymentMethod =", paymentMethod);

    const order = {

    orderNumber,

    userId: auth.currentUser.uid,

    items: checkout.items,

    // Review eligibility data
    // Stores the product IDs purchased in this order.
    reviewProductIds: [
        ...new Set(
            (checkout.items || [])
                .map(item => item.id)
                .filter(Boolean)
        )
    ],

    address: selectedAddress ?? checkout.address,

        profile: checkout.profile,

        subtotal: checkout.subtotal,

        shipping: checkout.shipping,

        discount: checkout.discount,

        grandTotal: checkout.grandTotal,

        paymentMethod,

        paymentStatus:
            paymentMethod === "COD"
                ? "Pending"
                : "Paid",

            razorpayPaymentId: paymentData?.paymentId || null,
razorpayOrderId: paymentData?.orderId || null,
razorpaySignature: paymentData?.signature || null,

paymentTime:
    paymentMethod === "razorpay"
        ? serverTimestamp()
        : null,

orderStatus: "Pending",

statusHistory: [

    {

        status: "Pending",

        time: new Date()

    }

],

createdAt: serverTimestamp()

    };

    const orderRef = doc(collection(db, "orders"));

await runTransaction(db, async (transaction) => {

    for (const item of checkout.items) {

        const productRef = doc(
            db,
            "products",
            item.id
        );

        const productSnap =
            await transaction.get(productRef);

        if (!productSnap.exists()) {

            throw new Error(
                `${item.name} not found.`
            );

        }

        const product =
            productSnap.data();

       const updates = {};

// Update overall stock
if ((product.stock || 0) < item.quantity) {

    throw new Error(
        `Only ${product.stock} ${item.name} left in stock.`
    );

}

updates.stock = product.stock - item.quantity;

// Update selected size stock
if (item.selectedSize &&
    product.inventory &&
    product.inventory.sizes) {

    const currentSizeStock =
        product.inventory.sizes[item.selectedSize] || 0;

    if (currentSizeStock < item.quantity) {

        throw new Error(
            `Only ${currentSizeStock} left in size ${item.selectedSize}.`
        );

    }

    updates[
        `inventory.sizes.${item.selectedSize}`
    ] = currentSizeStock - item.quantity;

}

transaction.update(productRef, updates);

    }

    transaction.set(
        orderRef,
        order
    );

});

return {

    id: orderRef.id,

    ...order,

};

}
