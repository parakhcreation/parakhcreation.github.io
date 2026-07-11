import { auth } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

// If already logged in, go straight to dashboard
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.location.href = "dashboard.html";
    }
});

const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email = document.getElementById("email").value.trim();

    const password = document.getElementById("password").value;

    const errorMessage = document.getElementById("errorMessage");

    errorMessage.textContent = "";

    try {

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        window.location.href = "dashboard.html";

    }
    catch (error) {

        switch (error.code) {

            case "auth/invalid-credential":
                errorMessage.textContent =
                    "Incorrect email or password.";
                break;

            case "auth/invalid-email":
                errorMessage.textContent =
                    "Invalid email address.";
                break;

            case "auth/network-request-failed":
                errorMessage.textContent =
                    "Network error. Check your internet connection.";
                break;

            default:
                errorMessage.textContent =
                    error.message;
        }

    }

});
