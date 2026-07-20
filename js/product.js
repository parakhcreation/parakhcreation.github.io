import { getProducts } from "./firebase.js";
import { Wishlist } from "./wishlistStore.js";
import { Cart } from "./cartStore.js";


const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

let currentProduct = null;

const image = document.getElementById("productImage");
const name = document.getElementById("productName");
const price = document.getElementById("productPrice");
const description = document.getElementById("productDescription");
const fabric = document.getElementById("productFabric");
const colour = document.getElementById("productColour");
const availability = document.getElementById("productAvailability");
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

    image.src =
    currentProduct.thumbnail ||
    currentProduct.image ||
    "";
    image.alt = currentProduct.name;

    name.textContent = currentProduct.name;

    price.textContent = "₹" + currentProduct.price;

    description.textContent = currentProduct.description;

    fabric.textContent = currentProduct.fabric;

    colour.textContent = currentProduct.colour;

    availability.textContent =
        currentProduct.available === "TRUE" ||
        currentProduct.available === true
            ? "Available"
            : "Out of Stock";
            
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

related.forEach(item => {

    relatedGrid.innerHTML += `

    <div class="related-card"
         onclick="window.location='product.html?id=${item.id}'"
         style="cursor:pointer">

        <img src="${item.thumbnail || item.image || ""}">

        <h3>${item.name}</h3>

        <p>₹${item.price}</p>

    </div>

    `;

});

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
    orderedSizes.forEach(([size,stock])=>{

        const button=document.createElement("button");

        button.type="button";

        button.className = "size-circle";

        button.textContent=size;

        

        if(stock<=0){

            button.classList.add("out-of-stock");

            button.disabled=true;

        }

        button.onclick = () => {

    document
        .querySelectorAll(".size-circle")
        .forEach(btn => btn.classList.remove("selected"));

    button.classList.add("selected");

    selectedSize = size;

};

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


