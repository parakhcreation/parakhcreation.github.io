import { getProducts } from "./firebase.js";

const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

const image = document.getElementById("productImage");
const name = document.getElementById("productName");
const price = document.getElementById("productPrice");
const description = document.getElementById("productDescription");
const fabric = document.getElementById("productFabric");
const colour = document.getElementById("productColour");
const availability = document.getElementById("productAvailability");
const relatedGrid = document.getElementById("relatedProducts");

async function loadProduct() {

    const products = await getProducts();

    const product = products.find(
    p => p.id && p.id.trim() === productId.trim()
    );
    console.log(product);
    if (!product) {

        document.body.innerHTML = "<h1>Product not found.</h1>";
        return;

    }

    image.src = product.image;
    image.alt = product.name;

    name.textContent = product.name;

    price.textContent = "₹" + product.price;

    description.textContent = product.description;

    fabric.textContent = product.fabric;

    colour.textContent = product.colour;

    availability.textContent =
        product.available === "TRUE" ||
        product.available === true
            ? "Available"
            : "Out of Stock";
            
            const related = products
    .filter(p =>
        p.category === product.category &&
        p.id !== product.id
    )
    .slice(0,4);

relatedGrid.innerHTML = "";

related.forEach(item => {

    relatedGrid.innerHTML += `

    <div class="related-card"
         onclick="window.location='product.html?id=${item.id}'"
         style="cursor:pointer">

        <img src="${item.image}">

        <h3>${item.name}</h3>

        <p>₹${item.price}</p>

    </div>

    `;

});

}

loadProduct();

document.getElementById("addToCart").onclick = () => {

    const id = new URLSearchParams(window.location.search).get("id");

    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    const existing = cart.find(item => item.id === id);

    if (existing) {

        existing.quantity++;

    } else {

        cart.push({

            id: id,

            quantity: 1

        });

    }

    localStorage.setItem(

        "cart",

        JSON.stringify(cart)

    );

    document.getElementById("drawerProductName").textContent =
        document.getElementById("productName").textContent;

    document.getElementById("cartDrawer").classList.add("open");

};


document.getElementById("viewCart").onclick = () => {

    window.location.href = "cart.html";

};

