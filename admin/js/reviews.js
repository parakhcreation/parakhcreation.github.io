import { db } from "./firebase.js";

import {
    collection,
    query,
    orderBy,
    getDocs
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


// ============================================================
// ELEMENTS
// ============================================================

const reviewsNav =
    document.getElementById("reviewsNav");

const dashboardSection =
    document.getElementById("dashboardSection");

const reviewsSection =
    document.getElementById("reviewsSection");

const reviewsContainer =
    document.getElementById("reviewsContainer");


// ============================================================
// NAVIGATION
// ============================================================

if (reviewsNav) {

    reviewsNav.addEventListener("click", () => {

        if (dashboardSection) {
            dashboardSection.style.display = "none";
        }

        if (reviewsSection) {
            reviewsSection.style.display = "block";
        }

        loadReviews();

    });

}


// ============================================================
// LOAD REVIEWS
// ============================================================

async function loadReviews() {

    if (!reviewsContainer) {
        return;
    }

    reviewsContainer.innerHTML = `
        <p class="text-muted">
            Loading reviews...
        </p>
    `;

    try {

        const q = query(
            collection(db, "reviews"),
            orderBy("createdAt", "desc")
        );

        const snapshot =
            await getDocs(q);


        if (snapshot.empty) {

            reviewsContainer.innerHTML = `
                <div class="alert alert-info">
                    No reviews have been submitted yet.
                </div>
            `;

            return;
        }


        reviewsContainer.innerHTML = "";


        snapshot.forEach(reviewDoc => {

            const review = {
                id: reviewDoc.id,
                ...reviewDoc.data()
            };

            reviewsContainer.appendChild(
                createReviewCard(review)
            );

        });


    } catch (error) {

        console.error(
            "Failed to load reviews:",
            error
        );

        reviewsContainer.innerHTML = `
            <div class="alert alert-danger">
                Unable to load reviews.
            </div>
        `;

    }

}


// ============================================================
// CREATE REVIEW CARD
// ============================================================

function createReviewCard(review) {

    const card =
        document.createElement("div");

    card.className =
        "card mb-3 shadow-sm";


    const stars =
        "★".repeat(
            Number(review.rating || 0)
        )
        +
        "☆".repeat(
            5 - Number(review.rating || 0)
        );


    card.innerHTML = `

        <div class="card-body">

            <div class="d-flex justify-content-between">

                <div>

                    <h5 class="card-title mb-1">

                        ${escapeHtml(
                            review.title || "Untitled Review"
                        )}

                    </h5>

                    <div class="text-warning">

                        ${stars}

                    </div>

                </div>


                <span class="badge bg-secondary">

                    ${escapeHtml(
                        review.status || "pending"
                    )}

                </span>

            </div>


            <p class="mt-3 mb-2">

                ${escapeHtml(
                    review.comment || ""
                )}

            </p>


           <small class="text-muted">

    Product:
    ${escapeHtml(
        review.productId || "Unknown"
    )}

    <br>

    Customer:
    ${escapeHtml(
        review.userId || "Unknown"
    )}

</small>

${
    review.images &&
    Array.isArray(review.images) &&
    review.images.length > 0

    ? `

    <div class="mt-3">

        <strong>
            Customer Photos
        </strong>

        <div
            class="d-flex flex-wrap gap-2 mt-2">

            ${review.images.map(image => `

                <a
                    href="${image}"
                    target="_blank"
                    rel="noopener noreferrer">

                    <img
                        src="${image}"
                        alt="Customer review photo"
                        style="
                            width:120px;
                            height:120px;
                            object-fit:cover;
                            border-radius:8px;
                            border:1px solid #ddd;
                        "
                    >

                </a>

            `).join("")}

        </div>

    </div>

    `
    : ""
}

${
    review.video

    ? `

    <div class="mt-3">

        <strong>
            Customer Video
        </strong>

        <div class="mt-2">

            <video
                controls
                preload="metadata"
                style="
                    width:300px;
                    max-width:100%;
                    border-radius:8px;
                    border:1px solid #ddd;
                "
            >

                <source
                    src="${review.video}"
                >

                Your browser does not support video playback.

            </video>

        </div>

    </div>

    `
    : ""
}


            <div class="mt-3">

                ${
                    review.status !== "approved"

                    ? `
                    <button
                        class="btn btn-success btn-sm approveReviewBtn">

                        Approve

                    </button>
                    `
                    : ""
                }


                ${
                    review.status !== "rejected"

                    ? `
                    <button
                        class="btn btn-warning btn-sm rejectReviewBtn">

                        Reject

                    </button>
                    `
                    : ""
                }


                <button
                    class="btn btn-danger btn-sm deleteReviewBtn">

                    Delete

                </button>

            </div>

        </div>

    `;


    // --------------------------------------------------------
    // APPROVE
    // --------------------------------------------------------

    const approveButton =
        card.querySelector(".approveReviewBtn");

    if (approveButton) {

        approveButton.addEventListener(
            "click",
            () => approveReview(review.id)
        );

    }


    // --------------------------------------------------------
    // REJECT
    // --------------------------------------------------------

    const rejectButton =
        card.querySelector(".rejectReviewBtn");

    if (rejectButton) {

        rejectButton.addEventListener(
            "click",
            () => rejectReview(review.id)
        );

    }


    // --------------------------------------------------------
    // DELETE
    // --------------------------------------------------------

    const deleteButton =
        card.querySelector(".deleteReviewBtn");

    if (deleteButton) {

        deleteButton.addEventListener(
            "click",
            () => deleteReview(review.id)
        );

    }


    return card;

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}