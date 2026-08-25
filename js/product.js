import { getProducts, db } from "./firebase.js";
import { Wishlist } from "./wishlistStore.js";
import { Cart } from "./cartStore.js";

import {
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

let currentProduct = null;

const image = document.getElementById("productImage");
const zoomLens =
document.getElementById("zoomLens");

const zoomContainer =
document.getElementById("imageZoomContainer");
const thumbnailContainer =
document.getElementById("thumbnailContainer");
const name = document.getElementById("productName");
const price = document.getElementById("productPrice");
const description = document.getElementById("productDescription");
const fabric = document.getElementById("productFabric");
const colour = document.getElementById("productColour");
const accordions = document.getElementById("productAccordions");
const viewer =
document.getElementById("imageViewer");

const viewerImage =
document.getElementById("viewerImage");

const closeViewer =
document.getElementById("closeViewer");

const prevImage =
document.getElementById("prevImage");

const nextImage =
document.getElementById("nextImage");


const relatedGrid = document.getElementById("relatedProducts");
const wishlistButton = document.getElementById("addToWishlist");
const sizeSection = document.getElementById("sizeSection");

const sizeButtons = document.getElementById("sizeButtons");

let selectedSize = null;

async function loadProduct() {

    const products = await getProducts();

    currentProduct = products.find(
    p => p.id && p.id.trim() === productId.trim()
);



console.log(currentProduct);

if (!currentProduct) {

    document.body.innerHTML = "<h1>Product not found.</h1>";
    return;

}

const gallery = [];

let currentGallery = gallery;

let currentIndex = 0;

// Always make the thumbnail the first image
if (currentProduct.thumbnail || currentProduct.image) {

    gallery.push(
        currentProduct.thumbnail ||
        currentProduct.image
    );

}

// Then add the gallery images
if (currentProduct.images && currentProduct.images.length > 0) {

    gallery.push(...currentProduct.images);

}

image.src = gallery[0];

thumbnailContainer.innerHTML = "";

gallery.forEach((url, index) => {

    const thumb = document.createElement("img");

    thumb.src = url;

    thumb.className = "thumbnail";

    if (index === 0) {
        thumb.classList.add("active");
    }

    thumb.onclick = ()=>{

    image.style.opacity = "0";

    setTimeout(()=>{

        image.src = url;
        currentIndex = index;

        image.onload = ()=>{

            image.style.opacity = "1";

        };

    },150);

    document.querySelectorAll(".thumbnail")
        .forEach(t=>t.classList.remove("active"));

    thumb.classList.add("active");

};

    thumbnailContainer.appendChild(thumb);

});

image.onclick = () => {

    viewer.classList.add("active");

    viewerImage.src = currentGallery[currentIndex];

};

closeViewer.onclick = () => {

    viewer.classList.remove("active");

};

viewer.onclick = (e)=>{

    if(e.target===viewer){

        viewer.classList.remove("active");

    }

};

prevImage.onclick = ()=>{

    currentIndex--;

    if(currentIndex<0){

        currentIndex=currentGallery.length-1;

    }

    viewerImage.src=currentGallery[currentIndex];

};

nextImage.onclick = ()=>{

    currentIndex++;

    if(currentIndex>=currentGallery.length){

        currentIndex=0;

    }

    viewerImage.src=currentGallery[currentIndex];

};
    image.alt = currentProduct.name;

    name.textContent = currentProduct.name;

    price.textContent = "₹" + currentProduct.price;

    description.textContent = currentProduct.description;

    fabric.textContent = currentProduct.fabric;

    colour.textContent = currentProduct.colour;

   const specifications = [
    ["SKU", currentProduct.sku],
    ["Fabric", currentProduct.fabric],
    ["Colour", currentProduct.colour],
    ["Pattern", currentProduct.pattern],
    ["Work", currentProduct.work],
    ["Border", currentProduct.border],
    ["Blouse Piece", currentProduct.blousePiece],
    ["Length", currentProduct.length],
    ["Width", currentProduct.width],
    ["Weight", currentProduct.weight],
    ["Package Contents", currentProduct.packageContents],
    ["Country of Origin", currentProduct.countryOfOrigin],
    ["Manufacturer", currentProduct.manufacturer],
    ["Marketed By", currentProduct.marketedBy]
];

let specificationRows = "";

specifications.forEach(([label, value]) => {
    if (value) {
        specificationRows += `
        <div class="spec-row">
            <div class="spec-label">${label}</div>
            <div class="spec-value">${value}</div>
        </div>`;
    }
});

accordions.innerHTML = "";

if (currentProduct.productDetails) {

    accordions.innerHTML += `
    <div class="accordion-item active">

        <div class="accordion-header">

            <span class="accordion-title">Product Details</span>

            <span class="accordion-icon">⌄</span>

        </div>

        <div class="accordion-content">

            <p>${currentProduct.productDetails}</p>

        </div>

    </div>`;
}

if (specificationRows) {

    accordions.innerHTML += `
    <div class="accordion-item">

        <div class="accordion-header">

            <span class="accordion-title">Product Specifications</span>

            <span class="accordion-icon">⌄</span>

        </div>

        <div class="accordion-content">

            ${specificationRows}

        </div>

    </div>`;
}

document.querySelectorAll(".accordion-header").forEach(header => {

    header.addEventListener("click", () => {

        header.parentElement.classList.toggle("active");

    });

});

    let inStock = false;

// Product without sizes
if (
    currentProduct.inventory &&
    currentProduct.inventory.type === "none"
) {

    inStock = Number(currentProduct.inventory.stock) > 0;

}

// Product with sizes
else if (
    currentProduct.inventory &&
    currentProduct.inventory.sizes
) {

    inStock = Object.values(currentProduct.inventory.sizes)
        .some(stock => Number(stock) > 0);

}

// Old products without inventory object
else {

    inStock =
        currentProduct.available === "TRUE" ||
        currentProduct.available === true;

}

const availability = document.getElementById("productAvailability");

if (availability) {
    if (inStock) {
        availability.textContent = "";
    } else {
        availability.textContent = "Out of Stock";
        availability.style.color = "#dc3545";
    }
}


    if (!inStock) {

    document.getElementById("addToCart").disabled = true;

    document.getElementById("buyNow").disabled = true;

    document.getElementById("addToWishlist").disabled = true;

}
            
            renderSizes(currentProduct);
    wishlistButton.textContent =

    await Wishlist.has(currentProduct.id)

    ? "❤ Remove from Wishlist"

    : "♡ Add to Wishlist";
    
    wishlistButton.onclick = async () => {

    const added = await Wishlist.toggle(currentProduct.id);

    wishlistButton.textContent = added
        ? "❤ Remove from Wishlist"
        : "♡ Add to Wishlist";

};
            
            const related = products
    .filter(p =>
        p.category === currentProduct.category &&
        p.id !== currentProduct.id
    )
    .slice(0,4);

relatedGrid.innerHTML = "";

for (const item of related) {

    const rating =
        await getProductRating(
            item.id
        );


    let ratingHTML = "";


    if (rating.count > 0) {

        ratingHTML = `

            <div class="related-rating">

                <span
                    class="related-rating-number">

                    ${rating.average.toFixed(1)}

                </span>

                <span
                    class="related-rating-star">

                    ★

                </span>

                <span
                    class="related-rating-count">

                    (${rating.count})

                </span>

            </div>

        `;

    }


    relatedGrid.innerHTML += `

        <div
            class="related-card"
            onclick="window.location='product.html?id=${item.id}'"
            style="cursor:pointer">

            <img
                src="${item.thumbnail || item.image || ""}">

            <h3>
                ${item.name}
            </h3>

            ${ratingHTML}

            <p>
                ₹${item.price}
            </p>

        </div>

    `;

}

}

function renderSizes(product){

    if(!product.inventory){

        sizeSection.style.display="none";
        return;

    }

    if(product.inventory.type==="none"){

        sizeSection.style.display="none";
        return;

    }

    sizeSection.style.display="block";

    sizeButtons.innerHTML="";

    const sizes = product.inventory.sizes || {};

    const orderedSizes = Object.entries(sizes);

const alphaOrder = [
    "XS",
    "S",
    "M",
    "L",
    "XL",
    "XXL",
    "3XL",
    "4XL",
    "5XL"
];

orderedSizes.sort((a, b) => {

    const ia = alphaOrder.indexOf(a[0]);
    const ib = alphaOrder.indexOf(b[0]);

    // Numeric sizes (28,30,32...)
    if (ia === -1 && ib === -1) {
        return Number(a[0]) - Number(b[0]);
    }

    // Alphabetic sizes
    if (ia === -1) return 1;
    if (ib === -1) return -1;

    return ia - ib;

});
    orderedSizes.forEach(([size, stock]) => {

    const available =
        Number(stock || 0) > 0;

    const button =
        document.createElement("button");

    button.type = "button";
    button.className = "size-circle";
    button.textContent = size;

    if (!available) {

        // Keep the size visible,
        // but make it look unavailable
        // and prevent clicking.

        button.classList.add("out-of-stock");
        button.disabled = true;

        button.setAttribute(
            "aria-label",
            `${size}, out of stock`
        );

        button.setAttribute(
            "title",
            "Out of stock"
        );

    } else {

        button.setAttribute(
            "aria-label",
            `${size}, available`
        );

        button.onclick = () => {

            document
                .querySelectorAll(".size-circle")
                .forEach(btn => {
                    btn.classList.remove("selected");
                });

            button.classList.add("selected");

            selectedSize = size;

            if (sizeAvailabilityMessage) {

                sizeAvailabilityMessage.textContent = "";

                sizeAvailabilityMessage.classList.remove(
                    "visible",
                    "shake"
                );

            }

        };

    }

    // IMPORTANT:
    // Add EVERY size to the page,
    // including out-of-stock sizes.

    sizeButtons.appendChild(button);

});

}

loadProduct();

document.getElementById("addToCart").onclick = async () => {

    if (
    currentProduct.inventory &&
    currentProduct.inventory.type !== "none" &&
    !selectedSize
) {
        alert("Please select a size.");
        return;
    }

    await Cart.add(
    currentProduct.id,
    selectedSize
);

    document.getElementById("drawerProductName").textContent =
        document.getElementById("productName").textContent;

    document.getElementById("cartDrawer").classList.add("open");

};


document.getElementById("viewCart").onclick = () => {

    window.location.href = "cart.html";

};


document.getElementById("buyNow").onclick = () => {

    if (!currentProduct) return;

    if (
    currentProduct.inventory &&
    currentProduct.inventory.type !== "none" &&
    !selectedSize
) {
    alert("Please select a size.");
    return;
}

    sessionStorage.setItem(

        "buyNowItem",

        JSON.stringify({

    id: currentProduct.id,

    quantity: 1,

    selectedSize: selectedSize

})

    );

    window.location.href = "checkout.html";

};


// ============================================================
// GET APPROVED PRODUCT RATING
// ============================================================

async function getProductRating(productId) {

    try {

        const reviewsQuery =
            query(
                collection(db, "reviews"),

                where(
                    "productId",
                    "==",
                    productId
                ),

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


        if (snapshot.empty) {

            return {
                average: null,
                count: 0
            };

        }


        let total = 0;


        snapshot.forEach(
            reviewDoc => {

                const review =
                    reviewDoc.data();

                total +=
                    Number(
                        review.rating || 0
                    );

            }
        );


        const average =
            total /
            snapshot.size;


        return {

            average:
                Math.round(
                    average * 10
                ) / 10,

            count:
                snapshot.size

        };

    }

    catch (error) {

        console.error(
            "Failed to load product rating:",
            error
        );


        return {
            average: null,
            count: 0
        };

    }

}