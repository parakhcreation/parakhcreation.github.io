import { db } from "./firebase.js";
import { showConfirmModal } from "./modal.js";

import {
    doc,
    getDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);

const orderId = params.get("id");

async function loadOrder() {

    if (!orderId) {

        alert("Invalid Order");

        window.location.href = "my-orders.html";

        return;

    }

    const snap = await getDoc(

        doc(db, "orders", orderId)

    );

    if (!snap.exists()) {

        alert("Order not found");

        window.location.href = "my-orders.html";

        return;

    }

    window.currentOrder = snap.data();

const order = window.currentOrder;

    const item = order.items[0];
    
        document.getElementById("returnSummary").innerHTML = `

<div class="cancelCard">

    <div class="cancelProduct">

        <img src="${item.thumbnail}" alt="${item.name}">

        <div class="cancelInfo">

            <h2>${item.name}</h2>

            <p>₹${item.price}</p>

            <p><strong>Quantity:</strong> ${item.quantity}</p>

            <p><strong>Order No:</strong> ${order.orderNumber}</p>

        </div>

    </div>

</div>

`;
const refundSection =

document.getElementById("refundSection");

if (order.paymentMethod === "COD") {

refundSection.innerHTML = `

<h2>Refund Details</h2>

<p class="cancelSubtitle">

Please provide the account where you'd like to receive your refund.

</p>

<input
id="accountHolder"
class="checkoutInput"
placeholder="Account Holder Name">

<input
id="bankName"
class="checkoutInput"
placeholder="Bank Name">

<input
id="accountNumber"
class="checkoutInput"
placeholder="Account Number">

<input
id="confirmAccountNumber"
class="checkoutInput"
placeholder="Confirm Account Number">

<input
id="ifsc"
class="checkoutInput"
placeholder="IFSC Code">

<input
id="upi"
class="checkoutInput"
placeholder="UPI ID (Optional)">

`;

} else {

refundSection.innerHTML = `

<h2>Refund Method</h2>

<p>

Your refund will be credited back to the original payment method used while placing the order.

</p>

`;

}

const remarks =

document.getElementById("remarks");

document
.querySelectorAll(
'input[name="returnReason"]'
)
.forEach(radio => {

radio.addEventListener("change", () => {

if (radio.value === "Other") {

remarks.style.display = "block";

} else {

remarks.style.display = "none";

remarks.value = "";

}

});

});

}

loadOrder();

document.getElementById("submitReturnBtn")
.addEventListener("click", submitReturn);

async function submitReturn() {

    const selectedReason = document.querySelector(
        'input[name="returnReason"]:checked'
    );

    if (!selectedReason) {

        alert("Please select a return reason.");

        return;

    }

    const remarks =
        document.getElementById("remarks").value.trim();

    if (

        selectedReason.value === "Other" &&

        remarks === ""

    ) {

        alert("Please enter your return reason.");

        return;

    }

    const orderRef = doc(db, "orders", orderId);

    const returnData = {

    status: "Return Requested",

    history: [

        {

            status: "Return Requested",

            time: new Date()

        }

    ],

    reason: selectedReason.value,

    remarks:

        selectedReason.value === "Other"

        ? remarks

        : "",

    requestedAt: serverTimestamp(),

    refundStatus: "Pending",

    adminStatus: "Pending",

    photos: []

};

        
    
        if (

        window.currentOrder.paymentMethod === "COD"

    ) {

        const accountHolder =
            document.getElementById("accountHolder").value.trim();

        const bankName =
            document.getElementById("bankName").value.trim();

        const accountNumber =
            document.getElementById("accountNumber").value.trim();

        const confirmAccount =
            document.getElementById("confirmAccountNumber").value.trim();

        const ifsc =
            document.getElementById("ifsc").value.trim();

        const upi =
            document.getElementById("upi").value.trim();

        if (

            !accountHolder ||

            !bankName ||

            !accountNumber ||

            !confirmAccount ||

            !ifsc

        ) {

            alert("Please complete all refund details.");

            return;

        }

        if (

            accountNumber !== confirmAccount

        ) {

            alert("Account numbers do not match.");

            return;

        }

        returnData.refundDetails = {

            accountHolder,

            bankName,

            accountNumber,

            ifsc,

            upi

        };

    }
    
        showConfirmModal({

    title: "Submit Return Request",

    message: "Are you sure you want to submit this return request?",

    confirmText: "Submit Request",

    cancelText: "Keep Product",

    onConfirm: async () => {

        await updateDoc(orderRef, {

            returnRequest: returnData

        });

        window.location.href =
            `return-success.html?id=${orderId}`;

    }

});
return;

}
