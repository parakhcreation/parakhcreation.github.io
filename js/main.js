// ============================================================
// PARAKH — main.js
// ============================================================
import { getProducts } from "./firebase.js";
const STORE_PHONES = {
  creation: "919331028448",
  collection: "919883351584",
};
let PRODUCTS = [];

let currentFilter = "all";
let visibleCount = 12;
const PAGE_SIZE = 12;

const grid = document.getElementById("productGrid");
const filterCount = document.getElementById("filterCount");
const loadMoreBtn = document.getElementById("loadMoreBtn");

function formatPrice(p) {
  if (p === null || p === undefined) return "Price on request";
  return "₹" + p.toLocaleString("en-IN");
}

function getFiltered() {
  if (currentFilter === "all") return PRODUCTS;
  return PRODUCTS.filter((p) => p.category === currentFilter);
}

function render() {
  const filtered = getFiltered();
  const slice = filtered.slice(0, visibleCount);
  grid.innerHTML = slice
    .map(
      (p) => `
    <article class="card" data-id="${p.id}">
      <div class="card-media">
        <span class="card-tag">${p.category === "saree" ? "Saree" : "Suit Set"}</span>
        <img src="${p.image}" alt="${p.name}" loading="lazy">
        <div class="card-quick">Tap for details &amp; enquiry</div>
      </div>
      <div class="card-body">
        <div class="cname">${p.name}</div>
        <div class="cmeta">
          <span class="cprice">${formatPrice(p.price)}</span>
          <span class="ccode">${p.id}</span>
        </div>
      </div>
    </article>`
    )
    .join("");

  filterCount.textContent = `Showing ${slice.length} of ${filtered.length} pieces`;
  loadMoreBtn.style.display = visibleCount >= filtered.length ? "none" : "inline-flex";

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

document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    visibleCount = PAGE_SIZE;
    render();
  });
});

loadMoreBtn.addEventListener("click", () => {
  visibleCount += PAGE_SIZE;
  render();
});

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
  modalImg.src = p.image;
  modalImg.alt = p.name;
  modalCat.textContent = p.category === "saree" ? "Saree" : "Suit Set";
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

document.getElementById("modalClose").addEventListener("click", closeModal);
backdrop.addEventListener("click", (e) => {
  if (e.target === backdrop) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

// ---------------- Marquee ----------------
const marqueeItems = [
  "Sarees", "Suit Sets", "Parakh Creation", "Parakh Collection",
  "Howrah", "Festive Edit", "New Arrivals Weekly", "Hand-picked Pieces",
];
const marqueeEl = document.getElementById("marquee");
const marqueeHTML =
  `<span>${marqueeItems.map((m) => `${m} <span class="dot">✦</span>`).join(" ")}</span>`.repeat(2);
marqueeEl.innerHTML = marqueeHTML;

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
