/**
 * WEHRSELECTOR: STRATEGIC ALLIANCE & COMBAT ENGINE (roster.js)
 */

// --- 1. STATE INITIALIZATION ---
// Note: We do NOT declare teamAccents here anymore to avoid the "already declared" error.
window.roster = window.roster || [];
window.unitWounds = window.unitWounds || {}; 
window.unitTeams = window.unitTeams || {}; 
window.teamFactions = window.teamFactions || {}; 
window.unitNotes = window.unitNotes || {}; 
window.warlordId = window.warlordId || null;
window.engagementMode = false; 

/**
 * Adds a unit to the specific active team.
 */
window.toggleRoster = (unitId, event) => {
    if (event) event.stopPropagation();

    const unitData = window.db.find(u => u.id === unitId);
    if (!unitData) return;

    const targetTeam = window.currentTeamContext || 1;

    if (window.teamFactions[targetTeam] && window.teamFactions[targetTeam] !== unitData.faction) {
        alert(`TEAM ${targetTeam} ERROR: LOCKED TO ${window.teamFactions[targetTeam].toUpperCase()}`);
        return;
    }

    const instanceId = `inst_${unitId}_${Date.now()}`;
    window.roster.push({ instanceId, unitId });
    window.unitTeams[instanceId] = targetTeam;
    window.teamFactions[targetTeam] = unitData.faction;
    
    window.unitWounds[instanceId] = parseInt(unitData.w);

    window.updateRosterBadge();
    window.saveToDisk();

    const view = window.viewHistory[window.viewHistory.length - 1];
    if (view === 'units') window.renderUnitList(window.currentSelection.faction, window.currentSelection.subfaction);
};

/**
 * Main Roster Renderer: Handles Admin and Combat states.
 */
