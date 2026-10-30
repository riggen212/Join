/**
 * Initializes a public page with navigation matching the user context.
 * Hides the profile button for visitors and reveals the prepared navbar.
 *
 * @returns {Promise<void>}
 */
async function initMeta() {
    loggedUserId = await loadCurrentUser(true);

    if (!loggedUserId) {
        setLoggedOutNavbar();
        hideProfileButton();
    }

    document.querySelector(".navbar").classList.remove("navbar-loading");
}

initMeta();

/**
 * Selects the navigation elements and applies the logged-out layout.
 *
 * @returns {void}
 */
function setLoggedOutNavbar() {
    const navbar = document.querySelector(".navbar");
    const navbarLinks = document.querySelectorAll(".navbar-wrapper .link-navbar");
    const footer = document.querySelector("footer");

    applyLoggedOutNavbarState(navbar, navbarLinks, footer);
}

/**
 * Marks navigation as logged out, shows login and hides main-page links.
 * Makes the legal and privacy footer visible.
 *
 * @param {HTMLElement} navbar - The navbar element.
 * @param {NodeListOf<HTMLAnchorElement>} navbarLinks - The main navigation links.
 * @param {HTMLElement} footer - The navigation footer.
 * @returns {void}
 */
function applyLoggedOutNavbarState(navbar, navbarLinks, footer) {
    navbar.dataset.isLoggedIn = "false";

    navbarLinks.forEach((link) => {
        if (link.id === "nav-login") {
            link.closest("li").classList.remove("d-none");
        } else {
            link.closest("li").classList.add("d-none");
        }
    });

    footer.classList.add("d-unset");
}

/**
 * Hides the profile button.
 *
 * @returns {void}
 */
function hideProfileButton() {
    const profileButton = document.querySelector(".header-profile-initials-button");
    profileButton.classList.add("d-none");
}
