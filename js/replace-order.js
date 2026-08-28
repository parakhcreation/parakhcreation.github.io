import { db, auth, getProducts, storage } from "./firebase.js";

import {
    doc,
    getDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";


// ============================================================
// REPLACEMENT PHOTO PERSISTENCE
// Uses IndexedDB so selected photos survive page refresh.
// ============================================================

const REPLACEMENT_DB_NAME =
    "parakhReplacementPhotos";

const REPLACEMENT_DB_VERSION = 1;

const REPLACEMENT_STORE =
    "pendingPhotos";


function openReplacementPhotoDB() {

    return new Promise(
        (resolve, reject) => {

            const request =
                indexedDB.open(
                    REPLACEMENT_DB_NAME,
                    REPLACEMENT_DB_VERSION
                );


            request.onupgradeneeded =
                event => {

                    const db =
                        event.target.result;

                    if (
                        !db.objectStoreNames.contains(
                            REPLACEMENT_STORE
                        )
                    ) {

                        db.createObjectStore(
                            REPLACEMENT_STORE
                        );

                    }

                };


            request.onsuccess =
                () => {

                    resolve(
                        request.result
                    );

                };


            request.onerror =
                () => {

                    reject(
                        request.error
                    );

                };

        }
    );

}


async function savePendingReplacementPhotos(
    key,
    files
) {

    const db =
        await openReplacementPhotoDB();


    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    REPLACEMENT_STORE,
                    "readwrite"
                );

            const store =
                transaction.objectStore(
                    REPLACEMENT_STORE
                );


            store.put(
                files,
                key
            );


            transaction.oncomplete =
                () => {

                    db.close();

                    resolve();

                };


            transaction.onerror =
                () => {

                    db.close();

                    reject(
                        transaction.error
                    );

                };

        }
    );

}


async function getPendingReplacementPhotos(
    key
) {

    const db =
        await openReplacementPhotoDB();


    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    REPLACEMENT_STORE,
                    "readonly"
                );

            const store =
                transaction.objectStore(
                    REPLACEMENT_STORE
                );


            const request =
                store.get(key);


            request.onsuccess =
                () => {

                    db.close();

                    resolve(
                        request.result || []
                    );

                };


            request.onerror =
                () => {

                    db.close();

                    reject(
                        request.error
                    );

                };

        }
    );

}


async function deletePendingReplacementPhotos(
    key
) {

    const db =
        await openReplacementPhotoDB();


    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    REPLACEMENT_STORE,
                    "readwrite"
                );

            const store =
                transaction.objectStore(
                    REPLACEMENT_STORE
                );


            store.delete(key);


            transaction.oncomplete =
                () => {

                    db.close();

                    resolve();

                };


            transaction.onerror =
                () => {

                    db.close();

                    reject(
                        transaction.error
                    );

                };

        }
    );

}

function getReplacementPhotoKey(
    orderId,
    itemIndex
) {

    return `${orderId}__${itemIndex}`;

}
// ============================================================
// REPLACEMENT FEATURE
// This file is intentionally separate from return-order.js
// ============================================================


function getOrderIdFromButton(button) {

    return button?.dataset?.id || "";

}


// ============================================================
// CHECK WHETHER REPLACEMENT IS ALLOWED
// ============================================================

function canRequestReplacement(order) {

    if (!order) {
        return false;
    }

    if (order.orderStatus !== "Delivered") {
        return false;
    }

    if (
        order.returnWindowEnds &&
        typeof order.returnWindowEnds.toDate === "function"
    ) {

        if (
            new Date() >
            order.returnWindowEnds.toDate()
        ) {

            return false;

        }

    }

   

    

    if (
        !order.items ||
        !Array.isArray(order.items) ||
        order.items.length === 0
    ) {

        return false;

    }

    return true;

}


// ============================================================
// LOAD ORDER
// ============================================================

async function getOrder(orderId) {

    if (!orderId) {
        return null;
    }

    const snap =
        await getDoc(
            doc(db, "orders", orderId)
        );

    if (!snap.exists()) {
        return null;
    }

    return {

        id: snap.id,

        ...snap.data()

    };

}


// ============================================================
// PRODUCT STOCK
// ============================================================




// ============================================================
// CREATE MODAL
// ============================================================

