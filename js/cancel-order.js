import { db } from "./firebase.js";

import {

    doc,

    getDoc,

    updateDoc,

    serverTimestamp,

    arrayUnion

} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);

const orderId = params.get("id");

async function loadOrder(){

    if(!orderId){

        alert("Invalid Order");

        window.location.href="my-orders.html";

        return;

    }

    const snap = await getDoc(

        doc(db,"orders",orderId)

    );

    if(!snap.exists()){

        alert("Order not found");

        window.location.href="my-orders.html";

        return;

    }

    const order=snap.data();

    const item=order.items[0];

    document.getElementById("orderSummary").innerHTML = `

<div class="cancelCard">

    <div class="cancelProduct">

        <img src="${item.thumbnail}" alt="${item.name}">

        <div class="cancelInfo">

            <h2>${item.name}</h2>

            <p>₹${item.price}</p>

            <p>Quantity : ${item.quantity}</p>

            <p><b>Order No.</b> ${order.orderNumber}</p>
            
            <p><strong>Ordered on:</strong> ${
    order.createdAt
        ? new Date(order.createdAt.seconds * 1000).toLocaleDateString("en-IN")
        : "-"
}</p>

        </div>

    </div>

</div>



`;


document.querySelectorAll('input[name="reason"]').forEach(radio => {

    radio.addEventListener("change", () => {

        const remarks = document.getElementById("remarks");

        if (radio.value === "Other") {

            remarks.style.display = "block";

        } else {

            remarks.style.display = "none";

            remarks.value = "";

        }

    });

});





const cancelBtn = document.getElementById("cancelOrderBtn");

cancelBtn.addEventListener("click", async () => {

    const selectedReason = document.querySelector(
        'input[name="reason"]:checked'
    );

    if (!selectedReason) {

        alert("Please select a reason for cancellation.");

        return;

    }

   const remarksBox = document.getElementById("remarks");

const remarks = remarksBox.value.trim();

if (

    selectedReason.value === "Other" &&

    remarks === ""

){

    alert("Please enter the reason.");

    remarksBox.focus();

    return;

}

    const confirmCancel = confirm(

        "Are you sure you want to cancel this order?\n\nThis action cannot be undone."

    );

    if (!confirmCancel) return;

    try {

        await updateDoc(

            doc(db, "orders", orderId),

            {

                orderStatus: "Cancelled",

                cancellation: {

                    reason: selectedReason.value === "Other"
    ? remarks
    : selectedReason.value,

                    remarks: selectedReason.value === "Other"
    ? remarks
    : "",

                    cancelledBy: "Customer",

                    cancelledAt: serverTimestamp()

                },

                statusHistory: arrayUnion({

                    status: "Cancelled",

                    time: new Date()

                })

            }

        );

        alert("Order cancelled successfully.");

        window.location.href = "my-orders.html";

    }

    catch (err) {

        console.error(err);

        alert("Unable to cancel order.");

    }

});

}

loadOrder();


