import { auth, db } from "./firebase.js";

import {
    doc,
    getDoc,
    updateDoc,
    setDoc
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

async function getUserDoc() {

    const user = auth.currentUser || await waitForUser();

    if (!user) return null;

    return doc(db, "users", user.uid);

}

function updateCartBadge(count) {

    const badge = document.getElementById("cartCount");

    if (!badge) return;

    badge.textContent = count;

}

export const Cart = {

    async getAll() {

        const userRef = await getUserDoc();

        if (!userRef) return {};

        const snap = await getDoc(userRef);

        if (!snap.exists()) return {};

        return snap.data().cart || {};

    },

    async add(id, size = "") {

        const userRef = await getUserDoc();

        if (!userRef) return;

        const snap = await getDoc(userRef);

        let cart = {};

        if (snap.exists()) {

            cart = snap.data().cart || {};

        }

        const key = size ? `${id}_${size}` : id;

cart[key] = (cart[key] || 0) + 1;

        await setDoc(userRef, {

            cart

        }, {

            merge: true

        });

        updateCartBadge(

            Object.values(cart).reduce(

                (a,b)=>a+b,

                0

            )

        );

    },

    async remove(id) {

        const userRef = await getUserDoc();

        if (!userRef) return;

        const snap = await getDoc(userRef);

        if (!snap.exists()) return;

        let cart = snap.data().cart || {};

        delete cart[id];

        await updateDoc(userRef, {

            cart

        });

        updateCartBadge(

            Object.values(cart).reduce(

                (a,b)=>a+b,

                0

            )

        );

    },
    async update(id, quantity) {

    const userRef = await getUserDoc();

    if (!userRef) return;

    const snap = await getDoc(userRef);

    if (!snap.exists()) return;

    let cart = snap.data().cart || {};

    cart[id] = quantity;

    await updateDoc(userRef, {

        cart

    });

    updateCartBadge(

        Object.values(cart).reduce(

            (a,b)=>a+b,

            0

        )

    );

},
    async save(cart) {

    const userRef = await getUserDoc();

    if (!userRef) return;

    await updateDoc(userRef, {

        cart

    });

    updateCartBadge(

        Object.values(cart).reduce(

            (a,b)=>a+b,

            0

        )

    );

},

async clear() {

    const userRef = await getUserDoc();

    if (!userRef) return;

    await updateDoc(userRef, {

        cart: {}

    });

    updateCartBadge(0);

},

};

(async()=>{

    const cart=await Cart.getAll();

    updateCartBadge(

        Object.values(cart).reduce(

            (a,b)=>a+b,

            0

        )

    );

})();
