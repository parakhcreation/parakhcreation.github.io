import { Address } from "./addressStore.js";

const list = document.getElementById("addressList");

const form = document.getElementById("addressForm");

const addBtn = document.getElementById("addAddressBtn");

const saveBtn = document.getElementById("saveAddressBtn");

let editingAddressId = null;

async function loadAddresses() {

    const addresses = await Address.getAll();

    if (addresses.length === 0) {

        list.innerHTML = "<p>No saved addresses yet.</p>";

        return;

    }

    list.innerHTML = "";

    addresses.forEach(address => {

        const card = document.createElement("div");

        card.style.border = "1px solid #ddd";

        card.style.padding = "15px";

        card.style.borderRadius = "10px";

        card.style.marginBottom = "15px";

        card.innerHTML = `
    <strong>${address.type}</strong>

    ${address.isDefault ? " ⭐ Default" : ""}

    <br><br>

    ${address.addressLine1}<br>

    ${address.addressLine2 || ""}<br>

    ${address.landmark || ""}<br>

    ${address.city}, ${address.state}<br>

    ${address.pincode}

    <br><br>

    <button class="editAddress" data-id="${address.id}">
        Edit
    </button>

    <button class="deleteAddress" data-id="${address.id}">
        Delete
    </button>

    ${
        address.isDefault
        ? ""
        : `<button class="defaultAddress" data-id="${address.id}">
            Set Default
        </button>`
    }
`;

        list.appendChild(card);
        card.querySelector(".editAddress").onclick = () => {

    editingAddressId = address.id;

    document.getElementById("addressType").value = address.type;

    document.getElementById("addressLine1").value = address.addressLine1;

    document.getElementById("addressLine2").value = address.addressLine2 || "";

    document.getElementById("landmark").value = address.landmark || "";

    document.getElementById("city").value = address.city;

    document.getElementById("state").value = address.state;

    document.getElementById("pincode").value = address.pincode;

    document.getElementById("defaultAddress").checked = address.isDefault;

    form.style.display = "block";

    saveBtn.textContent = "Update Address";

};
        card.querySelector(".deleteAddress").onclick = async () => {

    if (!confirm("Delete this address?")) return;

    await Address.remove(address.id);

    loadAddresses();

};

if (!address.isDefault) {

    card.querySelector(".defaultAddress").onclick = async () => {

        await Address.setDefault(address.id);

        loadAddresses();

    };

}

    });

}

addBtn.onclick = () => {

    form.style.display =

        form.style.display === "none"

            ? "block"

            : "none";

};

saveBtn.onclick = async () => {

    const address = {

        type: document.getElementById("addressType").value,

        addressLine1: document.getElementById("addressLine1").value.trim(),

        addressLine2: document.getElementById("addressLine2").value.trim(),

        landmark: document.getElementById("landmark").value.trim(),

        city: document.getElementById("city").value.trim(),

        state: document.getElementById("state").value.trim(),

        pincode: document.getElementById("pincode").value.trim(),

        isDefault: document.getElementById("defaultAddress").checked

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

    if (editingAddressId) {

    await Address.update(editingAddressId, address);

    editingAddressId = null;

} else {

    await Address.add(address);

}

alert("Address saved successfully.");
saveBtn.textContent = "Save Address";

window.location.href = "account.html";

};

loadAddresses();
