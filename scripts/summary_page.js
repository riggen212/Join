async function initSummary() {
    loggedUserId = await loadCurrentUser();
    const user = await getData(DB_USERS, loggedUserId);
    document.getElementById('userNames').innerHTML = user.profile.name;
}

initSummary();
