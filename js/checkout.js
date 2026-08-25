

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
let selectedAddressId = null;

const selectedCartItems =
    JSON.parse(
        sessionStorage.getItem("selectedCartItems") || "[]"
    );

    async function removeSelectedCartItems() {

    for (
        const cartItemId
        of selectedCartItems
    ) {

        await Cart.remove(
            cartItemId
        );

    }

    sessionStorage.removeItem(
        "selectedCartItems"
    );

}

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

        if (
    address.id === selectedAddressId ||
    (!selectedAddressId && address.isDefault)
) {

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

    selectedAddress = address;

    selectedAddressId = address.id;

};

        addressContainer.appendChild(card);

    });
    
    console.log("Profile =", Profile);
console.log("Address =", Address);
console.log("Cart =", Cart);

const buyNowItem =
    sessionStorage.getItem("buyNowItem");

let cartObject;

if (buyNowItem) {

    const item =
        JSON.parse(buyNowItem);

    cartObject = {

        [item.selectedSize
            ? `${item.id}_${item.selectedSize}`
            : item.id
        ]: item.quantity

    };

} else {

    const allCartItems =
        await Cart.getAll();

    cartObject = {};

    Object.entries(allCartItems).forEach(
        ([key, quantity]) => {

            if (
                selectedCartItems.includes(key)
            ) {

                cartObject[key] =
                    quantity;

            }

        }
    );

}

const products = await getProducts();

summaryProducts.innerHTML = "";

let subtotal = 0;

Object.entries(cartObject).forEach(([key, quantity]) => {

    const separatorIndex =
    key.lastIndexOf("_");

let productId;
let selectedSize;

if (separatorIndex > -1) {

    productId =
        key.substring(
            0,
            separatorIndex
        );

    selectedSize =
        key.substring(
            separatorIndex + 1
        );

} else {

    productId = key;
    selectedSize = "";

}

const product =
    products.find(
        p => p.id === productId
    );

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

${selectedSize
    ? `<br>Size : ${selectedSize}`
    : ""
}

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

    const order = await placeOrder(
    "COD",
    null,
    selectedAddress
);

    if (sessionStorage.getItem("buyNowItem")) {

    sessionStorage.removeItem(
        "buyNowItem"
    );

} else {

    await removeSelectedCartItems();

}

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
        paymentId: response.razorpay_payment_id,
        orderId: response.razorpay_order_id,
        signature: response.razorpay_signature,
    },
    selectedAddress
);

    if (
    sessionStorage.getItem("buyNowItem")
) {

    sessionStorage.removeItem(
        "buyNowItem"
    );

} else {

    await removeSelectedCartItems();

}

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

const addBtn =
document.getElementById("addNewAddress");

const form =
document.getElementById("newAddressForm");

const cancelBtn =
document.getElementById("cancelCheckoutAddress");

addBtn.onclick = () => {

    form.style.display = "block";

};

cancelBtn.onclick = () => {

    form.style.display = "none";

};

document.getElementById("saveCheckoutAddress").onclick = async () => {

const saveBtn =
document.getElementById("saveCheckoutAddress");

saveBtn.disabled = true;

    const address = {

        type: document.getElementById("newAddressType").value,

        addressLine1: document.getElementById("newAddressLine1").value.trim(),

        addressLine2: document.getElementById("newAddressLine2").value.trim(),

        landmark: document.getElementById("newLandmark").value.trim(),

        city: document.getElementById("newCity").value.trim(),

        state: document.getElementById("newState").value.trim(),

        pincode: document.getElementById("newPincode").value.trim(),

        isDefault: document.getElementById("newDefault").checked,

        createdAt: new Date()

    };

    if (

        !address.addressLine1 ||

        !address.city ||

        !address.state ||

        !address.pincode

    ) {

        alert("Please fill all required fields.");

        return;

    }

    try {

    await Address.add(address);
    
    const addresses = await Address.getAll();

selectedAddressId = addresses[addresses.length - 1].id;

    await loadCheckout();

    form.style.display = "none";
    addressContainer.scrollIntoView({

    behavior: "smooth",

    block: "start"

});

    document.getElementById("newAddressType").value = "Home";
    document.getElementById("newAddressLine1").value = "";
    document.getElementById("newAddressLine2").value = "";
    document.getElementById("newLandmark").value = "";
    document.getElementById("newCity").value = "";
    document.getElementById("newState").value = "";
    document.getElementById("newPincode").value = "";
    document.getElementById("newDefault").checked = false;

    alert("Address saved successfully.");

} finally {

    saveBtn.disabled = false;

}

};
