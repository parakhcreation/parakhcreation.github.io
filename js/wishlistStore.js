import { db } from "./firebase.js";

import {
    doc,
    getDoc,
    updateDoc,
    arrayUnion,
    arrayRemove
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {
    auth
} from "./firebase.js";



import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

function waitForUser() {
    return new Promise(resolve => {
        const unsubscribe = onAuthStateChanged(auth, user => {
            unsubscribe();
            resolve(user);
        });
    });
}

function updateWishlistBadge(count) {

    const badge = document.getElementById("wishlistCount");

    if (!badge) return;

    badge.textContent = count;

}

async function getUserDoc() {

    const user = auth.currentUser || await waitForUser();

    if (!user) return null;

    return doc(db, "users", user.uid);

}

export const Wishlist = {

    async getAll() {

        const userRef = await getUserDoc();

        if (!userRef) return [];

        const snap = await getDoc(userRef);

        if (!snap.exists()) return [];

        return snap.data().wishlist || [];

    },

  async has(id) {

    const list = await this.getAll();

    return list.includes(id);

},

    async add(id) {

        const userRef = await getUserDoc();

        if (!userRef) {

            alert("Please login first.");

            window.location = "login.html";

            return;

        }

        await updateDoc(userRef, {

            wishlist: arrayUnion(id)

        });
        const list = await this.getAll();
updateWishlistBadge(list.length);

    },

    async remove(id) {

        const userRef = await getUserDoc();

        if (!userRef) return;

        await updateDoc(userRef, {

            wishlist: arrayRemove(id)

        });
    const list = await this.getAll();
updateWishlistBadge(list.length);
    },

    async toggle(id) {

        if (await this.has(id)) {

            await this.remove(id);

            return false;

        }

        else {

            await this.add(id);

            return true;

        }

    }

};
(async function () {

    const list = await Wishlist.getAll();

    updateWishlistBadge(list.length);

})();
