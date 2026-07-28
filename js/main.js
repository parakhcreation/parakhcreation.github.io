// ============================================================
// PARAKH — main.js
// ============================================================
import { getProducts } from "./firebase.js";
const STORE_PHONES = {
  creation: "919331028448",
  collection: "919883351584",
};

import {

    collection,

    getDocs,

    query,

    where,

    orderBy,

    limit

}

from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import { db } from "./firebase.js";

let categoryMap = {};

let heroBanners = [];

let currentHero = 0;

async function loadHeroBanner(){

    const snapshot = await getDocs(
        collection(db,"heroBanners")
    );

    heroBanners = [];

    snapshot.forEach(doc=>{

        const data = doc.data();

        if(data.active){

            heroBanners.push(data);

        }

    });

    heroBanners.sort(
        (a,b)=>a.displayOrder-b.displayOrder
    );

    if(heroBanners.length===0)
        return;

    showHeroBanner(0);

    if(heroBanners.length>1){

        setInterval(()=>{

            currentHero++;

            if(currentHero>=heroBanners.length)
                currentHero=0;

            showHeroBanner(currentHero);

        },3000);

    }

}

function showHeroBanner(index){

    const hero = heroBanners[index];

    const bg =
        document.getElementById("heroBackground");

    const title =
        document.getElementById("heroTitle");

    const subtitle =
        document.getElementById("heroSubtitle");

    if(bg){

        bg.style.opacity=0;

        setTimeout(()=>{

            bg.style.backgroundImage=
                `url('${hero.image}')`;

            bg.style.opacity=1;

        },250);

    }

    if(title){

        title.style.opacity=0;

        setTimeout(()=>{

            title.textContent=
                hero.title;

            title.style.opacity=1;

        },250);

    }

    if(subtitle){

        subtitle.style.opacity=0;

        setTimeout(()=>{

            subtitle.textContent=
                hero.subtitle || "";

            subtitle.style.opacity=1;

        },250);

    }

}

async function loadCategories(){

    const snapshot = await getDocs(
        collection(db,"categories")
    );

    snapshot.forEach(doc=>{

        categoryMap[doc.id] = doc.data();

    });



    // ---------- Update homepage heading ----------

const title = document.getElementById("collectionTitle");

if (title) {

    const names = Object.values(categoryMap)
        .filter(c => c.active)
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map(c => c.pluralName);

    title.textContent = "Our Collection";

}

// ----------------------------
// Build collection filter buttons
// ----------------------------

const filters = document.getElementById("filters");

if (filters) {

    filters.innerHTML = "";

    // All Pieces button
    filters.innerHTML += `
        <button
            class="filter-btn active"
            data-filter="all">
            All Pieces
        </button>
    `;

    Object.entries(categoryMap)

        .sort(
            (a, b) =>
                a[1].displayOrder -
                b[1].displayOrder
        )

        .forEach(([id, category]) => {

            if (!category.active) return;

            filters.innerHTML += `
                <button
                    class="filter-btn"
                    data-filter="${id}">
                    ${category.pluralName}
                </button>
            `;

        });

}

const categoryCount =
    document.getElementById("categoryCount");

if (categoryCount) {

    categoryCount.textContent = Object.values(categoryMap)
        .filter(c => c.active)
        .length;

}


// ----------------------------
// Build Featured Collection Cards
// ----------------------------

const categoryTrain =
    document.getElementById("categoryTrain");

if (categoryTrain) {

    categoryTrain.innerHTML = "";

    Object.entries(categoryMap)
        .sort((a, b) => a[1].displayOrder - b[1].displayOrder)
        .forEach(([id, category]) => {

            if (!category.active) return;

            categoryTrain.innerHTML += `
<a
    href="#collection"
    class="category-card"
    data-category="${id}">

    <div class="category-info">

        <h3>${category.pluralName}</h3>

        <span>Shop Now →</span>

    </div>

    <div class="category-photo">

        <img
            src="${category.image}"
            alt="${category.pluralName}">

    </div>

</a>
`;

        });

    // Duplicate cards

const originalCards = [...categoryTrain.children];

originalCards.forEach(card => {

    categoryTrain.appendChild(card.cloneNode(true));

});

// Click on ANY card (original or duplicate)

categoryTrain
    .querySelectorAll(".category-card")
    .forEach(card => {

        card.addEventListener("click", e => {

            e.preventDefault();

            const category = card.dataset.category;

            window.location.href =
                `search.html?category=${encodeURIComponent(category)}`;

        });

    });

startCategoryTrain();



        // ------------------------------------
// Duplicate cards for infinite train
// ------------------------------------



}

}
export let PRODUCTS = [];

let currentFilter = "all";
let visibleCount = 12;
const PAGE_SIZE = 12;

const grid = document.querySelector(".product-grid");

const filterCount = document.querySelector(".filter-count");

const loadMoreBtn = document.getElementById("loadMoreBtn");

export function formatPrice(p) {
  if (p === null || p === undefined) return "Price on request";
  return "₹" + p.toLocaleString("en-IN");
}

export function getFiltered() {
  if (currentFilter === "all") return PRODUCTS;
  return PRODUCTS.filter((p) => p.category === currentFilter);
}


