import { db } from "./firebase.js";

import {
    doc,
    getDoc,
    updateDoc,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


function orderBadge(status) {

    const map = {

        "Pending": "warning",

        "Confirmed": "info",

        "Packed": "primary",

        "Shipped": "secondary",

        "Out for Delivery": "dark",

        "Delivered": "success",

        "Cancelled": "danger",

        "Returned": "danger",

    };

    return `<span class="badge bg-${map[status] || "secondary"}">${status}</span>`;
}

function paymentBadge(status) {

    const map = {

        "Pending": "warning",

        "Paid": "success",

        "Failed": "danger",

        "Refunded": "info",

    };

    return `<span class="badge bg-${map[status] || "secondary"}">${status}</span>`;
}
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
    
    
document.getElementById("pageTitle").textContent =
    order.orderNumber;

document.getElementById("summaryTotal").textContent =
    `₹${order.grandTotal}`;

document.getElementById("paymentBadge").innerHTML =
    paymentBadge(order.paymentStatus);

document.getElementById("orderBadge").innerHTML =
    orderBadge(order.orderStatus);

document.getElementById("orderDate").textContent =

    order.createdAt
        ? order.createdAt.toDate().toLocaleString()
        : "-";
document.getElementById("customerInfo").innerHTML = `

<div class="mb-2">

<strong>

${order.profile?.firstName || ""}

${order.profile?.lastName || ""}

</strong>

</div>

<div>

📞 ${order.profile?.phone || "-"}

</div>

<div class="text-muted small mt-2">

${order.userId}

</div>

`;

document.getElementById("addressInfo").innerHTML = `

<div>

${order.address.addressLine1}

</div>

<div>

${order.address.addressLine2 || ""}

</div>

<div>

${order.address.city},

${order.address.state}

</div>

<div>

${order.address.pincode}

</div>

`;
const paymentInfo =
    document.getElementById("paymentInfo");

paymentInfo.innerHTML = `

<div class="row mb-3">

    <div class="col-5 text-muted">

        Payment Method

    </div>

    <div class="col-7">

        ${order.paymentMethod.toUpperCase()}

    </div>

</div>

<div class="row mb-3">

    <div class="col-5 text-muted">

        Payment Status

    </div>

    <div class="col-7">

        ${
            order.paymentStatus === "Paid"

            ? '<span class="badge bg-success">Paid</span>'

            : '<span class="badge bg-warning text-dark">'
                + order.paymentStatus +
              '</span>'
        }

    </div>

</div>

<div class="row mb-3">

    <div class="col-5 text-muted">

        Razorpay Payment ID

    </div>

    <div class="col-7 small">

        ${order.razorpayPaymentId || "-"}

    </div>

</div>

<div class="row mb-3">

    <div class="col-5 text-muted">

        Razorpay Order ID

    </div>

    <div class="col-7 small">

        ${order.razorpayOrderId || "-"}

    </div>

</div>

<div class="row">

    <div class="col-5 text-muted">

        Payment Time

    </div>

    <div class="col-7">

        ${
            order.paymentTime
            ? order.paymentTime.toDate().toLocaleString()
            : "-"
        }

    </div>

</div>

`;
const table =
    document.getElementById("productsTable");

const productsTable =
    document.getElementById("productsTable");

productsTable.innerHTML = "";

order.items.forEach(item => {

    productsTable.innerHTML += `

<div class="card border-0 shadow-sm mb-3">

    <div class="card-body">

        <div class="row align-items-center">

            <div class="col-md-2 text-center">

                <img

                    src="${item.thumbnail}"

                    style="width:100px;
                           height:100px;
                           object-fit:cover;
                           border-radius:10px;">

            </div>

            <div class="col-md-4">

                <h5 class="mb-2">

                    ${item.name}

                </h5>

                <div class="text-muted">

                    SKU :
                    ${item.id}

                </div>

                <div class="text-muted">

                    ${item.collection}

                    •

                    ${item.fabric}

                </div>

                <div class="text-muted">

                    Colour :

                    ${item.colour}

                </div>

            </div>

            <div class="col-md-2 text-center">

                <small class="text-muted">

                    Quantity

                </small>

                <h5>

                    ${item.quantity}

                </h5>

            </div>

            <div class="col-md-2 text-center">

                <small class="text-muted">

                    Price

                </small>

                <h5>

                    ₹${item.price}

                </h5>

            </div>

            <div class="col-md-2 text-center">

                <small class="text-muted">

                    Total

                </small>

                <h5 class="text-success">

                    ₹${item.total}

                </h5>

            </div>

        </div>

    </div>

</div>

`;

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
    location.reload();
});

const paymentStatusSelect =
    document.getElementById("paymentStatusSelect");

paymentStatusSelect.value =
    order.paymentStatus;

document
    .getElementById("updatePaymentBtn")
    .addEventListener("click", async () => {

        await updateDoc(orderRef, {

            paymentStatus:
                paymentStatusSelect.value,

        });

        alert(
            "Payment status updated successfully."
        );

        location.reload();

    });
