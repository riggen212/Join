// Reads the current user key from the URL.
function getUserKey() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('user');
}

// Loads the current user from Firebase and displays the user name.
async function loadCurrentUser() {
    const userKey = getUserKey();
    const user = await getData(DB_USERS, userKey);

    document.getElementById('userNames').innerHTML = user.profile.name;
}

loadCurrentUser();

// Opens the Add Task page and keeps the current user key.
function openAddTask() {
    const userKey = getUserKey();

    window.location.href = `./add_task.html?user=${userKey}`;
}

// Opens the Board page and keeps the current user key.
function openBoard() {
    const userKey = getUserKey();

    window.location.href = `./board.html?user=${userKey}`;
}

// Opens the Contacts page and keeps the current user key.
function openContacts() {
    const userKey = getUserKey();

    window.location.href = `./contacts.html?user=${userKey}`;
}