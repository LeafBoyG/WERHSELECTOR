/**
 * WEHRSELECTOR: STRATEGIC BATTLE GROUP ENGINE (roster.js)
 */

// Initialize state if not already defined
window.roster = window.roster || [];
window.unitWounds = window.unitWounds || {};
window.deployment = window.deployment || {}; 
window.lockedFaction = window.lockedFaction || null;
window.warlordId = window.warlordId || null;

/**
 * Adds a unique unit instance to the roster.
 * Generates an instanceId so you can have multiple of the same datasheet.
 */
window.toggleRoster = (unitId, event) => {
    if (event) event.stopPropagation();

    const unitData = db.find(u => u.id === unitId);
    if (!unitData) return;

    // Faction Coherence Check
    if (window.lockedFaction && unitData.faction !== window.lockedFaction) {
        alert(`COHERENCE ERROR: ARMY LOCKED TO ${window.lockedFaction.toUpperCase()}`);
        return;
    }

    // Create unique instance ID
    const instanceId = `inst_${unitId}_${Date.now()}`;

    window.roster.push({ instanceId, unitId });
    window.deployment[instanceId] = "ALPHA"; // Default sector
    window.lockedFaction = unitData.faction;

    // Refresh the view to update button states
    const currentView = viewHistory[viewHistory.length - 1];
    if (currentView === 'units') renderUnitList(currentSelection.faction, currentSelection.subfaction);
    if (currentView === 'card') renderCard(unitId);
    
    updateRosterBadge();
    saveToDisk();
};

/**
 * Main Roster Renderer: Tactical Battle Group Layout
 */
window.renderRoster = () => {
    updateView('roster');
    setTheme(null); // Reset to amber for roster view
    const content = document.getElementById('app-content');
    
    if (window.roster.length === 0) {
        content.innerHTML = `
            <div class="empty-state-alert" style="text-align:center; padding: 50px 20px;">
                <p style="color:var(--accent-hazard); font-weight:800;">NO FORCES REGISTERED</p>
                <span style="font-size:0.6rem; color:var(--text-dim);">SYSTEM_IDLE: AWAITING_DEPLOYMENT_ORDERS</span>
            </div>`;
        return;
    }

    // Army Summary Header
    let html = `
        <div class="army-summary-card">
            <div class="summary-meta">
                <span style="font-size:0.5rem; color:var(--text-dim);">FORCE_COHERENCE:</span>
                <h1 style="color:var(--faction-accent); margin: 5px 0;">${window.lockedFaction?.toUpperCase()}</h1>
            </div>
            <div class="summary-stats" style="display:flex; gap:20px; border-top:1px solid rgba(255,180,0,0.1); padding-top:10px; margin-top:10px;">
                <div class="s-block">
                    <span style="font-size:0.5rem; color:var(--text-dim); display:block;">UNITS</span>
                    <strong style="color:var(--faction-accent);">${window.roster.length}</strong>
                </div>
                <div class="s-block">
                    <span style="font-size:0.5rem; color:var(--text-dim); display:block;">WARLORD</span>
                    <strong style="color:${window.warlordId ? '#00ff00' : 'var(--accent-hazard)'}">${window.warlordId ? 'READY' : 'REQUIRED'}</strong>
                </div>
            </div>
        </div>
    `;

    // Deployment Sectors
    const sectors = ["ALPHA", "BRAVO", "RESERVES"];
    sectors.forEach(zone => {
        const unitsInZone = window.roster.filter(item => (window.deployment[item.instanceId] || "ALPHA") === zone);
        if (unitsInZone.length === 0 && zone !== "ALPHA") return;

        html += `
            <div class="deployment-section">
                <div class="zone-divider" style="display:flex; align-items:center; gap:10px; margin:20px 0 10px;">
                    <span style="font-size:0.6rem; font-weight:800; color:var(--text-dim); letter-spacing:2px;">${zone}_SECTOR</span>
                    <div style="flex-grow:1; height:1px; background:linear-gradient(90deg, rgba(255,180,0,0.3), transparent);"></div>
                </div>
                ${unitsInZone.map(item => {
                    const u = db.find(d => d.id === item.unitId);
                    const isWarlord = window.warlordId === item.instanceId;
                    
                    return `
                        <div class="roster-card ${isWarlord ? 'warlord-active' : ''}" style="background:var(--bg-surface); border:1px solid ${isWarlord ? 'var(--faction-accent)' : 'rgba(255,180,0,0.1)'}; margin-bottom:8px; display:flex;">
                            <div class="roster-card-main" onclick="selectUnit('${u.id}')" style="padding:12px 15px; flex-grow:1; cursor:pointer;">
                                <div style="font-size:0.45rem; color:var(--faction-accent); margin-bottom:4px; letter-spacing:1px;">${isWarlord ? '★ COMMAND_NODE' : 'OPERATIVE'}</div>
                                <h2 style="font-size:0.9rem; margin:0;">${u.name}</h2>
                                <div style="font-size:0.55rem; color:var(--text-dim); margin-top:4px;">T:${u.t} | SV:${u.sv} | W:${u.w}</div>
                            </div>
                            <div class="roster-card-side" style="display:flex; flex-direction:column; border-left:1px solid rgba(255,180,0,0.1);">
                                <select onchange="window.setDeployment('${item.instanceId}', this.value)" style="background:#000; color:var(--text-dim); border:none; font-size:0.5rem; padding:8px; flex-grow:1; cursor:pointer;">
                                    <option value="ALPHA" ${window.deployment[item.instanceId] === 'ALPHA' ? 'selected' : ''}>ALPHA</option>
                                    <option value="BRAVO" ${window.deployment[item.instanceId] === 'BRAVO' ? 'selected' : ''}>BRAVO</option>
                                    <option value="RESERVES" ${window.deployment[item.instanceId] === 'RESERVES' ? 'selected' : ''}>RESERVES</option>
                                </select>
                                <button onclick="window.removeInstance('${item.instanceId}')" style="background:rgba(255,0,0,0.1); color:var(--accent-hazard); border:none; padding:10px; cursor:pointer;">✕</button>
                            </div>
                        </div>`;
                }).join('')}
            </div>`;
    });

    html += `<button class="action-btn danger-btn" onclick="window.clearRoster()" style="width:100%; margin-top:20px;">TERMINATE_ALL_DEPLOYMENTS</button>`;
    content.innerHTML = html;
};

