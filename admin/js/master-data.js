import {
    db,
    storage
} from "../../js/firebase.js";

import {
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";

import {
    collection,
    getDocs,
    query,
    orderBy,
    addDoc,
    doc,
    setDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

let editingId = null;
let editingMode = false;

let currentType = "categories";

const tabs = document.querySelectorAll(".master-tab");
const title = document.getElementById("pageTitle");
const tableHead = document.getElementById("tableHead");
const tableBody = document.getElementById("tableBody");

const addBtn = document.getElementById("addItemBtn");

const imageInput =
    document.getElementById("catImage");

const preview =
    document.getElementById("catPreview");

imageInput.addEventListener("change", () => {

    const file = imageInput.files[0];

    if (!file) {

        preview.style.display = "none";
        return;

    }

    preview.src =
        URL.createObjectURL(file);

    preview.style.display = "block";

});

addBtn.addEventListener("click", () => {

    if (
    currentType !== "categories" &&
    currentType !== "sizes"
) return;

    editingMode = false;
    editingId = null;

   document.getElementById("categoryModalTitle").textContent =
    currentType === "sizes"
        ? "Add Size"
        : "Add Category";

    document.getElementById("catName").value = "";
    if (currentType === "sizes") {

    document.getElementById("catPlural").parentElement.style.display = "none";
    document.getElementById("catPrefix").parentElement.parentElement.style.display = "none";
    document.getElementById("catImage").closest(".mb-3").style.display = "none";

} else {

    document.getElementById("catPlural").parentElement.style.display = "";
    document.getElementById("catPrefix").parentElement.parentElement.style.display = "";
    document.getElementById("catImage").closest(".mb-3").style.display = "";

}
    document.getElementById("catPlural").value = "";
    document.getElementById("catPrefix").value = "";
    document.getElementById("catOrder").value = "";
    document.getElementById("catActive").checked = true;

    new bootstrap.Modal(
        document.getElementById("categoryModal")
    ).show();

});



tabs.forEach(tab => {

    tab.addEventListener("click", () => {

        tabs.forEach(t => t.classList.remove("active"));

        tab.classList.add("active");

        currentType = tab.dataset.type;

        title.textContent =
            currentType.charAt(0).toUpperCase() +
            currentType.slice(1);

        loadTable();

    });

});

async function loadTable() {

    tableHead.innerHTML = "";
    tableBody.innerHTML = "";

   if (currentType === "categories") {

    await loadCategories();

    return;

}

if (currentType === "sizes") {

    await loadSizes();

    return;

}

tableBody.innerHTML = `
<tr>
    <td colspan="6">
        Coming Soon...
    </td>
</tr>
`;

return;

    tableHead.innerHTML = `
        <tr>
            <th>Name</th>
            <th>Prefix</th>
            <th>Plural Name</th>
            <th>Display Order</th>
            <th>Active</th>
            <th>Actions</th>
        </tr>
    `;

    const q = query(
        collection(db,"categories"),
        orderBy("displayOrder")
    );

    const snapshot = await getDocs(q);

    snapshot.forEach(doc=>{

        const data = doc.data();

        tableBody.innerHTML += `
            <tr>

                <td>${data.name}</td>

                <td>${data.prefix}</td>

                <td>${data.pluralName}</td>

                <td>${data.displayOrder}</td>

                <td>

                    ${
                        data.active
                        ? "✅"
                        : "❌"
                    }

                </td>

                <td>

                    <button
class="btn btn-warning btn-sm edit-category"
data-id="${doc.id}">

Edit

</button>

                </td>

            </tr>
        `;

    });

    
    document
.querySelectorAll(".edit-category")
.forEach(button=>{

    button.onclick = async ()=>{

        editingMode = true;

        editingId = button.dataset.id;

        const data =
            snapshot.docs.find(
                d=>d.id===editingId
            ).data();

        document.getElementById("categoryModalTitle")
            .textContent = "Edit Category";

        document.getElementById("catName").value =
            data.name;

        document.getElementById("catPlural").value =
            data.pluralName;

        document.getElementById("catPrefix").value =
            data.prefix;

        document.getElementById("catOrder").value =
            data.displayOrder;

        document.getElementById("catImage").value =
    data.image || "";

    const image =
    document.getElementById("catImage")
        .value
        .trim();

        document.getElementById("catActive").checked =
            data.active;

        new bootstrap.Modal(
            document.getElementById("categoryModal")
        ).show();

    };

});

}


async function loadSizes() {

    tableHead.innerHTML = `
        <tr>
            <th>Size</th>
            <th>Display Order</th>
            <th>Active</th>
            <th>Actions</th>
        </tr>
    `;

    tableBody.innerHTML = "";

    const q = query(
        collection(db, "sizes"),
        orderBy("displayOrder")
    );

    const snapshot = await getDocs(q);

    snapshot.forEach(doc => {

        const data = doc.data();

        tableBody.innerHTML += `
            <tr>

                <td>${data.name}</td>

                <td>${data.displayOrder}</td>

                <td>
                    ${data.active ? "✅" : "❌"}
                </td>

                <td>
                    <button
                        class="btn btn-warning btn-sm"
                        disabled>

                        Edit

                    </button>
                </td>

            </tr>
        `;

    });

}
loadTable();        


document
.getElementById("saveCategoryBtn")
.addEventListener("click", async () => {

    const name =
        document.getElementById("catName").value.trim();

    const pluralName =
        document.getElementById("catPlural").value.trim();

    const prefix =
        document.getElementById("catPrefix")
        .value
        .trim()
        .toUpperCase();

    const displayOrder =
        Number(
            document.getElementById("catOrder").value
        );

    const active =
        document.getElementById("catActive").checked;

    if (!name) {
        alert("Please enter a category name.");
        return;
    }

    if (
    currentType === "categories" &&
    !prefix
) {
    alert("Please enter a category prefix.");
    return;
}

    const id = name
        .toLowerCase()
        .replace(/\s+/g, "-");


        if (currentType === "sizes") {

    await setDoc(
        doc(db, "sizes", id),
        {
            name,
            displayOrder,
            active
        }
    );

    bootstrap.Modal
        .getInstance(
            document.getElementById("categoryModal")
        )
        .hide();

    await loadTable();

    return;

}

        let imageUrl = "";

const file =
    imageInput.files[0];

if (file) {

    const extension =
        file.name.split(".").pop();

    const storageRef =
        ref(
            storage,
            `category-images/${prefix}.${extension}`
        );

    await uploadBytes(
        storageRef,
        file
    );

    imageUrl =
        await getDownloadURL(storageRef);

}
   await setDoc(
    doc(db, "categories", id),
    {

        name,
        pluralName,
        prefix,
        displayOrder,

        image: imageUrl,

        active

    }
);

    document.getElementById("catName").value = "";
    document.getElementById("catPlural").value = "";
    document.getElementById("catPrefix").value = "";
    document.getElementById("catOrder").value = "";
    document.getElementById("catImage").value = "";
    document.getElementById("catActive").checked = true;

    bootstrap.Modal
        .getInstance(
            document.getElementById("categoryModal")
        )
        .hide();

    await loadTable();

});

