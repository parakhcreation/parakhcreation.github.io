import { auth, db } from "./firebase.js";

import { Checkout } from "./checkoutStore.js";

import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    runTransaction,
    serverTimestamp,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

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
