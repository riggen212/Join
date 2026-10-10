async function initSummary() {
    const user = await loadCurrentUser();
    document.getElementById('userNames').innerHTML = user.profile.name;
}

initSummary();