function createModal() {

    const existing =
        document.getElementById(
            "replacementModal"
        );

    if (existing) {

        existing.remove();

    }

    const overlay =
        document.createElement("div");

    overlay.id =
        "replacementModal";

    overlay.innerHTML = `

        <div class="replacement-overlay">

            <div class="replacement-modal">

                <button
                    type="button"
                    class="replacement-close"
                    id="replacementClose">

                    ×

                </button>

                <div
                    id="replacementContent">

                </div>

            </div>

        </div>

    `;

    document.body.appendChild(overlay);

    document
        .getElementById("replacementClose")
        .onclick = () => {

            overlay.remove();

        };

    overlay
        .querySelector(".replacement-overlay")
        .onclick = event => {

            if (
                event.target ===
                overlay.querySelector(
                    ".replacement-overlay"
                )
            ) {

                overlay.remove();

            }

        };

    return overlay;

}


// ============================================================
// MODAL STYLES
// ============================================================

function addReplacementStyles() {

    if (
        document.getElementById(
            "replacementFeatureStyles"
        )
    ) {

        return;

    }

    const style =
        document.createElement("style");

    style.id =
        "replacementFeatureStyles";

    style.textContent = `

        .replacement-overlay{

            position:fixed;

            inset:0;

            background:rgba(0,0,0,.45);

            display:flex;

            justify-content:center;

            align-items:center;

            padding:20px;

            z-index:999999;

            backdrop-filter:blur(4px);

        }


        .replacement-modal{

            position:relative;

            width:min(520px,100%);

            max-height:90vh;

            overflow-y:auto;

            background:#fff;

            border-radius:18px;

            padding:30px;

            box-sizing:border-box;

            box-shadow:0 20px 60px rgba(0,0,0,.2);

            font-family:inherit;

        }


        .replacement-close{

            position:absolute;

            top:12px;

            right:16px;

            width:34px;

            height:34px;

            border:none;

            background:transparent;

            font-size:28px;

            line-height:1;

            cursor:pointer;

            color:#555;

        }


        .replacement-modal h2{

            margin:0 35px 8px 0;

            color:#17324d;

        }


        .replacement-subtitle{

            color:#666;

            margin:0 0 22px;

            line-height:1.5;

        }


        .replacement-option{

            display:flex;

            align-items:flex-start;

            gap:12px;

            width:100%;

            padding:14px;

            margin:10px 0;

            border:1px solid #ddd;

            border-radius:12px;

            cursor:pointer;

            box-sizing:border-box;

        }


        .replacement-option:hover{

            border-color:#8c1d40;

        }


        .replacement-option input{

            margin-top:4px;

            accent-color:#8c1d40;

        }


        .replacement-product{

            display:flex;

            align-items:center;

            gap:14px;

            width:100%;

            padding:12px;

            border:1px solid #ddd;

            border-radius:12px;

            margin:10px 0;

            cursor:pointer;

            box-sizing:border-box;

        }


        .replacement-product img{

            width:65px;

            height:82px;

            object-fit:cover;

            border-radius:8px;

            flex-shrink:0;

        }


        .replacement-product input{

            accent-color:#8c1d40;

            flex-shrink:0;

        }


        .replacement-product-info{

            min-width:0;

        }


        .replacement-product-info strong{

            display:block;

            margin-bottom:5px;

        }


        .replacement-product-info span{

            color:#666;

            font-size:14px;

        }


        .replacement-label{

            display:block;

            font-weight:600;

            margin:20px 0 10px;

            color:#333;

        }


        .replacement-size-grid{

            display:flex;

            flex-wrap:wrap;

            gap:10px;

        }


        .replacement-size{

            min-width:52px;

            padding:10px 14px;

            border:1px solid #bbb;

            border-radius:9px;

            background:#fff;

            cursor:pointer;

            font-weight:600;

        }


        .replacement-size.selected{

            background:#8c1d40;

            color:#fff;

            border-color:#8c1d40;

        }


        .replacement-size:disabled{

            opacity:.4;

            cursor:not-allowed;

            text-decoration:line-through;

        }


        .replacement-note{

            margin-top:16px;

            padding:12px 14px;

            background:#faf6f0;

            border-radius:10px;

            color:#666;

            font-size:13px;

            line-height:1.5;

        }


        .replacement-submit{

            width:100%;

            margin-top:24px;

            height:48px;

            border:none;

            border-radius:10px;

            background:#8c1d40;

            color:#fff;

            font-size:15px;

            font-weight:600;

            cursor:pointer;

        }


        .replacement-submit:hover{

            background:#701631;

        }


        .replacement-back{

            margin-top:12px;

            width:100%;

            height:44px;

            border:2px solid #ddd;

            background:#fff;

            border-radius:10px;

            cursor:pointer;

            font-weight:600;

        }

        .replacement-upload-button{

    display:flex;

    align-items:center;

    justify-content:center;

    width:100%;

    min-height:48px;

    box-sizing:border-box;

    border:2px dashed #8c1d40;

    border-radius:12px;

    background:#fffaf7;

    color:#8c1d40;

    font-weight:600;

    cursor:pointer;

    transition:.25s;

}

.replacement-upload-button:hover{

    background:#fdf0f4;

}


.replacement-photo-preview{

    display:flex;

    flex-wrap:wrap;

    gap:12px;

    margin-top:14px;

    min-height:82px;

}



.replacement-photo-placeholder{

    width:100%;

    padding:20px;

    box-sizing:border-box;

    text-align:center;

    color:#888;

    background:#f8f8f8;

    border-radius:10px;

    font-size:13px;

}


.replacement-photo-item{

    width:82px;

    height:100px;

    overflow:hidden;

    border-radius:10px;

    border:1px solid #ddd;

    background:#f5f5f5;

}


.replacement-photo-item img{

    width:82px;

    height:104px;

    object-fit:cover;

    display:block;

    border-radius:10px;

    border:1px solid #ddd;

}

.replacement-photo-remove{

    position:absolute;

    top:-8px;

    right:-8px;

    width:25px;

    height:25px;

    padding:0;

    margin:0;

    border:2px solid #fff;

    border-radius:50%;

    background:#8c1d40;

    color:#fff;

    font-size:18px;

    line-height:19px;

    display:flex;

    align-items:center;

    justify-content:center;

    cursor:pointer;

    z-index:2;

    box-shadow:0 2px 6px rgba(0,0,0,.2);

}


.replacement-photo-remove:hover{

    background:#6f1633;

}


.replacement-photo-count{

    margin:8px 0 0;

    color:#777;

    font-size:13px;

}


.replacement-photo-placeholder{

    width:100%;

    padding:20px;

    box-sizing:border-box;

    text-align:center;

    color:#888;

    background:#f8f8f8;

    border-radius:10px;

    font-size:13px;

}


.replacement-photo-error{

    margin:8px 0 0;

    min-height:18px;

    color:#c62828;

    font-size:13px;

}

.replacement-requested{

    width:100%;

    box-sizing:border-box;

    min-height:46px;

    padding:12px;

    border-radius:10px;

    background:#f8edf1;

    color:#8c1d40;

    border:1px solid #d9aabb;

    display:flex;

    align-items:center;

    justify-content:center;

    text-align:center;

    font-size:14px;

    font-weight:600;

}


        @media(max-width:600px){

            .replacement-overlay{

                padding:12px;

            }

            .replacement-modal{

                padding:24px 18px;

                border-radius:16px;

            }

            /* ============================================================
   REPLACEMENT INFORMATION / SUCCESS MESSAGE
   ============================================================ */

.replacement-message-card{

    text-align:center;

    padding:18px 8px 8px;

}


.replacement-message-icon{

    width:58px;

    height:58px;

    margin:0 auto 18px;

    border-radius:50%;

    display:flex;

    align-items:center;

    justify-content:center;

    background:#f8edf1;

    border:1px solid #d9aabb;

    color:#A8194A;

    font-family:'Marcellus',
        'Cormorant Garamond',
        serif;

    font-size:28px;

}


.replacement-message-card h2{

    margin:0 0 14px;

    color:#123A34;

    font-family:'Marcellus',
        'Cormorant Garamond',
        serif;

    font-size:28px;

    line-height:1.2;

}


.replacement-message-divider{

    width:55px;

    height:2px;

    margin:0 auto 18px;

    background:#B8872B;

}


.replacement-message-card p{

    margin:0 auto;

    max-width:390px;

    color:#555;

    font-family:'Manrope',
        sans-serif;

    font-size:14px;

    line-height:1.7;

}


.replacement-message-button{

    width:100%;

    height:48px;

    margin-top:26px;

    border:none;

    border-radius:10px;

    background:#A8194A;

    color:#fff;

    font-family:'Poppins',
        sans-serif;

    font-size:14px;

    font-weight:600;

    cursor:pointer;

    transition:.25s;

}


.replacement-message-button:hover{

    background:#7E1138;

}


/* ============================================================
   SUCCESS MESSAGE
   ============================================================ */

.replacement-success-card{

    text-align:center;

    padding:12px 8px 6px;

}


.replacement-success-icon{

    width:68px;

    height:68px;

    margin:0 auto 18px;

    border-radius:50%;

    display:flex;

    align-items:center;

    justify-content:center;

    background:#f8edf1;

    border:2px solid #A8194A;

    color:#A8194A;

    font-size:32px;

    font-weight:700;

}


.replacement-success-card h2{

    margin:0 0 10px;

    color:#123A34;

    font-family:'Marcellus',
        'Cormorant Garamond',
        serif;

    font-size:30px;

    line-height:1.2;

}


.replacement-success-subtitle{

    margin:0 auto;

    max-width:400px;

    color:#555;

    font-family:'Manrope',
        sans-serif;

    font-size:14px;

    line-height:1.7;

}


.replacement-status-badge{

    display:inline-flex;

    align-items:center;

    justify-content:center;

    margin-top:18px;

    padding:8px 16px;

    border-radius:30px;

    background:#f8edf1;

    border:1px solid #d9aabb;

    color:#A8194A;

    font-family:'Poppins',
        sans-serif;

    font-size:13px;

    font-weight:600;

}


.replacement-success-order{

    margin-top:16px;

    padding:12px 14px;

    border-radius:10px;

    background:#faf6f0;

    color:#555;

    font-size:13px;

    line-height:1.5;

}


.replacement-success-button{

    width:100%;

    height:48px;

    margin-top:24px;

    border:none;

    border-radius:10px;

    background:#A8194A;

    color:#fff;

    font-family:'Poppins',
        sans-serif;

    font-size:14px;

    font-weight:600;

    cursor:pointer;

    transition:.25s;

}


.replacement-success-button:hover{

    background:#7E1138;

}

        }

    `;

    document.head.appendChild(style);

}

