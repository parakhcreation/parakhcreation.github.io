import { db } from "./firebase.js";

import {
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


// ============================================================
// GET PRODUCT ID
// ============================================================

const params =
    new URLSearchParams(
        window.location.search
    );

const productId =
    params.get("id") ||
    params.get("productId");


// ============================================================
// ELEMENTS
// ============================================================

const reviewSummary =
    document.getElementById(
        "reviewSummary"
    );

const featuredReviews =
    document.getElementById(
        "featuredReviews"
    );

const allReviews =
    document.getElementById(
        "allReviews"
    );

const seeAllReviews =
    document.getElementById(
        "seeAllReviews"
    );


// ============================================================
// LOAD REVIEWS
// ============================================================

async function loadProductReviews() {

    if (!productId) {

        console.error(
            "Product ID not found."
        );

        return;

    }


    try {

        const reviewsQuery =
            query(

                collection(
                    db,
                    "reviews"
                ),

                where(
                    "productId",
                    "==",
                    productId
                ),

                where(
                    "status",
                    "==",
                    "approved"
                )

            );


        const snapshot =
            await getDocs(
                reviewsQuery
            );


        const reviews =
            snapshot.docs.map(
                reviewDoc => ({

                    id:
                        reviewDoc.id,

                    ...reviewDoc.data()

                })
            );


        renderReviewSummary(
            reviews
        );


        renderFeaturedReviews(
            reviews
        );


        setupSeeAllReviews(
            reviews
        );

    }

    catch (error) {

        console.error(
            "Failed to load product reviews:",
            error
        );


        if (reviewSummary) {

            reviewSummary.textContent =
                "Reviews unavailable";

        }

    }

}


// ============================================================
// PRODUCT RATING SUMMARY
// ============================================================

function renderReviewSummary(
    reviews
) {

    const productRating =
        document.getElementById(
            "productRating"
        );


    // --------------------------------------------------------
    // NO REVIEWS
    // --------------------------------------------------------

    if (!reviews.length) {

        if (reviewSummary) {

            reviewSummary.innerHTML = `

                <span>
                    No reviews yet
                </span>

            `;

        }


        if (productRating) {

            productRating.innerHTML = "";

        }


        return;

    }


    // --------------------------------------------------------
    // CALCULATE AVERAGE
    // --------------------------------------------------------

    const total =
        reviews.reduce(

            (sum, review) =>

                sum +
                Number(
                    review.rating || 0
                ),

            0

        );


    const average =
        total / reviews.length;


    const roundedAverage =
        Math.round(
            average * 10
        ) / 10;


    // ========================================================
    // CUSTOMER REVIEWS SECTION
    // ========================================================

    if (reviewSummary) {

        const stars =
            createStars(
                roundedAverage
            );


        reviewSummary.innerHTML = `

            <span
                class="review-summary-stars">

                ${stars}

            </span>

            <strong>

                ${roundedAverage.toFixed(1)}

            </strong>

            <span
                class="review-summary-count">

                (${reviews.length}
                ${
                    reviews.length === 1
                        ? "review"
                        : "reviews"
                })

            </span>

        `;

    }


    // ========================================================
    // RATING BESIDE PRICE
    // ========================================================

    if (productRating) {

        productRating.innerHTML = `

            <span
                class="product-rating-badge">

                <span
                    class="product-rating-number">

                    ${roundedAverage.toFixed(1)}

                </span>

                <span
                    class="product-rating-star">

                    ★

                </span>

            </span>

            <span
                class="product-rating-count">

                ${reviews.length}
                ${
                    reviews.length === 1
                        ? "review"
                        : "reviews"
                }

            </span>

        `;

    }

}


// ============================================================
// FEATURED REVIEWS
// Show exactly TWO
// ============================================================

function renderFeaturedReviews(
    reviews
) {

    if (!featuredReviews) {
        return;
    }


    featuredReviews.innerHTML = "";


    const firstTwo =
        reviews.slice(0, 2);


    if (!firstTwo.length) {

        featuredReviews.innerHTML = `

            <p class="text-muted">

                Be the first to review this product.

            </p>

        `;

        return;

    }


    firstTwo.forEach(
        review => {

            featuredReviews.appendChild(
                createReviewCard(
                    review
                )
            );

        }
    );

}


// ============================================================
// SEE ALL REVIEWS
// ============================================================

function setupSeeAllReviews(
    reviews
) {

    if (!seeAllReviews) {
        return;
    }


    // No need for button if
    // there are only 2 or fewer reviews.

    if (reviews.length <= 2) {

        seeAllReviews.style.display =
            "none";

        return;

    }


    seeAllReviews.style.display =
        "block";


    seeAllReviews.onclick = () => {

        const currentlyVisible =
            allReviews.style.display !==
            "none";


        if (currentlyVisible) {

            allReviews.style.display =
                "none";

            seeAllReviews.textContent =
                "See all reviews";

            return;

        }


        renderAllReviews(
            reviews
        );


        allReviews.style.display =
            "block";

        seeAllReviews.textContent =
            "Hide reviews";

    };

}


// ============================================================
// ALL REVIEWS
// ============================================================

function renderAllReviews(
    reviews
) {

    if (!allReviews) {
        return;
    }


    allReviews.innerHTML = "";


    reviews.forEach(
        review => {

            allReviews.appendChild(
                createReviewCard(
                    review
                )
            );

        }
    );

}


// ============================================================
// CREATE REVIEW CARD
// ============================================================

function createReviewCard(
    review
) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "review-card";


    // --------------------------------------------------------
    // RATING
    // --------------------------------------------------------

    const rating =
        Math.max(
            0,
            Math.min(
                5,
                Number(
                    review.rating || 0
                )
            )
        );


    // --------------------------------------------------------
    // REVIEWER NAME
    // --------------------------------------------------------

    let reviewerName =
    review.reviewerName ||
    "Customer";


    // --------------------------------------------------------
    // REVIEW DATE
    // --------------------------------------------------------

    let reviewDate =
        "";


    if (review.createdAt) {

        try {

            let date;


            // Firestore Timestamp

            if (
                typeof review.createdAt.toDate ===
                "function"
            ) {

                date =
                    review.createdAt.toDate();

            }

            // Normal JavaScript Date

            else {

                date =
                    new Date(
                        review.createdAt
                    );

            }


            if (
                !isNaN(
                    date.getTime()
                )
            ) {

                reviewDate =
                    date.toLocaleDateString(
                        "en-IN",
                        {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                        }
                    );

            }

        }

        catch (error) {

            console.warn(
                "Could not format review date:",
                error
            );

        }

    }


    // --------------------------------------------------------
    // BUILD REVIEW CARD
    // --------------------------------------------------------

    card.innerHTML = `

        <div class="review-card-header">

            <div>

                <div class="review-author">

                    ${escapeHTML(
                        reviewerName
                    )}

                </div>


                ${
                    reviewDate

                    ? `

                        <div class="review-date">

                            ${escapeHTML(
                                reviewDate
                            )}

                        </div>

                    `

                    : ""

                }

            </div>


            <div class="review-stars">

                ${createStars(rating)}

            </div>

        </div>


        ${
            review.title

            ? `

                <div class="review-title">

                    ${escapeHTML(
                        review.title
                    )}

                </div>

            `

            : ""

        }


        ${
            review.comment

            ? `

                <div class="review-comment">

                    ${escapeHTML(
                        review.comment
                    )}

                </div>

            `

            : ""

        }


        ${
            review.verifiedPurchase === true

            ? `

                <div class="review-verified">

                    ✓ Verified Purchase

                </div>

            `

            : ""

        }


        ${renderMedia(review)}

    `;


    return card;

}


