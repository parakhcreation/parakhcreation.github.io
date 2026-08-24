import {
    auth,
    db
} from "./firebase.js";

import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {
    getReviewOrder,
    getExistingReview,
    createReview
} from "./reviewStore.js";


// ============================================================
// URL PARAMETERS
// ============================================================

const storage = getStorage();

const params =
    new URLSearchParams(window.location.search);

const orderId =
    params.get("orderId");

const productId =
    params.get("productId");


// ============================================================
// STATE
// ============================================================

let selectedRating = 0;

let selectedImages = [];

let selectedVideo = null;

let currentUser = null;


// ============================================================
// DOM
// ============================================================

const productPreview =
    document.getElementById("productPreview");

const reviewTitle =
    document.getElementById("reviewTitle");

const reviewComment =
    document.getElementById("reviewComment");

const imageInput =
    document.getElementById("imageInput");

const videoInput =
    document.getElementById("videoInput");

const mediaPreview =
    document.getElementById("mediaPreview");

const submitButton =
    document.getElementById("submitReview");

const message =
    document.getElementById("reviewMessage");


// ============================================================
// AUTHENTICATION
// ============================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "login.html";

            return;

        }

        currentUser = user;

        await initialiseReviewPage();

    }
);


// ============================================================
// INITIALISE
// ============================================================

async function initialiseReviewPage() {

    if (!orderId || !productId) {

        showMessage(
            "This review link is invalid.",
            "error"
        );

        disableForm();

        return;

    }


    try {

        const order =
            await getReviewOrder(
                orderId
            );


        // ----------------------------------------------------
        // SECURITY / ELIGIBILITY CHECKS
        // ----------------------------------------------------

        if (
            order.userId !==
            currentUser.uid
        ) {

            throw new Error(
                "You are not allowed to review this order."
            );

        }


        if (
            order.orderStatus !==
            "Delivered"
        ) {

            throw new Error(
                "You can review a product only after it has been delivered."
            );

        }


        const product =
            (order.items || [])
                .find(
                    item =>
                        item.id === productId
                );


        if (!product) {

            throw new Error(
                "This product was not found in the order."
            );

        }


        // ----------------------------------------------------
        // CHECK IF ALREADY REVIEWED
        // ----------------------------------------------------

        const existingReview =
            await getExistingReview(
                orderId,
                productId
            );


        if (existingReview) {

            showExistingReview(
                product,
                existingReview
            );

            return;

        }


        // ----------------------------------------------------
        // DISPLAY PRODUCT
        // ----------------------------------------------------

        renderProduct(
            product
        );

    }

    catch (error) {

        console.error(
            "Review page error:",
            error
        );

        showMessage(
            error.message ||
            "Unable to load this review.",
            "error"
        );

        disableForm();

    }

}


// ============================================================
// PRODUCT PREVIEW
// ============================================================

function renderProduct(product) {

    productPreview.innerHTML = `

        <img
            src="${escapeHtml(
                product.thumbnail || ""
            )}"
            alt="${escapeHtml(
                product.name || "Product"
            )}">

        <div class="product-info">

            <div class="product-name">

                ${escapeHtml(
                    product.name ||
                    "Product"
                )}

            </div>

            <div class="verified">

                ✓ Verified Purchase

            </div>

        </div>

    `;

}


// ============================================================
// STAR RATING
// ============================================================

document
    .querySelectorAll(".star")
    .forEach(
        star => {

            star.addEventListener(
                "click",
                () => {

                    selectedRating =
                        Number(
                            star.dataset.rating
                        );

                    updateStars();

                }
            );

        }
    );


function updateStars() {

    document
        .querySelectorAll(".star")
        .forEach(
            star => {

                const rating =
                    Number(
                        star.dataset.rating
                    );

                star.classList.toggle(
                    "active",
                    rating <=
                    selectedRating
                );

            }
        );

}


// ============================================================
// IMAGE SELECTION
// ============================================================

if (imageInput) {

    imageInput.addEventListener(
        "change",
        event => {

            const files =
                Array.from(
                    event.target.files || []
                );

            selectedImages =
                [
                    ...selectedImages,
                    ...files
                ];

            renderMediaPreview();

            // Allows selecting the same file again
            event.target.value = "";

        }
    );

}


