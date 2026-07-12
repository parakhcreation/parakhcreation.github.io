import { Profile } from "./profileStore.js";

import { Address } from "./addressStore.js";

import { Cart } from "./cartStore.js";

import { getProducts } from "./firebase.js";

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
            src="${product.image}"
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
