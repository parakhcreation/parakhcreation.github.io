import { getProducts } from "./firebase.js";
import { Cart } from "./cartStore.js";

const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");

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

    if (cart.length === 0) {

        cartItems.innerHTML = "<h2>Your cart is empty.</h2>";

        cartTotal.textContent = "₹0";

        return;

    }

    cart.forEach(item => {
console.log("Cart item:", item);
       const product = products.find(
    p => p.id && p.id.trim() === item.id.trim()
);

console.log("Matched product:", product);

        if (!product) return;

        total += Number(product.price) * item.quantity;

        cartItems.innerHTML += `

        <div class="cart-item">

            <img src="${product.image}">

            <div class="cart-details">

                <h2>${product.name}</h2>

                <p>${product.description}</p>

                <div class="cart-price">

    ₹${product.price}

</div>

<p>

<div class="quantity-controls">

    <button
    class="qty-btn minus"
    data-id="${product.id}">
        −
    </button>

    <span class="qty">

        ${item.quantity}

    </span>

    <button
    class="qty-btn plus"
    data-id="${product.id}">
        +

    </button>

</div>

</p>

            </div>

            <button
                class="removeBtn"
                data-id="${product.id}">

                Remove

            </button>

        </div>

        `;

    });

    cartTotal.textContent = "₹" + total;

const finalTotal = document.getElementById("finalTotal");

if(finalTotal){

    finalTotal.textContent = "₹" + total;

}

    document.querySelectorAll(".removeBtn").forEach(btn => {

    btn.onclick = async () => {

        await Cart.remove(btn.dataset.id);

        loadCart();

    };

});
    
    document.querySelectorAll(".plus").forEach(button=>{

   button.onclick = async () => {

    await Cart.add(button.dataset.id);

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
.onclick=()=>{

window.location.href="checkout.html";

};

