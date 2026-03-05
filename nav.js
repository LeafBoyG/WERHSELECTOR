/**
 * WEHRSELECTOR: NAVIGATION ENGINE (nav.js)
 */

window.renderTacticalNav = () => {
    const navBar = document.getElementById('tactical-nav');
    if (!navBar) return;

    navBar.innerHTML = `
        <div class="nav-group">
            <button onclick="selectSuperFaction('Imperium')" class="nav-btn">IMPERIUM</button>
            <button onclick="selectSuperFaction('Chaos')" class="nav-btn">CHAOS</button>
            <button onclick="selectSuperFaction('Xenos')" class="nav-btn">XENOS</button>
        </div>
    `;
};

// Call during fetch initialization
fetch('wehrselector_data.json')
    .then(res => res.json())
    .then(data => { 
        db = data; 
        loadFromDisk(); 
        renderTacticalNav(); // Initialize the nav bar
        renderHome(); 
    });

window.renderBreadcrumbs = (view) => {
    const breadcrumbsDiv = document.getElementById('breadcrumbs');
    if (!breadcrumbsDiv) return;

    let crumbs = [`<div class="breadcrumb-group"><span class="breadcrumb-item" onclick="goHome()">CMD</span><span class="breadcrumb-sep">//</span></div>`];

    if (view === 'roster') {
        crumbs.push(`<span class="breadcrumb-item active">BATTLEGROUP</span>`);
    } else {
        if (currentSelection.superFaction) {
            crumbs.push(`
                <div class="breadcrumb-group">
                    <span class="breadcrumb-item ${view === 'factions' ? 'active' : ''}" onclick="selectSuperFaction('${currentSelection.superFaction}')">${currentSelection.superFaction}</span>
                    ${view !== 'factions' ? '<span class="breadcrumb-sep">//</span>' : ''}
                </div>`);
        }
        if (currentSelection.faction && view !== 'factions') {
            crumbs.push(`
                <div class="breadcrumb-group">
                    <span class="breadcrumb-item ${view === 'subfactions' ? 'active' : ''}" onclick="selectFaction('${currentSelection.faction}')">${currentSelection.faction}</span>
                    ${view !== 'subfactions' ? '<span class="breadcrumb-sep">//</span>' : ''}
                </div>`);
        }
    }
    
    breadcrumbsDiv.innerHTML = crumbs.join('');
    breadcrumbsDiv.classList.toggle('hidden', view === 'superfactions');
};