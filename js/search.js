import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import { COLOURS } from "./data/colours.js";



const params = new URLSearchParams(window.location.search);

const categoryQuery =
    (params.get("category") || "").trim().toLowerCase();
const searchQuery =
    (params.get("q") || "").trim();

if (categoryQuery) {

    document.getElementById("searchHeading").textContent =
        categoryQuery.charAt(0).toUpperCase() +
        categoryQuery.slice(1);

}
else {

    document.getElementById("searchHeading").textContent =
        `Search Results for "${searchQuery}"`;

}

const snapshot = await getDocs(collection(db, "products"));

const products = snapshot.docs.map(doc => doc.data());

let activeFilters = {};

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

let currentResults;

if (categoryQuery) {

    currentResults = products.filter(product =>
        (product.category || "").toLowerCase() === categoryQuery
    );

}
else if (searchQuery) {

    currentResults =
        fuse.search(searchQuery).map(r => r.item);

}
else {

    currentResults = products;

}

    let browsingMode = false;

    buildFilters(products);

const searchResults =
    document.getElementById("searchResults");

// ============================================================
// APPROVED PRODUCT RATINGS
// ============================================================

const productRatings = {};

async function loadProductRatings() {

    try {

        const reviewsQuery =
            query(
                collection(db, "reviews"),
                where(
                    "status",
                    "==",
                    "approved"
                )
            );

        const snapshot =
            await getDocs(
                reviewsQuery
            );

        snapshot.forEach(reviewDoc => {

            const review =
                reviewDoc.data();

            const productId =
                review.productId;

            if (!productId) {
                return;
            }

            if (!productRatings[productId]) {

                productRatings[productId] = {
                    total: 0,
                    count: 0
                };

            }

            productRatings[productId].total +=
                Number(review.rating || 0);

            productRatings[productId].count +=
                1;

        });

        Object.keys(productRatings)
            .forEach(productId => {

                const data =
                    productRatings[productId];

                data.average =
                    Math.round(
                        (
                            data.total /
                            data.count
                        ) * 10
                    ) / 10;

            });

    }

    catch (error) {

        console.error(
            "Failed to load product ratings:",
            error
        );

    }

}

function createSearchCard(product) {

    const rating =
        productRatings[product.id];

    let ratingHTML = "";

    if (
        rating &&
        rating.count > 0
    ) {

        ratingHTML = `

            <div class="card-rating">

                <span class="card-rating-number">
                    ${rating.average.toFixed(1)}
                </span>

                <span class="card-rating-star">
                    ★
                </span>

                <span class="card-rating-count">
                    (${rating.count})
                </span>

            </div>

        `;

    }

    return `

<article
    class="card"
    data-id="${product.id}">

    <div class="card-media">

        <span class="card-tag">

            ${product.category === "saree"
                ? "Saree"
                : "Suit Set"}

        </span>

        <img
            src="${product.thumbnail}"
            alt="${product.name}"
            loading="lazy">

        <div class="card-quick">

            Tap for details & enquiry

        </div>

    </div>

    <div class="card-body">

        <div class="cname">

    ${product.name}

</div>

${ratingHTML}

<div class="cmeta">

            <span class="cprice">

                ₹${Number(product.price).toLocaleString("en-IN")}

            </span>

            <span class="ccode">

                ${product.id}

            </span>

        </div>

    </div>

</article>

`;

}
await loadProductRatings();

renderProducts(currentResults);

     
console.log(currentResults);

document.getElementById("searchCount").textContent =
    `${currentResults.length} product(s) found`;


function getColourHex(name) {

    const colour = COLOURS.find(c => c.name === name);

    if (!colour) return null;

    return colour.hex;

}

function buildFilters(products) {

    const container =
        document.getElementById("filterContainer");

    if (!container) return;

    const sections = [

    {
        title: "Category",
        key: "category"
    },

    {
        title: "Fabric",
        key: "fabric"
    },

    {
        title: "Colour",
        key: "colour"
    },

    {
        title: "Work",
        key: "work"
    },

    {
        title: "Collection",
        key: "collection"
    }

];

    container.innerHTML = "";

    sections.forEach(section => {

        const values = [
    ...new Set(
        products
            .map(p => p[section.key])
            .filter(Boolean)
    )
].sort((a, b) => a.localeCompare(b));

        if (values.length === 0) return;

        const html = document.createElement("div");

        html.className = "filter-section";

        html.innerHTML = `

            <h4>${section.title}</h4>

            ${values.map(value => {

    if (section.key === "colour") {

        const hex = getColourHex(value);

        const swatch =
            hex === "rainbow"
                ? `<span class="colour-swatch rainbow"></span>`
                : `<span class="colour-swatch"
                        style="background:${hex};"></span>`;

        return `

<label class="filter-option">

<input
type="checkbox"
data-key="colour"
value="${value}">

${swatch}

${value}

</label>

`;

    }

    return `

<label class="filter-option">

<input
type="checkbox"
data-key="${section.key}"
value="${value}">

${value}

</label>

`;

}).join("")}

        `;

        container.appendChild(html);

        html.querySelectorAll("input").forEach(input => {

    input.addEventListener("change", updateFilters);

});

    });

}

