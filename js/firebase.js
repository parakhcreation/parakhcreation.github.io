// ===============================
// Firebase Configuration
// ===============================

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {

    getFirestore,

    collection,

    getDocs,

    doc,

    setDoc

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

console.log("✅ Firebase Connected Successfully!");

async function getProducts() {

    const SHEET_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSoOi31SJkVFXK7OCiqavDorxm9lw_iK4WeY1PLviq5sM5yt61P9kHWjxIqLgtc66jgQP3O1FQ2Mfqf/pub?output=csv";

    const response = await fetch(SHEET_URL);

    const csv = await response.text();

    const results = Papa.parse(csv, {

        header: true,

        skipEmptyLines: true

    });

   const products = results.data.filter(product =>
    product.id &&
    product.id.trim() !== ""
);

return products;

}

export {
    db,
    auth,
    getProducts
};
