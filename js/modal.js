export function showConfirmModal({

    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm

}) {

    // Remove existing modal if present
    const oldModal = document.getElementById("confirmModalOverlay");

    if (oldModal) oldModal.remove();

    const overlay = document.createElement("div");

    overlay.id = "confirmModalOverlay";

    overlay.innerHTML = `

        <div class="confirmModal">

            <h2>${title}</h2>

            <p>${message}</p>

            <div class="confirmButtons">

                <button
                    id="confirmCancelBtn"
                    class="secondaryBtn">

                    ${cancelText}

                </button>

                <button
                    id="confirmOkBtn"
                    class="primaryBtn">

                    ${confirmText}

                </button>

            </div>

        </div>

    `;

    document.body.appendChild(overlay);

    document
        .getElementById("confirmCancelBtn")
        .onclick = () => {

            overlay.remove();

        };

    document
        .getElementById("confirmOkBtn")
        .onclick = async () => {

            overlay.remove();

            if (onConfirm) {

                await onConfirm();

            }

        };

}