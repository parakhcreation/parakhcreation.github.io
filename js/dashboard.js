import { auth, getProducts } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const totalProducts = document.getElementById("totalProducts");
const totalSarees = document.getElementById("totalSarees");
const totalSuits = document.getElementById("totalSuits");
const productsTable = document.getElementById("productsTable");
const logoutBtn = document.getElementById("logoutBtn");

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    const products = await getProducts();
    console.log(products);
console.log("Length:", products.length);
console.log("Total element:", totalProducts);

    totalProducts.textContent = products.length;

    const sarees = products.filter(p => p.category === "saree");
    const suits = products.filter(p => p.category === "suit");

    totalSarees.textContent = sarees.length;
    totalSuits.textContent = suits.length;

    productsTable.innerHTML = "";

    products.forEach(product => {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>₹${product.price}</td>
            <td>${product.available ? "Available" : "Out of Stock"}</td>
            <td>
                <button>Edit</button>
                <button>Delete</button>
            </td>
        `;

        productsTable.appendChild(row);

    });

});

logoutBtn.addEventListener("click", async () => {

    await signOut(auth);

    window.location.href = "login.html";

});
