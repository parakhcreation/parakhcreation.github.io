import { auth, db } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const error = document.getElementById("error");

        error.textContent = "";

        try {

            const credential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            const uid = credential.user.uid;

            const userRef = doc(db, "users", uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {

                await signOut(auth);
                error.textContent = "User record not found.";

                return;

            }

            const user = userSnap.data();

            if (!user.active) {

                await signOut(auth);
                error.textContent = "Account has been disabled.";

                return;

            }

            const allowedRoles = [
                "staff",
                "admin",
                "super-admin"
            ];

            if (!allowedRoles.includes(user.role)) {

                await signOut(auth);
                error.textContent = "You are not authorised to access the admin panel.";

                return;

            }

            window.location.href = "index.html";

        }

        catch (err) {

            console.error(err);

            error.textContent = err.message;

        }

    });

}
