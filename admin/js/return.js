import { db } from "./firebase.js";

import {

    doc,

    getDoc,
    
    updateDoc

} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);

const orderId = params.get("id");

async function loadReturn() {

    if (!orderId) {

        alert("Invalid Return");

        history.back();

        return;

    }

    const snap = await getDoc(

        doc(db, "orders", orderId)

    );

    if (!snap.exists()) {

        alert("Return not found");

        history.back();

        return;

    }

    const order = {

    id: snap.id,

    ...snap.data()

};

    const item = order.items[0];
    
    document.getElementById("summaryCard").innerHTML = `

<div class="card shadow-sm border-0">

<div class="card-body">

<h4>

Return Status

</h4>

<h2 class="text-warning">

${order.returnRequest.status}

</h2>

<p>

Order No :
${order.orderNumber}

</p>

</div>

</div>

`;

document.getElementById("customerCard").innerHTML = `

<div class="card shadow-sm border-0">

<div class="card-body">

<h4 class="mb-4">

Customer Details

</h4>

<div class="row mb-2">

<div class="col-md-3 fw-semibold">

Name

</div>

<div class="col-md-9">

${order.profile.firstName} ${order.profile.lastName}

</div>

</div>

<div class="row mb-2">

<div class="col-md-3 fw-semibold">

Phone

</div>

<div class="col-md-9">

${order.profile.phone}

</div>

</div>

<div class="row">

<div class="col-md-3 fw-semibold">

Address

</div>

<div class="col-md-9">

${order.address.fullName}<br>

${order.address.addressLine1}<br>

${order.address.addressLine2 || ""}<br>

${order.address.city},
${order.address.state}
-
${order.address.pincode}

</div>

</div>

</div>

</div>

`;
document.getElementById("productCard").innerHTML = `

<div class="card shadow-sm border-0">

<div class="card-body">

<h4 class="mb-4">

Product

</h4>

<div class="row">

<div class="col-md-3">

<img

src="${item.thumbnail}"

class="img-fluid rounded">

</div>

<div class="col-md-9">

<h5>

${item.name}

</h5>

<p>

₹${item.price}

</p>

<p>

Quantity :
${item.quantity}

</p>

<p>

Order Number :

${order.orderNumber}

</p>

<p>

Order Status :

${order.orderStatus}

</p>

</div>

</div>

</div>

</div>

`;

document.getElementById("returnCard").innerHTML = `

<div class="card shadow-sm border-0">

<div class="card-body">

<h4 class="mb-4">

Return Details

</h4>

<div class="row mb-3">

<div class="col-md-3 fw-semibold">

Status

</div>

<div class="col-md-9">

🟠 ${order.returnRequest.status}

</div>

</div>

<div class="row mb-3">

<div class="col-md-3 fw-semibold">

Reason

</div>

<div class="col-md-9">

${order.returnRequest.reason}

</div>

</div>

${
order.returnRequest.remarks
?
`
<div class="row">

<div class="col-md-3 fw-semibold">

Remarks

</div>

<div class="col-md-9">

${order.returnRequest.remarks}

</div>

</div>
`
:
""
}

</div>

</div>

`;

if (

order.paymentMethod==="COD"

){

document.getElementById("refundCard").innerHTML=`

<div class="card shadow-sm border-0">

<div class="card-body">

<h4>

Refund Details

</h4>

<p>

Refund Method :
COD

</p>

<p>

Status :

${order.returnRequest.refundStatus}

</p>

</div>

</div>

`;

}else{

document.getElementById("refundCard").innerHTML=`

<div class="card shadow-sm border-0">

<div class="card-body">

<h4>

Refund

</h4>

<p>

Original Payment Method

</p>

<p>

${order.paymentMethod}

</p>

<p>

Status :

${order.returnRequest.refundStatus}

</p>

</div>

</div>

`;

}

document.getElementById("timelineCard").innerHTML=`

<div class="card shadow-sm border-0">

<div class="card-body">

<h4>

Timeline

</h4>

<ul>

${
order.returnRequest.history

.map(step=>`

<li>

<b>

${step.status}

</b>

<br>

${

step.time

?

step.time
.toDate()
.toLocaleString("en-IN")

:

""

}

</li>

`).join("")

}

</ul>

</div>

</div>

`;


renderAdminActions(order);

function renderAdminActions(order) {

    const container = document.getElementById("adminActions");

    const currentStatus = order.returnRequest.status;

    const statuses = [

        "Return Requested",

        "Return Approved",

        "Pickup Scheduled",

        "Product Picked Up",

        "Quality Inspection",

        "Refund Initiated",

        "Refund Completed",

        "Return Rejected"

    ];

    container.innerHTML = `

    <div class="card shadow-sm border-0 mt-4">

        <div class="card-body">

            <h4 class="mb-4">

                Return Workflow

            </h4>

            <div class="mb-3">

                <label class="form-label">

                    Current Status

                </label>

                <input

                    class="form-control"

                    value="${currentStatus}"

                    disabled>

            </div>

            <div class="mb-3">

                <label class="form-label">

                    Change Status

                </label>

                <select
                    id="statusSelect"
                    class="form-select">

                    ${statuses.map(status => `

                        <option

                            value="${status}"

                            ${status===currentStatus?"selected":""}>

                            ${status}

                        </option>

                    `).join("")}

                </select>

            </div>

            <div class="mb-3">

                <label class="form-label">

                    Admin Remarks

                </label>

                <textarea

                    id="adminRemarks"

                    class="form-control"

                    rows="3"

                    placeholder="Optional remarks..."></textarea>

            </div>

            <button

                id="updateStatusBtn"

                class="btn btn-primary">

                Update Status

            </button>

        </div>

    </div>

    `;

    document
        .getElementById("updateStatusBtn")
        .addEventListener("click", () => {

            updateReturnStatus(order);

        });

}


}

