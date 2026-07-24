import { getCategories } from "./products.js";

const train = document.getElementById("categoryTrain");

async function buildCategoryTrain() {

    const categories = await getCategories();

    if (!categories || !categories.length) return;

    // Duplicate list for infinite scrolling
    const doubled = [...categories, ...categories];

    train.innerHTML = "";

    doubled.forEach(category => {

        const card = document.createElement("a");

        card.className = "category-card";

        card.href = `search.html?category=${encodeURIComponent(category.slug)}`;

        card.innerHTML = `

            <div class="category-info">

                <h3>${category.name}</h3>

                <span>Explore →</span>

            </div>

            <div class="category-photo">

                <img
                    src="${category.image}"
                    alt="${category.name}">

            </div>

        `;

        train.appendChild(card);

    });

}

buildCategoryTrain();