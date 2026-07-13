import { getNextProductId } from "./productService.js";
import { getCategories } from "./categoryService.js";
import { db } from "./firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

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
                    <img src="${p.image}" width="60">
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
                    class="btn btn-sm btn-warning">

                    Edit

                    </button>

                    <button
                    class="btn btn-sm btn-danger">

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

loadProducts();
loadCategoryDropdown();

document
.getElementById("category")
.addEventListener(
    "change",
    updateProductId
);
