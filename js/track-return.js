import { db } from "./firebase.js";

import {

doc,

getDoc

}

from

"https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const params =

new URLSearchParams(

window.location.search

);

const orderId =

params.get("id");

loadReturn();

async function loadReturn() {

    if (!orderId) {

        alert("Invalid Return");

        window.location.href = "my-orders.html";

        return;

    }

    const snap = await getDoc(

        doc(db, "orders", orderId)

    );

    if (!snap.exists()) {

        alert("Return not found");

        window.location.href = "my-orders.html";

        return;

    }

    const order = {

        id: snap.id,

        ...snap.data()

    };

    if (!order.returnRequest) {

        alert("No return request found.");

        window.location.href = "my-orders.html";

        return;

    }

    renderSummary(order);

    renderTimeline(order);

}

function renderSummary(order) {

    const item = order.items[0];

    document.getElementById("returnSummary").innerHTML = `

    <div class="cancelCard">

        <div class="cancelProduct">

            <img
                src="${item.thumbnail}"
                alt="${item.name}">

            <div class="cancelInfo">

                <h2>${item.name}</h2>

                <p>

                    ₹${item.price}

                </p>

                <p>

                    Quantity :

                    ${item.quantity}

                </p>

                <p>

                    <strong>

                        Order No.

                    </strong>

                    ${order.orderNumber}

                </p>

                <p>

                    <strong>

                        Current Status

                    </strong>

                    ${order.returnRequest.status}

                </p>

            </div>

        </div>

    </div>

    `;

}

function renderTimeline(order) {

    const currentStatus = order.returnRequest.status;

    const stages = [

        "Return Requested",

        "Return Approved",

        "Pickup Scheduled",

        "Product Picked Up",

        "Quality Inspection",

        "Refund Initiated",

        "Refund Completed"

    ];

    const currentIndex = stages.indexOf(currentStatus);

    let html = `

    <div class="cancelCard">

        <h2>

            Return Progress

        </h2>

        <div class="returnTimeline">

    `;

    stages.forEach((stage, index) => {

        let icon = "○";
        let className = "pending";

        if (index < currentIndex) {

            icon = "✓";
            className = "completed";

        }

        else if (index === currentIndex) {

            icon = "●";
            className = "current";

        }

        html += `

        <div class="timelineRow ${className}">

            <div class="timelineIcon">

                ${icon}

            </div>

            <div class="timelineText">

                ${stage}

            </div>

        </div>

        `;

    });

    html += `

        </div>

    </div>

    `;

    document.getElementById("returnTimeline").innerHTML = html;

}