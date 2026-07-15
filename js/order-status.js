import { db, auth } from "./firebase.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const params = new URLSearchParams(window.location.search);

const orderId = params.get("id");

const loading =
    document.getElementById("loadingState");

const content =
    document.getElementById("content");
    
onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";
        return;

    }

    loadOrder(user.uid);

});

async function loadOrder(userId){

    if(!orderId){

        window.location.href="my-orders.html";
        return;

    }

    const ref = doc(db,"orders",orderId);

    const snap = await getDoc(ref);

    if(!snap.exists()){

        window.location.href="my-orders.html";
        return;

    }

    const order = snap.data();

    if(order.userId !== userId){

        window.location.href="my-orders.html";
        return;

    }

    loading.style.display="none";

    content.style.display="block";

    buildTimeline(order);

}

function buildTimeline(order) {

    const FLOW = [
        "Pending",
        "Confirmed",
        "Packed",
        "Shipped",
        "Out for Delivery",
        "Delivered"
    ];

    const LABELS = {
        Pending: "Order Placed",
        Confirmed: "Confirmed",
        Packed: "Packed",
        Shipped: "Shipped",
        "Out for Delivery": "Out for Delivery",
        Delivered: "Delivered"
    };

    document.getElementById("currentStatus").innerHTML =
        `<strong>Current Status:</strong> ${LABELS[order.orderStatus]}`;

    const timeline = document.getElementById("timeline");
    timeline.innerHTML = "";

    const historyMap = {};

    if (Array.isArray(order.statusHistory)) {

        order.statusHistory.forEach(item => {

            historyMap[item.status] = item.time;

        });

    }

    const currentIndex = FLOW.indexOf(order.orderStatus);

    FLOW.forEach(status => {

        const stepIndex = FLOW.indexOf(status);

        let cls = "upcoming";
        let icon = "";

        if (stepIndex < currentIndex) {

            cls = "completed";
            icon = "✓";

        } else if (stepIndex === currentIndex) {

            cls = "current";
            icon = "●";

        }

        let formattedTime = "";

        const time = historyMap[status];

        if (time && typeof time.toDate === "function") {

            formattedTime = time.toDate().toLocaleString("en-IN", {

                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"

            });

        }

        timeline.innerHTML += `

        <div class="timeline-item">

            <div class="circle ${cls}">

                ${icon}

            </div>

            <div class="line"></div>

            <div>

                <div class="step-title">

                    ${LABELS[status]}

                </div>

                <div class="step-date">

                    ${formattedTime}

                </div>

            </div>

        </div>

        `;

    });

    const a = order.address;
    const p = order.profile;

    document.getElementById("deliveryAddress").innerHTML = `

        <h3>Delivery Address</h3>

        <br>

        <strong>${p.firstName} ${p.lastName}</strong>

        <br><br>

        ${p.phone}

        <br><br>

        ${a.addressLine1}

        <br>

        ${a.addressLine2}

        <br>

        ${a.landmark}

        <br>

        ${a.city}, ${a.state}

        <br>

        ${a.pincode}

    `;

}
