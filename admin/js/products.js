import { getNextProductId } from "./productService.js";
import { COLOURS } from "./productLists.js";
import { getCategories } from "./categoryService.js";
import { requireAdmin } from "./auth.js";
import {
    db,
    storage
} from "./firebase.js";

import {
    collection,
    doc,
    setDoc,
    serverTimestamp,
    getDocs,
    deleteDoc,
    getDoc,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";

await requireAdmin();
let editingProductId = null;

const tbody = document.getElementById("productsTable");

const inventoryType =
    document.getElementById("inventoryType");

const inventoryContainer =
    document.getElementById("inventoryContainer");

const ALPHABETIC_SIZES = [
    "S",
    "M",
    "L",
    "XL",
    "XXL",
    "3XL"
];

const NUMERIC_SIZES = [
    "28",
    "30",
    "32",
    "34",
    "36",
    "38",
    "40"
];


async function loadProducts() {

    try {

        const snapshot = await getDocs(collection(db, "products"));

        tbody.innerHTML = "";

        snapshot.forEach((doc) => {

            const p = doc.data();

            tbody.innerHTML += `
            <tr>

                <td>
                    <img
    src="${p.thumbnail}"
    width="60"
    style="
        width:60px;
        height:80px;
        object-fit:cover;
        border-radius:8px;
    ">
                </td>

                <td>${p.id}</td>

                <td>${p.name}</td>

                <td>${p.category}</td>

                <td>₹${p.price}</td>

                <td>${p.stock}</td>

                <td>

                    ${
                        p.available
                        ? "✅"
                        : "❌"
                    }

                </td>

                <td>

                    <button
class="btn btn-sm btn-warning editBtn"
data-id="${p.id}">

Edit

</button>

                    <button
class="btn btn-sm btn-danger deleteBtn"
data-id="${p.id}">

Delete

</button>

                </td>

            </tr>
            `;

        });

    }

    catch(error){

        console.error(error);

        tbody.innerHTML=`
        <tr>
        <td colspan="8">

        Failed to load products.

        </td>
        </tr>
        `;

    }

}


function renderInventory() {

    if (!inventoryType || !inventoryContainer) return;

    const type = inventoryType.value;

    inventoryContainer.innerHTML = "";

    if (type === "none") {

        inventoryContainer.innerHTML = `

<div class="row">

    <div class="col-md-4 mb-3">

        <label class="form-label">

            Total Stock

        </label>

        <input
            id="totalStock"
            type="number"
            min="0"
            value="0"
            class="form-control">

    </div>

</div>

`;

        return;
    }

    const sizes =
        type === "alphabetic"
            ? ALPHABETIC_SIZES
            : NUMERIC_SIZES;

    if (type === "alphabetic" || type === "numeric") {

    sizes.forEach(size => {

    inventoryContainer.innerHTML += `

<div class="row align-items-center mb-2">

    <div class="col-4">

        <div class="form-check">

            <input
                class="form-check-input size-enable"
                type="checkbox"
                data-size="${size}">

            <label class="form-check-label">

                ${size}

            </label>

        </div>

    </div>

    <div class="col-4">

        <input
            class="form-control size-stock"
            type="number"
            min="0"
            value="0"
            placeholder="Stock"
            disabled
            data-size="${size}">

    </div>

</div>

`;

});

    const checks =
        inventoryContainer.querySelectorAll(".size-enable");

    checks.forEach(check => {

        check.addEventListener("change", () => {

            const stockInput =
                inventoryContainer.querySelector(
                    `.size-stock[data-size="${check.dataset.size}"]`
                );

            stockInput.disabled = !check.checked;

            if (!check.checked) {
                stockInput.value = 0;
            }

        });

    });

    return;

}

    inventoryContainer.innerHTML = `

<div id="customSizes">

</div>

<button
    type="button"
    class="btn btn-outline-primary"
    id="addCustomSize">

    + Add Custom Size

</button>

`;

const customContainer =
    document.getElementById("customSizes");

function addCustomRow() {

    customContainer.insertAdjacentHTML(
        "beforeend",
        `

<div class="row mb-2">

    <div class="col-md-4">

        <input
            class="form-control custom-size-name"
            placeholder="Size">

    </div>

    <div class="col-md-3">

        <input
            type="number"
            min="0"
            value="0"
            class="form-control custom-size-stock"
            placeholder="Stock">

    </div>

    <div class="col-md-2">

        <button
            type="button"
            class="btn btn-outline-danger removeCustomSize">

            Remove

        </button>

    </div>

</div>

`
    );

}

addCustomRow();

document
    .getElementById("addCustomSize")
    .addEventListener(
        "click",
        addCustomRow
    );

    inventoryContainer.addEventListener("click", e => {

    if (
        e.target.classList.contains(
            "removeCustomSize"
        )
    ) {

        e.target
            .closest(".row")
            .remove();

    }

});



}


function getInventory() {

    const type = inventoryType.value;

    if (type === "none") {

        return {
            type: "none",
            stock: Number(
                document.getElementById("totalStock").value || 0
            )
        };

    }

    if (type === "alphabetic" || type === "numeric") {

        const sizes = {};

        document
            .querySelectorAll(".size-enable")
            .forEach(check => {

                if (check.checked) {

                    const stock = document.querySelector(
                        `.size-stock[data-size="${check.dataset.size}"]`
                    );

                    sizes[check.dataset.size] =
                        Number(stock.value || 0);

                }

            });

        return {
            type,
            sizes
        };

    }

    const sizes = {};

    document
        .querySelectorAll("#customSizes .row")
        .forEach(row => {

            const name =
                row.querySelector(".custom-size-name").value.trim();

            const stock =
                Number(
                    row.querySelector(".custom-size-stock").value || 0
                );

            if (name) {

                sizes[name] = stock;

            }

        });

    return {
        type: "custom",
        sizes
    };

}

function setInventory(inventory) {

    if (!inventory) {

        renderInventory();
        return;

    }

    if (inventory.type === "none") {

        const stockInput =
            document.getElementById("totalStock");

        if (stockInput) {

            stockInput.value = inventory.stock || 0;

        }

        return;

    }

    if (!inventory.sizes) return;

    Object.entries(inventory.sizes).forEach(([size, stock]) => {

        const checkbox = document.querySelector(
            `.size-enable[data-size="${size}"]`
        );

        if (checkbox) {

            checkbox.checked = true;

        }

        const stockInput = document.querySelector(
            `.size-stock[data-size="${size}"]`
        );

        if (stockInput) {

            stockInput.value = stock;

        }

    });

}

function getTotalStock() {

    const inventory = getInventory();

    if (inventory.type === "none") {

        return inventory.stock;

    }

    return Object.values(inventory.sizes)
        .reduce((a, b) => a + b, 0);

}


async function loadCategoryDropdown(){

    const select = document.getElementById("category");

    if(!select) return;

    select.innerHTML="";

    const categories = await getCategories();

    categories.forEach(category=>{

        select.innerHTML += `
            <option
                value="${category.id}"
                data-prefix="${category.prefix}">
                ${category.name}
            </option>
        `;

    });

    await updateProductId();

}

async function updateProductId(){

    const select = document.getElementById("category");

    const option =
        select.options[select.selectedIndex];

    if(!option) return;

    const prefix =
        option.dataset.prefix;

    const nextId =
        await getNextProductId(prefix);

    const idField =
        document.getElementById("id");

    idField.value = nextId;

}

loadProducts().then(() => {

    document.querySelectorAll(".editBtn").forEach(button => {

        button.addEventListener("click", () => {

            const productId = button.dataset.id;

            console.log("Editing:", productId);

        });

    });

});



await loadCategoryDropdown();


renderInventory();

inventoryType.addEventListener(
    "change",
    renderInventory
);


document.addEventListener("click", async (e) => {

    if (!e.target.classList.contains("editBtn")) return;

    const productId = e.target.dataset.id;

    const snap = await getDoc(doc(db, "products", productId));

    if (!snap.exists()) {
        alert("Product not found.");
        return;
    }

    const product = snap.data();

    editingProductId = product.id;

// Change modal title
document.querySelector(".modal-title").textContent =
    "Edit Product";

// Change button text
document.getElementById("saveProductBtn").textContent =
    "Update Product";

// Fill all fields
document.getElementById("id").value = product.id;
document.getElementById("name").value = product.name;
document.getElementById("category").value = product.category;
document.getElementById("fabric").value = product.fabric || "";
const colourSelect = document.getElementById("colour");

if (colourSelect.tomselect) {

    colourSelect.tomselect.setValue(product.colour || "");

} else {

    colourSelect.value = product.colour || "";

}
document.getElementById("price").value = product.price;

document.getElementById("collection").value =
    product.collection || "";
document.getElementById("occasion").value =
    (product.occasion || []).join(", ");

document.getElementById("keywords").value =
    (product.keywords || []).join(", ");
document.getElementById("description").value =
    product.description || "";

document.getElementById("available").checked =
    product.available;

document.getElementById("featured").checked =
    product.featured;

// Show existing image
if (product.thumbnail) {

    imagePreview.src = product.thumbnail;

    imagePreview.classList.remove("d-none");

    removeImageBtn.classList.remove("d-none");

}

/* ---------------- Restore Inventory ---------------- */

if (product.inventory) {

    inventoryType.value = product.inventory.type || "none";

} else {

    inventoryType.value = "none";

}

renderInventory();

setInventory(product.inventory);

/* ----------------------------------------------- */

// Open modal
new bootstrap.Modal(
    document.getElementById("productModal")
).show();
});

document.addEventListener("click", async (e) => {

    if (!e.target.classList.contains("deleteBtn")) return;

    const productId = e.target.dataset.id;

    const confirmed = confirm(
        `Delete product ${productId}?\n\nThis cannot be undone.`
    );

    if (!confirmed) return;

    try {
        
        const imageRef = ref(
    storage,
    `products/${productId}/thumbnail`
);

try {
    await deleteObject(imageRef);
} catch (err) {
    console.warn("Image not found in Storage:", err);
}

        await deleteDoc(doc(db, "products", productId));

        alert("✅ Product deleted successfully!");

        loadProducts();

    } catch (error) {

        console.error(error);

        alert("❌ Failed to delete product.");

    }

});

document
.getElementById("category")
.addEventListener(
    "change",
    updateProductId
);
console.log("Storage:", storage);

const saveBtn = document.getElementById("saveProductBtn");

saveBtn.addEventListener("click", async () => {

    console.log(
    "BEFORE PRODUCT OBJECT",
    document.getElementById("occasion").value,
    document.getElementById("keywords").value
);

    const product = {
    id: document.getElementById("id").value.trim(),
    name: document.getElementById("name").value.trim(),
    category: document.getElementById("category").value,
    fabric: document.getElementById("fabric").value.trim(),
    colour: document.getElementById("colour").value.trim(),
    price: Number(document.getElementById("price").value),
    inventory: getInventory(),
stock: getTotalStock(),
    collection: document.getElementById("collection").value.trim(),
    occasion:
    document.getElementById("occasion")
        .value
        .split(",")
        .map(v => v.trim())
        .filter(Boolean),

keywords:
    document.getElementById("keywords")
        .value
        .split(",")
        .map(v => v.trim().toLowerCase())
        .filter(Boolean),
    description: document.getElementById("description").value.trim(),
    available: document.getElementById("available").checked,
    featured: document.getElementById("featured").checked
};

console.log(
    "AFTER PRODUCT OBJECT",
    product.occasion,
    product.keywords
);

const imageFile = document.getElementById("productImage").files[0];

// Keep the existing image when editing
let imageUrl = imagePreview.src || "";

// Upload a new image only if one was selected
if (imageFile) {

    const storageRef = ref(
        storage,
        `products/${product.id}/thumbnail`
    );

    await uploadBytes(storageRef, imageFile);

    imageUrl = await getDownloadURL(storageRef);

}

product.thumbnail = imageUrl;
if (editingProductId) {

    const existing = await getDoc(doc(db, "products", editingProductId));

    if (existing.exists()) {
        product.createdAt = existing.data().createdAt;
    }

} else {

    product.createdAt = serverTimestamp();

}

product.updatedAt = serverTimestamp();
product.displayOrder = 1;

console.log("Occasion:", product.occasion);

console.log("Keywords:", product.keywords);

console.log(product);

// Save to Firestore
await setDoc(
    doc(db, "products", product.id),
    product
);

alert(
    editingProductId
        ? "✅ Product updated successfully!"
        : "✅ Product added successfully!"
);

loadProducts();

// Close the modal
bootstrap.Modal
    .getInstance(document.getElementById("productModal"))
    .hide();

// Reset the form
document.getElementById("productForm").reset();

// Generate the next product ID
await updateProductId();

});



// ---------- Image Preview ----------

const productImage = document.getElementById("productImage");
const imagePreview = document.getElementById("imagePreview");
const removeImageBtn = document.getElementById("removeImageBtn");

productImage.addEventListener("change", () => {

    const file = productImage.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {

        imagePreview.src = e.target.result;

        imagePreview.classList.remove("d-none");

        removeImageBtn.classList.remove("d-none");

    };

    reader.readAsDataURL(file);

});

removeImageBtn.addEventListener("click", () => {

    productImage.value = "";

    imagePreview.src = "";

    imagePreview.classList.add("d-none");

    removeImageBtn.classList.add("d-none");

});


function initialiseColourDropdown() {

    const select = document.getElementById("colour");

    if (!select) return;

    // Clear existing options
    select.innerHTML = "";

    // Empty option
    select.add(new Option("", ""));

    // Populate colours
    COLOURS.forEach(colour => {

    select.add(

        new Option(

            colour.name,

            colour.name

        )

    );

});

    // Initialise Tom Select
   new TomSelect("#colour", {

    create: function(input) {

        input = input.trim();

        if (!input) return false;

        input = input
            .toLowerCase()
            .replace(/\b\w/g, c => c.toUpperCase());

        return {

            value: input,

            text: input

        };

    },

    createOnBlur: true,

    persist: false,

    maxOptions: 500,

    placeholder: "Search or type a colour...",

    sortField: {

        field: "text",

        direction: "asc"

    },

    render: {

        option: function(data, escape) {

            const colour = COLOURS.find(c => c.name === data.text);

            let swatch = "";

            if (colour) {

                if (colour.hex === "rainbow") {

                    swatch = `
                        <span class="colour-dot rainbow-dot"></span>
                    `;

                } else if (
                    colour.hex !== "pattern" &&
                    colour.hex !== "gradient"
                ) {

                    swatch = `
                        <span
                            class="colour-dot"
                            style="background:${colour.hex};">
                        </span>
                    `;

                }

            }

            return `
                <div class="colour-option">
                    ${swatch}
                    ${escape(data.text)}
                </div>
            `;

        },

        item: function(data, escape) {

            const colour = COLOURS.find(c => c.name === data.text);

            let swatch = "";

            if (colour) {

                if (colour.hex === "rainbow") {

                    swatch = `
                        <span class="colour-dot rainbow-dot"></span>
                    `;

                } else if (
                    colour.hex !== "pattern" &&
                    colour.hex !== "gradient"
                ) {

                    swatch = `
                        <span
                            class="colour-dot"
                            style="background:${colour.hex};">
                        </span>
                    `;

                }

            }

            return `
                <div class="colour-option">
                    ${swatch}
                    ${escape(data.text)}
                </div>
            `;

        }

    }

});

}

initialiseColourDropdown();