import { db } from "./firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

export async function getNextProductId(prefix){

    const snapshot = await getDocs(collection(db,"products"));

    let max = 0;

    snapshot.forEach(doc=>{

        const product = doc.data();

        if(!product.id) return;

        if(product.id.startsWith(prefix)){

            const number = parseInt(
                product.id.replace(prefix,"")
            );

            if(number>max){

                max = number;

            }

        }

    });

    return prefix + String(max+1).padStart(4,"0");

}