window.renderRoster = () => {
    // Check if updateView exists before calling (prevents ReferenceError)
    if (window.updateView) {
        window.updateView('roster');
    }
    
    if (window.setTheme) window.setTheme(null); 
    const content = document.getElementById('app-content');
    
    if (window.roster.length === 0) {
        content.innerHTML = `<div class="empty-state-alert">BATTLEGROUP_MANIFEST_EMPTY</div>`;
        return;
    }

    let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:15px;">
            <h1 class="hud-label" style="color:var(--accent-amber); margin:0;">// JOINT_OPERATIONS</h1>
            <button onclick="window.toggleEngagementMode()" 
                style="background:transparent; border:1px solid ${window.engagementMode ? 'var(--accent-hazard)' : 'var(--text-dim)'}; 
                       color:${window.engagementMode ? 'var(--accent-hazard)' : 'var(--text-dim)'}; 
                       padding:8px 12px; font-size:0.6rem; font-weight:800; cursor:pointer;">
                ${window.engagementMode ? 'EXIT_COMBAT_MODE' : 'ENTER_COMBAT_MODE'}
            </button>
        </div>
    `;

    [1, 2, 3].forEach(teamId => {
        const teamUnits = window.roster.filter(item => window.unitTeams[item.instanceId] === teamId);
        const teamFaction = window.teamFactions[teamId];

        if (teamUnits.length === 0 && teamId !== 1) return;

        // Use window.teamAccents from app.js
        const accent = window.teamAccents ? window.teamAccents[teamId] : '#ffb400';

        html += `
            <div class="team-section" style="margin-bottom:30px;">
                <div class="zone-divider" style="display:flex; align-items:center; gap:10px; margin-bottom:15px;">
                    <div style="background:${accent}; color:#000; padding:2px 10px; font-size:0.65rem; font-weight:900;">TEAM_${teamId}</div>
                    <span style="font-size:0.6rem; font-weight:800; color:var(--text-high);">${teamFaction ? teamFaction.toUpperCase() : 'NO_FACTION'}</span>
                    <div style="flex-grow:1; height:1px; background:linear-gradient(90deg, ${accent}, transparent); opacity:0.2;"></div>
                </div>
                ${teamUnits.map(item => renderCombatCard(item, teamId)).join('')}
            </div>
        `;
    });

    if (!window.engagementMode) {
        html += `<button class="action-btn danger-btn" onclick="window.clearRoster()">TERMINATE_ALL_DEPLOYMENTS</button>`;
    }
    
    content.innerHTML = html;
};

const renderCombatCard = (item, teamId) => {
    const u = window.db.find(d => d.id === item.unitId);
    const isWarlord = window.warlordId === item.instanceId;
    const currentHP = window.unitWounds[item.instanceId] !== undefined ? window.unitWounds[item.instanceId] : u.w;
    const accent = window.teamAccents ? window.teamAccents[teamId] : '#ffb400';

    if (window.engagementMode) {
        return `
            <div class="roster-card combat-glow" style="background:#000; border:1px solid ${accent}; margin-bottom:10px; display:flex; align-items:center; padding:12px;">
                <div style="flex-grow:1;">
                    <h2 style="font-size:0.9rem; margin:0; color:#fff;">${u.name}</h2>
                    <div style="font-size:0.45rem; color:${accent}; font-weight:800;">${isWarlord ? '★ COMMAND_NODE' : 'OPERATIVE'}</div>
                </div>
                <div style="display:flex; align-items:center; gap:15px;">
                    <button onclick="window.updateInstanceWounds('${item.instanceId}', -1)" 
                        style="background:none; border:1px solid ${accent}; color:#fff; width:35px; height:35px; font-size:1.2rem; cursor:pointer;">-</button>
                    <div style="text-align:center; min-width:50px;">
                        <div style="font-size:1.3rem; font-weight:900; color:${currentHP <= u.w / 2 ? 'var(--accent-hazard)' : '#fff'};">${currentHP}</div>
                        <div style="font-size:0.45rem; color:var(--text-dim);">/ ${u.w} HP</div>
                    </div>
                    <button onclick="window.updateInstanceWounds('${item.instanceId}', 1)" 
                        style="background:none; border:1px solid ${accent}; color:#fff; width:35px; height:35px; font-size:1.2rem; cursor:pointer;">+</button>
                </div>
            </div>`;
    } else {
        return `
            <div class="roster-card" style="background:var(--bg-surface); border:1px solid rgba(255,180,0,0.1); margin-bottom:8px; display:flex;">
                <div class="roster-card-main" onclick="window.selectUnit('${u.id}')" style="padding:15px; flex-grow:1; cursor:pointer;">
                    <div style="font-size:0.45rem; color:${accent}; margin-bottom:4px;">${isWarlord ? '★ TEAM_LEADER' : 'OPERATIVE'}</div>
                    <h2 style="font-size:0.95rem; margin:0;">${u.name}</h2>
                </div>
                <div class="roster-card-side" style="display:flex; flex-direction:column; border-left:1px solid rgba(255,180,0,0.1);">
                    <button onclick="window.setWarlordInstance('${item.instanceId}')" 
                        style="background:none; color:${isWarlord ? accent : 'var(--text-dim)'}; border:none; padding:10px; cursor:pointer; font-size:1rem;">
                        ${isWarlord ? '★' : '☆'}
                    </button>
                    <button onclick="window.removeInstance('${item.instanceId}')" 
                        style="background:rgba(255,0,0,0.1); color:var(--accent-hazard); border:none; padding:15px; cursor:pointer;">✕</button>
                </div>
            </div>`;
    }
};

window.toggleEngagementMode = () => {
    window.engagementMode = !window.engagementMode;
    window.renderRoster();
};

window.updateInstanceWounds = (instanceId, amt) => {
    const item = window.roster.find(i => i.instanceId === instanceId);
    if (!item) return;
    const u = window.db.find(d => d.id === item.unitId);
    
    let current = window.unitWounds[instanceId] !== undefined ? window.unitWounds[instanceId] : u.w;
    window.unitWounds[instanceId] = Math.max(0, Math.min(u.w, current + amt));
    
    window.saveToDisk();
    window.renderRoster();
};

window.setWarlordInstance = (instanceId) => {
    window.warlordId = (window.warlordId === instanceId) ? null : instanceId;
    window.saveToDisk();
    window.renderRoster();
};

window.removeInstance = (instanceId) => {
    const teamId = window.unitTeams[instanceId];
    window.roster = window.roster.filter(item => item.instanceId !== instanceId);
    
    delete window.unitTeams[instanceId];
    delete window.unitWounds[instanceId];
    if (window.warlordId === instanceId) window.warlordId = null;

    const teamRemaining = window.roster.filter(item => window.unitTeams[item.instanceId] === teamId);
    if (teamRemaining.length === 0) delete window.teamFactions[teamId];

    window.renderRoster();
    window.updateRosterBadge();
    window.saveToDisk();
};

window.clearRoster = () => {
    if (confirm("PURGE ALL TEAMS?")) {
        window.roster = [];
        window.unitTeams = {};
        window.teamFactions = {};
        window.unitWounds = {};
        window.warlordId = null;
        window.saveToDisk();
        window.renderRoster();
        window.updateRosterBadge();
    }
};

window.updateRosterBadge = () => {
    const btn = document.getElementById('roster-toggle');
    if (btn) btn.innerHTML = window.roster.length > 0 ? `ALLIANCE [${window.roster.length}]` : `BATTLEGROUP`;
};

window.saveToDisk = () => {
    localStorage.setItem('wehr_alliance_state', JSON.stringify({
        roster: window.roster,
        unitTeams: window.unitTeams,
        teamFactions: window.teamFactions,
        unitWounds: window.unitWounds,
        warlordId: window.warlordId
    }));
};

window.loadFromDisk = () => {
    const saved = localStorage.getItem('wehr_alliance_state');
    if (saved) {
        const data = JSON.parse(saved);
        window.roster = data.roster || [];
        window.unitTeams = data.unitTeams || {};
        window.teamFactions = data.teamFactions || {};
        window.unitWounds = data.unitWounds || {};
        window.warlordId = data.warlordId || null;
        window.updateRosterBadge();
    }
};