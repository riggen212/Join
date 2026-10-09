async function loadCurrentUser() {
    const userKey = getUserKey();
    const user = await getData(DB_USERS, userKey);

    setUserIdsToNavLinks(userKey);
    await setInitialsToProfileButton(userKey);
    document.getElementById('userNames').innerHTML = user.profile.name;
}

loadCurrentUser();