import { db } from "./firebase.js";

import {
    doc,
    getDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

console.log("order.js loaded");


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

const order = {

    id: orderSnap.id,

    ...orderSnap.data()

};

    
    
    
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

                <div class="text-muted">

    Size :

    <strong>${item.selectedSize || "-"}</strong>

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
    
    
    /* ============================
   RETURN DETAILS
============================ */

if (order.returnRequest) {

    document.getElementById("returnCard").style.display = "block";

    document.getElementById("viewReturnBtn").style.display = "inline-block";

    document.getElementById("returnInfo").innerHTML = `

        <div class="row mb-3">

            <div class="col-md-4 fw-semibold">

                Return Status

            </div>

            <div class="col-md-8">

                ${order.returnRequest.status}

            </div>

        </div>

        <div class="row mb-3">

            <div class="col-md-4 fw-semibold">

                Reason

            </div>

            <div class="col-md-8">

                ${order.returnRequest.reason}

            </div>

        </div>

        <div class="row mb-3">

            <div class="col-md-4 fw-semibold">

                Requested On

            </div>

            <div class="col-md-8">

                ${
                    order.returnRequest.requestedAt
                        ? order.returnRequest.requestedAt
                            .toDate()
                            .toLocaleString("en-IN")
                        : "-"
                }

            </div>

        </div>

        <div class="row">

            <div class="col-md-4 fw-semibold">

                Refund Status

            </div>

            <div class="col-md-8">

                ${order.returnRequest.refundStatus}

            </div>

        </div>

    `;

    document
        .getElementById("viewReturnBtn")
        .addEventListener("click", () => {

            window.location.href =
                `return.html?id=${orderId}`;

        });

}
  document
.getElementById("updateBtn")
.addEventListener("click", async () => {

    console.log("STEP 1");

try {

    console.log("STEP 2");
    const newStatus = statusSelect.value;

    console.log("STEP 3", newStatus);

    const history = [...(order.statusHistory || [])];

   const lastStatus =
    history.length > 0
        ? history[history.length - 1].status
        : null;

if (lastStatus !== newStatus) {

    history.push({

    status: newStatus,

    time: new Date()

});

}
    const updateData = {

    orderStatus: newStatus,

    statusHistory: history

};

// First time an order becomes Delivered
if (

    newStatus === "Delivered" &&

    !order.deliveredAt

) {

    const deliveredAt = new Date();

    const returnWindowEnds = new Date(deliveredAt);

    returnWindowEnds.setDate(
        returnWindowEnds.getDate() + 7
    );

    updateData.deliveredAt = deliveredAt;

    updateData.returnWindowEnds = returnWindowEnds;

}

await updateDoc(orderRef, updateData);




console.log("STEP 4 - Firestore updated");
console.log("newStatus =", newStatus);
if (newStatus === "Cancelled") {
console.log("STEP 5 - Calling restoreInventoryOnly v2");
    const response = await fetch(

        "https://us-central1-parakh-creation-website.cloudfunctions.net/restoreInventoryOnly",

        {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify({

                orderId: order.id

            })

        }

    );

    console.log("STEP 6", response.status);

    const result = await response.json();

console.log("STEP 7", result);

    if (!response.ok) {

        

        throw new Error(

            result.error ||

            "Failed to restore inventory."

        );

    }

}

console.log("STEP 8");

    alert(
        "Order updated successfully."
    );

    location.reload();

    } catch (e) {

    console.error("ERROR:", e);

}

});
if (

    order.orderStatus === "Cancelled" &&

    order.cancellation

) {

    document
        .getElementById("cancellationCard")
        .style.display = "block";

    document
        .getElementById("cancellationInfo")
        .innerHTML = `

<div class="row mb-3">

    <div class="col-4 text-muted">

        Reason

    </div>

    <div class="col-8">

        ${order.cancellation.reason}

    </div>

</div>

${
order.cancellation.remarks

?

`

<div class="row mb-3">

    <div class="col-4 text-muted">

        Remarks

    </div>

    <div class="col-8">

        ${order.cancellation.remarks}

    </div>

</div>

`

: ""

}

<div class="row mb-3">

    <div class="col-4 text-muted">

        Cancelled By

    </div>

    <div class="col-8">

        ${order.cancellation.cancelledBy}

    </div>

</div>

<div class="row">

    <div class="col-4 text-muted">

        Cancelled On

    </div>

    <div class="col-8">

        ${
            order.cancellation.cancelledAt
            ? order.cancellation.cancelledAt
                .toDate()
                .toLocaleString()
            : "-"
        }

    </div>

</div>

`;

}

if (order.refund) {

    document
        .getElementById("refundCard")
        .style.display = "block";

    const refund = order.refund;

    let actionButton = "";

    if (refund.status === "Pending") {

        actionButton = `

<button
id="initiateRefundBtn"
class="btn btn-primary mt-3">

Initiate Refund

</button>

`;

    }

    else if (refund.status === "Initiated") {

        actionButton = `

<button
id="completeRefundBtn"
class="btn btn-success mt-3">

Mark Refund Completed

</button>

`;

    }

    document
        .getElementById("refundInfo")
        .innerHTML = `

<div class="row mb-3">

<div class="col-4 text-muted">

Status

</div>

<div class="col-8">

${refund.status}

</div>

</div>

<div class="row mb-3">

<div class="col-4 text-muted">

Amount

</div>

<div class="col-8">

₹${refund.amount}

</div>

</div>

<div class="row mb-3">

<div class="col-4 text-muted">

Method

</div>

<div class="col-8">

${refund.method}

</div>

</div>

${actionButton}

`;


const initiateBtn =
document.getElementById("initiateRefundBtn");

if (initiateBtn) {

    initiateBtn.addEventListener("click", () => {

        initiateRefund(order);

    });

}

const completeBtn =
document.getElementById("completeRefundBtn");

if (completeBtn) {

    completeBtn.addEventListener("click", () => {

        completeRefund(order);

    });

}

}
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


    async function initiateRefund(order) {

    const button = document.getElementById("initiateRefundBtn");

    button.disabled = true;
    button.textContent = "Processing Refund...";

    try {

        const response = await fetch(

            "https://us-central1-parakh-creation-website.cloudfunctions.net/createRazorpayRefund",

            {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify({

                    orderId: order.id

                })

            }

        );

        const result = await response.json();

        if (!response.ok) {

            throw new Error(result.error || "Refund failed.");

        }

        location.reload();

    }

    catch (err) {

        alert(err.message);

        button.disabled = false;
        button.textContent = "Initiate Refund";

    }

}

async function completeRefund(order) {

    await updateDoc(

    orderRef,

    {

            "refund.status": "Completed",

            "refund.completedAt": serverTimestamp(),

            paymentStatus: "Refunded"

        }

    );

    location.reload();

}