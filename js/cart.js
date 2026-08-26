import { getProducts } from "./firebase.js";
import { Cart } from "./cartStore.js";
import { Wishlist } from "./wishlistStore.js";

const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const finalTotal = document.getElementById("finalTotal");

const selectAllBtn =
    document.getElementById("selectAllBtn");

const selectedCartItems = new Set(
    JSON.parse(
        sessionStorage.getItem(
            "selectedCartItems"
        ) || "[]"
    )
);

function isItemOutOfStock(product, selectedSize) {

    if (!product) return false;

    const inventory = product.inventory;

    // Size-based inventory
    if (
        inventory &&
        inventory.sizes &&
        selectedSize
    ) {

        return Number(
            inventory.sizes[selectedSize] || 0
        ) <= 0;

    }

    // Simple stock inventory
    if (
        inventory &&
        inventory.type === "none"
    ) {

        return Number(
            inventory.stock || 0
        ) <= 0;

    }

    return false;
}

function updateSelectAllButton() {

    if (!selectAllBtn) return;

    const checkboxes =
        document.querySelectorAll(
            ".cart-selection"
        );

    if (checkboxes.length === 0) {

        selectAllBtn.textContent =
            "Select All Items";

        return;

    }

    const allSelected =
        [...checkboxes].every(
            checkbox => checkbox.checked
        );

    selectAllBtn.textContent =
        allSelected
            ? "Deselect All Items"
            : "Select All Items";

}


function updateSelectedTotal() {

    let selectedTotal = 0;

    document
        .querySelectorAll(".cart-selection:checked")
        .forEach(checkbox => {

            const price =
                Number(
                    checkbox.dataset.price || 0
                );

            const quantity =
                Number(
                    checkbox.dataset.quantity || 0
                );

            selectedTotal +=
                price * quantity;

        });

    cartTotal.textContent =
        "₹" + selectedTotal;

    if (finalTotal) {

        finalTotal.textContent =
            "₹" + selectedTotal;

    }

    updateSelectAllButton();

}

