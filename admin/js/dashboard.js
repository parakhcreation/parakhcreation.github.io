import { auth } from "./firebase.js";
import { requireAdmin } from "./auth.js";
import {
    signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import { db } from "./firebase.js";

// Protect this page
await requireAdmin();

// Logout
document
    .getElementById("logoutBtn")
    .addEventListener("click", async () => {

        await signOut(auth);

        window.location.href = "login.html";

    });

// ============================================================
// INSTAGRAM CATALOGUE
// ============================================================

const INSTAGRAM_FEED_URL =
    "https://asia-south1-parakh-creation-website.cloudfunctions.net/instagramProductFeed";


async function loadInstagramCatalogue() {

    const countElement =
        document.getElementById(
            "instagramProductCount"
        );

    const availableCountElement =
        document.getElementById(
            "instagramAvailableCount"
        );

    const lastCheckedElement =
        document.getElementById(
            "instagramLastChecked"
        );

    const container =
        document.getElementById(
            "instagramProductsContainer"
        );


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "products"
                )
            );


        const instagramProducts =
            snapshot.docs

                .map(doc => doc.data())

                .filter(
                    product =>
                        product.instagramEnabled === true
                );


        const availableProducts =
            instagramProducts.filter(
                product =>
                    product.available !== false
            );


        countElement.textContent =
            instagramProducts.length;


        availableCountElement.textContent =
            availableProducts.length;


        lastCheckedElement.textContent =
            new Date().toLocaleString(
                "en-IN",
                {
                    dateStyle: "medium",
                    timeStyle: "short"
                }
            );


        if (
            instagramProducts.length === 0
        ) {

            container.innerHTML = `

                <div class="alert alert-light border">

                    No products are currently selected
                    for Instagram.

                </div>

            `;

            return;

        }


        instagramProducts.sort(
            (a, b) =>
                (a.name || "")
                    .localeCompare(
                        b.name || ""
                    )
        );


        container.innerHTML = `

            <div class="table-responsive">

                <table class="table table-hover align-middle mb-0">

                    <thead>

                        <tr>

                            <th>Product</th>

                            <th>ID</th>

                            <th>Price</th>

                            <th>Availability</th>

                            <th>Product Page</th>

                        </tr>

                    </thead>

                    <tbody>

                        ${instagramProducts
                            .map(product => {

                                const productUrl =
                                    `https://parakhcreation.github.io/product.html?id=${encodeURIComponent(
                                        product.id
                                    )}`;

                                return `

                                    <tr>

                                        <td>

                                            <div class="d-flex align-items-center gap-2">

                                                ${
                                                    product.thumbnail
                                                        ? `
                                                            <img
                                                                src="${product.thumbnail}"
                                                                alt=""
                                                                width="50"
                                                                height="60"
                                                                style="object-fit:cover;border-radius:4px;">
                                                          `
                                                        : ""
                                                }

                                                <span>

                                                    ${product.name || "Unnamed product"}

                                                </span>

                                            </div>

                                        </td>


                                        <td>

                                            <small>
                                                ${product.id || "—"}
                                            </small>

                                        </td>


                                        <td>

                                            ₹${Number(
                                                product.price || 0
                                            ).toLocaleString(
                                                "en-IN"
                                            )}

                                        </td>


                                        <td>

                                            ${
                                                product.available === false
                                                    ? `
                                                        <span class="badge text-bg-secondary">
                                                            Unavailable
                                                        </span>
                                                      `
                                                    : `
                                                        <span class="badge text-bg-success">
                                                            Available
                                                        </span>
                                                      `
                                            }

                                        </td>


                                        <td>

                                            <a
                                                href="${productUrl}"
                                                target="_blank"
                                                rel="noopener">

                                                View

                                            </a>

                                        </td>

                                    </tr>

                                `;

                            })
                            .join("")}

                    </tbody>

                </table>

            </div>

        `;

    }

    catch (error) {

        console.error(
            "Failed to load Instagram catalogue:",
            error
        );


        countElement.textContent =
            "Error";

        availableCountElement.textContent =
            "Error";

        lastCheckedElement.textContent =
            "Unable to load";


        container.innerHTML = `

            <div class="alert alert-danger">

                Unable to load Instagram products.
                Please refresh the page.

            </div>

        `;

    }

}


const copyInstagramFeedBtn =
    document.getElementById(
        "copyInstagramFeedBtn"
    );


if (copyInstagramFeedBtn) {

    copyInstagramFeedBtn.addEventListener(
        "click",
        async () => {

            try {

                await navigator.clipboard.writeText(
                    INSTAGRAM_FEED_URL
                );


                const originalText =
                    copyInstagramFeedBtn.textContent;


                copyInstagramFeedBtn.textContent =
                    "Copied!";


                setTimeout(() => {

                    copyInstagramFeedBtn.textContent =
                        originalText;

                }, 2000);

            }

            catch (error) {

                console.error(
                    "Failed to copy feed URL:",
                    error
                );

                alert(
                    "Unable to copy the feed URL."
                );

            }

        }
    );

}


loadInstagramCatalogue();