// ============================================================
// REPLACEMENT INFORMATION MESSAGE
// ============================================================

function showReplacementInfo(
    overlay,
    title,
    message
) {

    const content =
        overlay.querySelector(
            "#replacementContent"
        );

    content.innerHTML = `

        <div class="replacement-message-card">

            <div class="replacement-message-icon">
                !
            </div>

            <h2>
                ${title}
            </h2>

            <div class="replacement-message-divider">
            </div>

            <p>
                ${message}
            </p>

            <button
                type="button"
                class="replacement-message-button"
                id="replacementMessageClose">

                Back to My Orders

            </button>

        </div>

    `;


    document
        .getElementById(
            "replacementMessageClose"
        )
        .onclick = () => {

            overlay.remove();

        };

}

// ============================================================
// STEP 1 — SELECT PRODUCT
// ============================================================

function showProductSelection(
    overlay,
    order
) {

    const content =
        overlay.querySelector(
            "#replacementContent"
        );

    content.innerHTML = `

        <h2>Replace Product</h2>

        <p class="replacement-subtitle">

            Select the product you want to replace.

        </p>

        <div id="replacementProducts">

            ${order.items.map(
                (item, index) => `

                    <label
                        class="replacement-product">

                        <input
                            type="radio"
                            name="replacementItem"
                            value="${index}">

                        <img
                            src="${item.thumbnail || ""}"
                            alt="${item.name || "Product"}">

                        <div
                            class="replacement-product-info">

                            <strong>
                                ${item.name || "Product"}
                            </strong>

                            <span>
                                ${
                                    item.selectedSize
                                    ? `Size: ${item.selectedSize}`
                                    : ""
                                }
                            </span>

                        </div>

                    </label>

                `
            ).join("")}

        </div>

        <button
            type="button"
            class="replacement-submit"
            id="replacementContinue">

            Continue

        </button>

    `;

    document
        .getElementById(
            "replacementContinue"
        )
        .onclick = () => {

            const selected =
                document.querySelector(
                    'input[name="replacementItem"]:checked'
                );

            if (!selected) {

                alert(
                    "Please select a product."
                );

                return;

            }

            const itemIndex =
                Number(selected.value);

            showReasonSelection(
                overlay,
                order,
                itemIndex
            );

        };

}