// ============================================================
// VIDEO SELECTION
// ============================================================

if (videoInput) {

    videoInput.addEventListener(
        "change",
        event => {

            const file =
                event.target.files?.[0];

            if (!file) {
                return;
            }

            selectedVideo =
                file;

            renderMediaPreview();

            event.target.value = "";

        }
    );

}


// ============================================================
// MEDIA PREVIEW
// ============================================================

function renderMediaPreview() {

    if (!mediaPreview) {
        return;
    }

    mediaPreview.innerHTML = "";


    // --------------------------------------------------------
    // IMAGES
    // --------------------------------------------------------

    selectedImages.forEach(
        (file, index) => {

            const wrapper =
                document.createElement(
                    "div"
                );

            wrapper.className =
                "preview-item";


            const image =
                document.createElement(
                    "img"
                );

            image.src =
    typeof file === "string"
        ? file
        : URL.createObjectURL(file);


            const remove =
                document.createElement(
                    "button"
                );

            remove.type =
                "button";

            remove.className =
                "remove-media";

            remove.textContent =
                "×";


            remove.addEventListener(
                "click",
                () => {

                    selectedImages.splice(
                        index,
                        1
                    );

                    renderMediaPreview();

                }
            );


            wrapper.appendChild(
                image
            );

            wrapper.appendChild(
                remove
            );

            mediaPreview.appendChild(
                wrapper
            );

        }
    );


    // --------------------------------------------------------
    // VIDEO
    // --------------------------------------------------------

    if (selectedVideo) {

        const wrapper =
            document.createElement(
                "div"
            );

        wrapper.className =
            "preview-item";


        const video =
            document.createElement(
                "video"
            );

        video.src =
    typeof selectedVideo === "string"
        ? selectedVideo
        : URL.createObjectURL(
            selectedVideo
        );

        video.controls =
            true;


        const remove =
            document.createElement(
                "button"
            );

        remove.type =
            "button";

        remove.className =
            "remove-media";

        remove.textContent =
            "×";


        remove.addEventListener(
            "click",
            () => {

                selectedVideo =
                    null;

                renderMediaPreview();

            }
        );


        wrapper.appendChild(
            video
        );

        wrapper.appendChild(
            remove
        );

        mediaPreview.appendChild(
            wrapper
        );

    }

}


// ============================================================
// SUBMIT REVIEW
// ============================================================

if (submitButton) {

   submitButton.onclick =
    submitReview;

}

// ============================================================
// UPLOAD REVIEW MEDIA
// ============================================================

async function uploadReviewMedia() {

    const imageUrls = [];

    // --------------------------------------------------------
    // UPLOAD IMAGES
    // --------------------------------------------------------

    for (const file of selectedImages) {

        // Already uploaded image
        if (typeof file === "string") {

            imageUrls.push(file);

            continue;

        }

        const safeName =
            file.name.replace(
                /[^a-zA-Z0-9._-]/g,
                "_"
            );

        const storagePath =
            `reviews/${currentUser.uid}/${orderId}/${productId}/images/${Date.now()}_${safeName}`;

        const storageRef =
            ref(
                storage,
                storagePath
            );

        await uploadBytes(
            storageRef,
            file
        );

        const downloadUrl =
            await getDownloadURL(
                storageRef
            );

        imageUrls.push(
            downloadUrl
        );

    }


    // --------------------------------------------------------
    // UPLOAD VIDEO
    // --------------------------------------------------------

    let videoUrl = null;


    if (selectedVideo) {

        // Existing video URL
        if (
            typeof selectedVideo ===
            "string"
        ) {

            videoUrl =
                selectedVideo;

        }

        // New video file
        else {

            const safeName =
                selectedVideo.name.replace(
                    /[^a-zA-Z0-9._-]/g,
                    "_"
                );

            const storagePath =
                `reviews/${currentUser.uid}/${orderId}/${productId}/video/${Date.now()}_${safeName}`;

            const storageRef =
                ref(
                    storage,
                    storagePath
                );

            await uploadBytes(
                storageRef,
                selectedVideo
            );

            videoUrl =
                await getDownloadURL(
                    storageRef
                );

        }

    }


    return {
        images: imageUrls,
        video: videoUrl
    };

}
// ============================================================
// GET REVIEWER NAME
// ============================================================