export function createProductCard(p) {

    return `
    <article class="card" data-id="${p.id}">
      <div class="card-media">
        <span class="card-tag">
            ${categoryMap[p.category]?.name || p.category}
        </span>

        <img
            src="${p.thumbnail}"
            alt="${p.name}"
            loading="lazy">

        <div class="card-quick">
            Tap for details &amp; enquiry
        </div>
      </div>

      <div class="card-body">

        <div class="cname">
            ${p.name}
        </div>

        <div class="cmeta">

          <span class="cprice">
            ${formatPrice(p.price)}
          </span>

          <span class="ccode">
            ${p.id}
          </span>

        </div>

      </div>

    </article>
    `;
}
export function render() {
  const filtered = getFiltered();
  const slice = filtered.slice(0, visibleCount);
  grid.innerHTML = slice
    .map(createProductCard)
    .join("");

  if (filterCount) {

    filterCount.textContent =
        `Showing ${slice.length} of ${filtered.length} pieces`;

}

if (loadMoreBtn) {

    loadMoreBtn.style.display =
        visibleCount >= filtered.length
            ? "none"
            : "inline-flex";

}

  grid.querySelectorAll(".card").forEach((card) => {

  card.addEventListener("click", () => {

    localStorage.setItem("lastShoppingPage", window.location.href);

localStorage.setItem(
    "lastScrollPosition",
    window.scrollY
);

window.open(

    `product.html?id=${card.dataset.id}`,

    "_blank"

);

  });

});
}

document
.getElementById("filters")
.addEventListener("click", e => {

    const button = e.target.closest(".filter-btn");

    if (!button) return;

    document
        .querySelectorAll(".filter-btn")
        .forEach(btn =>
            btn.classList.remove("active")
        );

    button.classList.add("active");

    currentFilter = button.dataset.filter;

    visibleCount = 6;

    render();

});

if (loadMoreBtn) {

    loadMoreBtn.addEventListener("click", () => {

        visibleCount += 8;

        render();

    });

}

// ---------------- Modal ----------------
const backdrop = document.getElementById("modalBackdrop");
const modalImg = document.getElementById("modalImg");
const modalCat = document.getElementById("modalCat");
const modalName = document.getElementById("modalName");
const modalPrice = document.getElementById("modalPrice");
const modalSpecs = document.getElementById("modalSpecs");
const modalWhatsapp = document.getElementById("modalWhatsapp");
const modalCall = document.getElementById("modalCall");

function openModal(id) {
  const p = PRODUCTS.find((x) => x.id === id);
  if (!p) return;
  modalImg.src = p.thumbnail;
  modalImg.alt = p.name;
  modalCat.textContent = categoryMap[p.category]?.name || p.category
  modalName.textContent = p.name;
  modalPrice.textContent = formatPrice(p.price);
  modalSpecs.textContent = p.description;

  const msg = encodeURIComponent(
    `Hi, I'm interested in ${p.name} (Ref: ${p.id}) from the Parakh website. Is this available?`
  );
  modalWhatsapp.href = `https://wa.me/${STORE_PHONES.creation}?text=${msg}`;
  modalCall.href = `tel:+${STORE_PHONES.creation}`;

  backdrop.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  backdrop.classList.remove("open");
  document.body.style.overflow = "";
}

const modalCloseBtn = document.getElementById("modalClose");

if (modalCloseBtn && backdrop) {

  modalCloseBtn.addEventListener("click", closeModal);

  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
    }
  });

}

// ---------------- Marquee ----------------
const marqueeItems = [
  "Sarees", "Suit Sets", "Parakh Creation", "Parakh Collection",
  "Howrah", "Festive Edit", "New Arrivals Weekly", "Hand-picked Pieces",
];
const marqueeEl = document.getElementById("marquee");
const marqueeHTML =
  `<span>${marqueeItems.map((m) => `${m} <span class="dot">✦</span>`).join(" ")}</span>`.repeat(2);
if (marqueeEl) {
  marqueeEl.innerHTML = marqueeHTML;
}

// ---------------- Scroll reveal ----------------
const revealEls = document.querySelectorAll(".reveal");
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);
revealEls.forEach((el) => io.observe(el));

// ---------------- Mobile nav ----------------
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");
navToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
});
navLinks.querySelectorAll("a").forEach((a) => {
  a.addEventListener("click", () => {
    navLinks.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

async function init() {
  try {
    PRODUCTS = await getProducts();

    console.log("Products loaded from Firestore:", PRODUCTS);

    render();

  } catch (error) {
    console.error("Error loading products:", error);
  }
}

await loadCategories();

await loadHeroBanner();

init();
function updateCartCount() {

    const cart =
        JSON.parse(localStorage.getItem("cart")) || [];

    const count =
        document.getElementById("cartCount");

    if (count) {

        count.textContent = cart.length;

    }

}

updateCartCount();

const savedScroll = sessionStorage.getItem("restoreScroll");

if (savedScroll !== null) {

    window.addEventListener("load", () => {

        window.scrollTo({

            top: Number(savedScroll),

            behavior: "instant"

        });

        sessionStorage.removeItem("restoreScroll");

    });

}

// ================= SEARCH =================

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

function performSearch() {

    const query = searchInput.value.trim();

    if (!query) return;

    window.location.href =
        `search.html?q=${encodeURIComponent(query)}`;
}

if (searchBtn) {

    searchBtn.addEventListener("click", performSearch);

}

if (searchInput) {

    searchInput.addEventListener("keydown", (e) => {

        if (e.key === "Enter") {

            performSearch();

        }

    });

}

/* ==========================================
   Category Train Animation
========================================== */

function startCategoryTrain() {

    const track = document.getElementById("categoryTrain");

    if (!track) return;

    let position = 0;
    const speed = 0.5; // pixels per frame

    let paused = false;

    track.addEventListener("mouseenter", () => {

        paused = true;

    });

    track.addEventListener("mouseleave", () => {

        paused = false;

    });

    function animate() {

        if (!paused) {

            position += speed;

            const halfWidth = track.scrollWidth / 2;

            if (position >= halfWidth) {

                position = 0;

            }

            track.style.transform =
                `translateX(${-position}px)`;

        }

        requestAnimationFrame(animate);

    }

    animate();

}