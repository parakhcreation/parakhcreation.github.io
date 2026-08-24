const admin = require("firebase-admin");

// ============================================================
// INITIALISE FIREBASE ADMIN
// ============================================================
//
// IMPORTANT:
// Download your Firebase service-account JSON from:
// Firebase Console
// → Project Settings
// → Service Accounts
// → Generate new private key
//
// Save it locally as:
// serviceAccountKey.json
//
// NEVER upload this file to GitHub.
// NEVER put it inside your website.
// ============================================================

const serviceAccount =
    require("./serviceAccountKey.json");

admin.initializeApp({
    credential:
        admin.credential.cert(
            serviceAccount
        )
});

const db =
    admin.firestore();


// ============================================================
// DRY RUN
// ============================================================
//
// true  = ONLY show what would change
// false = actually update Firestore
//
// ALWAYS run with true first.
// ============================================================

const DRY_RUN = true;


// ============================================================
// MIGRATION
// ============================================================

async function migrate() {

    console.log(
        "\n========================================"
    );

    console.log(
        "PARAKH REVIEW PRODUCT MIGRATION"
    );

    console.log(
        "========================================\n"
    );


    const snapshot =
        await db
            .collection("orders")
            .get();


    console.log(
        `Found ${snapshot.size} orders.\n`
    );


    let needsUpdate = 0;

    let alreadyCorrect = 0;

    let skipped = 0;


    for (
        const orderDoc
        of snapshot.docs
    ) {

        const order =
            orderDoc.data();


        // ----------------------------------------------------
        // If reviewProductIds already exists,
        // leave the order completely untouched.
        // ----------------------------------------------------

        if (
            Array.isArray(
                order.reviewProductIds
            )
        ) {

            alreadyCorrect++;

            continue;

        }


        // ----------------------------------------------------
        // Make sure items exists
        // ----------------------------------------------------

        if (
            !Array.isArray(
                order.items
            )
        ) {

            console.log(
                `SKIP ${orderDoc.id} — no items array`
            );

            skipped++;

            continue;

        }


        // ----------------------------------------------------
        // Extract product IDs
        // ----------------------------------------------------

        const productIds =
            [
                ...new Set(

                    order.items

                        .map(
                            item =>
                                item?.id
                        )

                        .filter(
                            Boolean
                        )

                )
            ];


        if (
            productIds.length === 0
        ) {

            console.log(
                `SKIP ${orderDoc.id} — no product IDs`
            );

            skipped++;

            continue;

        }


        // ----------------------------------------------------
        // Show what will happen
        // ----------------------------------------------------

        console.log(
            `UPDATE ${orderDoc.id}`
        );

        console.log(
            `  Order: ${
                order.orderNumber ||
                "(no order number)"
            }`
        );

        console.log(
            `  Products: ${
                productIds.join(", ")
            }`
        );

        console.log("");


        needsUpdate++;


        // ----------------------------------------------------
        // ACTUAL UPDATE
        // ----------------------------------------------------

        if (!DRY_RUN) {

            await orderDoc.ref.update({

                reviewProductIds:
                    productIds

            });

        }

    }


    console.log(
        "========================================"
    );

    console.log(
        `Orders already correct: ${alreadyCorrect}`
    );

    console.log(
        `Orders needing update: ${needsUpdate}`
    );

    console.log(
        `Orders skipped: ${skipped}`
    );

    console.log(
        "========================================"
    );


    if (DRY_RUN) {

        console.log(
            "\nDRY RUN ONLY."
        );

        console.log(
            "No Firestore data was changed."
        );

        console.log(
            "\nIf everything above looks correct,"
        );

        console.log(
            "change DRY_RUN to false and run again."
        );

    }
    else {

        console.log(
            "\nMigration completed successfully."
        );

    }

}


migrate()

    .then(
        () => {

            process.exit(0);

        }
    )

    .catch(
        error => {

            console.error(
                "\nMIGRATION FAILED:\n",
                error
            );

            process.exit(1);

        }
    );