loadReturn();

async function approveReturn(order) {

    if (!confirm("Approve this return request?")) return;

    try {

        const history = order.returnRequest.history || [];

        history.push({

            status: "Return Approved",

            time: new Date()

        });

        await updateDoc(
            doc(db, "orders", order.id),
            {

                "returnRequest.status": "Return Approved",

                "returnRequest.adminStatus": "Approved",

                "returnRequest.history": history

            }
        );

        alert("Return Approved Successfully.");

        location.reload();

    }

    catch (error) {

        console.error(error);

        alert("Unable to approve return.");

    }

}

async function rejectReturn(order) {

    const remarks = prompt("Reason for rejecting the return:");

    if (remarks === null) return;

    try {

        const history = order.returnRequest.history || [];

        history.push({

            status: "Return Rejected",

            time: new Date(),

            remarks

        });

        await updateDoc(
            doc(db, "orders", order.id),
            {

                "returnRequest.status": "Return Rejected",

                "returnRequest.adminStatus": "Rejected",

                "returnRequest.adminRemarks": remarks,

                "returnRequest.history": history

            }
        );

        alert("Return Rejected.");

        location.reload();

    }

    catch (error) {

        console.error(error);

        alert("Unable to reject return.");

    }

}

async function schedulePickup(order) {

    alert("Next step: Schedule Pickup dialog.");

}

async function updateReturnStatus(order) {

    const newStatus =

        document.getElementById("statusSelect").value;

    const remarks =

        document.getElementById("adminRemarks").value.trim();

    if (newStatus === order.returnRequest.status) {

        alert("Status is already up to date.");

        return;

    }

    if (!confirm(`Change status to "${newStatus}" ?`)) {

        return;

    }

    try {

        const history =

            order.returnRequest.history || [];

        history.push({

            status: newStatus,

            time: new Date(),

            updatedBy: "Admin",

            remarks

        });

        await updateDoc(

            doc(db, "orders", order.id),

            {

                "returnRequest.status": newStatus,

                "returnRequest.adminRemarks": remarks,

                "returnRequest.history": history

            }

        );

        alert("Return status updated successfully.");

        location.reload();

    }

    catch (error) {

        console.error(error);

        alert("Unable to update return status.");

    }

}
