import { db, auth } from "./firebase.js";

import {
    getExistingReview
} from "./reviewStore.js";

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
    
    const returnStatus =

order.returnRequest?.status || null;

const canReturn =

order.orderStatus === "Delivered" &&

order.returnWindowEnds &&

new Date() <= order.returnWindowEnds.toDate() &&

!returnStatus;

    

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

    ${firstItem.selectedSize
    ? `
    <p class="order-size">

        Size: <strong>${firstItem.selectedSize}</strong>

    </p>
    `
    : ""
}

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

    ${
    ["Pending","Confirmed"].includes(order.orderStatus)

    ? `

    <button
        class="cancelBtn"
        data-id="${order.id}">
        Cancel Order
    </button>

    `

    : order.orderStatus === "Delivered"

?

returnStatus

?

`

<button
class="trackReturnBtn"
data-id="${order.id}">

Track Return

</button>

`

:

canReturn

?

`

<button
class="returnBtn">

Return Product

</button>

`

:

`

<span class="closedText">

Return Window Closed

</span>

`


    : order.orderStatus === "Cancelled"

? `

<span class="cancelledText">
    Order Cancelled
</span>

${
order.paymentMethod !== "COD" &&
order.refund

?

`

<div class="refundBadge refund-${order.refund.status.toLowerCase().replace(/\s+/g,"-")}">

${

order.refund.status === "Pending"

? "🟡 Refund Pending"

: order.refund.status === "Initiated"

? "🟠 Refund Initiated"

: "🟢 Refund Completed"

}

</div>

`

:

""

}

`

    : `

    <span class="closedText">
        Cancellation Window Closed
    </span>

    `
}

</div>

</div>

`;

card.querySelector(".detailsBtn").addEventListener("click", () => {

    window.location.href =
        `order-details.html?id=${order.id}`;

});

const cancelBtn = card.querySelector(".cancelBtn");

if (cancelBtn) {

    cancelBtn.addEventListener("click", () => {

        window.location.href =
            `cancel-order.html?id=${order.id}`;

    });

}

const returnBtn = card.querySelector(".returnBtn");

if (returnBtn) {

    returnBtn.addEventListener("click", () => {

        window.location.href =
`return-order.html?id=${order.id}`;

    });

}

const trackReturnBtn = card.querySelector(".trackReturnBtn");

if (trackReturnBtn) {

    trackReturnBtn.addEventListener("click", () => {

        window.location.href =
            `track-return.html?id=${order.id}`;

    });

}


// ============================================================
// REVIEW PRODUCT
// ============================================================

if (order.orderStatus === "Delivered") {

    const reviewContainer =
        document.createElement("div");

    reviewContainer.className =
        "review-buttons";


    const reviewProducts =
        (order.items || [])
            .map(item => item.id)
            .filter(Boolean);


    reviewProducts.forEach(productId => {

        const item =
            (order.items || []).find(
                item => item.id === productId
            );

        if (!item) return;


        const productReview =
            document.createElement("div");

        productReview.className =
            "product-review-action";


        const productName =
            document.createElement("div");

        productName.className =
            "review-product-name";

        productName.textContent =
            item.name || "Product";


        const actionRow =
            document.createElement("div");

        actionRow.className =
            "review-action-row";


        const reviewButton =
            document.createElement("button");

        reviewButton.className =
            "reviewBtn";

        reviewButton.textContent =
            "⭐ Review Product";


        reviewButton.onclick = () => {

            window.location.href =
                `review.html?orderId=${encodeURIComponent(order.id)}&productId=${encodeURIComponent(productId)}`;

        };


        actionRow.appendChild(
            reviewButton
        );


        productReview.appendChild(
            productName
        );

        productReview.appendChild(
            actionRow
        );

        reviewContainer.appendChild(
            productReview
        );


        // ----------------------------------------------------
        // CHECK FOR EXISTING REVIEW
        // ----------------------------------------------------

        getExistingReview(
            order.id,
            productId
        )
        .then(review => {

            if (!review) {
                return;
            }


            // Existing review found
            reviewButton.textContent =
                "✓ Reviewed";

            reviewButton.className =
                "reviewedBtn";

            reviewButton.disabled =
                true;


            // Edit button
            const editButton =
                document.createElement("button");

            editButton.className =
                "editReviewBtn";

            editButton.textContent =
                "Edit Review";


            editButton.onclick = () => {

                window.location.href =
                    `review.html?orderId=${encodeURIComponent(order.id)}&productId=${encodeURIComponent(productId)}`;

            };


            actionRow.appendChild(
                editButton
            );

        })
        .catch(error => {

            console.error(
                "Review lookup failed:",
                error
            );

        });

    });


    const buttonRow =
        card.querySelector(".button-row");


    if (buttonRow) {

        buttonRow.appendChild(
            reviewContainer
        );

    }

}
    
return card;

    

}


