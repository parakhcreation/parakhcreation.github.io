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

loadProduct();

document.getElementById("addToCart").onclick = async () => {

    await Cart.add(currentProduct.id);

    document.getElementById("drawerProductName").textContent =
        document.getElementById("productName").textContent;

    document.getElementById("cartDrawer").classList.add("open");

};


document.getElementById("viewCart").onclick = () => {

    window.location.href = "cart.html";

};


document.getElementById("buyNow").onclick = () => {

    if (!currentProduct) return;

    sessionStorage.setItem(

        "buyNowItem",

        JSON.stringify({

            id: currentProduct.id,

            quantity: 1

        })

    );

    window.location.href = "checkout.html";

};


