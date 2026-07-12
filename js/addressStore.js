import { auth, db } from "./firebase.js";

import {
    doc,
    getDoc,
    updateDoc
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

export const Address = {

    async getAll() {

        const userRef = await getUserRef();

        if (!userRef) return [];

        const snap = await getDoc(userRef);

        if (!snap.exists()) return [];

        return snap.data().addresses || [];

    },

    async add(address) {

        const userRef = await getUserRef();

        if (!userRef) return;

        const snap = await getDoc(userRef);

        let addresses = snap.data().addresses || [];

        if (address.isDefault) {

            addresses.forEach(a => a.isDefault = false);

        }

        address.id = crypto.randomUUID();

        addresses.push(address);

        await updateDoc(userRef, {

            addresses

        });

    },

    async update(id, updatedAddress) {

        const userRef = await getUserRef();

        if (!userRef) return;

        const snap = await getDoc(userRef);

        let addresses = snap.data().addresses || [];

        if (updatedAddress.isDefault) {

            addresses.forEach(a => a.isDefault = false);

        }

        addresses = addresses.map(address =>

            address.id === id

                ? { ...updatedAddress, id }

                : address

        );

        await updateDoc(userRef, {

            addresses

        });

    },

    async remove(id) {

        const userRef = await getUserRef();

        if (!userRef) return;

        const snap = await getDoc(userRef);

        const addresses =

            (snap.data().addresses || [])

            .filter(address => address.id !== id);

        await updateDoc(userRef, {

            addresses

        });

    },

    async setDefault(id) {

        const userRef = await getUserRef();

        if (!userRef) return;

        const snap = await getDoc(userRef);

        let addresses = snap.data().addresses || [];

        addresses = addresses.map(address => ({

            ...address,

            isDefault: address.id === id

        }));

        await updateDoc(userRef, {

            addresses

        });

    }

};
