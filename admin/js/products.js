import { getNextProductId } from "./productService.js";
import { getCategories } from "./categoryService.js";
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
    getDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";

let editingProductId = null;
const tbody = document.getElementById("productsTable");

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

loadCategoryDropdown();

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
document.getElementById("colour").value = product.colour || "";
document.getElementById("price").value = product.price;
document.getElementById("stock").value = product.stock;
document.getElementById("collection").value =
    product.collection || "";
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

    const product = {
    id: document.getElementById("id").value.trim(),
    name: document.getElementById("name").value.trim(),
    category: document.getElementById("category").value,
    fabric: document.getElementById("fabric").value.trim(),
    colour: document.getElementById("colour").value.trim(),
    price: Number(document.getElementById("price").value),
    stock: Number(document.getElementById("stock").value),
    collection: document.getElementById("collection").value.trim(),
    description: document.getElementById("description").value.trim(),
    available: document.getElementById("available").checked,
    featured: document.getElementById("featured").checked
};

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
