const params = new URLSearchParams(window.location.search);

const orderId = params.get("id");

const loading =
    document.getElementById("loadingState");

const content =
    document.getElementById("orderContent");


import { db, auth } from "./firebase.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";

        return;

    }

    loadOrder(user.uid);

});

async function loadOrder(userId){

    if(!orderId){

        alert("Order not found");

        window.location.href="my-orders.html";

        return;

    }

    const ref = doc(db,"orders",orderId);

    const snap = await getDoc(ref);

    if(!snap.exists()){

        alert("Order not found");

        window.location.href="my-orders.html";

        return;

    }

    const order = snap.data();

    if(order.userId !== userId){

        alert("Unauthorized");

        window.location.href="my-orders.html";

        return;

    }

    loading.style.display="none";

    content.style.display="block";

    populateOrder(order);

}

function populateOrder(order){

    // ==========================
    // Order Summary
    // ==========================

    document.getElementById("orderNumber").textContent =
        order.orderNumber;

    document.getElementById("orderDate").textContent =
        order.createdAt.toDate().toLocaleDateString("en-IN",{

            day:"numeric",
            month:"short",
            year:"numeric"

        });

    document.getElementById("paymentMethod").textContent =
        order.paymentMethod;

    document.getElementById("paymentStatus").textContent =
        order.paymentStatus;

    document.getElementById("orderStatus").textContent =
        order.orderStatus;
        
  

    // ==========================
    // Price Details
    // ==========================

    document.getElementById("subtotal").textContent =
        "₹" + order.subtotal.toLocaleString("en-IN");

    document.getElementById("shipping").textContent =
        order.shipping === 0
        ? "FREE"
        : "₹" + order.shipping.toLocaleString("en-IN");

    document.getElementById("discount").textContent =
        "₹" + order.discount.toLocaleString("en-IN");

    document.getElementById("grandTotal").textContent =
        "₹" + order.grandTotal.toLocaleString("en-IN");




// ==========================
// Products
// ==========================

const productsContainer =
    document.getElementById("productsContainer");

productsContainer.innerHTML = "";

order.items.forEach(item => {

    productsContainer.innerHTML += `

    <div class="product">

        <img
            src="${item.thumbnail}"
            alt="${item.name}">

        <div class="productInfo">

            <h3>${item.name}</h3>

            <div class="infoItem">

                <div class="label">

                    SKU

                </div>

                <div class="value">

                    ${item.id}

                </div>

            </div>

            <div class="infoItem">

                <div class="label">

                    Quantity

                </div>

                <div class="value">

                    ${item.quantity}

                </div>

            </div>

            <div class="infoItem">

                <div class="label">

                    Price

                </div>

                <div class="value">

                    ₹${item.price.toLocaleString("en-IN")}

                </div>

            </div>

        </div>

    </div>

    `;

});

// ==========================
// Delivery Address
// ==========================

const a = order.address;

const p = order.profile;

document.getElementById("deliveryAddress").innerHTML = `

<div class="value">

    ${p.firstName} ${p.lastName}

</div>

<br>

${p.phone}

<br><br>

${a.addressLine1}

<br>

${a.addressLine2}

<br>

${a.landmark}

<br>

${a.city}

<br>

${a.state}

-

${a.pincode}

`;

document.getElementById("trackOrderBtn").addEventListener("click", () => {

    window.location.href =
        `order-status.html?id=${orderId}`;

});
}
