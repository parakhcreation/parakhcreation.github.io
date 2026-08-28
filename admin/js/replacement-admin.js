// ============================================================
// PARAKH ADMIN — REPLACEMENT REQUESTS
// ============================================================
//
// This module is intentionally isolated from order.js.
//
// It:
// - Reads the current order
// - Displays replacement requests
// - Shows customer defect photos
// - Allows staff/admin to approve or reject
//
// It does NOT modify:
// - normal order status
// - payment status
// - returns
// - refunds
// - cancellations
// - products
// - inventory
//
// ============================================================

import { db, auth } from "./firebase.js";

import {
    doc,
    getDoc,
    updateDoc,
    serverTimestamp,
    runTransaction
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


// ============================================================
// GET ORDER ID
// ============================================================

const params =
    new URLSearchParams(
        window.location.search
    );

const orderId =
    params.get("id");


// ============================================================
// DOM
// ============================================================

const replacementCard =
    document.getElementById(
        "replacementCard"
    );

const replacementInfo =
    document.getElementById(
        "replacementInfo"
    );


// ============================================================
// INITIAL CHECK
// ============================================================

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";


if (
    replacementCard &&
    replacementInfo
) {

    onAuthStateChanged(
        auth,
        (user) => {

            if (!user) {

                console.warn(
                    "Replacement admin: user is not authenticated."
                );

                return;

            }

            console.log(
                "Replacement admin: authenticated as",
                user.uid
            );

            loadReplacementRequest();

        }
    );

}


// ============================================================
// LOAD ORDER
// ============================================================

async function loadReplacementRequest() {

    try {

        if (!orderId) {

            return;

        }


        const currentUser =
            auth.currentUser;


        if (!currentUser) {

            console.warn(
                "Replacement admin: user not authenticated."
            );

            return;

        }


        const orderRef =
            doc(
                db,
                "orders",
                orderId
            );


        const snapshot =
            await getDoc(
                orderRef
            );


        if (!snapshot.exists()) {

            return;

        }


        const order =
            snapshot.data();


        /*
         * Only show the card when a replacement
         * request actually exists.
         */

        if (
            !order.replacementRequest
        ) {

            return;

        }


        renderReplacementRequest(
            order
        );

    }

    catch (error) {

        console.error(
            "Failed to load replacement request:",
            error
        );

        showReplacementError(
            "Unable to load replacement request."
        );

    }

}


// ============================================================
// RENDER REQUEST
// ============================================================

function renderReplacementRequest(
    order
) {

    const request =
        order.replacementRequest;


    replacementCard.style.display =
        "block";


    const itemIndex =
        Number(
            request.itemIndex
        );


    const item =
        Number.isInteger(itemIndex) &&
        Array.isArray(order.items)
            ? order.items[itemIndex]
            : null;


    const productName =
        request.productName ||
        item?.name ||
        "Product";


    const originalSize =
        request.originalSize ||
        item?.selectedSize ||
        "Not specified";


    const replacementSize =
        request.replacementSize ||
        "Same size";


    const reason =
        request.reason ||
        "Not specified";


    const status =
        request.status ||
        "requested";

    const normalizedStatus =
    String(status)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");


    const photos =
        Array.isArray(
            request.photos
        )
            ? request.photos
            : [];


    replacementInfo.innerHTML = `

        <div class="replacement-admin-header">

            <div>

                <div class="replacement-admin-eyebrow">

                    REPLACEMENT REQUEST

                </div>

                <h4 class="replacement-admin-title">

                    ${escapeHtml(
                        productName
                    )}

                </h4>

            </div>


            <span
                class="replacement-admin-status
                ${getStatusClass(status)}">

                ${formatStatus(status)}

            </span>

        </div>


        <div class="replacement-admin-grid">

            

        <div
            class="replacement-admin-edit-grid"
        >

            <div
                class="replacement-admin-edit-field"
            >

                <label
                    for="replacementStatusSelect"
                    class="replacement-admin-label"
                >

                    Replacement Status

                </label>

                <select
                    id="replacementStatusSelect"
                    class="form-select"
                >

                    <option value="requested">
                        Replacement Requested
                    </option>

                    <option value="under_review">
                        Under Review
                    </option>

                    <option value="approved">
                        Replacement Approved
                    </option>

                    <option value="rejected">
                        Replacement Rejected
                    </option>

                    <option value="replacement_ready">
                        Replacement Ready
                    </option>

                    <option value="pickup_pending">
                        Exchange Pending
                    </option>

                    <option value="exchange_scheduled">
                        Exchange Scheduled
                    </option>

                    <option value="out_for_exchange">
                        Out for Exchange
                    </option>

                    <option value="completed">
                        Exchange Completed
                    </option>

                </select>

            </div>


            <div
                class="replacement-admin-edit-field"
            >

                <label
                    for="replacementExchangeDate"
                    class="replacement-admin-label"
                >

                    Exchange Date

                </label>

                <input
    type="date"
    id="replacementExchangeDate"
    class="form-control"
    value="${escapeAttribute(
        request.exchangeDate || ""
    )}"
>

            </div>

            <div
    class="replacement-admin-edit-field"
>

    <label
        for="replacementCourierPhone"
        class="replacement-admin-label"
    >

        Courier Contact Number

        <span
            style="font-weight:400;color:#888;"
        >
            (Optional)
        </span>

    </label>

    <input
        type="tel"
        id="replacementCourierPhone"
        class="form-control"
        placeholder="Enter courier contact number"
        value="${escapeAttribute(
            request.courierPhone || ""
        )}"
    >

</div>

        </div>

                <div
            class="replacement-admin-actions"
        >

            <button
                type="button"
                class="btn btn-primary"
                id="updateReplacementDetailsBtn"
            >

                Update Replacement

            </button>

        </div>




                <span class="replacement-admin-label">

                    Original Size

                </span>

                <strong>

                    ${escapeHtml(
                        originalSize
                    )}

                </strong>

            </div>


            <div class="replacement-admin-field">

                <span class="replacement-admin-label">

                    Requested Replacement

                </span>

                <strong>

                    ${escapeHtml(
                        replacementSize
                    )}

                </strong>

            </div>


            <div class="replacement-admin-field">

                <span class="replacement-admin-label">

                    Reason

                </span>

                <strong>

                    ${escapeHtml(
                        reason
                    )}

                </strong>

            </div>


            <div class="replacement-admin-field">

                <span class="replacement-admin-label">

                    Requested On

                </span>

                <strong>

                    ${formatTimestamp(
                        request.requestedAt
                    )}

                </strong>

            </div>

        </div>


        ${
            photos.length
                ? `

                    <div class="replacement-admin-photos">

                        <div class="replacement-admin-section-title">

                            Customer Photos

                        </div>


                        <div class="replacement-photo-grid">

                            ${photos.map(
                                (
                                    photo,
                                    index
                                ) => `

                                    <a
                                        href="${escapeAttribute(photo)}"
                                        target="_blank"
                                        rel="noopener"
                                        class="replacement-photo-link"
                                    >

                                        <img
                                            src="${escapeAttribute(photo)}"
                                            alt="Replacement request photo ${index + 1}"
                                        >

                                    </a>

                                `
                            ).join("")}

                        </div>

                    </div>

                `
                : ""
        }


        ${
            request.adminNote
                ? `

                    <div class="replacement-admin-note">

                        <div class="replacement-admin-section-title">

                            Admin Note

                        </div>

                        <p>

                            ${escapeHtml(
                                request.adminNote
                            )}

                        </p>

                    </div>

                `
                : ""
        }
        
        


        

    `;


        const replacementStatusSelect =
        document.getElementById(
            "replacementStatusSelect"
        );


    if (replacementStatusSelect) {

        replacementStatusSelect.value =
            normalizedStatus;

    }


    const replacementExchangeDate =
        document.getElementById(
            "replacementExchangeDate"
        );


    if (replacementExchangeDate) {

        replacementExchangeDate.value =
            request.exchangeDate || "";

    }

    





   
    bindReplacementActions(
        order,
        request
    );

       


    


    

}


// ============================================================
// ACTION BUTTONS
// ============================================================

// ============================================================
// ACTION BUTTONS
// ============================================================

function bindReplacementActions(
    order,
    request
) {

    


    // --------------------------------------------------------
    // PREPARE REPLACEMENT
    // --------------------------------------------------------

   


    // --------------------------------------------------------
    // UPDATE REPLACEMENT DETAILS
    // --------------------------------------------------------

    const updateDetailsBtn =
        document.getElementById(
            "updateReplacementDetailsBtn"
        );

    if (updateDetailsBtn) {

        updateDetailsBtn.addEventListener(
            "click",
            async () => {

                const statusSelect =
                    document.getElementById(
                        "replacementStatusSelect"
                    );

                const dateInput =
                    document.getElementById(
                        "replacementExchangeDate"
                    );


                const newStatus =
                    statusSelect?.value || "";


                const newDate =
                    dateInput?.value || "";

                    const courierPhoneInput =
    document.getElementById(
        "replacementCourierPhone"
    );

const newCourierPhone =
    courierPhoneInput?.value.trim() || "";


                if (!newStatus) {

                    alert(
                        "Please select a replacement status."
                    );

                    return;

                }


                await updateReplacementDetails(
    order,
    newStatus,
    newDate,
    newCourierPhone
);

            }
        );

    }


       

}

// ============================================================
// UPDATE REPLACEMENT DETAILS
// ============================================================

async function updateReplacementDetails(
    order,
    status,
    exchangeDate,
    courierPhone
) {

    try {

        const currentUser =
            auth.currentUser;


        if (!currentUser) {

            alert(
                "Your admin session has expired. Please log in again."
            );

            return;

        }


        const existing =
            order.replacementRequest || {};


        const updatedRequest = {

    ...existing,

    status,

    exchangeDate:
        exchangeDate || null,

    courierPhone:
        courierPhone || "",

    updatedAt:
        serverTimestamp(),

    updatedBy:
        currentUser.uid

};


        const orderRef =
    doc(
        db,
        "orders",
        orderId
    );


/*
 * If the replacement is being marked as completed,
 * update the inventory and replacement status together.
 */

if (
    status === "completed"
) {

    await completeReplacementAndAdjustInventory(
        order,
        updatedRequest,
        currentUser
    );

}

else {

    await updateDoc(
        orderRef,
        {
            replacementRequest:
                updatedRequest
        }
    );

}


        const refreshedSnapshot =
            await getDoc(
                orderRef
            );


        if (
            refreshedSnapshot.exists()
        ) {

            const refreshedOrder =
                refreshedSnapshot.data();


            renderReplacementRequest(
                refreshedOrder
            );

        }


        showReplacementToast(
            "Replacement details updated successfully."
        );

    }

    catch (error) {

        console.error(
            "Replacement details update failed:",
            error
        );


        showReplacementError(
            "Could not update the replacement details. Please try again."
        );

    }

}


// ============================================================
// CONFIRM ACTION
// ============================================================

function confirmReplacementAction(
    order,
    action
) {

    const title =
        action === "approve"
            ? "Approve Replacement?"
            : "Reject Replacement?";


    const message =
        action === "approve"

            ? "This will approve the customer's replacement request. The exchange can then move to the preparation stage."

            : "This will reject the customer's replacement request.";


    const confirmed =
        window.confirm(
            `${title}\n\n${message}`
        );


    if (!confirmed) {

        return;

    }


    if (action === "approve") {

        updateReplacementStatus(
            order,
            "approved"
        );

    }

    else {

        updateReplacementStatus(
            order,
            "rejected"
        );

    }

}

// ============================================================
// SCHEDULE REPLACEMENT EXCHANGE
// ============================================================

async function scheduleReplacementExchange(
    order,
    exchangeDetails
) {

    try {

        const currentUser =
            auth.currentUser;


        if (!currentUser) {

            alert(
                "Your admin session has expired. Please log in again."
            );

            return;

        }


        const exchangeDate =
            exchangeDetails?.exchangeDate || "";


        if (!exchangeDate) {

            alert(
                "Please select the exchange date."
            );

            return;

        }


        const existing =
            order.replacementRequest || {};


        const updatedRequest = {

            ...existing,

            status:
                "exchange_scheduled",

            exchange: {

                ...(existing.exchange || {}),

                exchangeDate,

                scheduledAt:
                    serverTimestamp(),

                scheduledBy:
                    currentUser.uid

            }

        };


        const orderRef =
            doc(
                db,
                "orders",
                orderId
            );


        await updateDoc(
            orderRef,
            {

                replacementRequest:
                    updatedRequest

            }
        );


        const refreshedSnapshot =
            await getDoc(
                orderRef
            );


        if (
            refreshedSnapshot.exists()
        ) {

            const refreshedOrder =
                refreshedSnapshot.data();


            renderReplacementRequest(
                refreshedOrder
            );

        }


        showReplacementToast(
            "Exchange scheduled successfully."
        );

    }

    catch (error) {

        console.error(
            "Replacement exchange scheduling failed:",
            error
        );


        showReplacementError(
            "Could not schedule the exchange. Please try again."
        );

    }

}


// ============================================================
// UPDATE STATUS
// ============================================================

async function updateReplacementStatus(
    order,
    status
) {

    try {

        const currentUser =
            auth.currentUser;


        if (!currentUser) {

            alert(
                "Your admin session has expired. Please log in again."
            );

            return;

        }


        const existing =
            order.replacementRequest;

            


        /*
         * Preserve every existing replacement field.
         *
         * Only replacementRequest is changed.
         * Existing order fields remain untouched.
         */

        const updatedRequest = {

            ...existing,

            status,

            reviewedAt:
                serverTimestamp(),

            reviewedBy:
                currentUser.uid

        };


        const orderRef =
            doc(
                db,
                "orders",
                orderId
            );


        await updateDoc(
            orderRef,
            {

                replacementRequest:
                    updatedRequest

            }
        );

        


        /*
         * Reload the request so the admin sees
         * the new status immediately.
         */

        const refreshedSnapshot =
            await getDoc(
                orderRef
            );


        if (
            refreshedSnapshot.exists()
        ) {

            const refreshedOrder =
                refreshedSnapshot.data();


            renderReplacementRequest(
                refreshedOrder
            );

        }


        showReplacementToast(
            status === "approved"
                ? "Replacement approved successfully."
                : "Replacement request rejected."
        );

    }

    catch (error) {

        console.error(
            "Replacement status update failed:",
            error
        );


        showReplacementError(
            "Could not update the replacement request. Please try again."
        );

    }

}


// ============================================================
// STATUS HELPERS
// ============================================================

function formatStatus(
    status
) {

    const normalizedStatus =
        String(status || "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "_");

    const labels = {

        requested:
            "Replacement Requested",

        under_review:
            "Under Review",

        approved:
            "Replacement Approved",

        rejected:
            "Replacement Rejected",

        replacement_ready:
    "Replacement Ready",

        pickup_pending:
            "Exchange Pending",

        exchange_scheduled:
            "Exchange Scheduled",

        out_for_exchange:
            "Out for Exchange",

        completed:
            "Exchange Completed"

    };


    return (
        labels[normalizedStatus] ||
        "Replacement Requested"
    );

}


function getStatusClass(
    status
) {

    const normalizedStatus =
        String(status || "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "_");


    if (
        normalizedStatus === "approved"
    ) {

        return "replacement-status-approved";

    }


    if (
        normalizedStatus === "replacement_ready"
    ) {

        return "replacement-status-ready";

    }


    if (
        normalizedStatus === "rejected"
    ) {

        return "replacement-status-rejected";

    }


    return "replacement-status-requested";

}


// ============================================================
// TIMESTAMP
// ============================================================

function formatTimestamp(
    timestamp
) {

    if (!timestamp) {

        return "—";

    }


    try {

        const date =
            timestamp.toDate
                ? timestamp.toDate()
                : new Date(timestamp);


        return date.toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    }

    catch {

        return "—";

    }

}


// ============================================================
// HTML SAFETY
// ============================================================

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


function escapeAttribute(
    value
) {

    return escapeHtml(
        value
    );

}


// ============================================================
// TOAST
// ============================================================

function showReplacementToast(
    message
) {

    let toast =
        document.getElementById(
            "replacementAdminToast"
        );


    if (!toast) {

        toast =
            document.createElement(
                "div"
            );


        toast.id =
            "replacementAdminToast";


        document.body.appendChild(
            toast
        );

    }


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    setTimeout(
        () => {

            toast.classList.remove(
                "show"
            );

        },
        3000
    );

}


// ============================================================
// ERROR
// ============================================================

function showReplacementError(
    message
) {

    if (
        !replacementCard ||
        !replacementInfo
    ) {

        return;

    }


    replacementCard.style.display =
        "block";


    replacementInfo.innerHTML = `

        <div class="alert alert-danger">

            ${escapeHtml(
                message
            )}

        </div>

                <div
            class="replacement-admin-actions"
            style="margin-top:20px;"
        >

            <button
                type="button"
                class="btn btn-primary"
                id="updateReplacementDetailsBtn">

                Update Replacement

            </button>

        </div>

    `;

}

// ============================================================
// REPLACEMENT INVENTORY ADJUSTMENT
// ============================================================
// ============================================================
// COMPLETE REPLACEMENT + UPDATE INVENTORY
// ============================================================

async function completeReplacementAndAdjustInventory(
    order,
    updatedRequest,
    currentUser
) {

    const productId =
        updatedRequest.productId;

    if (!productId) {

        throw new Error(
            "Replacement inventory update failed: product ID is missing."
        );

    }


    const originalSize =
        String(
            updatedRequest.originalSize ||
            ""
        ).trim();


    const replacementSize =
        String(
            updatedRequest.replacementSize ||
            ""
        ).trim();


    const productRef =
        doc(
            db,
            "products",
            productId
        );


    const orderRef =
        doc(
            db,
            "orders",
            orderId
        );


    await runTransaction(
        db,
        async (transaction) => {

            /*
             * Read both documents BEFORE making any changes.
             */

            const productSnapshot =
                await transaction.get(
                    productRef
                );


            const orderSnapshot =
                await transaction.get(
                    orderRef
                );


            if (
                !productSnapshot.exists()
            ) {

                throw new Error(
                    "Product not found."
                );

            }


            if (
                !orderSnapshot.exists()
            ) {

                throw new Error(
                    "Order not found."
                );

            }


            const product =
                productSnapshot.data();


            const latestOrder =
                orderSnapshot.data();


            const latestRequest =
                latestOrder.replacementRequest ||
                {};


            /*
             * SAFETY CHECK
             *
             * Prevent the same replacement from
             * changing inventory twice.
             */

            if (
                latestRequest.inventoryAdjusted === true
            ) {

                /*
                 * Still update the replacement information
                 * if necessary, but do NOT touch inventory.
                 */

                transaction.update(
                    orderRef,
                    {
                        replacementRequest:
                            updatedRequest
                    }
                );

                return;

            }


            const inventory =
                product.inventory ||
                {};


            /*
             * ==================================================
             * SIZE-BASED INVENTORY
             * ==================================================
             */

            if (
                inventory.sizes &&
                typeof inventory.sizes === "object"
            ) {

                const sizes = {
                    ...inventory.sizes
                };


                /*
                 * ----------------------------------------------
                 * SIZE CHANGE
                 *
                 * Example:
                 *
                 * Original: M
                 * Replacement: L
                 *
                 * M + 1
                 * L - 1
                 * ----------------------------------------------
                 */

                if (
                    originalSize &&
                    replacementSize &&
                    originalSize !== replacementSize
                ) {

                    const oldSizeStock =
                        Number(
                            sizes[originalSize] || 0
                        );


                    const replacementSizeStock =
                        Number(
                            sizes[replacementSize] || 0
                        );


                    /*
                     * The replacement product must exist
                     * in inventory.
                     */

                    if (
                        replacementSizeStock <= 0
                    ) {

                        throw new Error(
                            `Replacement size ${replacementSize} has no available inventory.`
                        );

                    }


                    /*
                     * Customer returned the old size.
                     */

                    sizes[originalSize] =
                        oldSizeStock + 1;


                    /*
                     * Customer received the new size.
                     */

                    sizes[replacementSize] =
                        replacementSizeStock - 1;

                }


                /*
                 * ----------------------------------------------
                 * SAME SIZE REPLACEMENT
                 *
                 * Example:
                 *
                 * Original: M
                 * Replacement: M
                 *
                 * Damaged product cannot return to
                 * saleable inventory.
                 *
                 * Therefore:
                 *
                 * M - 1
                 * ----------------------------------------------
                 */

                else {

                    const size =
                        replacementSize ||
                        originalSize;


                    if (!size) {

                        throw new Error(
                            "Replacement size is missing."
                        );

                    }


                    const currentStock =
                        Number(
                            sizes[size] || 0
                        );


                    if (
                        currentStock <= 0
                    ) {

                        throw new Error(
                            `Inventory for size ${size} is already zero.`
                        );

                    }


                    sizes[size] =
                        currentStock - 1;

                }


                /*
                 * Save the new size inventory.
                 */

                transaction.update(
                    productRef,
                    {

                        "inventory.sizes":
                            sizes,

                        updatedAt:
                            serverTimestamp()

                    }
                );

            }


            /*
             * ==================================================
             * PRODUCTS WITHOUT SIZE INVENTORY
             * ==================================================
             */

            else {

                const currentStock =
                    Number(
                        inventory.stock || 0
                    );


                if (
                    currentStock <= 0
                ) {

                    throw new Error(
                        "Product inventory is already zero."
                    );

                }


                transaction.update(
                    productRef,
                    {

                        "inventory.stock":
                            currentStock - 1,

                        updatedAt:
                            serverTimestamp()

                    }
                );

            }


            /*
             * ==================================================
             * MARK REPLACEMENT AS COMPLETED
             * ==================================================
             *
             * This is saved in the SAME transaction as
             * the inventory update.
             */

            transaction.update(
                orderRef,
                {

                    replacementRequest: {

                        ...updatedRequest,

                        status:
                            "completed",

                        inventoryAdjusted:
                            true,

                        inventoryAdjustedAt:
                            serverTimestamp(),

                        inventoryAdjustedBy:
                            currentUser.uid

                    }

                }
            );

        }
    );

}