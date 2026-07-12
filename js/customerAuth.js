import { auth, db } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

/* ===========================
   SIGNUP
=========================== */

const signupForm = document.getElementById("signupForm");

if (signupForm) {

    signupForm.addEventListener("submit", signupUser);

}

async function signupUser(e) {

    e.preventDefault();

    const name = document.getElementById("name").value.trim();

    const email = document.getElementById("email").value.trim();

    const phone = document.getElementById("phone").value.trim();

    const password = document.getElementById("password").value;

    const confirm = document.getElementById("confirmPassword").value;

    if (password !== confirm) {

        alert("Passwords do not match.");

        return;

    }

    try {

        const cred = await createUserWithEmailAndPassword(

            auth,
            email,
            password

        );

        await setDoc(

            doc(db, "users", cred.user.uid),

            {

                uid: cred.user.uid,

                name,

                email,

                phone,

                role: "customer",

                createdAt: serverTimestamp()

            }

        );

        alert("Account created successfully.");

        window.location.href = "login.html";

    }

    catch (err) {

        alert(err.message);

    }

}

/* ===========================
   LOGIN
=========================== */

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", loginUser);

}

async function loginUser(e) {

    e.preventDefault();

    const email = document.getElementById("email").value.trim();

    const password = document.getElementById("password").value;

    try {

        await signInWithEmailAndPassword(
    auth,
    email,
    password
);

window.location.href = "index.html";

    }

    catch (err) {

        alert(err.message);

    }

}

/* ===========================
   ACCOUNT
=========================== */

const accountName = document.getElementById("accountName");

const accountEmail = document.getElementById("accountEmail");

const logoutBtn = document.getElementById("logoutBtn");

onAuthStateChanged(auth, async(user)=>{

    if(!accountName) return;

    if(!user){

        window.location.href="login.html";

        return;

    }

    const snap=await getDoc(

        doc(db,"users",user.uid)

    );

    if(snap.exists()){

        const data=snap.data();

        accountName.textContent=data.name;

        accountEmail.textContent=data.email;

    }

});

if(logoutBtn){

    logoutBtn.onclick=async()=>{

        await signOut(auth);

        window.location.href="index.html";

    }

}

/* ===========================
   NAVBAR ACCOUNT BUTTON
=========================== */

const accountBtn = document.getElementById("accountBtn");

if (accountBtn) {

    onAuthStateChanged(auth, (user) => {

        if (user) {

            accountBtn.title = "My Account";

            accountBtn.onclick = () => {

                window.location.href = "account.html";

            };

        }

        else {

            accountBtn.title = "Login";

            accountBtn.onclick = () => {

                window.location.href = "login.html";

            };

        }

    });

}
