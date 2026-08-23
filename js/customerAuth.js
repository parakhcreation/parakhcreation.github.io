import { auth, db } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    verifyPasswordResetCode,
    confirmPasswordReset,
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

    const firstName = document.getElementById("firstName").value.trim();

const lastName = document.getElementById("lastName").value.trim();

const name = `${firstName} ${lastName}`.trim();

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

        firstName,

        lastName,

        name,

        email,

        phone,

        role: "customer",

        wishlist: [],

        cart: {},

        profile: {

            firstName,

            lastName,

            phone,

            gender: "",

            dob: ""

        },

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

// ===============================
// FORGOT PASSWORD
// ===============================

const forgotPasswordForm = document.getElementById("forgotPasswordForm");

if (forgotPasswordForm) {

    forgotPasswordForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const email = document.getElementById("resetEmail").value.trim();
        const message = document.getElementById("resetMessage");
        const button = forgotPasswordForm.querySelector("button");

        if (!email) {
            message.textContent = "Please enter your email address.";
            return;
        }

        button.disabled = true;
        button.textContent = "Sending...";

        try {

            await sendPasswordResetEmail(auth, email);

            message.textContent =
                "If an account exists with this email, a password reset link has been sent. Please check your inbox.";

            message.style.color = "#0d4b43";

            forgotPasswordForm.reset();

        } catch (error) {

            console.error("Password reset error:", error);

            message.textContent =
                "Unable to send the reset email. Please check the email address and try again.";

            message.style.color = "#8c1d40";

        } finally {

            button.disabled = false;
            button.textContent = "Send Reset Link";

        }

    });

}

/* ===========================
   RESET PASSWORD
=========================== */

const resetPasswordForm = document.getElementById("resetPasswordForm");

if (resetPasswordForm) {

    const resetMessage = document.getElementById("resetPasswordMessage");
    const resetButton = document.getElementById("resetPasswordButton");

    const urlParams = new URLSearchParams(window.location.search);

    const mode = urlParams.get("mode");
    const oobCode = urlParams.get("oobCode");

    // Make sure this is a Firebase password-reset link
    if (mode !== "resetPassword" || !oobCode) {

        resetMessage.textContent =
            "This password reset link is invalid or incomplete.";

        resetMessage.style.color = "#8c1d40";

        resetButton.disabled = true;

    } else {

        // Verify that the reset code is valid
        verifyPasswordResetCode(auth, oobCode)
            .then(() => {

                // Reset link is valid.
                resetButton.disabled = false;

            })
            .catch((error) => {

                console.error("Password reset verification error:", error);

                resetMessage.textContent =
                    "This password reset link has expired or is no longer valid. Please request a new reset link.";

                resetMessage.style.color = "#8c1d40";

                resetButton.disabled = true;

            });


        resetPasswordForm.addEventListener("submit", async (e) => {

            e.preventDefault();

            const newPassword =
                document.getElementById("newPassword").value;

            const confirmNewPassword =
                document.getElementById("confirmNewPassword").value;


            // Check password length
            if (newPassword.length < 6) {

                resetMessage.textContent =
                    "Password must be at least 6 characters long.";

                resetMessage.style.color = "#8c1d40";

                return;

            }


            // Check passwords match
            if (newPassword !== confirmNewPassword) {

                resetMessage.textContent =
                    "The passwords do not match.";

                resetMessage.style.color = "#8c1d40";

                return;

            }


            resetButton.disabled = true;
            resetButton.textContent = "Resetting...";


            try {

                await confirmPasswordReset(
                    auth,
                    oobCode,
                    newPassword
                );


                resetMessage.textContent =
                    "Your password has been successfully changed. You can now log in with your new password.";

                resetMessage.style.color = "#0d4b43";


                resetPasswordForm.reset();

                resetButton.textContent = "Password Reset Successfully";


                // Give the user a moment to read the message,
                // then return to the login page.
                setTimeout(() => {

                    window.location.href = "login.html";

                }, 2500);


            } catch (error) {

                console.error("Password reset error:", error);

                resetButton.disabled = false;
                resetButton.textContent = "Reset Password";


                if (error.code === "auth/expired-action-code") {

                    resetMessage.textContent =
                        "This password reset link has expired. Please request a new one.";

                } else if (error.code === "auth/invalid-action-code") {

                    resetMessage.textContent =
                        "This password reset link is invalid or has already been used.";

                } else if (error.code === "auth/weak-password") {

                    resetMessage.textContent =
                        "Please choose a stronger password.";

                } else {

                    resetMessage.textContent =
                        "Something went wrong while resetting your password. Please try again.";

                }

                resetMessage.style.color = "#8c1d40";

            }

        });

    }

}
