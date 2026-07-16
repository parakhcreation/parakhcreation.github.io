import { db } from "./firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {
    createProductCard
} from "./main.js";

const params = new URLSearchParams(window.location.search);
const query = (params.get("q") || "").trim();

document.getElementById("searchHeading").textContent =
    `Search Results for "${query}"`;

const snapshot = await getDocs(collection(db, "products"));

const products = snapshot.docs.map(doc => doc.data());

console.log("Products loaded:", products.length);

const fuse = new Fuse(products, {
    includeScore: true,
    threshold: 0.35,
    ignoreLocation: true,
    keys: [
        {name: "name", weight: 5},
        {name: "keywords", weight: 4},
        {name: "occasion", weight: 4},
        {name: "collection", weight: 3},
        {name: "category", weight: 3},
        {name: "fabric", weight: 2},
        {name: "colour", weight: 2},
        {name: "description", weight: 1}
    ]
});

const results = query
    ? fuse.search(query).map(r => r.item)
    : products;

const searchResults =
    document.getElementById("searchResults");


function createSearchCard(product) {

    return `

<div class="search-card"

data-id="${product.id}">

<div class="search-image">

<img

src="${product.thumbnail}"

alt="${product.name}"

loading="lazy">

</div>

<div class="search-body">

<h3>

${product.name}

</h3>

<p class="search-price">

₹${product.price.toLocaleString("en-IN")}

</p>

<p class="search-meta">

${product.fabric}

•

${product.colour}

</p>

<p class="search-collection">

${product.collection || ""}

</p>

<button
    class="search-cart"
    type="button">

    View Details

</button>

</div>

</div>

`;

}
searchResults.innerHTML =
    results
        .map(createSearchCard)
        .join("");

      searchResults
    .querySelectorAll(".search-card")
    .forEach((card) => {

        card.addEventListener("click", () => {

            localStorage.setItem(
                "lastShoppingPage",
                window.location.href
            );

            localStorage.setItem(
                "lastScrollPosition",
                window.scrollY
            );

            window.location.href =
                `product.html?id=${card.dataset.id}`;

        });

    });
console.log(results);

document.getElementById("searchCount").textContent =
    `${results.length} product(s) found`;