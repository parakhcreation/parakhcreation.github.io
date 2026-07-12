import { auth, db } from "./firebase.js";

import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

function waitForUser() {

    return new Promise(resolve => {

        const unsubscribe = onAuthStateChanged(auth, user => {

            unsubscribe();

            resolve(user);

        });

    });

}

async function getUserRef() {

    const user = auth.currentUser || await waitForUser();

    if (!user) return null;

    return doc(db, "users", user.uid);

}

export const Profile = {

    async get() {

        const userRef = await getUserRef();

        if (!userRef) return null;

        const snap = await getDoc(userRef);

        if (!snap.exists()) return null;

        return snap.data().profile || {};

    },

    async createIfMissing() {

        const user = auth.currentUser || await waitForUser();

        if (!user) return;

        const userRef = doc(db, "users", user.uid);

        const snap = await getDoc(userRef);

        if (!snap.exists()) {

            await setDoc(userRef, {

                email: user.email,

                profile: {

                    firstName: "",

                    lastName: "",

                    phone: "",

                    gender: "",

                    dob: ""

                },

                addresses: [],

                wishlist: [],

                cart: {},

                createdAt: serverTimestamp(),

                lastLogin: serverTimestamp()

            });

            return;

        }

        const data = snap.data();

        const updates = {};

        if (!data.profile) {

            updates.profile = {

                firstName: "",

                lastName: "",

                phone: "",

                gender: "",

                dob: ""

            };

        }

        if (!data.addresses) {

            updates.addresses = [];

        }

        if (!data.cart) {

            updates.cart = {};

        }

        if (!data.wishlist) {

            updates.wishlist = [];

        }

        updates.lastLogin = serverTimestamp();

        if (Object.keys(updates).length > 0) {

            await updateDoc(userRef, updates);

        }

    },

    async update(profile) {

        const userRef = await getUserRef();

        if (!userRef) return;

        await updateDoc(userRef, {

            profile

        });

    }

};

(async () => {

    await Profile.createIfMissing();

})();