function updateFilters() {

    if (!browsingMode && searchQuery) {

    browsingMode = true;

    // Clear the heading
    document.getElementById("searchHeading").textContent = "Products";

    // Clear the search box if it exists
    const searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.value = "";

    // Remove ?q=... from the URL without reloading
    const url = new URL(window.location);
    url.searchParams.delete("q");
    window.history.replaceState({}, "", url);

}

    activeFilters = {};

    document
        .querySelectorAll("#filterContainer input:checked")
        .forEach(input => {

            const key = input.dataset.key;

            if (!activeFilters[key]) {

                activeFilters[key] = [];

            }

            activeFilters[key].push(input.value);

        });

    const sourceProducts = products;

const filtered = sourceProducts.filter(product => {

        return Object.keys(activeFilters).every(key => {

            return activeFilters[key].includes(product[key]);

        });

    });

    renderProducts(sortProducts(filtered));

}
function sortProducts(products) {

    const sortValue = document.getElementById("sortSelect")?.value || "relevance";

    switch (sortValue) {

        case "priceLow":

            products.sort((a, b) =>
                Number(a.price) - Number(b.price)
            );
            break;

        case "priceHigh":

            products.sort((a, b) =>
                Number(b.price) - Number(a.price)
            );
            break;

        case "nameDesc":

    products.sort((a, b) =>
        b.name.localeCompare(a.name)
    );

    break;
            

        case "name":

            products.sort((a, b) =>
                a.name.localeCompare(b.name)
            );
            break;

        case "relevance":

        default:

            break;

    }

    return products;

}

function renderProducts(products) {

    searchResults.innerHTML = products
        .map(createSearchCard)
        .join("");

    document
        .querySelectorAll(".card")
        .forEach(card => {

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

    document.getElementById("searchCount").textContent =
        `${products.length} product(s) found`;

}

document
    .getElementById("sortSelect")
    .addEventListener("change", updateFilters);


    const searchInput = document.getElementById("searchInput");

if (searchInput) {

    searchInput.addEventListener("input", () => {

    const searchText = searchInput.value.trim();

    let filteredProducts;

    if (!searchText) {

        filteredProducts = currentResults;

    } else {

        filteredProducts = fuse
            .search(searchText)
            .map(result => result.item);

    }

    renderProducts(sortProducts(filteredProducts));

});

const mobileFilterBtn = document.getElementById("mobileFilterBtn");
const filtersPanel = document.querySelector(".filters");

if (mobileFilterBtn && filtersPanel) {

    mobileFilterBtn.addEventListener("click", () => {

        filtersPanel.classList.toggle("mobile-open");

    });

}

const mobileFilterOk = document.getElementById("mobileFilterOk");

if (mobileFilterOk && filtersPanel) {

    mobileFilterOk.addEventListener("click", () => {

        filtersPanel.classList.remove("mobile-open");

    });

}

const mobileSortBtn = document.getElementById("mobileSortBtn");
const mobileSortMenu = document.getElementById("mobileSortMenu");
const mobileSortClose = document.getElementById("mobileSortClose");
const sortSelect = document.getElementById("sortSelect");

if (mobileSortBtn && mobileSortMenu) {

    mobileSortBtn.addEventListener("click", () => {

        mobileSortMenu.classList.add("open");

    });

}

if (mobileSortClose && mobileSortMenu) {

    mobileSortClose.addEventListener("click", () => {

        mobileSortMenu.classList.remove("open");

    });

}

if (mobileSortMenu && sortSelect) {

    mobileSortMenu
        .querySelectorAll("[data-sort]")
        .forEach(button => {

            button.addEventListener("click", () => {

                const value = button.dataset.sort;

                sortSelect.value = value;

                sortSelect.dispatchEvent(
                    new Event("change", { bubbles:true })
                );

                mobileSortMenu.classList.remove("open");

            });

        });

}

}