async function initMeta() {
    loggedUserId = getUserKey();
    setUserIdsToNavLinks(loggedUserId);
    await setInitialsToProfileButton(loggedUserId);
}

initMeta();
