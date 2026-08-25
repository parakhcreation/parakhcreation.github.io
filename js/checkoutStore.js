import { Cart } from "./cartStore.js";
import { Profile } from "./profileStore.js";
import { Address } from "./addressStore.js";
import { getProducts } from "./firebase.js";

export const Checkout = {

    async prepare() {

        let cart;

const buyNow = sessionStorage.getItem("buyNowItem");

if (buyNow) {

    const item = JSON.parse(buyNow);

    cart = {

    [item.selectedSize
        ? `${item.id}_${item.selectedSize}`
        : item.id]: item.quantity

};

}

else {

    const allCartItems =
        await Cart.getAll();

    const selectedCartItems =
        JSON.parse(
            sessionStorage.getItem(
                "selectedCartItems"
            ) || "[]"
        );

    cart = {};

    Object.entries(allCartItems).forEach(
        ([key, quantity]) => {

            if (
                selectedCartItems.includes(key)
            ) {

                cart[key] = quantity;

            }

        }
    );

}

        const profile = await Profile.get();

        const addresses = await Address.getAll();

        const products = await getProducts();

        const items = [];

        let subtotal = 0;

        for (const [key, quantity] of Object.entries(cart)) {

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

    console.log("KEY =", key);

console.log("SELECTED SIZE =", selectedSize);

    const product = products.find(

        p => p.id === productId

    );
            
            
            if (!product) continue;

            const total = product.price * quantity;

            subtotal += total;

            items.push({

    ...product,

    quantity,

    selectedSize,

    total

});

        }

        const shipping = subtotal >= 999 ? 0 : 99;

        const discount = 0;

        const grandTotal = subtotal + shipping - discount;

        const defaultAddress =

            addresses.find(

                a => a.isDefault

            ) || null;

        return {

            profile,

            address: defaultAddress,

            items,

            subtotal,

            shipping,

            discount,

            grandTotal

        };

    }

};
