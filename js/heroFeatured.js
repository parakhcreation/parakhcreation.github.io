import { db } from "./firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

let products = [];

async function init(){

    const snapshot = await getDocs(collection(db,"products"));

    snapshot.forEach(doc=>{

        const p = doc.data();

        if(p.featured){

            products.push(p);

        }

    });

    shuffle(products);

    showSet(products.slice(0,3));

    setInterval(changeProducts,2000);

}

function showSet(set){

    for(let i=1;i<=3;i++){

        const img=document.getElementById(`heroImg${i}`);

        const card=document.getElementById(`heroCard${i}`);

        img.src=set[i-1].thumbnail;
        img.alt=set[i-1].name;

        card.href=`product.html?id=${set[i-1].id}`;

    }

}

function changeProducts(){

    const next=getRandomThree();

    for(let i=1;i<=3;i++){

        animateCard(i,next[i-1]);

    }

}

function animateCard(index,product){

    const img=document.getElementById(`heroImg${index}`);

    const card=document.getElementById(`heroCard${index}`);

    img.classList.add("slideOutLeft");

    img.addEventListener("animationend",function handler(){

        img.removeEventListener("animationend",handler);

        img.classList.remove("slideOutLeft");

        img.src=product.thumbnail;

        img.alt=product.name;

        card.href=`product.html?id=${product.id}`;

        img.classList.add("slideInRight");

        img.addEventListener("animationend",function handler2(){

            img.removeEventListener("animationend",handler2);

            img.classList.remove("slideInRight");

        });

    });

}

function getRandomThree(){

    const copy=[...products];

    shuffle(copy);

    return copy.slice(0,3);

}

function shuffle(array){

    for(let i=array.length-1;i>0;i--){

        const j=Math.floor(Math.random()*(i+1));

        [array[i],array[j]]=[array[j],array[i]];

    }

}

init();