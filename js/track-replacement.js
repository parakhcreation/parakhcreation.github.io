import {
    db,
    auth
} from "./firebase.js";


import {
    doc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";


// ============================================================
// ORDER ID
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

const loadingState =
    document.getElementById(
        "loadingState"
    );


const errorState =
    document.getElementById(
        "errorState"
    );


const trackingCard =
    document.getElementById(
        "trackingCard"
    );


// ============================================================
// STATUS INFORMATION
// ============================================================

const statusInfo = {

    requested: {

        title:
            "Replacement Requested",

        description:
            "Your replacement request has been received and is awaiting review."

    },

    pending: {

        title:
            "Replacement Under Review",

        description:
            "Your replacement request is being reviewed by our team."

    },

    under_review: {

        title:
            "Replacement Under Review",

        description:
            "Your replacement request is being reviewed by our team."

    },

    approved: {

        title:
            "Replacement Approved",

        description:
            "Your replacement request has been approved. We are preparing your replacement product."

    },

    replacement_ready: {

        title:
            "Replacement Ready",

        description:
            "Your replacement product is ready. We will now arrange the exchange."

    },

    exchange_scheduled: {

        title:
            "Exchange Scheduled",

        description:
            "Your exchange has been scheduled. The same delivery person will collect the original product and deliver the replacement during the same visit."

    },

    out_for_exchange: {

        title:
            "Out for Exchange",

        description:
            "The delivery person is on the way with your replacement and will collect the original product during the same visit."

    },

    completed: {

        title:
            "Exchange Completed",

        description:
            "Your original product has been collected and your replacement product has been delivered successfully."

    },

    rejected: {

        title:
            "Replacement Request Rejected",

        description:
            "Unfortunately, your replacement request could not be approved."

    }

};


// ============================================================
// AUTH
// ============================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            showError(
                "Please log in to view your replacement details."
            );

            return;

        }


        if (!orderId) {

            showError(
                "Replacement order could not be identified."
            );

            return;

        }


        await loadReplacement(
            user
        );

    }
);


// ============================================================
// LOAD REPLACEMENT — REAL TIME
// ============================================================

function loadReplacement(
    user
) {

    try {

        const orderRef =
            doc(
                db,
                "orders",
                orderId
            );


        onSnapshot(
            orderRef,
            (snapshot) => {

                if (!snapshot.exists()) {

                    showError(
                        "We could not find this order."
                    );

                    return;

                }


                const order =
                    snapshot.data();


                // ------------------------------------------------
                // SECURITY CHECK
                // ------------------------------------------------

                if (
                    order.userId !== user.uid
                ) {

                    showError(
                        "You do not have permission to view this replacement."
                    );

                    return;

                }


                const request =
                    order.replacementRequest;


                if (!request) {

                    showError(
                        "There is no replacement request for this order."
                    );

                    return;

                }


                console.log(
                    "Replacement updated:",
                    request
                );


                renderReplacement(
                    order,
                    request
                );

            },

            (error) => {

                console.error(
                    "Replacement realtime listener failed:",
                    error
                );


                showError(
                    "We could not load your replacement details. Please try again."
                );

            }

        );

    }

    catch (error) {

        console.error(
            "Failed to start replacement tracking:",
            error
        );


        showError(
            "We could not load your replacement details. Please try again."
        );

    }

}


// ============================================================
// RENDER
// ============================================================

function renderReplacement(
    order,
    request
) {

    const status =
        normalizeStatus(
            request.status
        );


    const info =
        statusInfo[status] ||
        statusInfo.requested;


    const itemIndex =
        Number(
            request.itemIndex
        );


    const item =
        Number.isInteger(itemIndex) &&
        Array.isArray(order.items)
            ? order.items[itemIndex]
            : order.items?.[0];


    document.getElementById(
        "productName"
    ).textContent =
        request.productName ||
        item?.name ||
        "Product";


    document.getElementById(
        "orderNumber"
    ).textContent =
        `Order #${order.orderNumber || order.id || orderId}`;


    document.getElementById(
        "originalSize"
    ).textContent =
        `Original size: ${
            request.originalSize ||
            item?.selectedSize ||
            "—"
        }`;


    document.getElementById(
        "replacementSize"
    ).textContent =
        `Replacement size: ${
            request.replacementSize ||
            "—"
        }`;


    const image =
        request.productImage ||
        item?.image ||
        item?.thumbnail ||
        item?.productImage ||
        "";


    const imageElement =
        document.getElementById(
            "productImage"
        );


    if (image) {

        imageElement.src =
            image;

    }

    else {

        imageElement.style.display =
            "none";

    }


    document.getElementById(
        "statusTitle"
    ).textContent =
        info.title;


    document.getElementById(
        "statusDescription"
    ).textContent =
        info.description;


    renderDetails(
        request,
        status
    );

    renderExpectedDate(
    request
);


    renderTimeline(
        request
    );


    renderExchangeMessage(
        request,
        status
    );


    loadingState.style.display =
        "none";


    trackingCard.style.display =
        "block";

}