// ============================================================
// STEP 2 — SELECT REASON
// ============================================================

function showReasonSelection(
    overlay,
    order,
    itemIndex
) {

    const item =
        order.items[itemIndex];

    const content =
        overlay.querySelector(
            "#replacementContent"
        );

    content.innerHTML = `

        <h2>Why do you need a replacement?</h2>

        <p class="replacement-subtitle">

            ${item.name || "Product"}

            ${
                item.selectedSize
                ? ` — Size ${item.selectedSize}`
                : ""
            }

        </p>


        <label class="replacement-option">

            <input
                type="radio"
                name="replacementReason"
                value="Size Doesn't Fit">

            <span>

                <strong>
                    Size doesn't fit
                </strong>

                <br>

                <small>
                    Exchange this product for another available size.
                </small>

            </span>

        </label>


        <label class="replacement-option">

            <input
                type="radio"
                name="replacementReason"
                value="Defective / Damaged">

            <span>

                <strong>
                    Product is defective / damaged
                </strong>

                <br>

                <small>
                    Receive a new piece of the same product.
                </small>

            </span>

        </label>


        <button
            type="button"
            class="replacement-submit"
            id="replacementReasonContinue">

            Continue

        </button>


        <button
            type="button"
            class="replacement-back"
            id="replacementBack">

            Back

        </button>

    `;

    document
        .getElementById(
            "replacementBack"
        )
        .onclick = () => {

            showProductSelection(
                overlay,
                order
            );

        };


    document
        .getElementById(
            "replacementReasonContinue"
        )
        .onclick = async () => {

            const selected =
                document.querySelector(
                    'input[name="replacementReason"]:checked'
                );

            if (!selected) {

                alert(
                    "Please select a replacement reason."
                );

                return;

            }

            if (
                selected.value ===
                "Size Doesn't Fit"
            ) {

                await showSizeSelection(
                    overlay,
                    order,
                    itemIndex
                );

            }
            else {

                showDefectiveConfirmation(
                    overlay,
                    order,
                    itemIndex
                );

            }

        };

}


