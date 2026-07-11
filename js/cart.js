import { getProducts } from "./firebase.js";

const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");

async function loadCart() {

    const cart = JSON.parse(localStorage.getItem("cart")) || [];

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

        const product = products.find(
    p => p.id === item.id
);

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

    document.querySelectorAll(".removeBtn").forEach(btn=>{

        btn.onclick=()=>{

            const newCart = cart.filter(item => item.id !== btn.dataset.id);

            localStorage.setItem(
                "cart",
                JSON.stringify(newCart)
            );

            loadCart();

        };

    });
    
    document.querySelectorAll(".plus").forEach(button=>{

    button.onclick=()=>{

        const id=button.dataset.id;

        let cart=JSON.parse(localStorage.getItem("cart"))||[];

        const item=cart.find(i=>i.id===id);

        item.quantity++;

        localStorage.setItem("cart",JSON.stringify(cart));

        location.reload();

    };

});

document.querySelectorAll(".minus").forEach(button=>{

    button.onclick=()=>{

        const id=button.dataset.id;

        let cart=JSON.parse(localStorage.getItem("cart"))||[];

        const item=cart.find(i=>i.id===id);

        item.quantity--;

        if(item.quantity<=0){

            cart=cart.filter(i=>i.id!==id);

        }

        localStorage.setItem("cart",JSON.stringify(cart));

        location.reload();

    };

});

}

loadCart();

document
.getElementById("checkoutBtn")
.onclick=()=>{

window.location.href="checkout.html";

};