// ============================================================
// DETAILS
// ============================================================

function renderDetails(
    request,
    status
) {

    const grid =
        document.getElementById(
            "detailsGrid"
        );


    const exchange =
        request.exchange || {};


    const details = [];


    if (
        exchange.exchangeDate ||
        request.exchangeDate
    ) {

        details.push({

            label:
                "Exchange Date",

            value:
                exchange.exchangeDate ||
                request.exchangeDate

        });

    }


    if (
        exchange.courierPhone ||
        request.courierPhone
    ) {

        details.push({

            label:
                "Courier Contact",

            value:
                exchange.courierPhone ||
                request.courierPhone

        });

    }


    if (
        exchange.courierName
    ) {

        details.push({

            label:
                "Delivery Person",

            value:
                exchange.courierName

        });

    }


    if (
        exchange.reference
    ) {

        details.push({

            label:
                "Tracking / Reference",

            value:
                exchange.reference

        });

    }


    grid.innerHTML =
        details
            .map(
                detail => `

                    <div class="detail">

                        <span class="detail-label">

                            ${escapeHtml(
                                detail.label
                            )}

                        </span>

                        <span class="detail-value">

                            ${escapeHtml(
                                detail.value
                            )}

                        </span>

                    </div>

                `
            )
            .join("");

}


// ============================================================
// TIMELINE
// ============================================================
// ============================================================
// TIMELINE
// ============================================================

function renderTimeline(request) {

    const timelineContainer =
        document.getElementById("timeline");

    if (!timelineContainer) {

        console.warn(
            "Replacement timeline container not found."
        );

        return;

    }


    const currentStatus =
        normalizeStatus(
            request.status
        );


    const statusOrder = [

        "requested",
        "under_review",
        "approved",
        "replacement_ready",
        "exchange_scheduled",
        "out_for_exchange",
        "completed"

    ];


    const currentIndex =
        statusOrder.indexOf(
            currentStatus
        );


    /*
     * Use the replacement history whenever it exists.
     *
     * This is important because updatedAt/reviewedAt
     * can change later. We don't want an old completed
     * step to suddenly receive the date of a newer update.
     */

    const history =
        Array.isArray(request.history)
            ? request.history
            : [];


    function getHistoryDate(status) {

        const entry =
            history.find(
                item =>
                    normalizeStatus(
                        item?.status
                    ) === status
            );


        if (!entry) {

            return null;

        }


        return (
            entry.timestamp ||
            entry.changedAt ||
            entry.createdAt ||
            entry.updatedAt ||
            null
        );

    }


    const timelineSteps = [

        {
            status:
                "requested",

            label:
                "Replacement Requested",

            date:
                request.requestedAt ||
                getHistoryDate("requested")

        },


        {
            status:
                "under_review",

            label:
                "Under Review",

            date:
                request.reviewedAt ||
                getHistoryDate("under_review")

        },


        {
            status:
                "approved",

            label:
                "Replacement Approved",

            date:
                getHistoryDate("approved") ||

                (
                    currentStatus === "approved"
                        ? request.reviewedAt
                        : null
                )

        },


        {
            status:
                "replacement_ready",

            label:
                "Replacement Ready",

            date:
                getHistoryDate(
                    "replacement_ready"
                )

        },


        {
            status:
                "exchange_scheduled",

            label:
                "Exchange Scheduled",

            date:
                getHistoryDate(
                    "exchange_scheduled"
                ) ||

                request.exchange?.scheduledAt ||

                null

        },


        {
            status:
                "out_for_exchange",

            label:
                "Out for Exchange",

            date:
                getHistoryDate(
                    "out_for_exchange"
                ) ||

                request.exchange?.outForExchangeAt ||

                null

        },


        {
            status:
                "completed",

            label:
                "Exchange Completed",

            date:
                getHistoryDate(
                    "completed"
                ) ||

                request.exchange?.completedAt ||

                null

        }

    ];


    /*
     * If the status is not recognised, show the request
     * step instead of breaking the page.
     */

    const safeCurrentIndex =
        currentIndex >= 0
            ? currentIndex
            : 0;


    timelineContainer.innerHTML =
        timelineSteps
            .map(
                step => {

                    const stepIndex =
                        statusOrder.indexOf(
                            step.status
                        );


                    const completed =
                        safeCurrentIndex >= stepIndex;


                    /*
                     * FUTURE STEPS:
                     *
                     * Always show Pending.
                     *
                     * Never use today's date or updatedAt
                     * for a future step.
                     */

                    let dateText =
                        "Pending";


                    if (
                        completed &&
                        step.date
                    ) {

                        dateText =
                            formatTimelineDate(
                                step.date
                            );

                    }


                    return `

                        <div
                            class="timeline-item
                            ${completed
                                ? "completed"
                                : ""}"
                        >

                            <div
                                class="timeline-dot"
                            ></div>


                            <div
                                class="timeline-content"
                            >

                                <strong>
                                    ${escapeHtml(
                                        step.label
                                    )}
                                </strong>


                                <span>
                                    ${escapeHtml(
                                        dateText
                                    )}
                                </span>

                            </div>

                        </div>

                    `;

                }
            )
            .join("");

}

