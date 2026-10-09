async function login() {

    const users = await getData(DB_USERS);
    let email = document.getElementById('emailField').value;
    let password = document.getElementById('passwortField').value;

    checkLoginData(users, email, password);
}

function checkLoginData(users, email, password) {

    let loginSuccessful = false;

    for (let key in users) {
        if (
            users[key].profile.email === email &&
            users[key].profile.password === password
        ) {
            loginSuccessful = true;
            window.location.href = `./pages/summary_page.html?user=${key}`;
        }
    }
        if (!loginSuccessful) showLoginError();   
}

function showLoginError() {

    document.getElementById('loginTextError').innerText =
            'Check your email and password. Please try again.';

    document.getElementById('loginEmailRed').classList.add('login-fail');
    document.getElementById('loginPasswordRed').classList.add('login-fail');
    document.getElementById('loginTextError').classList.add('login-text-fail');
}

function guestLogin() {

    window.location.href = "./pages/summary_page.html?user=0";
}