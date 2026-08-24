// ===============================
// Firebase Configuration
// ===============================

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    getStorage
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";

import {

    getFirestore,

    collection,

    getDocs,

    doc,

    setDoc,

    getDoc,

    updateDoc,

    arrayUnion,

    arrayRemove,

    query,

    where,

    orderBy,

    limit

}

from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyA8kJk3IlZvtbgdGSXjEUeQyvctYDtZpRA",
    authDomain: "parakh-creation-website.firebaseapp.com",
    projectId: "parakh-creation-website",
    storageBucket: "parakh-creation-website.firebasestorage.app",
    messagingSenderId: "957807664051",
    appId: "1:957807664051:web:f1a1cbeb2628a214bf09c6",
    measurementId: "G-0JQC4PGDYK"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);

const storage = getStorage(app);

console.log("✅ Firebase Connected Successfully!");

async function getProducts() {

    const snapshot = await getDocs(collection(db, "products"));

    const products = [];

    snapshot.forEach((docSnap) => {

        products.push({
            id: docSnap.id,
            ...docSnap.data()
        });

    });

    return products;

}

export {
    db,
    auth,
    storage,
    getProducts
};
