async function login() {

    const users = await loadUsers();
    let email = document.getElementById('emailField').value;
    let password = document.getElementById('passwortField').value;

    checkLoginData(users, email, password);
}

function checkLoginData(users, email, password) {

    for (let key in users) {
        if (
            users[key].profile.email === email &&
            users[key].profile.password === password
        ) {
            window.location.href = "./pages/summary_page.html";
        }else {
            /*Rückmeldung für Falsche Login daten noch zurück geben*/
        }
        /*console.log(users[key].profile.email);*/
        
    }
}