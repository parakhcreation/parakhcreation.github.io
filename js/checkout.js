import { getProducts } from "./firebase.js";

const orderItems = document.getElementById("orderItems");
const checkoutTotal = document.getElementById("checkoutTotal");

async function loadCheckout() {

    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    const products = await getProducts();

    let total = 0;

    orderItems.innerHTML = "";

    if (cart.length === 0) {

        orderItems.innerHTML = "<p>Your cart is empty.</p>";

        checkoutTotal.textContent = "₹0";

        document.getElementById("payNow").disabled = true;

        return;

    }

    cart.forEach(item => {

        const product = products.find(p => p.id === item.id);

        if (!product) return;

        const subtotal = Number(product.price) * item.quantity;

        total += subtotal;

        orderItems.innerHTML += `

        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">

            <span>

                ${product.name}

                × ${item.quantity}

            </span>

            <strong>

                ₹${subtotal}

            </strong>

        </div>

        `;

    });

    checkoutTotal.textContent = "₹" + total;

}

loadCheckout();

document.getElementById("payNow").onclick = () => {

    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const address = document.getElementById("address").value.trim();
    const city = document.getElementById("city").value.trim();
    const state = document.getElementById("state").value.trim();
    const pincode = document.getElementById("pincode").value.trim();

    if (name === "") {

        alert("Please enter your Full Name.");
        document.getElementById("name").focus();
        return;

    }

    if (!/^[0-9]{10}$/.test(phone)) {

        alert("Please enter a valid 10-digit Mobile Number.");
        document.getElementById("phone").focus();
        return;

    }

    if (address === "") {

        alert("Please enter your Delivery Address.");
        document.getElementById("address").focus();
        return;

    }

    if (city === "") {

        alert("Please enter your City.");
        document.getElementById("city").focus();
        return;

    }

    if (state === "") {

        alert("Please enter your State.");
        document.getElementById("state").focus();
        return;

    }

    if (!/^[0-9]{6}$/.test(pincode)) {

        alert("Please enter a valid 6-digit Pincode.");
        document.getElementById("pincode").focus();
        return;

    }

    alert("Customer details verified.\n\nNext step: Razorpay Payment");

};
