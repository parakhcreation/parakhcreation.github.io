// ============================================================
// REVIEW STORE
// Handles customer product reviews.
// This module is intentionally separate from orders/cart/checkout.
// ============================================================

import {
    db,
    auth
} from "./firebase.js";

import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    addDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


// ============================================================
// AUTH
// ============================================================

export function getCurrentReviewUser() {

    return auth.currentUser || null;

}


// ============================================================
// GET ORDER
// Used to verify/load the customer's purchased product.
// ============================================================

export async function getReviewOrder(orderId) {

    if (!orderId) {
        throw new Error("Order ID is required.");
    }

    const orderRef =
        doc(db, "orders", orderId);

    const snapshot =
        await getDoc(orderRef);

    if (!snapshot.exists()) {
        throw new Error("Order not found.");
    }

    return {
        id: snapshot.id,
        ...snapshot.data()
    };

}


// ============================================================
// FIND EXISTING REVIEW
// One review per user + order + product.
// ============================================================

export async function getExistingReview(
    orderId,
    productId
) {

    const user = auth.currentUser;

    if (!user) {

        throw new Error(
            "You must be logged in."
        );

    }

    if (!orderId || !productId) {

        throw new Error(
            "Order ID and Product ID are required."
        );

    }


    const reviewsRef =
        collection(
            db,
            "reviews"
        );


    /*
     * IMPORTANT:
     *
     * We explicitly include userId in the query.
     *
     * This matches the Firestore rule:
     *
     * resource.data.userId == request.auth.uid
     *
     * and prevents the customer from querying
     * other customers' reviews.
     */

    const q = query(

        reviewsRef,

        where(
            "userId",
            "==",
            user.uid
        ),

        where(
            "orderId",
            "==",
            orderId
        ),

        where(
            "productId",
            "==",
            productId
        )

    );


    const snapshot =
        await getDocs(q);


    if (snapshot.empty) {

        return null;

    }


    const reviewDoc =
        snapshot.docs[0];


    return {

        id:
            reviewDoc.id,

        ...reviewDoc.data()

    };

}


// ============================================================
// CREATE REVIEW
// ============================================================

export async function createReview({

    orderId,
    productId,

    rating,
    title,
    comment,

    reviewerName,

    images = [],
    video = null

}) {

    console.log(
    "NEW reviewStore.js IS RUNNING",
    reviewerName
);

    const user = auth.currentUser;

    if (!user) {
        throw new Error("You must be logged in.");
    }

    if (!orderId) {
        throw new Error("Order ID is required.");
    }

    if (!productId) {
        throw new Error("Product ID is required.");
    }

    if (
        !Number.isInteger(rating) ||
        rating < 1 ||
        rating > 5
    ) {

        throw new Error(
            "Please select a rating from 1 to 5."
        );

    }

    const existingReview =
        await getExistingReview(
            orderId,
            productId
        );

    if (existingReview) {

        throw new Error(
            "You have already reviewed this product."
        );

    }

    const reviewData = {

    userId: user.uid,

    orderId,

    productId,

    rating,

    title: title?.trim() || "",

    comment: comment?.trim() || "",

    reviewerName:
        reviewerName?.trim() || "Customer",

    images,

    video,

    verifiedPurchase: true,
    

        status: "pending",

        createdAt: serverTimestamp(),

        updatedAt: serverTimestamp()

    };

    const reviewRef =
        await addDoc(
            collection(db, "reviews"),
            reviewData
        );

    return reviewRef.id;

}


// ============================================================
// UPDATE REVIEW
// ============================================================

export async function updateReview(
    reviewId,
    {
        rating,
        title,
        comment,
        images = [],
        video = null
    }
) {

    const user = auth.currentUser;

    if (!user) {
        throw new Error("You must be logged in.");
    }

    if (!reviewId) {
        throw new Error("Review ID is required.");
    }

    if (
        !Number.isInteger(rating) ||
        rating < 1 ||
        rating > 5
    ) {

        throw new Error(
            "Please select a rating from 1 to 5."
        );

    }

    const reviewRef =
        doc(
            db,
            "reviews",
            reviewId
        );

    const snapshot =
        await getDoc(reviewRef);

    if (!snapshot.exists()) {
        throw new Error("Review not found.");
    }

    const review =
        snapshot.data();

    if (
        review.userId !== user.uid
    ) {

        throw new Error(
            "You can only edit your own review."
        );

    }

    await updateDoc(
        reviewRef,
        {

            rating,

            title:
                title?.trim() || "",

            comment:
                comment?.trim() || "",

            images,

            video,

            updatedAt:
                serverTimestamp()

        }
    );

}


// ============================================================
// DELETE REVIEW
// ============================================================

export async function deleteReview(
    reviewId
) {

    const user = auth.currentUser;

    if (!user) {
        throw new Error("You must be logged in.");
    }

    if (!reviewId) {
        throw new Error("Review ID is required.");
    }

    const reviewRef =
        doc(
            db,
            "reviews",
            reviewId
        );

    const snapshot =
        await getDoc(reviewRef);

    if (!snapshot.exists()) {
        throw new Error("Review not found.");
    }

    const review =
        snapshot.data();

    if (
        review.userId !== user.uid
    ) {

        throw new Error(
            "You can only delete your own review."
        );

    }

    await deleteDoc(reviewRef);

}


// ============================================================
// GET APPROVED REVIEWS FOR A PRODUCT
// Used later by product.html.
// ============================================================

export async function getProductReviews(
    productId
) {

    if (!productId) {
        throw new Error("Product ID is required.");
    }

    const reviewsRef =
        collection(db, "reviews");

    const q = query(
        reviewsRef,

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
        await getDocs(q);

    return snapshot.docs.map(
        reviewDoc => ({

            id: reviewDoc.id,

            ...reviewDoc.data()

        })
    );

}