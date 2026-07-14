import { Profile } from "./profileStore.js";

import { Address } from "./addressStore.js";

import { Cart } from "./cartStore.js";

import { getProducts } from "./firebase.js";

import { placeOrder } from "./orderStore.js";

console.log("Checkout loaded");
console.log(placeOrder);


const addressContainer =
    document.getElementById("addressContainer");

const summaryProducts =
    document.getElementById("summaryProducts");

const recipientName =
    document.getElementById("recipientName");

const recipientPhone =
    document.getElementById("recipientPhone");

const subtotalElement =
    document.getElementById("subtotal");

const grandTotalElement =
    document.getElementById("grandTotal");

let selectedAddress = null;

async function loadCheckout(){

    const profile = await Profile.get();

    recipientName.value =
        `${profile.firstName} ${profile.lastName}`.trim();

    recipientPhone.value =
        profile.phone || "";

    const addresses =
        await Address.getAll();

    addressContainer.innerHTML = "";

    addresses.forEach(address=>{

        const card =
            document.createElement("div");

        card.className =
            "addressCard";

        if(address.isDefault){

            selectedAddress = address;

            card.classList.add("selected");

        }

        card.innerHTML=`

        <div class="addressType">

            ${address.type}

            ${address.isDefault
                ? '<span class="defaultBadge">Default</span>'
                : ''
            }

        </div>

        <div class="addressText">

            ${address.addressLine1}<br>

            ${address.addressLine2 || ""}<br>

            ${address.landmark || ""}<br>

            ${address.city},
            ${address.state}

            ${address.pincode}

        </div>

        `;

        card.onclick=()=>{

            document
            .querySelectorAll(".addressCard")
            .forEach(c=>c.classList.remove("selected"));

            card.classList.add("selected");

            selectedAddress=address;

        };

        addressContainer.appendChild(card);

    });
    
    console.log("Profile =", Profile);
console.log("Address =", Address);
console.log("Cart =", Cart);

const cartObject = await Cart.getAll();

const products = await getProducts();

summaryProducts.innerHTML = "";

let subtotal = 0;

Object.entries(cartObject).forEach(([id, quantity]) => {

    const product =
    products.find(p => p.id === id);

    if (!product) return;

    subtotal +=
    Number(product.price) * quantity;

    const div =
        document.createElement("div");

    div.className = "summaryItem";

    div.innerHTML = `

        <img
            class="summaryImage"
            src="${product.thumbnail}"
        >

        <div class="summaryInfo">

            <div class="summaryName">

                ${product.name}

            </div>

            <div class="summaryPrice">

                Qty : ${quantity}

            </div>

            <div class="summaryPrice">

                ₹${product.price}

            </div>

        </div>

    `;

    summaryProducts.appendChild(div);

});

subtotalElement.textContent =
    `₹${subtotal}`;

grandTotalElement.textContent =
    `₹${subtotal}`;

}

loadCheckout();

const placeOrderBtn = document.getElementById("placeOrderBtn");

placeOrderBtn.addEventListener("click", async () => {

    if (!selectedAddress) {
        alert("Please select a delivery address.");
        return;
    }

    const paymentMethod = document.querySelector(
        'input[name="payment"]:checked'
    ).value;

    console.log(paymentMethod);     
    

    try {

        placeOrderBtn.disabled = true;
        placeOrderBtn.textContent = "Processing...";

        if (paymentMethod === "COD") {

    const order = await placeOrder("COD");

    await Cart.clear();

   window.location.href =
`order-success.html?id=${order.id}`;

}
else {

    const response = await fetch(
    "https://asia-south1-parakh-creation-website.cloudfunctions.net/createRazorpayOrder",
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            amount: Number(
                grandTotalElement.textContent.replace("₹", "")
            ),
        }),
    }
);

const data = await response.json();

if (!data.success) {

    throw new Error("Unable to create Razorpay order.");

}
const options = {

    key: "rzp_test_TD2D4ekj67FYeZ",

    amount: data.order.amount,

    currency: data.order.currency,

    name: "Parakh Creation",

    description: "Order Payment",

    order_id: data.order.id,

    prefill: {

        name: recipientName.value,

        contact: recipientPhone.value,

    },

    theme: {

        color: "#111827",

    },

    handler: async function (response) {

    const verifyResponse = await fetch(
        "https://asia-south1-parakh-creation-website.cloudfunctions.net/verifyRazorpayPayment",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({

                orderId: response.razorpay_order_id,

                paymentId: response.razorpay_payment_id,

                signature: response.razorpay_signature,

            }),
        }
    );

    const verifyData = await verifyResponse.json();

    if (!verifyData.success) {

        alert("Payment verification failed.");

        return;

    }

    const order = await placeOrder(
    "razorpay",
    {
        paymentId:
            response.razorpay_payment_id,

        orderId:
            response.razorpay_order_id,

        signature:
            response.razorpay_signature,
    }
);

    await Cart.clear();

    window.location.href =
`order-success.html?id=${order.id}`;

},

};

const rzp = new Razorpay(options);

    rzp.open();

}

    } catch (err) {

        console.error(err);

        alert("Unable to place your order.");

    } finally {

        placeOrderBtn.disabled = false;
        placeOrderBtn.textContent = "PLACE ORDER";

    }

});
