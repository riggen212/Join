/**
 * Initializes the information page and handles loading errors.
 * Displays an error notification if initialization fails.
 *
 * @returns {Promise<void>} Resolves after initialization or error handling.
 */
async function initInfoPages() {
    try {
        await loadInfoPage();
    } catch (error) {
        showNotification("Page could not be loaded. Please reload the page.", "error");
    }
}

/**
 * Initializes an information page with navigation matching the user context.
 * Hides the profile button for visitors and reveals the prepared navbar.
 * The help page is only available for logged in users, visitors are sent to the login page.
 * Reveals the desktop Help link on legal and privacy pages for valid users, including guests.
 *
 * @returns {Promise<void>}
 * @throws {Error} If loading the user or preparing the page fails.
 */
async function loadInfoPage() {
    const isHelpPage = window.location.pathname.endsWith("help.html");
    loggedUserId = await loadCurrentUser(!isHelpPage);

    if (!loggedUserId && isHelpPage) return;
    document.querySelector(".header-link")?.classList.toggle("d-none", !loggedUserId);

    if (!loggedUserId) {
        setLoggedOutNavbar();
        hideProfileButton();
    }

    document.querySelector(".navbar").classList.remove("navbar-loading");
}

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

initInfoPages();