/**
 * Updates the deployment zone for a specific unit instance.
 */
window.setDeployment = (instanceId, zone) => {
    window.deployment[instanceId] = zone;
    saveToDisk();
    renderRoster();
};

/**
 * Removes a specific instance (squad) from the army.
 */
window.removeInstance = (instanceId) => {
    window.roster = window.roster.filter(item => item.instanceId !== instanceId);
    
    // Cleanup state
    delete window.deployment[instanceId];
    if (window.warlordId === instanceId) window.warlordId = null;
    if (window.roster.length === 0) window.lockedFaction = null;

    renderRoster();
    updateRosterBadge();
    saveToDisk();
};

/**
 * Resets the entire battlegroup.
 */
window.clearRoster = () => {
    if (confirm("CONFIRM TOTAL LIST PURGE?")) {
        window.roster = [];
        window.lockedFaction = null;
        window.warlordId = null;
        window.deployment = {};
        saveToDisk();
        renderRoster();
        updateRosterBadge();
    }
};

/**
 * Updates the "BATTLEGROUP" button label in the header.
 */
window.updateRosterBadge = () => {
    const btn = document.getElementById('roster-toggle');
    if (btn) {
        btn.innerHTML = window.roster.length > 0 ? `BATTLEGROUP [${window.roster.length}]` : `BATTLEGROUP`;
    }
};

/**
 * Saves current army state to LocalStorage.
 */
window.saveToDisk = () => {
    localStorage.setItem('wehr_army_session', JSON.stringify({
        roster: window.roster,
        lockedFaction: window.lockedFaction,
        unitWounds: window.unitWounds,
        deployment: window.deployment,
        warlordId: window.warlordId
    }));
};

/**
 * Loads army state from LocalStorage.
 */
window.loadFromDisk = () => {
    const data = JSON.parse(localStorage.getItem('wehr_army_session'));
    if (data) {
        window.roster = data.roster || [];
        window.lockedFaction = data.lockedFaction || null;
        window.unitWounds = data.unitWounds || {};
        window.deployment = data.deployment || {};
        window.warlordId = data.warlordId || null;
        updateRosterBadge();
    }
};