// ============================================================
// STEP 3A — SIZE EXCHANGE
// ============================================================

async function showSizeSelection(
    overlay,
    order,
    itemIndex
) {

    const item =
        order.items[itemIndex];

    const products =
    await getProducts();

const product =
    products.find(
        p =>
            p.id &&
            p.id.trim() ===
            String(item.id).trim()
    );

    if (!product) {

        alert(
            "We could not load the product inventory. Please try again."
        );

        return;

    }

    const sizes =
        product.inventory?.sizes || {};

    const availableSizes =
    Object.entries(sizes);

const inStockSizes =
    availableSizes.filter(
        ([size, stock]) =>
            Number(stock || 0) > 0
    );

if (!inStockSizes.length) {

    showReplacementInfo(
        overlay,
        "Size Replacement Unavailable",
        `
            Unfortunately, we don't currently have
            another size available for this product.

            <br><br>

            You can still return the product
            according to our return policy and
            place a new order if you wish.
        `
    );

    return;

}

    const content =
        overlay.querySelector(
            "#replacementContent"
        );

    content.innerHTML = `

        <h2>Select Replacement Size</h2>

        <p class="replacement-subtitle">

            Current size:

            <strong>
                ${item.selectedSize || "Not specified"}
            </strong>

        </p>


        <label class="replacement-label">

            Available sizes

        </label>


        <div
            class="replacement-size-grid"
            id="replacementSizeGrid">

        </div>


        <div class="replacement-note">

            Only sizes currently showing as available can be requested.

        </div>


        <button
            type="button"
            class="replacement-submit"
            id="submitSizeReplacement">

            Request Replacement

        </button>


        <button
            type="button"
            class="replacement-back"
            id="sizeBack">

            Back

        </button>

    `;

    const grid =
        document.getElementById(
            "replacementSizeGrid"
        );

    availableSizes.forEach(
        ([size, stock]) => {


        
            const button =
                document.createElement(
                    "button"
                );

            button.type = "button";

            button.className =
                "replacement-size";

            button.textContent =
                size;

            const available =
                Number(stock || 0) > 0;

            if (!available) {

                button.disabled = true;

                button.title =
                    "Out of stock";

            }

            

            button.onclick = () => {

                document
                    .querySelectorAll(
                        ".replacement-size"
                    )
                    .forEach(
                        btn =>
                            btn.classList.remove(
                                "selected"
                            )
                    );

                button.classList.add(
                    "selected"
                );

                button.dataset.selected =
                    "true";

            };

            grid.appendChild(button);

        }
    );


    document
        .getElementById(
            "sizeBack"
        )
        .onclick = () => {

            showReasonSelection(
                overlay,
                order,
                itemIndex
            );

        };


    document
        .getElementById(
            "submitSizeReplacement"
        )
        .onclick = async () => {

            const selectedButton =
                document.querySelector(
                    ".replacement-size.selected"
                );

            if (!selectedButton) {

                alert(
                    "Please select a replacement size."
                );

                return;

            }

            const newSize =
                selectedButton.textContent;

            await submitReplacement(
                overlay,
                order,
                itemIndex,
                "Size Doesn't Fit",
                newSize
            );

        };

}


// ============================================================
// STEP 3B — DEFECTIVE PRODUCT
// ============================================================

