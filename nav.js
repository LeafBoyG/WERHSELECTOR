/**
 * WEHRSELECTOR: STRATEGIC NAVIGATION ENGINE (nav.js)
 */

/**
 * Renders the centered Super-Faction navigation bar.
 * Placed directly under the header in the document flow.
 */
window.renderTacticalNav = () => {
    const navBar = document.getElementById('tactical-nav');
    if (!navBar) return;

    navBar.innerHTML = `
        <div class="nav-group" style="display:flex; justify-content:center; gap:15px; padding: 10px 0;">
            <button onclick="selectSuperFaction('Imperium')" class="nav-btn">IMPERIUM</button>
            <button onclick="selectSuperFaction('Chaos')" class="nav-btn">CHAOS</button>
            <button onclick="selectSuperFaction('Xenos')" class="nav-btn">XENOS</button>
        </div>
    `;
};

/**
 * Handles the dynamic breadcrumb path (CMD // SUPER-FACTION // FACTION).
 */
window.renderBreadcrumbs = (view) => {
    const breadcrumbsDiv = document.getElementById('breadcrumbs');
    if (!breadcrumbsDiv) return;

    // Start with the Root node
    let crumbs = [`<div class="breadcrumb-group"><span class="breadcrumb-item" onclick="goHome()">CMD</span><span class="breadcrumb-sep">//</span></div>`];

    if (view === 'roster') {
        crumbs.push(`<span class="breadcrumb-item active">BATTLEGROUP</span>`);
    } else {
        // Super-Faction Breadcrumb
        if (currentSelection.superFaction) {
            crumbs.push(`
                <div class="breadcrumb-group">
                    <span class="breadcrumb-item ${view === 'factions' ? 'active' : ''}" onclick="selectSuperFaction('${currentSelection.superFaction}')">${currentSelection.superFaction.toUpperCase()}</span>
                    ${(view !== 'factions' && currentSelection.faction) ? '<span class="breadcrumb-sep">//</span>' : ''}
                </div>`);
        }
        // Faction/Subfaction Breadcrumb
        if (currentSelection.faction && view !== 'factions') {
            crumbs.push(`
                <div class="breadcrumb-group">
                    <span class="breadcrumb-item ${view === 'subfactions' ? 'active' : ''}" onclick="selectFaction('${currentSelection.faction}')">${currentSelection.faction.toUpperCase()}</span>
                    ${(view === 'units' || view === 'card') ? '<span class="breadcrumb-sep">//</span>' : ''}
                </div>`);
        }
    }
    
    breadcrumbsDiv.innerHTML = crumbs.join('');
    
    // Auto-hide breadcrumbs on the home screen for a cleaner HUD
    breadcrumbsDiv.classList.toggle('hidden', view === 'superfactions');
};