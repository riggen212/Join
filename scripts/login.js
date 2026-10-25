async function login(event) {
    event.preventDefault();

    const users = await getData(DB_USERS);
    let email = document.getElementById('emailField').value;
    let password = document.getElementById('passwortField').value;

    checkLoginData(users, email, password);
}


function checkLoginData(users, email, password) {

    let loginSuccessful = false;

    for (let key in users) {
        if (
            users[key].email === email &&
            users[key].password === password
        ) {
            loginSuccessful = true;
            window.location.href = `./pages/summary_page.html?user=${key}&animation=true`;
        }
    }
        if (!loginSuccessful) showLoginError();   
}


function showLoginError() {
    document.getElementById('loginTextError').innerText =
            'Check your email and password. Please try again.';

    document.getElementById("emailField").setAttribute("aria-invalid", "true");
    document.getElementById("passwortField").setAttribute("aria-invalid", "true");
    document.getElementById('loginEmailRed').classList.add('login-fail');
    document.getElementById('loginPasswordRed').classList.add('login-fail');
    document.getElementById('loginTextError').classList.add('login-text-fail');
}


function guestLogin() {

    window.location.href = "./pages/summary_page.html?user=0&animation=true";
}


/**
 * Toggles the visibility of the login password.
 *
 * @returns {void}
 */
function toggleLoginPasswordVisibility() {
    const passwordInput = document.getElementById("passwortField");
    const toggleButton = document.getElementById("toggle-login-password");
    const passwordIsHidden = passwordInput.type === "password";

    passwordInput.type = passwordIsHidden ? "text" : "password";
    toggleButton.setAttribute("aria-pressed", String(passwordIsHidden));
    toggleButton.setAttribute("aria-label", passwordIsHidden ? "Hide password" : "Show password");
}