import { auth } from "./firebase.js";
import { Profile } from "./profileStore.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "signup.html";

        return;

    }

    const profile = await Profile.get();

document.getElementById("firstName").value =
    profile.firstName || "";

document.getElementById("lastName").value =
    profile.lastName || "";

document.getElementById("profilePhone").value =
    profile.phone || "";

document.getElementById("gender").value =
    profile.gender || "";

document.getElementById("dob").value =
    profile.dob || "";

const fullName = [
    profile.firstName,
    profile.lastName
].join(" ").trim();

document.getElementById("accountName").textContent =
    fullName || "Complete your profile";

document.getElementById("accountEmail").textContent =
    user.email;

});

document.getElementById("saveProfileBtn").onclick = async () => {

    const profile = {

        firstName: document.getElementById("firstName").value.trim(),

        lastName: document.getElementById("lastName").value.trim(),

        phone: document.getElementById("profilePhone").value.trim(),

        gender: document.getElementById("gender").value,

        dob: document.getElementById("dob").value

    };

   await Profile.update(profile);

document.getElementById("accountName").textContent =
    (profile.firstName + " " + profile.lastName).trim() ||
    "Complete your profile";

alert("Profile updated successfully.");

window.location.href = "index.html";

};
document.getElementById("myOrdersBtn").onclick = () => {

    window.location.href = "my-orders.html";

};
document.getElementById("logoutBtn").onclick = async () => {

    await signOut(auth);

    window.location.href = "index.html";

};
