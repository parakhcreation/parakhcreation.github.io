import {
    db
} from "./firebase.js";

import {
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const table =
    document.getElementById("ordersTable");

async function loadOrders() {

    table.innerHTML = `
        <tr>
            <td colspan="7" class="text-center">
                Loading...
            </td>
        </tr>
    `;

    const q = query(
        collection(db, "orders"),
        orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {

        table.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    No orders found.
                </td>
            </tr>
        `;

        return;

    }

    table.innerHTML = "";

    snapshot.forEach(docSnap => {

        const order = docSnap.data();

        const tr =
            document.createElement("tr");

        tr.innerHTML = `

            <td>${order.orderNumber}</td>

            <td>
                ${order.profile.firstName}
                ${order.profile.lastName}
            </td>

            <td>
                ₹${order.grandTotal}
            </td>

            <td>
                ${order.paymentMethod}
            </td>

            <td>
                ${order.orderStatus}
            </td>

            <td>
                ${
                    order.createdAt
                    ?
                    order.createdAt
                        .toDate()
                        .toLocaleDateString()
                    :
                    "-"
                }
            </td>

            <td>

    <button
        class="btn btn-primary btn-sm viewOrderBtn"
        data-id="${docSnap.id}">

        View

    </button>

</td>

        `;

        table.appendChild(tr);
        
        tr.querySelector(".viewOrderBtn")
.addEventListener("click", () => {

    window.location.href =
        `order.html?id=${docSnap.id}`;

});

    });

}

loadOrders();
