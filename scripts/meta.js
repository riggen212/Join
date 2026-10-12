async function initMeta() {
    loggedUserId = await loadCurrentUser();
}

initMeta();
