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

            window.location.href = "dashboard.html";

        }

        catch (err) {

            console.error(err);

            error.textContent = err.message;

        }

    });

}

export async function requireAdmin() {

    return new Promise((resolve) => {

        onAuthStateChanged(auth, async (user) => {

            if (!user) {

                window.location.href = "login.html";
                return;

            }

            const snap = await getDoc(
                doc(db, "users", user.uid)
            );

            if (!snap.exists()) {

                await signOut(auth);

                window.location.href = "login.html";

                return;

            }

            const data = snap.data();

            const allowedRoles = [
                "super-admin",
                "admin",
                "staff"
            ];

            if (
                !data.active ||
                !allowedRoles.includes(data.role)
            ) {

                await signOut(auth);

                window.location.href = "login.html";

                return;

            }

            resolve(data);

        });

    });

}