async function showDefectiveConfirmation(
    overlay,
    order,
    itemIndex
) {

    const item =
        order.items[itemIndex];


    const content =
        overlay.querySelector(
            "#replacementContent"
        );


    const photoKey =
        getReplacementPhotoKey(
            order.id,
            itemIndex
        );


    let selectedFiles =
        await getPendingReplacementPhotos(
            photoKey
        );


    content.innerHTML = `

        <h2>Replace Defective Product</h2>


        <p class="replacement-subtitle">

            You will receive a new piece of:

            <strong>
                ${item.name}
            </strong>

            ${
                item.selectedSize
                ? ` — Size ${item.selectedSize}`
                : ""
            }

        </p>


        <div class="replacement-note">

            Please upload clear photos showing
            the defect or damage.

            <br><br>

            At least one photo is required.
            You can upload up to 3 photos.

        </div>


        <label
            class="replacement-label"
            for="replacementPhotos">

            Photos of the defect *

        </label>


        <input
            type="file"
            id="replacementPhotos"
            accept="image/jpeg,image/png,image/webp"
            multiple
            style="display:none;"
        >


        <label
            for="replacementPhotos"
            class="replacement-upload-button">

            📷 Add Photos

        </label>


        <div
            id="replacementPhotoPreview"
            class="replacement-photo-preview">

        </div>


        <p
            id="replacementPhotoCount"
            class="replacement-photo-count">

        </p>


        <p
            id="replacementPhotoError"
            class="replacement-photo-error">

        </p>


        <button
            type="button"
            class="replacement-submit"
            id="submitDefectiveReplacement"
            disabled>

            Request Replacement

        </button>


        <button
            type="button"
            class="replacement-back"
            id="defectiveBack">

            Back

        </button>

    `;


    const photoInput =
        document.getElementById(
            "replacementPhotos"
        );


    const preview =
        document.getElementById(
            "replacementPhotoPreview"
        );


    const error =
        document.getElementById(
            "replacementPhotoError"
        );


    const count =
        document.getElementById(
            "replacementPhotoCount"
        );


    const submitButton =
        document.getElementById(
            "submitDefectiveReplacement"
        );


    function updateSubmitState() {

        submitButton.disabled =
            selectedFiles.length === 0;

    }


    function renderPhotoPreview() {

        preview.innerHTML = "";


        if (
            !selectedFiles.length
        ) {

            preview.innerHTML = `

                <span
                    class="replacement-photo-placeholder">

                    No photos selected

                </span>

            `;

            count.textContent =
                "0 of 3 photos selected";

            updateSubmitState();

            return;

        }


        selectedFiles.forEach(
            (file, index) => {

                const wrapper =
                    document.createElement(
                        "div"
                    );


                wrapper.className =
                    "replacement-photo-item";


                const image =
                    document.createElement(
                        "img"
                    );


                image.alt =
                    "Selected defect photo";


                const removeButton =
                    document.createElement(
                        "button"
                    );


                removeButton.type =
                    "button";


                removeButton.className =
                    "replacement-photo-remove";


                removeButton.innerHTML =
                    "&times;";


                removeButton.setAttribute(
                    "aria-label",
                    "Remove photo"
                );


                removeButton.onclick =
                    async event => {

                        event.preventDefault();

                        event.stopPropagation();


                        selectedFiles =
                            selectedFiles.filter(
                                (
                                    file,
                                    fileIndex
                                ) =>
                                    fileIndex !==
                                    index
                            );


                        await savePendingReplacementPhotos(
                            photoKey,
                            selectedFiles
                        );


                        renderPhotoPreview();

                    };


                const reader =
                    new FileReader();


                reader.onload =
                    event => {

                        image.src =
                            event.target.result;

                    };


                reader.readAsDataURL(
                    file
                );


                wrapper.appendChild(
                    image
                );


                wrapper.appendChild(
                    removeButton
                );


                preview.appendChild(
                    wrapper
                );

            }
        );


        count.textContent =
            `${selectedFiles.length} of 3 photos selected`;


        updateSubmitState();

    }


    photoInput.addEventListener(
        "change",
        async () => {

            error.textContent = "";


            const newFiles =
                Array.from(
                    photoInput.files || []
                );


            if (!newFiles.length) {

                return;

            }


            if (
                selectedFiles.length +
                newFiles.length >
                3
            ) {

                error.textContent =
                    "You can upload a maximum of 3 photos.";

                photoInput.value = "";

                return;

            }


            const invalidFile =
                newFiles.find(
                    file =>
                        ![
                            "image/jpeg",
                            "image/png",
                            "image/webp"
                        ].includes(
                            file.type
                        )
                );


            if (invalidFile) {

                error.textContent =
                    "Please upload only JPG, PNG or WebP images.";

                photoInput.value = "";

                return;

            }


            const tooLarge =
                newFiles.find(
                    file =>
                        file.size >
                        5 * 1024 * 1024
                );


            if (tooLarge) {

                error.textContent =
                    "Each photo must be 5 MB or smaller.";

                photoInput.value = "";

                return;

            }


            selectedFiles = [
                ...selectedFiles,
                ...newFiles
            ];


            await savePendingReplacementPhotos(
                photoKey,
                selectedFiles
            );


            photoInput.value = "";


            renderPhotoPreview();

        }
    );


    document
        .getElementById(
            "defectiveBack"
        )
        .onclick = async () => {

            await savePendingReplacementPhotos(
                photoKey,
                selectedFiles
            );


            showReasonSelection(
                overlay,
                order,
                itemIndex
            );

        };


    submitButton.onclick =
        async () => {

            if (
                !selectedFiles.length
            ) {

                error.textContent =
                    "Please upload at least one photo.";

                return;

            }


            await submitReplacement(
                overlay,
                order,
                itemIndex,
                "Defective / Damaged",
                item.selectedSize || "",
                selectedFiles
            );

        };


    renderPhotoPreview();

}


