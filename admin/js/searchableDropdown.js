export function createSearchableDropdown(input, values) {

    let dropdown = document.createElement("div");

    dropdown.className = "search-dropdown";

    input.parentNode.appendChild(dropdown);

    input.addEventListener("input", () => {

        const text = input.value.toLowerCase();

        dropdown.innerHTML = "";

        if (!text) {

            dropdown.style.display = "none";

            return;

        }

        const filtered = values.filter(value =>
            value.toLowerCase().includes(text)
        );

        filtered.forEach(value => {

            const option =
                document.createElement("div");

            option.className =
                "search-option";

            option.textContent = value;

            option.onclick = () => {

                input.value = value;

                dropdown.style.display =
                    "none";

            };

            dropdown.appendChild(option);

        });

        dropdown.style.display =
            filtered.length
                ? "block"
                : "none";

    });

    document.addEventListener("click", e => {

        if (
            !dropdown.contains(e.target)
            &&
            e.target !== input
        ) {

            dropdown.style.display = "none";

        }

    });

}