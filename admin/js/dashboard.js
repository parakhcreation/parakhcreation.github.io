import { auth } from "./firebase.js";
import { requireAdmin } from "./auth.js";
import {
    signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

// Protect this page
await requireAdmin();

// Logout
document
    .getElementById("logoutBtn")
    .addEventListener("click", async () => {

        await signOut(auth);

        window.location.href = "login.html";

    });
