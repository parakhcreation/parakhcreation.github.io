/* ===================================
   Wishlist Storage
=================================== */

function getWishlist() {

    return JSON.parse(

        localStorage.getItem("wishlist")

    ) || [];

}

function saveWishlist(wishlist) {

    localStorage.setItem(

        "wishlist",

        JSON.stringify(wishlist)

    );

}

function addToWishlist(id) {

    let wishlist = getWishlist();

    if (!wishlist.includes(id)) {

        wishlist.push(id);

        saveWishlist(wishlist);

    }

    updateWishlistCount();

}

function removeFromWishlist(id) {

    let wishlist = getWishlist();

    wishlist = wishlist.filter(

        item => item !== id

    );

    saveWishlist(wishlist);

    updateWishlistCount();

}

function isWishlisted(id) {

    return getWishlist().includes(id);

}

function toggleWishlist(id) {

    if (isWishlisted(id)) {

        removeFromWishlist(id);

        return false;

    }

    addToWishlist(id);

    return true;

}

function updateWishlistCount() {

    const badge = document.getElementById(

        "wishlistCount"

    );

    if (!badge) return;

    badge.textContent = getWishlist().length;

}

document.addEventListener(

    "DOMContentLoaded",

    updateWishlistCount

);
