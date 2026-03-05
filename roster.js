/**
 * WEHRSELECTOR: ARMY ROSTER SYSTEM (roster.js)
 */

window.roster = [];
window.unitWounds = {};
window.deployment = {}; 
window.lockedFaction = null;
window.warlordId = null;

window.toggleRoster = (unitId) => {
    const unitData = db.find(u => u.id === unitId);
    if (!unitData) return;

    if (window.lockedFaction && unitData.faction !== window.lockedFaction) {
        alert(`COHERENCE ERROR: ARMY LOCKED TO ${window.lockedFaction}`);
        return;
    }

    const instanceId = `inst_${unitId}_${Date.now()}`;
    window.roster.push({ instanceId, unitId });
    window.deployment[instanceId] = "ALPHA";
    window.lockedFaction = unitData.faction;

    refreshCurrentView(unitId);
    updateRosterBadge();
    saveToDisk();
};

window.renderRoster = () => {
    updateView('roster');
    setTheme(null);
    const content = document.getElementById('app-content');
    
    if (window.roster.length === 0) {
        content.innerHTML = `<div class="empty-state-alert">NO FORCES REGISTERED.</div>`;
        return;
    }

    content.innerHTML = `
        <div class="army-header-card">
            <h1>${window.lockedFaction?.toUpperCase()}</h1>
            <div class="army-meta">
                <span>UNITS: ${window.roster.length}</span>
                <span class="${window.warlordId ? '' : 'text-hazard'}">WARLORD: ${window.warlordId ? 'ONLINE' : 'REQUIRED'}</span>
            </div>
        </div>
        ${["ALPHA", "BRAVO", "RESERVES"].map(group => {
            const groupUnits = window.roster.filter(item => (window.deployment[item.instanceId] || "ALPHA") === group);
            return `
                <div class="deployment-zone">
                    <h3 class="zone-header">// ${group}_SQUADRON</h3>
                    ${groupUnits.map(item => {
                        const u = db.find(d => d.id === item.unitId);
                        return `
                        <div class="menu-card roster-item">
                            <div style="flex-grow:1" onclick="selectUnit('${u.id}')">
                                <h2>${u.name}</h2>
                            </div>
                            <button class="add-unit-btn added small" onclick="removeInstance('${item.instanceId}')">✕</button>
                        </div>`;
                    }).join('')}
                </div>`;
        }).join('')}
    `;
};

window.removeInstance = (instanceId) => {
    window.roster = window.roster.filter(item => item.instanceId !== instanceId);
    if (window.roster.length === 0) window.lockedFaction = null;
    renderRoster();
    updateRosterBadge();
    saveToDisk();
};

window.updateRosterBadge = () => {
    const btn = document.getElementById('roster-toggle');
    if (btn) btn.innerHTML = window.roster.length > 0 ? `BATTLEGROUP [${window.roster.length}]` : `ROSTER`;
};