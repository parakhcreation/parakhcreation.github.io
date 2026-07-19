

import {
    doc,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


import { auth, db } from "./firebase.js";

import { requireAdmin } from "./auth.js";

await requireAdmin();
const seedBtn =
document.getElementById("seedMasterData");

const status =
document.getElementById("status");

seedBtn.addEventListener("click", seedMasterData);


const MASTER_DATA = {

    colours: [
        "Black","Charcoal","Graphite","Grey","Slate Grey","Ash Grey","Silver",
        "White","Off White","Ivory","Cream","Pearl White",
        "Red","Crimson","Maroon","Wine","Burgundy","Cherry","Brick Red","Rust",
        "Pink","Baby Pink","Blush Pink","Rose Pink","Hot Pink","Fuchsia","Magenta","Peach","Coral",
        "Purple","Lavender","Lilac","Violet","Plum","Mauve","Amethyst",
        "Blue","Sky Blue","Powder Blue","Baby Blue","Royal Blue","Navy Blue","Midnight Blue","Cobalt Blue","Indigo","Turquoise","Teal","Aqua",
        "Green","Olive","Bottle Green","Emerald","Sea Green","Sage","Mint","Lime","Forest Green",
        "Yellow","Mustard","Golden Yellow","Lemon Yellow","Amber",
        "Orange","Burnt Orange","Tangerine",
        "Brown","Coffee Brown","Chocolate Brown","Camel Brown","Tan","Mocha","Beige","Khaki",
        "Gold","Rose Gold","Bronze","Copper",
        "Multi"
    ],

    fabrics: [
        "Cotton","Silk","Linen","Chiffon","Georgette","Crepe","Organza",
        "Net","Velvet","Rayon","Viscose","Satin","Banarasi Silk",
        "Tussar Silk","Kanjivaram Silk","Pashmina","Wool","Khadi"
    ],

    collections: [
        "Wedding","Bridal","Festive","Party Wear","Casual",
        "Office Wear","Daily Wear","Designer","Premium",
        "Traditional","Handloom","Exclusive"
    ],

    categories: [
        "Saree","Suit","Lehenga","Kurti",
        "Dress Material","Dupatta","Blouse","Gown"
    ]

};

async function seedMasterData() {

    status.innerHTML = "Seeding Master Data...";

    try {

        for (const [docName, values] of Object.entries(MASTER_DATA)) {

            await setDoc(

                doc(db, "masterData", docName),

                {
                    values: values
                },

                {
                    merge: true
                }

            );

        }

        status.innerHTML =
            "✅ Master Data Seeded Successfully!";

    }

    catch (error) {

        console.error(error);

        status.innerHTML =
            "❌ " + error.message;

    }

}
