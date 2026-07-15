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

        [item.id]: item.quantity

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

        for (const [id, quantity] of Object.entries(cart)) {

            const product = products.find(

                p => p.id === id

            );
            
            console.log("Looking for:", id);
console.log("Found product:", product);
console.log("Products:", products);

            if (!product) continue;

            const total = product.price * quantity;

            subtotal += total;

            items.push({

                ...product,

                quantity,

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
