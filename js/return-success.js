console.log("ORDER SUCCESS JS LOADED");

import {
    db,
} from "./firebase.js";

console.log("db =", db);
console.log("db type =", typeof db);

import {
    doc,
    getDoc,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);

const orderId = params.get("id");

console.log("Order ID =", orderId);

if (!orderId) {

    window.location.href = "index.html";

}

const orderRef = doc(db, "orders", orderId);

const orderSnap = await getDoc(orderRef);

console.log("Exists =", orderSnap.exists());

if (orderSnap.exists()) {
    console.log(orderSnap.data());
}

if (!orderSnap.exists()) {

    alert("Order not found.");

    window.location.href = "index.html";

}

const order = orderSnap.data();

document.getElementById("orderNumber").textContent =
    order.orderNumber;

// Current Return Status

document.getElementById("paymentStatus").textContent =
    order.returnRequest?.status || "Return Requested";


// Refund Method

if (order.paymentMethod === "COD") {

    document.getElementById("grandTotal").textContent =
        "Bank Transfer";

} else {

    document.getElementById("grandTotal").textContent =
        "Original Payment Method";

}


document
    .getElementById("trackReturnBtn")
    .addEventListener("click", () => {

        window.location.href =
            `track-return.html?id=${orderId}`;

    });