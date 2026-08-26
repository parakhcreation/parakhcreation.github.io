import { getProducts, auth } from "./firebase.js";
import { Wishlist } from "./wishlistStore.js";
import { Cart } from "./cartStore.js";

const grid = document.getElementById("wishlistGrid");

async function loadWishlist() {

    

console.log("Current user:", auth.currentUser);

const user = auth.currentUser;
console.log("UID:", user?.uid);
    const wishlistIds = await Wishlist.getAll();
    console.log("Wishlist IDs:", wishlistIds);

    const products = await getProducts();
    
    console.log("Products:", products);

    const wishlistProducts = products.filter(

        product => wishlistIds.includes(product.id)

    );

    const wishlistSizes = {};

for (const product of wishlistProducts) {

    wishlistSizes[product.id] =
        await Wishlist.getSize(product.id);

}

    if (wishlistProducts.length === 0) {

        grid.innerHTML = `

        <div style="text-align:center;padding:80px;">

            <h2>Your Wishlist is Empty ❤️</h2>

            <p>Add products to your wishlist to see them here.</p>

        </div>

        `;

        return;

    }

    grid.innerHTML = wishlistProducts.map(product => `

    <div
        class="card"
        onclick="window.location.href='product.html?id=${encodeURIComponent(product.id)}'"
        style="cursor:pointer;"
    >

        <div class="card-media">

            <img
                src="${product.thumbnail}"
                alt="${product.name}"
                onerror="this.src='https://placehold.co/300x400?text=No+Image'">

        </div>

        <div class="card-body">

            <h3>${product.name}</h3>

${
    wishlistSizes[product.id]
    ? `
        <p class="wishlist-size">
            <strong>Size:</strong>
            ${wishlistSizes[product.id]}
        </p>
    `
    : ""
}

<p class="price">

    ₹${product.price}

</p>    

            <div class="card-actions">

    <button
        onclick="event.stopPropagation(); moveToCart('${product.id}')">

        🛒 Move to Cart

    </button>

    <button
        onclick="event.stopPropagation(); removeItem('${product.id}')">

        ❤ Remove

    </button>

</div>

        </div>

    </div>

`).join("");

}

window.moveToCart = async function(id){

    const savedSize =
        await Wishlist.getSize(id);

    await Cart.add(
        id,
        savedSize
    );

    await Wishlist.remove(id);

    loadWishlist();

}

window.removeItem = async function(id){

    await Wishlist.remove(id);

    // Also remove the saved size for this wishlist item
    await Wishlist.setSize(
        id,
        ""
    );

    loadWishlist();

}

loadWishlist();