function formatTimelineDate(value) {

    if (!value) {
        return "Pending";
    }


    try {

        let date;


        if (
            value &&
            typeof value.toDate === "function"
        ) {

            date =
                value.toDate();

        }

        else {

            date =
                new Date(value);

        }


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "Pending";

        }


        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    }

    catch {

        return "Pending";

    }

}

// ============================================================
// EXPECTED EXCHANGE DATE
// ============================================================

function renderExpectedDate(
    request
) {

    const box =
        document.getElementById(
            "expectedDateBox"
        );


    if (!box) {

        return;

    }


    const exchange =
        request.exchange || {};


    const exchangeDate =
        exchange.exchangeDate ||
        request.exchangeDate;


    if (!exchangeDate) {

        box.style.display =
            "none";

        box.innerHTML =
            "";

        return;

    }


    const formattedDate =
        formatDate(
            exchangeDate
        );


    if (!formattedDate) {

        box.style.display =
            "none";

        return;

    }


    box.innerHTML = `

        <strong>
            Expected Exchange Date
        </strong>

        <br>

        Your replacement delivery person
        is expected to arrive on

        <strong>
            ${escapeHtml(
                formattedDate
            )}
        </strong>.

        The original product will be collected
        during the same visit.

    `;


    box.style.display =
        "block";

}

// ============================================================
// EXCHANGE MESSAGE
// ============================================================

function renderExchangeMessage(
    request,
    status
) {

    const box =
        document.getElementById(
            "exchangeMessage"
        );


    if (
        status === "exchange_scheduled" ||
        status === "out_for_exchange"
    ) {

        box.innerHTML = `

            <strong>
                Your exchange is a single-visit exchange.
            </strong>

            The same delivery person will collect
            your original product and deliver the
            replacement product during the same visit.

        `;

        box.style.display =
            "block";

        return;

    }


    if (
        status === "completed"
    ) {

        box.innerHTML = `

            <strong>
                Exchange completed successfully.
            </strong>

            Your original product was collected and
            the replacement product was delivered
            during the same visit.

        `;

        box.style.display =
            "block";

        return;

    }


    box.style.display =
        "none";

}


// ============================================================
// STATUS NORMALIZATION
// ============================================================

function normalizeStatus(
    status
) {

    return String(
        status || "requested"
    )
        .trim()
        .toLowerCase()
        .replace(
            /\s+/g,
            "_"
        );

}


// ============================================================
// STATUS ORDER
// ============================================================

function getStatusIndex(
    status
) {

    const order = [

        "requested",

        "pending",

        "under_review",

        "approved",

        "replacement_ready",

        "exchange_scheduled",

        "out_for_exchange",

        "completed"

    ];


    const index =
        order.indexOf(
            status
        );


    return index >= 0
        ? index
        : 0;

}


// ============================================================
// DATE
// ============================================================

function formatDate(
    value
) {

    if (!value) {

        return "";

    }


    try {

        const date =
            value.toDate
                ? value.toDate()
                : new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "";

        }


        return date.toLocaleDateString(
            "en-IN",
            {
                day:
                    "2-digit",

                month:
                    "short",

                year:
                    "numeric"
            }
        );

    }

    catch {

        return "";

    }

}


// ============================================================
// ERROR
// ============================================================

function showError(
    message
) {

    loadingState.style.display =
        "none";


    trackingCard.style.display =
        "none";


    errorState.textContent =
        message;


    errorState.style.display =
        "block";

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