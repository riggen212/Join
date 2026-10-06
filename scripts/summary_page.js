function getUserKey() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('user');
}

async function loadCurrentUser() {
    const userKey = getUserKey();
    const user = await getData(DB_USERS, userKey);

    document.getElementById('userNames').innerHTML = user.profile.name;
}

loadCurrentUser();