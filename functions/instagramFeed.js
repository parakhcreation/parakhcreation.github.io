const {onRequest} = require("firebase-functions/v2/https");
const {getFirestore} = require("firebase-admin/firestore");
const {initializeApp, getApps} = require("firebase-admin/app");

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

const WEBSITE_URL =
    "https://parakhcreation.github.io";
/**
 * Escapes a value for CSV output.
 *
 * @param {*} value The value to escape.
 * @return {string} The escaped CSV value.
 */
function csvEscape(value) {
  if (value === undefined || value === null) {
    return "";
  }

  const text = String(value);

  if (
    text.includes(",") ||
    text.includes("\"") ||
    text.includes("\n") ||
    text.includes("\r")
  ) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }

  return text;
}
/**
 * Gets the primary image URL for a product.
 *
 * @param {Object} product The product object.
 * @return {string} The product image URL.
 */
function getImageUrl(product) {
  return (
    product.thumbnail ||
    product.image ||
    product.imageUrl ||
    product.mainImage ||
    (
      Array.isArray(product.images) &&
      product.images.length > 0 ?
        product.images[0] :
        ""
    )
  );
}
/**
 * Gets the description used in the product feed.
 *
 * @param {Object} product The product object.
 * @return {string} The product description.
 */
function getDescription(product) {
  return (
    product.description ||
    product.productDetails ||
    `${product.name || "Parakh product"} from Parakh.`
  );
}

exports.instagramProductFeed = onRequest(
    {
      region: "asia-south1",
      cors: false,
    },
    async (req, res) => {
      try {
        const snapshot =
            await db.collection("products").get();

        const products = [];

        snapshot.forEach((doc) => {
          const product = doc.data();

          if (product.instagramEnabled !== true) {
            return;
          }

          if (product.available === false) {
            return;
          }

          const imageUrl = getImageUrl(product);

          if (!imageUrl) {
            console.warn(
                `Skipping ${product.id}: no image URL`,
            );
            return;
          }

          products.push({
            id: product.id || doc.id,
            title: product.name || "Parakh Product",
            description: getDescription(product),
            availability: "in stock",
            condition: "new",
            price:
                `${Number(product.price || 0).toFixed(2)} INR`,
            link:
                `${WEBSITE_URL}/product.html?id=${
                  encodeURIComponent(product.id || doc.id)
                }`,
            image_link: imageUrl,
            brand: "Parakh",
            product_type:
                product.category || "Ethnic Wear",
          });
        });

        const headers = [
          "id",
          "title",
          "description",
          "availability",
          "condition",
          "price",
          "link",
          "image_link",
          "brand",
          "product_type",
        ];

        const rows = [
          headers.join(","),
          ...products.map((product) =>
            headers
                .map((header) =>
                  csvEscape(product[header]),
                )
                .join(","),
          ),
        ];

        res.set(
            "Cache-Control",
            "public, max-age=300",
        );

        res.set(
            "Content-Type",
            "text/csv; charset=utf-8",
        );

        res.status(200).send(
            rows.join("\n"),
        );
      } catch (error) {
        console.error(
            "Instagram product feed error:",
            error,
        );

        res.status(500).send(
            "Unable to generate product feed.",
        );
      }
    },
);