async function loadCart() {

    const cartObject = await Cart.getAll();

const cart = Object.entries(cartObject).map(([id, quantity]) => ({
    id,
    quantity
}));

    const products = await getProducts();
    console.log("Cart:", cart);
console.log("Products:", products);

    let total = 0;

    cartItems.innerHTML = "";

    let availableItems = [];
let outOfStockItems = [];

    if (cart.length === 0) {

        cartItems.innerHTML = "<h2>Your cart is empty.</h2>";

        cartTotal.textContent = "₹0";

        return;

    }

   cart.forEach(item => {

    console.log("Cart item:", item);

    const separatorIndex =
    item.id.lastIndexOf("_");

let productId;
let selectedSize;

if (separatorIndex > -1) {

    productId =
        item.id.substring(
            0,
            separatorIndex
        );

    selectedSize =
        item.id.substring(
            separatorIndex + 1
        );

} else {

    productId = item.id;
    selectedSize = "";

}

    const product = products.find(
        p => p.id && p.id.trim() === productId.trim()
    );

    console.log("Matched product:", product);

    if (!product) return;

    /*
     * Check the CURRENT stock of the exact
     * size that is in this cart item.
     */

    const itemOutOfStock =
        isItemOutOfStock(
            product,
            selectedSize
        );

    /*
     * Separate available and unavailable items.
     */

    if (itemOutOfStock) {

        outOfStockItems.push({
            item,
            product,
            selectedSize
        });

    } else {

        availableItems.push({
            item,
            product,
            selectedSize
        });

        /*
         * ONLY available items contribute
         * to the cart total.
         */

        total +=
            Number(product.price) *
            item.quantity;

    }

});

/* =========================
   AVAILABLE ITEMS
   ========================= */

if (availableItems.length > 0) {

    cartItems.innerHTML += `

        <section class="cart-section">

            <h2 class="cart-section-title">
                Your Cart
            </h2>

            <div class="cart-section-items">

                ${
                    availableItems.map(
                        ({ item, product, selectedSize }) => `

                            <div class="cart-item">

    <input
    type="checkbox"
    class="cart-selection"
    data-id="${item.id}"
    data-price="${product.price}"
    data-quantity="${item.quantity}"
    ${selectedCartItems.has(item.id) ? "checked" : ""}
    aria-label="Select ${product.name}">

    <div
        class="cart-product-link"
                                    data-product-id="${product.id}">

                                    <img
                                        src="${product.thumbnail}"
                                        alt="${product.name}"
                                        onerror="this.src='https://placehold.co/300x400?text=No+Image'">

                                </div>

                                <div class="cart-details">

                                    <h2
                                        class="cart-product-link"
                                        data-product-id="${product.id}">
                                        ${product.name}
                                    </h2>

                                    ${
                                        selectedSize
                                        ? `
                                            <p>
                                                <strong>Size:</strong>
                                                ${selectedSize}
                                            </p>
                                        `
                                        : ""
                                    }

                                    <p>
                                        ${product.description}
                                    </p>

                                    <div class="cart-price">
                                        ₹${product.price}
                                    </div>

                                    <div class="quantity-controls">

                                        <button
                                            class="qty-btn minus"
                                            data-id="${item.id}">
                                            −
                                        </button>

                                        <span class="qty">
                                            ${item.quantity}
                                        </span>

                                        <button
                                            class="qty-btn plus"
                                            data-id="${item.id}">
                                            +
                                        </button>

                                    </div>

                                </div>

                                <div class="cart-actions">

                                    <button
                                        class="removeBtn"
                                        data-id="${item.id}">
                                        Remove
                                    </button>

                                    <button
                                        class="moveWishlistBtn"
                                        data-id="${item.id}"
                                        data-product-id="${product.id}">
                                        ♡ Move to Wishlist
                                    </button>

                                </div>

                            </div>

                        `
                    ).join("")
                }

            </div>

        </section>

    `;

}

/* =========================
   OUT OF STOCK ITEMS
   ========================= */

if (outOfStockItems.length > 0) {

    cartItems.innerHTML += `

        <section class="cart-section out-of-stock-section">

            <div class="out-of-stock-heading">

                <h2 class="cart-section-title">
                    Out of Stock Items
                </h2>

                <span class="out-of-stock-note">
                    Not included in total
                </span>

            </div>

            <div class="cart-section-items">

                ${
                    outOfStockItems.map(
                        ({ item, product, selectedSize }) => `

                            <div class="cart-item cart-item-unavailable">

                                <div
                                    class="cart-product-link"
                                    data-product-id="${product.id}">

                                    <img
                                        src="${product.thumbnail}"
                                        alt="${product.name}"
                                        onerror="this.src='https://placehold.co/300x400?text=No+Image'">

                                </div>

                                <div class="cart-details">

                                    <h2
                                        class="cart-product-link"
                                        data-product-id="${product.id}">
                                        ${product.name}
                                    </h2>

                                    ${
                                        selectedSize
                                        ? `
                                            <p>
                                                <strong>Size:</strong>
                                                ${selectedSize}
                                            </p>
                                        `
                                        : ""
                                    }

                                    <div class="cart-item-out-of-stock">
                                        OUT OF STOCK
                                    </div>

                                    <p>
                                        ${product.description}
                                    </p>

                                    <div class="cart-price">
                                        ₹${product.price}
                                    </div>

                                    <div class="quantity-controls unavailable">

                                        <span class="qty">
                                            ${item.quantity}
                                        </span>

                                    </div>

                                </div>

                                <div class="cart-actions">

                                    <button
                                        class="removeBtn"
                                        data-id="${item.id}">
                                        Remove
                                    </button>

                                    <button
                                        class="moveWishlistBtn"
                                        data-id="${item.id}"
                                        data-product-id="${product.id}">
                                        ♡ Move to Wishlist
                                    </button>

                                </div>

                            </div>

                        `
                    ).join("")
                }

            </div>

        </section>

    `;

}

    

document
    .querySelectorAll(".cart-selection")
    .forEach(checkbox => {

        checkbox.addEventListener(
    "change",
    () => {

        if (checkbox.checked) {

            selectedCartItems.add(
                checkbox.dataset.id
            );

        } else {

            selectedCartItems.delete(
                checkbox.dataset.id
            );

        }

        sessionStorage.setItem(
            "selectedCartItems",
            JSON.stringify(
                [...selectedCartItems]
            )
        );

        updateSelectedTotal();

    }
);

    });

updateSelectedTotal();

if (selectAllBtn) {

    selectAllBtn.onclick = () => {

        const checkboxes =
            document.querySelectorAll(
                ".cart-selection"
            );

        const allSelected =
            [...checkboxes].every(
                checkbox => checkbox.checked
            );

        checkboxes.forEach(
            checkbox => {

                checkbox.checked =
                    !allSelected;

                if (checkbox.checked) {

                    selectedCartItems.add(
                        checkbox.dataset.id
                    );

                } else {

                    selectedCartItems.delete(
                        checkbox.dataset.id
                    );

                }

            }
        );

        sessionStorage.setItem(
    "selectedCartItems",
    JSON.stringify(
        [...selectedCartItems]
    )
);

        updateSelectedTotal();

    };

}

    document.querySelectorAll(".removeBtn").forEach(btn => {

    btn.onclick = async () => {

        selectedCartItems.delete(
            btn.dataset.id
        );

        await Cart.remove(
            btn.dataset.id
        );

        loadCart();

    };

});

document.querySelectorAll(".moveWishlistBtn").forEach(btn => {

    btn.onclick = async () => {

        const productId =
    btn.dataset.productId;

const cartItemId =
    btn.dataset.id;

const separatorIndex =
    cartItemId.lastIndexOf("_");

let selectedSize = "";

if (separatorIndex > -1) {

    selectedSize =
        cartItemId.substring(
            separatorIndex + 1
        );

}

const alreadyInWishlist =
    await Wishlist.has(productId);

if (!alreadyInWishlist) {

    await Wishlist.toggle(
        productId
    );

}

await Wishlist.setSize(
    productId,
    selectedSize
);

       selectedCartItems.delete(
    btn.dataset.id
);

await Cart.remove(
    btn.dataset.id
);

loadCart();

    };

});
    

document.querySelectorAll(".cart-product-link").forEach(element => {

    element.onclick = () => {

        const productId =
            element.dataset.productId;

        if (!productId) return;

        window.location.href =
            `product.html?id=${encodeURIComponent(productId)}`;

    };

});
    document.querySelectorAll(".plus").forEach(button=>{

   button.onclick = async () => {

    const cartItemId =
    button.dataset.id;

const separatorIndex =
    cartItemId.lastIndexOf("_");

let productId;
let selectedSize;

if (separatorIndex > -1) {

    productId =
        cartItemId.substring(
            0,
            separatorIndex
        );

    selectedSize =
        cartItemId.substring(
            separatorIndex + 1
        );

} else {

    productId = cartItemId;
    selectedSize = "";

}

await Cart.add(
    productId,
    selectedSize
);

loadCart();

};

});

document.querySelectorAll(".minus").forEach(button => {

    button.onclick = async () => {

        const cartObject = await Cart.getAll();

        const qty = cartObject[button.dataset.id];

        if (qty > 1) {

    await Cart.update(button.dataset.id, qty - 1);

} else {

    await Cart.remove(button.dataset.id);

}

loadCart();

    };

});

}

loadCart();

document
.getElementById("checkoutBtn")
.onclick = () => {

    const selectedIds =
        [...selectedCartItems];

    if (selectedIds.length === 0) {

        alert(
            "Please select at least one item to checkout."
        );

        return;

    }

    // This is a normal CART checkout,
// so any old Buy Now session must be ignored.
sessionStorage.removeItem("buyNowItem");

sessionStorage.setItem(
    "selectedCartItems",
    JSON.stringify(selectedIds)
);

window.location.href =
    "checkout.html";

};

