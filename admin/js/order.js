import { db } from "./firebase.js";

import {
    doc,
    getDoc,
    updateDoc,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const params =
    new URLSearchParams(window.location.search);

const orderId =
    params.get("id");

if (!orderId) {

    window.location.href =
        "orders.html";

}

const orderRef =
    doc(db, "orders", orderId);

const orderSnap =
    await getDoc(orderRef);

if (!orderSnap.exists()) {

    alert("Order not found.");

    window.location.href =
        "orders.html";

}

const order =
    orderSnap.data();
    
    
document.getElementById("orderInfo").innerHTML = `

<div class="row mb-2">

<div class="col-md-4">

<strong>Order Number</strong>

</div>

<div class="col-md-8">

${order.orderNumber}

</div>

</div>

<div class="row mb-2">

<div class="col-md-4">

<strong>Payment Method</strong>

</div>

<div class="col-md-8">

${order.paymentMethod}

</div>

</div>

<div class="row mb-2">

<div class="col-md-4">

<strong>Payment Status</strong>

</div>

<div class="col-md-8">

${order.paymentStatus}

</div>

</div>

<div class="row mb-2">

<div class="col-md-4">

<strong>Order Status</strong>

</div>

<div class="col-md-8">

${order.orderStatus}

</div>

</div>

<div class="row">

<div class="col-md-4">

<strong>Total</strong>

</div>

<div class="col-md-8">

₹${order.grandTotal}

</div>

</div>

`;
document.getElementById("customerInfo").innerHTML = `

<strong>

${order.profile?.firstName || ""}

${order.profile?.lastName || ""}

</strong>

<br>

${order.profile?.phone || "-"}

<br>

${order.userId}

`;

document.getElementById("addressInfo").innerHTML = `

${order.address.addressLine1}<br>

${order.address.addressLine2 || ""}<br>

${order.address.city},

${order.address.state}

${order.address.pincode}

`;

const table =
    document.getElementById("productsTable");

order.items.forEach(item => {

    const tr =
        document.createElement("tr");

    tr.innerHTML = `

        <td>

            ${item.name}

        </td>

        <td>

            ${item.quantity}

        </td>

        <td>

            ₹${item.price}

        </td>

        <td>

            ₹${item.total}

        </td>

    `;

    table.appendChild(tr);

});

const statusSelect =
    document.getElementById("statusSelect");

statusSelect.value =
    order.orderStatus;
    
    document
.getElementById("updateBtn")
.addEventListener("click", async () => {

    await updateDoc(orderRef, {

        orderStatus:
            statusSelect.value,

    });

    alert(
        "Order updated successfully."
    );

});


