import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    query,
    where,
    orderBy
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

export async function getCategories() {

    const q = query(
        collection(db, "categories"),
        where("active", "==", true),
        orderBy("displayOrder")
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}
