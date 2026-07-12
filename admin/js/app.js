import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", async () => {

        await signOut(auth);

        window.location.href = "login.html";

    });

}

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";

        return;

    }

    const snap = await getDoc(doc(db, "users", user.uid));

    if (!snap.exists()) {

        await signOut(auth);

        window.location.href = "login.html";

        return;

    }

    const data = snap.data();

    const allowedRoles = [
        "staff",
        "admin",
        "super-admin"
    ];

    if (!data.active || !allowedRoles.includes(data.role)) {

        await signOut(auth);

        window.location.href = "login.html";

    }

});
