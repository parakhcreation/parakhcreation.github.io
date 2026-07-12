import { auth, db } from "./firebase.js";

import {
    doc,
    getDoc,
    updateDoc,
    arrayUnion,
    arrayRemove
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";



export async function getWishlist(){

    const user = auth.currentUser;

    if(!user) return [];

    const snap = await getDoc(doc(db,"users",user.uid));

    if(!snap.exists()) return [];

    return snap.data().wishlist || [];

}



export async function isWishlisted(productId){

    const list = await getWishlist();

    return list.includes(productId);

}



export async function addToWishlist(productId){

    const user = auth.currentUser;

    if(!user){

        window.location.href="login.html";

        return;

    }

    await updateDoc(doc(db,"users",user.uid),{

        wishlist:arrayUnion(productId)

    });

}



export async function removeFromWishlist(productId){

    const user = auth.currentUser;

    if(!user) return;

    await updateDoc(doc(db,"users",user.uid),{

        wishlist:arrayRemove(productId)

    });

}



export async function toggleWishlist(productId){

    const exists = await isWishlisted(productId);

    if(exists){

        await removeFromWishlist(productId);

        return false;

    }

    else{

        await addToWishlist(productId);

        return true;

    }

}
