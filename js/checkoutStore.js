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

    cart = await Cart.getAll();

}

        const profile = await Profile.get();

        const addresses = await Address.getAll();

        const products = await getProducts();

        const items = [];

        let subtotal = 0;

        for (const [key, quantity] of Object.entries(cart)) {

    const parts = key.split("_");

    const productId = parts[0];

    const selectedSize = parts[1] || "";

    console.log("KEY =", key);
console.log("PARTS =", parts);
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