// ============================================================
// SUBMIT REPLACEMENT
// ============================================================

async function submitReplacement(
    overlay,
    order,
    itemIndex,
    reason,
    replacementSize,
    photoFiles = []
) {

    try {

        const currentUser =
            auth.currentUser;

        if (!currentUser) {

            alert(
                "Please log in again."
            );

            return;

        }

        const freshOrder =
            await getOrder(order.id);

        if (!freshOrder) {

            alert(
                "Order could not be found."
            );

            return;

        }

        if (
            freshOrder.userId !==
            currentUser.uid
        ) {

            alert(
                "You are not allowed to modify this order."
            );

            return;

        }

        if (
            !canRequestReplacement(
                freshOrder
            )
        ) {

            alert(
                "This order is no longer eligible for replacement."
            );

            overlay.remove();

            return;

        }

        const item =
            freshOrder.items[itemIndex];

        if (!item) {

            alert(
                "The selected product could not be found."
            );

            return;

        }


        // Re-check inventory for size replacement
        if (
            reason === "Size Doesn't Fit"
        ) {

            const products =
    await getProducts();

const product =
    products.find(
        p =>
            p.id &&
            p.id.trim() ===
            String(item.id).trim()
    );

            if (!product) {

                alert(
                    "Product could not be found."
                );

                return;

            }

            const stock =
                Number(
                    product.inventory?.sizes?.[
                        replacementSize
                    ] || 0
                );

            if (stock <= 0) {

                alert(
                    `Size ${replacementSize} is no longer available.`
                );

                return;

            }

        }

        let photoUrls = [];

if (
    reason === "Defective / Damaged" &&
    photoFiles.length
) {

    for (
        let i = 0;
        i < photoFiles.length;
        i++
    ) {

        const file =
            photoFiles[i];

        const filePath =
            `replacementRequests/${currentUser.uid}/${order.id}/${Date.now()}_${i}_${file.name}`;

        const storageRef =
            ref(
                storage,
                filePath
            );

        await uploadBytes(
            storageRef,
            file
        );

        const downloadUrl =
            await getDownloadURL(
                storageRef
            );

        photoUrls.push(
            downloadUrl
        );

    }

}


        const replacementData = {

            status:
                "Replacement Requested",

            history: [

                {

                    status:
                        "Replacement Requested",

                    time:
                        new Date()

                }

            ],

            reason,

            orderItemIndex:
    itemIndex,

itemIndex:
    itemIndex,

            productId:
                item.id,

            productName:
                item.name || "",

            originalSize:
                item.selectedSize || "",

            replacementSize:
                replacementSize || "",

            quantity:
                item.quantity || 1,

            photos:
    photoUrls,

            requestedAt:
                serverTimestamp(),

            adminStatus:
                "Pending"

        };


        const orderRef =
            doc(
                db,
                "orders",
                order.id
            );


        await updateDoc(
            orderRef,
            {

                replacementRequest:
                    replacementData

            }
        );

        await deletePendingReplacementPhotos(
    getReplacementPhotoKey(
        order.id,
        itemIndex
    )
);


showReplacementSuccess(
    overlay,
    order,
    item
);

    }

    catch (error) {

        console.error(
            "Replacement request failed:",
            error
        );

        alert(
            "We could not submit the replacement request. Please try again."
        );

    }

}

// ============================================================
// REPLACEMENT SUCCESS MESSAGE
// ============================================================