async function getReviewerName() {

    // First try Firebase Authentication
    if (
        currentUser &&
        currentUser.displayName
    ) {

        return currentUser.displayName.trim();

    }


    // Otherwise read the customer's own profile
    try {

        const userRef =
            doc(
                db,
                "users",
                currentUser.uid
            );

        const userSnapshot =
            await getDoc(
                userRef
            );


        if (
            userSnapshot.exists()
        ) {

            const userData =
                userSnapshot.data();


            // First Name + Last Name
            const fullName =
                [
                    userData.firstName,
                    userData.lastName
                ]
                .filter(Boolean)
                .join(" ")
                .trim();


            if (fullName) {

                return fullName;

            }


            // Other possible profile name
            if (
                userData.name
            ) {

                return String(
                    userData.name
                ).trim();

            }


            if (
                userData.displayName
            ) {

                return String(
                    userData.displayName
                ).trim();

            }

        }

    }

    catch (error) {

        console.warn(
            "Unable to load reviewer profile:",
            error
        );

    }


    // Final fallback
    return "Customer";

}

async function submitReview() {

    if (!currentUser) {
        return;
    }


    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (selectedRating < 1) {

        showMessage(
            "Please select a star rating.",
            "error"
        );

        return;

    }


    const title =
        reviewTitle?.value.trim() ||
        "";

    const comment =
        reviewComment?.value.trim() ||
        "";


    if (!comment) {

        showMessage(
            "Please write a review before submitting.",
            "error"
        );

        return;

    }


    if (comment.length < 5) {

        showMessage(
            "Please write a little more about your experience.",
            "error"
        );

        return;

    }


    // --------------------------------------------------------
    // PREVENT DOUBLE SUBMISSION
    // --------------------------------------------------------

    submitButton.disabled =
        true;

    submitButton.textContent =
        "SUBMITTING...";


    try {


        const media =
    await uploadReviewMedia();


const reviewerName =
    await getReviewerName();


const reviewId =
    await createReview({

        orderId,

        productId,

        rating:
            selectedRating,

        title,

        comment,

        reviewerName,

        images:
            media.images,

        video:
            media.video

    });


        console.log(
            "Review created:",
            reviewId
        );


        showMessage(
    "Your review has been submitted.",
    "success"
);

submitButton.textContent = "SUBMITTED ✓";

disableReviewInputs();

    }

    catch (error) {

        console.error(
            "Review submission failed:",
            error
        );

        showMessage(
            error.message ||
            "Unable to submit your review. Please try again.",
            "error"
        );

        submitButton.disabled =
            false;

        submitButton.textContent =
            "SUBMIT REVIEW";

    }

}

async function updateExistingReview(
    reviewId
) {

    const title =
        reviewTitle
            ? reviewTitle.value.trim()
            : "";


    const comment =
        reviewComment
            ? reviewComment.value.trim()
            : "";


    if (selectedRating < 1) {

        showMessage(
            "Please select a star rating.",
            "error"
        );

        return;

    }


    if (!comment) {

        showMessage(
            "Please write a review.",
            "error"
        );

        return;

    }


    submitButton.disabled =
        true;

    submitButton.textContent =
        "UPDATING...";


    try {

        const {
            updateReview
        } = await import(
            "./reviewStore.js"
        );


       const media =
    await uploadReviewMedia();


await updateReview(
    reviewId,
    {
        rating:
            selectedRating,

        title:
            title,

        comment:
            comment,

        images:
            media.images,

        video:
            media.video

    }
);


        showMessage(
            "Your review has been updated.",
            "success"
        );


        submitButton.textContent =
            "UPDATED ✓";

    }
    catch (error) {

        console.error(
            "Update review failed:",
            error
        );


        showMessage(
            error.message ||
            "Unable to update your review.",
            "error"
        );


        submitButton.disabled =
            false;

        submitButton.textContent =
            "UPDATE REVIEW";

    }

}