// ============================================================
// MEDIA
// ============================================================

function renderMedia(
    review
) {

    let html = "";


    if (
        Array.isArray(
            review.images
        )
        &&
        review.images.length
    ) {

        html += `

            <div class="review-media">

                ${
                    review.images
                        .map(
                            image => `

                                <img
    src="${escapeHTML(image)}"
    alt="Customer review photo"
    loading="lazy"
    class="review-image-clickable"
    data-review-image="${escapeHTML(image)}"
>

                            `
                        )
                        .join("")
                }

            </div>

        `;

    }


    if (review.video) {

        html += `

            <video
                class="review-video"
                controls
                preload="metadata">

                <source
                    src="${escapeHTML(
                        review.video
                    )}">

            </video>

        `;

    }


    return html;

}


// ============================================================
// STARS
// ============================================================

function createStars(
    rating
) {

    const rounded =
        Math.round(
            Number(rating)
        );


    return (
        "★".repeat(
            rounded
        )
        +
        "☆".repeat(
            5 - rounded
        )
    );

}


// ============================================================
// HTML SAFETY
// ============================================================

function escapeHTML(
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


// ============================================================
// START
// ============================================================

loadProductReviews();

// ============================================================
// RELATED PRODUCT RATINGS
// ============================================================

async function loadRelatedProductRatings() {

    const relatedGrid =
        document.getElementById(
            "relatedProducts"
        );

    if (!relatedGrid) {
        return;
    }

    const cards =
        relatedGrid.querySelectorAll(
            ".related-card"
        );

    if (!cards.length) {
        return;
    }

    for (const card of cards) {

        const link =
            card.getAttribute(
                "onclick"
            );

        if (!link) {
            continue;
        }

        const match =
            link.match(
                /product\.html\?id=([^'"]+)/
            );

        if (!match) {
            continue;
        }

        const relatedProductId =
            decodeURIComponent(
                match[1]
            );

        try {

            const reviewsQuery =
                query(
                    collection(
                        db,
                        "reviews"
                    ),
                    where(
                        "productId",
                        "==",
                        relatedProductId
                    ),
                    where(
                        "status",
                        "==",
                        "approved"
                    )
                );

            const snapshot =
                await getDocs(
                    reviewsQuery
                );

            const reviews =
                snapshot.docs.map(
                    doc => doc.data()
                );

            if (!reviews.length) {
                continue;
            }

            const total =
                reviews.reduce(
                    (sum, review) =>
                        sum +
                        Number(
                            review.rating || 0
                        ),
                    0
                );

            const average =
                total / reviews.length;

            const rounded =
                Math.round(
                    average * 10
                ) / 10;

            const rating =
                document.createElement(
                    "div"
                );

            rating.className =
                "related-rating";

            rating.innerHTML = `

                <span
                    class="related-rating-stars">

                    ${createStars(rounded)}

                </span>

                <span
                    class="related-rating-number">

                    ${rounded.toFixed(1)}

                </span>

                <span
                    class="related-rating-count">

                    (${reviews.length})

                </span>

            `;

            const price =
                card.querySelector(
                    "p"
                );

            if (price) {

                price.before(
                    rating
                );

            }

        }

        catch (error) {

            console.error(
                "Related product rating failed:",
                error
            );

        }

    }

}

loadRelatedProductRatings();

// ============================================================
// REVIEW IMAGE VIEWER
// ============================================================

document.addEventListener(
    "click",
    function (event) {

        const image =
            event.target.closest(
                ".review-image-clickable"
            );

        if (!image) {
            return;
        }

        const viewer =
            document.getElementById(
                "imageViewer"
            );

        const viewerImage =
            document.getElementById(
                "viewerImage"
            );

        if (!viewer || !viewerImage) {
            return;
        }

        viewerImage.src =
            image.dataset.reviewImage;

        viewer.classList.add(
            "active"
        );

    }
);

const reviewViewer =
    document.getElementById(
        "imageViewer"
    );

const reviewViewerClose =
    document.getElementById(
        "closeViewer"
    );


if (
    reviewViewer &&
    reviewViewerClose
) {

    reviewViewerClose.addEventListener(
        "click",
        function () {

            reviewViewer.classList.remove(
                "active"
            );

        }
    );


    reviewViewer.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                reviewViewer
            ) {

                reviewViewer.classList.remove(
                    "active"
                );

            }

        }
    );

}