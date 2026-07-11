import { getProducts } from "./firebase.js";

const grid = document.getElementById("wishlistGrid");

async function loadWishlist() {

    const wishlistIds = getWishlist();

    const products = await getProducts();

    const wishlistProducts = products.filter(

        product => wishlistIds.includes(product.id)

    );

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

        <div class="card">

            <div class="card-media">

                <img src="${product.image}"

                     alt="${product.name}">

            </div>

            <div class="card-body">

                <h3>${product.name}</h3>

                <p class="price">

                    ₹${product.price}

                </p>

               <div class="card-actions">

    <button

        onclick="window.open('product.html?id=${product.id}','_blank')">

        View Product

    </button>

    <button

        onclick="removeItem('${product.id}')">

        ❤ Remove

    </button>

</div>

            </div>

        </div>

    `).join("");

}

window.removeItem = function(id){

    removeFromWishlist(id);

    loadWishlist();

}

loadWishlist();