// ============================================================
// EXISTING REVIEW
// ============================================================
function showExistingReview(
    product,
    review
) {

    renderProduct(
        product
    );


    // ========================================================
    // LOAD THE EXISTING REVIEW INTO THE FORM
    // ========================================================

    selectedRating =
        Number(review.rating) || 0;


    if (reviewTitle) {

        reviewTitle.value =
            review.title || "";

    }


    if (reviewComment) {

        reviewComment.value =
            review.comment || "";

    }

    // ========================================================
// LOAD EXISTING MEDIA
// ========================================================

selectedImages =
    Array.isArray(review.images)
        ? [...review.images]
        : [];

selectedVideo =
    review.video || null;


renderMediaPreview();


    // Update the stars to show the saved rating
    updateStars();


    // ========================================================
    // CHANGE SUBMIT BUTTON TO UPDATE REVIEW
    // ========================================================

    if (submitButton) {

        submitButton.style.display =
            "block";

        submitButton.disabled =
            false;

        submitButton.textContent =
            "UPDATE REVIEW";

    }


    // ========================================================
    // REMOVE ANY OLD EXISTING-REVIEW MESSAGE
    // ========================================================

    const oldMessage =
        document.querySelector(
            ".existing-review-message"
        );

    if (oldMessage) {

        oldMessage.remove();

    }


    // ========================================================
    // CREATE DELETE BUTTON
    // ========================================================

    let deleteButton =
        document.getElementById(
            "deleteReviewButton"
        );


    if (!deleteButton) {

        deleteButton =
            document.createElement(
                "button"
            );

        deleteButton.id =
            "deleteReviewButton";

        deleteButton.type =
            "button";

        deleteButton.textContent =
            "DELETE REVIEW";


        // Basic styling
        deleteButton.style.width =
            "100%";

        deleteButton.style.marginTop =
            "12px";

        deleteButton.style.padding =
            "14px";

        deleteButton.style.border =
            "1px solid #c62828";

        deleteButton.style.borderRadius =
            "12px";

        deleteButton.style.background =
            "white";

        deleteButton.style.color =
            "#c62828";

        deleteButton.style.fontSize =
            "15px";

        deleteButton.style.fontWeight =
            "600";

        deleteButton.style.cursor =
            "pointer";


        if (
            submitButton &&
            submitButton.parentElement
        ) {

            submitButton.parentElement
                .appendChild(
                    deleteButton
                );

        }

    }


    // ========================================================
    // DELETE REVIEW
    // ========================================================

    deleteButton.onclick =
        async () => {

            const confirmed =
                window.confirm(
                    "Are you sure you want to delete your review?"
                );


            if (!confirmed) {

                return;

            }


            deleteButton.disabled =
                true;

            deleteButton.textContent =
                "DELETING...";


            try {

                const {
                    deleteReview
                } = await import(
                    "./reviewStore.js"
                );


                await deleteReview(
                    review.id
                );


                showMessage(
                    "Your review has been deleted.",
                    "success"
                );


                setTimeout(
                    () => {

                        window.location.href =
                            "my-orders.html";

                    },
                    1000
                );

            }
            catch (error) {

                console.error(
                    "Delete review failed:",
                    error
                );


                showMessage(
                    error.message ||
                    "Unable to delete your review.",
                    "error"
                );


                deleteButton.disabled =
                    false;

                deleteButton.textContent =
                    "DELETE REVIEW";

            }

        };


    // ========================================================
    // UPDATE REVIEW
    // ========================================================

    submitButton.onclick =
        async () => {

            await updateExistingReview(
                review.id
            );

        };

}


// ============================================================
// DISABLE FORM
// ============================================================

function disableForm() {

    if (submitButton) {

        submitButton.disabled =
            true;

    }

    disableReviewInputs();

}


// ============================================================
// DISABLE REVIEW INPUTS
// ============================================================

function disableReviewInputs() {

    document
        .querySelectorAll(
            ".star, input, textarea"
        )
        .forEach(
            element => {

                element.disabled =
                    true;

            }
        );

}


// ============================================================
// MESSAGE
// ============================================================

function showMessage(
    text,
    type
) {

    if (!message) {
        return;
    }

    message.textContent =
        text;

    message.className =
        `message ${type}`;

}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHtml(
    value
) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}