function showReplacementSuccess(
    overlay,
    order,
    item
) {

    const content =
        overlay.querySelector(
            "#replacementContent"
        );


    content.innerHTML = `

        <div class="replacement-success-card">

            <div class="replacement-success-icon">

                ✓

            </div>


            <h2>
                Replacement Requested
            </h2>


            <p
                class="replacement-success-subtitle">

                Your replacement request has been
                successfully received.

                <br>

                We'll review your request and
                process the replacement shortly.

            </p>


            <div
                class="replacement-status-badge">

                Replacement Requested

            </div>


            <div
                class="replacement-success-order">

                <strong>
                    ${item.name || "Product"}
                </strong>

                <br>

                Order #${order.id}

            </div>


            <button
                type="button"
                class="replacement-success-button"
                id="replacementSuccessDone">

                Done

            </button>

        </div>

    `;


    document
        .getElementById(
            "replacementSuccessDone"
        )
        .onclick = () => {

            overlay.remove();

            window.location.reload();

        };

}

// ============================================================
// ADD REPLACE BUTTONS TO MY ORDERS
// ============================================================
async function addReplacementButtons() {

    document
        .querySelectorAll(".order-card")
        .forEach(async card => {

            /*
             * Prevent multiple simultaneous executions for
             * the same order card.
             *
             * MutationObserver can call this function several
             * times while Firebase is still loading.
             */
            if (
                card.dataset.replacementProcessing === "true"
            ) {
                return;
            }


            if (
                card.querySelector(".replaceBtn") ||
                card.querySelector(".replacement-requested")
            ) {
                return;
            }


            const detailsBtn =
                card.querySelector(".detailsBtn");


            if (!detailsBtn) {
                return;
            }


            const orderId =
                getOrderIdFromButton(
                    detailsBtn
                );


            if (!orderId) {
                return;
            }


            const returnBtn =
                card.querySelector(".returnBtn");


            if (!returnBtn) {
                return;
            }


            /*
             * IMPORTANT:
             * Set this BEFORE awaiting Firebase.
             * This prevents another MutationObserver call
             * from inserting another button.
             */
            card.dataset.replacementProcessing =
                "true";


            try {

                const order =
                    await getOrder(
                        orderId
                    );


                if (!order) {

                    delete card.dataset
                        .replacementProcessing;

                    return;

                }


                /*
                 * Replacement already requested
                 */
                if (
                    order.replacementRequest
                ) {

                    if (
                        !card.querySelector(
                            ".replacement-requested"
                        )
                    ) {

                        const requested =
                            document.createElement(
                                "div"
                            );


                        requested.className =
                            "replacement-requested";


                        requested.textContent =
                            "Replacement Requested";


                        returnBtn.insertAdjacentElement(
                            "afterend",
                            requested
                        );

                    }

                    return;

                }


                /*
                 * Don't add replacement button if the
                 * order is not currently eligible.
                 */
                if (
                    !canRequestReplacement(
                        order
                    )
                ) {

                    delete card.dataset
                        .replacementProcessing;

                    return;

                }


                /*
                 * Final safety check before inserting.
                 */
                if (
                    card.querySelector(
                        ".replaceBtn"
                    ) ||
                    card.querySelector(
                        ".replacement-requested"
                    )
                ) {

                    return;

                }


                const button =
                    document.createElement(
                        "button"
                    );


                button.type =
                    "button";


                button.className =
                    "replaceBtn";


                button.textContent =
                    "Replace Product";


                button.dataset.id =
                    orderId;


                button.onclick =
                    async () => {

                        const freshOrder =
                            await getOrder(
                                orderId
                            );


                        if (!freshOrder) {

                            alert(
                                "Order could not be found."
                            );

                            return;

                        }


                        if (
                            freshOrder.replacementRequest
                        ) {

                            alert(
                                "A replacement request has already been submitted for this order."
                            );

                            window.location.reload();

                            return;

                        }


                        if (
                            !canRequestReplacement(
                                freshOrder
                            )
                        ) {

                            alert(
                                "This order is not currently eligible for replacement."
                            );

                            return;

                        }


                        addReplacementStyles();


                        const overlay =
                            createModal();


                        showProductSelection(
                            overlay,
                            freshOrder
                        );

                    };


                returnBtn.insertAdjacentElement(
                    "afterend",
                    button
                );

            } catch (error) {

                console.error(
                    "Could not initialize replacement button:",
                    error
                );

                /*
                 * Allow another MutationObserver attempt
                 * if Firebase temporarily fails.
                 */
                delete card.dataset
                    .replacementProcessing;

            }

        });

}


// ============================================================
// WATCH FOR ORDER CARDS
// ============================================================

function startReplacementFeature() {

    addReplacementStyles();

    addReplacementButtons();


    const container =
        document.getElementById(
            "ordersContainer"
        );

    if (!container) {
        return;
    }


    const observer =
        new MutationObserver(() => {

            addReplacementButtons();

        });


    observer.observe(
        container,
        {
            childList:true,
            subtree:true
        }
    );

}


startReplacementFeature();