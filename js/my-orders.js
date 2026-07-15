import { db, auth } from "./firebase.js";

import {
    collection,
    query,
    where,
    orderBy,
    getDocs
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    loadOrders(user.uid);

});

async function loadOrders(userId) {

    const loading =
        document.getElementById("loadingState");

    const empty =
        document.getElementById("emptyState");

    const container =
        document.getElementById("ordersContainer");

    loading.style.display = "block";
    container.innerHTML = "";

    const q = query(
        collection(db, "orders"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    loading.style.display = "none";

    if (snapshot.empty) {

        empty.style.display = "block";
        return;

    }

snapshot.forEach(doc => {

    const order = {

        id: doc.id,

        ...doc.data()

    };

    container.appendChild(
        createOrderCard(order)
    );

});

}

function createOrderCard(order) {

    const firstItem = order.items && order.items.length
    ? order.items[0]
    : {
        thumbnail: "",
        name: "Order"
    };

    const card = document.createElement("div");

    card.className = "order-card";

    card.innerHTML = `

<div class="order-left">

    <img
        src="${firstItem.thumbnail}"
        class="order-image">

</div>

<div class="order-middle">

    <div class="status">

        ${order.orderStatus}

    </div>

    <h2>

        ${firstItem.name}

    </h2>

    ${
    order.items && order.items.length > 1
    ? `<p class="more-items">+${order.items.length - 1} more item(s)</p>`
    : ""
}

    <p class="order-number">

        Order #${order.orderNumber}

    </p>

    <p class="order-date">

        Placed on
        ${order.createdAt.toDate().toLocaleDateString("en-IN")}

    </p>

</div>

<div class="order-right">

    <h2 class="price">

        ₹${order.grandTotal.toLocaleString("en-IN")}

    </h2>

    <div class="button-row">

        <button
    class="detailsBtn"
    data-id="${order.id}">

    View Details

</button>

      

    </div>

</div>

`;

card.querySelector(".detailsBtn").addEventListener("click", () => {

    window.location.href =
        `order-details.html?id=${order.id}`;

});

    return card;

}


