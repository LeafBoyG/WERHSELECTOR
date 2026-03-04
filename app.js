/**
 * WEHRSELECTOR: COMMAND UPLINK V4.0
 * INTEGRATED ARMY CREATOR & TACTICAL HUD
 */

// --- 1. STATE & DATA ---
let db = [];
let viewHistory = ['superfactions'];
let viewedHistory = []; 
let currentSelection = { superFaction: null, faction: null, subfaction: null, unitId: null };
let roster = [];
let unitWounds = {};
let teams = { "ALPHA": [], "BRAVO": [], "RESERVES": [] };

// New state for Army Validation
let lockedFaction = null; 
let warlordId = null;    

const superFactions = {
    "Imperium": ["Adepta Sororitas", "Adeptus Custodes", "Adeptus Mechanicus", "Adeptus Titanicus", "Astra Militarum", "Grey Knights", "Imperial Agents", "Imperial Knights", "Space Marines"],
    "Chaos": ["Chaos Daemons", "Chaos Knights", "Chaos Space Marines", "Death Guard", "Emperor’s Children", "Thousand Sons", "World Eaters"],
    "Xenos": ["Aeldari", "Drukhari", "Genestealer Cults", "Leagues of Votann", "Necrons", "Orks", "T’au Empire", "Tyranids"]
};

const factionLogos = {
    "Adepta Sororitas": "SOB.svg", "Adeptus Custodes": "AC.svg", "Adeptus Mechanicus": "ADMech.svg",
    "Adeptus Titanicus": "TL.svg", "Aeldari": "AE.svg", "Astra Militarum": "AM.svg",
    "Chaos Daemons": "CD.svg", "Chaos Knights": "CK.svg", "Chaos Space Marines": "CSM.svg",
    "Death Guard": "DG.svg", "Drukhari": "DRU.svg", "Emperor’s Children": "EC.svg",
    "Genestealer Cults": "GSC.svg", "Grey Knights": "GK.svg", "Imperial Agents": "AoI.svg",
    "Imperial Knights": "IK.svg", "Leagues of Votann": "VOT.svg", "Necrons": "NEC.svg",
    "Orks": "ORK.svg", "Space Marines": "SM.svg", "T’au Empire": "TAU.svg",
    "Thousand Sons": "TS.svg", "Tyranids": "TYR.svg", "World Eaters": "WE.svg"
};

const factionColors = {
    "Adepta Sororitas": "#f2f2f2", "Adeptus Custodes": "#e5c100", "Adeptus Mechanicus": "#ff4422",
    "Astra Militarum": "#4e5d4a", "Chaos Daemons": "#ff00ff", "Chaos Space Marines": "#ff8800",
    "Death Guard": "#889966", "Necrons": "#00ff00", "Orks": "#228822", 
    "Space Marines": "#0077ff", "T’au Empire": "#ffcc33", "Tyranids": "#aa00ff", "World Eaters": "#ff0000"
};

const contentDiv = document.getElementById('app-content');
const backBtn = document.getElementById('back-btn');
const breadcrumbsDiv = document.getElementById('breadcrumbs');
const searchBar = document.getElementById('search-bar');
const suggestionsDiv = document.getElementById('search-suggestions');
const rosterBtn = document.getElementById('roster-toggle');

// --- 2. TACTICAL HUD & POINTS LOGIC ---
const renderTacticalHUD = () => {
    const totalPts = roster.reduce((sum, id) => {
        const u = db.find(unit => unit.id === id);
        const unitPoints = (u && u.pts) ? parseInt(u.pts) : 0;
        return sum + unitPoints;
    }, 0);

    const recentUnits = [...new Set(viewedHistory)].reverse().slice(0, 5);

    let hud = document.getElementById('tactical-hud');
    if (!hud) {
        hud = document.createElement('div');
        hud.id = 'tactical-hud';
        document.body.appendChild(hud);
    }

    hud.innerHTML = `
        <div class="hud-content" style="display:flex; justify-content:space-between; align-items:center;">
            <div class="hud-history" style="display:flex; gap:10px; align-items:center;">
                <span style="font-size:0.5rem; color:var(--text-dim); font-weight:800;">RECENT_INTEL:</span>
                <div style="display:flex; gap:5px;">
                    ${recentUnits.map(id => {
                        const u = db.find(unit => unit.id === id);
                        return u ? `<div class="history-chip" onclick="selectUnit('${id}')" style="cursor:pointer; background:var(--bg-elevated); border:1px solid var(--border-ui); padding:2px 8px; font-size:0.6rem;">${u.name}</div>` : '';
                    }).join('')}
                </div>
            </div>
            <div class="hud-points" style="text-align:right;">
                <span style="font-size:0.5rem; color:var(--text-dim); font-weight:800;">ARMY_VALUE:</span>
                <div style="color:var(--accent-hazard); font-weight:900; font-size:0.9rem;">${totalPts} PTS</div>
            </div>
        </div>`;
};

// --- 3. TOAST & GLITCH SYSTEMS ---
const showToast = (message, type = 'info') => {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast-alert ${type}`;
    const icon = type === 'hazard' ? '[!]' : '>>';
    toast.innerHTML = `<span class="toast-icon">${icon}</span> <span class="toast-msg">${message}</span>`;
    container.appendChild(toast);

    const msgSpan = toast.querySelector('.toast-msg');
    const originalText = message;
    const chars = "!<>-_\\/[]{}—=+*^?#________";
    let iterations = 0;
    const glitchInterval = setInterval(() => {
        msgSpan.innerText = originalText.split("").map((char, index) => {
            if (index < iterations) return originalText[index];
            return chars[Math.floor(Math.random() * chars.length)];
        }).join("");
        if (iterations >= originalText.length) clearInterval(glitchInterval);
        iterations += 1/2;
    }, 30);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
};

// --- 4. PERSISTENCE ---
const saveToDisk = (silent = false) => {
    localStorage.setItem('arkRaider_session', JSON.stringify({
        roster, unitWounds, teams, viewedHistory, lockedFaction, warlordId
    }));
    if (!silent) showToast("DATA_SYNC_SUCCESSFUL", "info");
};

const loadFromDisk = () => {
    const saved = localStorage.getItem('arkRaider_session');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            roster = data.roster || [];
            unitWounds = data.unitWounds || {};
            viewedHistory = data.viewedHistory || [];
            teams = (data.teams && Object.keys(data.teams).length > 0) ? data.teams : { "ALPHA": [], "BRAVO": [], "RESERVES": [] };
            lockedFaction = data.lockedFaction || null;
            warlordId = data.warlordId || null;
            updateRosterBadge();
        } catch (e) {
            showToast("CORRUPT_BUFFER_REPAIRED", "hazard");
            saveToDisk(true);
        }
    }
};

// --- 5. THEME & UI HELPERS ---
const setTheme = (color) => {
    document.documentElement.style.setProperty('--faction-accent', color || 'var(--accent-amber)');
    document.documentElement.style.setProperty('--faction-glow', (color || '#ffb400') + '26');
};

const resetTheme = () => {
    document.documentElement.style.setProperty('--faction-accent', "var(--accent-amber)");
    document.documentElement.style.setProperty('--faction-glow', "rgba(255, 180, 0, 0.1)");
};

const updateUI = (view, unitId = null) => {
    if (!breadcrumbsDiv) return;
    let crumbs = [`<span class="breadcrumb-item" onclick="goHome()">CMD</span>`];
    if (view === 'roster') crumbs.push(`<span class="breadcrumb-item active">BATTLEGROUP</span>`);
    else if (view === 'factions') crumbs.push(`<span class="breadcrumb-item active">${currentSelection.superFaction}</span>`);
    else if (view === 'subfactions') {
        crumbs.push(`<span class="breadcrumb-item" onclick="selectSuperFaction('${currentSelection.superFaction}')">${currentSelection.superFaction}</span>`);
        crumbs.push(`<span class="breadcrumb-item active">${currentSelection.faction}</span>`);
    } else if (view === 'units') {
        crumbs.push(`<span class="breadcrumb-item" onclick="selectFaction('${currentSelection.faction}')">${currentSelection.faction}</span>`);
        crumbs.push(`<span class="breadcrumb-item active">${currentSelection.subfaction}</span>`);
    } else if (view === 'card') {
        const u = db.find(unit => unit.id === unitId);
        crumbs.push(`<span class="breadcrumb-item" onclick="renderUnitList('${currentSelection.faction}', '${currentSelection.subfaction}')">${currentSelection.subfaction}</span>`);
        crumbs.push(`<span class="breadcrumb-item active">${u ? u.name : 'DATA'}</span>`);
    }
    breadcrumbsDiv.innerHTML = crumbs.join(' // ');
    breadcrumbsDiv.classList.toggle('hidden', view === 'superfactions');
    if (backBtn) backBtn.classList.toggle('hidden', view === 'superfactions');
};

// --- 6. RENDER LOGIC ---
const renderHome = () => {
    currentSelection = { superFaction: null, faction: null, subfaction: null, unitId: null };
    viewHistory = ['superfactions'];
    resetTheme();
    updateUI('superfactions');
    renderTacticalHUD();
    const sfLogos = { "Imperium": "IMPERIUM.SVG", "Chaos": "CHAOS.SVG", "Xenos": "XENOS.SVG" };
    contentDiv.innerHTML = Object.keys(superFactions).map(sf => `
        <div class="menu-card" onclick="selectSuperFaction('${sf}')">
            <div class="sf-icon-container"><img src="assets/logos/${sfLogos[sf]}" class="faction-logo sf-large-logo"></div>
            <h2>${sf}</h2>
            <p>SYSTEM_OVERRIDE: ${superFactions[sf].length} ACTIVE_NODES</p>
        </div>`).join('');
};

const renderFactions = (sf) => {
    currentSelection.superFaction = sf;
    updateUI('factions');
    resetTheme();
    contentDiv.innerHTML = superFactions[sf].map(f => `
        <div class="menu-card" style="border-left: 4px solid ${factionColors[f]}" onclick="selectFaction('${f}')">
            <div class="faction-row" style="display: flex; align-items: center; gap: 15px;">
                <img src="assets/logos/${factionLogos[f] || 'generic.svg'}" class="faction-logo">
                <h2>${f}</h2>
            </div>
        </div>`).join('');
};

const renderSubfactions = (f) => {
    currentSelection.faction = f;
    setTheme(factionColors[f]);
    updateUI('subfactions');
    const subs = [...new Set(db.filter(u => u.faction === f).map(u => u.subfaction))];
    contentDiv.innerHTML = subs.map(s => `
        <div class="menu-card" onclick="renderUnitList('${f}', '${s}')">
            <h2>${s || 'GENERAL_UNITS'}</h2>
        </div>`).join('');
};

const renderUnitList = (f, s) => {
    currentSelection.subfaction = s;
    updateUI('units');
    const units = db.filter(u => u.faction === f && u.subfaction === s).sort((a,b) => a.name.localeCompare(b.name));
    contentDiv.innerHTML = `<ul class="list-menu vertical">` + 
        units.map(u => `<li class="menu-card" onclick="selectUnit('${u.id}')"><h2>${u.name}</h2></li>`).join('') + `</ul>`;
};

const renderCard = (unitId) => {
    const unit = db.find(u => u.id === unitId);
    if (!unit) return;
    
    if (!viewedHistory.includes(unitId)) viewedHistory.push(unitId);
    currentSelection.unitId = unitId;

    const curUnits = db.filter(u => u.faction === currentSelection.faction && u.subfaction === currentSelection.subfaction).sort((a,b) => a.name.localeCompare(b.name));
    const idx = curUnits.findIndex(u => u.id === unitId);
    const prev = curUnits[idx - 1], next = curUnits[idx + 1];

    setTheme(factionColors[unit.faction]);
    updateUI('card', unitId);
    renderTacticalHUD();
    
    if (unitWounds[unit.id] === undefined) unitWounds[unit.id] = parseInt(unit.w);

    const isSupreme = unit.abilities.some(a => a.name === "SUPREME COMMANDER");

    contentDiv.innerHTML = `
        <div class="unit-card">
            <div class="unit-nav-header" style="display:flex; justify-content:space-between; align-items:center; background:#000; padding:5px 15px; border-bottom:1px solid var(--border-ui);">
                <button class="nav-arrow" ${prev ? `onclick="selectUnit('${prev.id}')"` : 'disabled'} style="opacity:${prev ? '1' : '0.2'}">◀ PREV</button>
                <span style="font-size:0.5rem; color:var(--text-dim);">SCRUBBING: ${idx + 1} / ${curUnits.length}</span>
                <button class="nav-arrow" ${next ? `onclick="selectUnit('${next.id}')"` : 'disabled'} style="opacity:${next ? '1' : '0.2'}">NEXT ▶</button>
            </div>
            <div class="unit-header">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="assets/logos/${factionLogos[unit.faction] || 'generic.svg'}" class="faction-logo" style="width:22px; height:22px;">
                    <span class="unit-name">${unit.name}</span>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <span style="color:var(--accent-hazard); font-weight:900; font-size:0.8rem;">${unit.pts || 0} PTS</span>
                    <button class="action-btn" onclick="toggleRoster('${unit.id}')">
                        ${roster.includes(unit.id) ? '✕ DISENGAGE' : '📌 ENGAGE'}
                    </button>
                </div>
            </div>

            <div style="padding: 0 15px 10px 15px;">
                <button class="action-btn ${warlordId === unit.id ? 'active' : ''}" 
                        onclick="setWarlord('${unit.id}')"
                        style="width: 100%; border-color: var(--accent-hazard); font-size: 0.6rem;">
                    ${warlordId === unit.id ? '★ COMMAND_LINK_ACTIVE' : '☆ DESIGNATE_WARLORD'}
                </button>
            </div>

            <div class="stat-bar">
                <div class="stat-item"><span class="stat-label">M</span><span class="stat-val high-performance">${unit.m}</span></div>
                <div class="stat-item"><span class="stat-label">T</span><span class="stat-val">${unit.t}</span></div>
                <div class="stat-item"><span class="stat-label">SV</span><span class="stat-val save-highlight">${unit.sv}</span></div>
                <div class="stat-item"><span class="stat-label">W</span><span class="stat-val">${unit.w}</span></div>
                <div class="stat-item"><span class="stat-label">LD</span><span class="stat-val" style="color:#a855f7;">${unit.ld}</span></div>
                <div class="stat-item"><span class="stat-label">OC</span><span class="stat-val">${unit.oc}</span></div>
            </div>
            <div class="tab-bar"><button class="tab-btn active" onclick="switchTab('weapons', this)">ARMAMENT</button><button class="tab-btn" onclick="switchTab('abilities', this)">INTEL</button></div>
            <div id="tab-weapons" class="tab-content">
                <div class="weapon-row header"><span>WEAPON</span><span>R</span><span>A</span><span>BS</span><span>S</span><span>AP</span><span>D</span></div>
                ${unit.weapons.map(w => `
                    <div class="weapon-card-tactical">
                        <div class="weapon-row">
                            <span style="font-weight:800; text-align:left; padding-left:10px;">${w.name}</span>
                            <span>${w.range}</span><span>${w.a}</span><span>${w.ws_bs}+</span><span>${w.s}</span>
                            <span class="weapon-ap">${w.ap}</span><span class="weapon-d">${w.d}</span>
                        </div>
                        ${w.keywords ? `<div class="weapon-keywords">// ${w.keywords}</div>` : ''}
                    </div>`).join('')}
            </div>
            <div id="tab-abilities" class="tab-content hidden">${unit.abilities.map(a => `<div class="ability-card"><div class="ability-name">${a.name}</div><div class="ability-text">${a.text}</div></div>`).join('')}</div>
            <div class="wound-tracker">
                <button class="counter-btn" onclick="updateWounds('${unit.id}', -1)">−</button>
                <div class="wound-display"><span id="wound-display-text" style="font-size:1.2rem; font-weight:800; color:var(--accent-hazard);">${unitWounds[unit.id]}</span><span style="font-size:0.6rem; color:var(--text-dim);">/ ${unit.w} HP</span></div>
                <button class="counter-btn" onclick="updateWounds('${unit.id}', 1)">+</button>
            </div>
        </div>`;
};

// --- 7. ARMY & ROSTER LOGIC ---
window.toggleRoster = (id) => {
    const unit = db.find(u => u.id === id);
    if (!unit) return;

    const index = roster.indexOf(id);
    if (index === -1) {
        // Validation: Faction Lock
        if (lockedFaction && unit.faction !== lockedFaction) {
            showToast(`DEPLOYMENT_ERROR: ARMY LOCKED TO ${lockedFaction.toUpperCase()}`, "hazard");
            return;
        }

        // Validation: Unit Limits
        const count = roster.filter(uId => uId === id).length;
        const isBattleline = unit.subfaction === "Battleline";
        const isUnique = unit.abilities.some(a => a.name === "CHOSEN OF THE EMPEROR" || a.name === "SUPREME COMMANDER");

        if (isUnique && count >= 1) {
            showToast(`UNIQUE_ENTITY_LIMIT_REACHED`, "hazard");
            return;
        }
        if (!isBattleline && count >= 3) {
            showToast(`STRIKE_FORCE_LIMIT_REACHED: MAX 3`, "hazard");
            return;
        }

        roster.push(id);
        if (!lockedFaction) lockedFaction = unit.faction;
        
        const defaultTeam = teams["ALPHA"] ? "ALPHA" : Object.keys(teams)[0];
        teams[defaultTeam].push(id);
        showToast(`${unit.name.toUpperCase()}_ENGAGED`, "info");
    } else {
        roster.splice(index, 1);
        Object.keys(teams).forEach(t => teams[t] = teams[t].filter(uid => uid !== id));
        
        if (roster.length === 0) lockedFaction = null;
        if (warlordId === id && !roster.includes(id)) warlordId = null;
        
        showToast(`${unit.name.toUpperCase()}_DISENGAGED`, "info");
    }
    
    const cur = viewHistory[viewHistory.length - 1];
    if (cur === 'roster') renderRoster();
    else if (cur === 'card') renderCard(id);
    
    updateRosterBadge();
    saveToDisk(true);
    renderTacticalHUD();
};

window.setWarlord = (id) => {
    const unit = db.find(u => u.id === id);
    if (!roster.includes(id)) {
        showToast("UNIT_NOT_IN_ROSTER", "hazard");
        return;
    }
    
    warlordId = id;
    showToast(`${unit.name.toUpperCase()}_DESIGNATED_WARLORD`, "info");
    renderCard(id);
    saveToDisk(true);
};

window.selectUnit = (id) => {
    if (!viewedHistory.includes(id)) viewedHistory.push(id);
    viewHistory.push('card');
    suggestionsDiv.classList.add('hidden');
    renderCard(id);
    renderTacticalHUD();
};

const renderRoster = () => {
    updateUI('roster');
    resetTheme();
    if (!teams["ALPHA"]) teams["ALPHA"] = [];
    contentDiv.innerHTML = `
        <div class="team-controls" style="margin-bottom:20px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-ui); padding-bottom:10px;">
            <h1 style="color:var(--accent-hazard); font-size:1rem;">BATTLEGROUP_INTEL</h1>
            <button class="action-btn" onclick="createNewTeam()">[+] NEW_TEAM</button>
        </div>
        ${Object.keys(teams).map(teamName => {
            const teamUnits = teams[teamName].map(id => db.find(u => u.id === id)).filter(u => u);
            if (teamUnits.length === 0 && teamName !== "ALPHA") return '';
            return `
                <div class="team-block" style="margin-bottom:20px; border: 1px solid var(--border-ui);">
                    <div style="background:var(--bg-elevated); padding:8px 15px; display:flex; justify-content:space-between; border-bottom:1px solid var(--faction-accent);">
                        <span style="font-weight:800; color:var(--faction-accent); font-size:0.7rem;">SQUAD // ${teamName}</span>
                    </div>
                    <div style="padding:10px;">
                        ${teamUnits.map(u => `
                            <div class="roster-item-layout" style="margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">
                                <div onclick="selectUnit('${u.id}')" style="cursor:pointer;">
                                    <h2 style="font-size:0.85rem;">${warlordId === u.id ? '★ ' : ''}${u.name}</h2>
                                    <p style="font-size:0.5rem; color:var(--text-dim);">${u.faction} // ${u.pts || 0} PTS</p>
                                </div>
                                <div style="display:flex; gap:10px; align-items:center;">
                                    <div class="wound-counter-small"><button onclick="updateWounds('${u.id}', -1)">−</button><span id="roster-wounds-${u.id}">${unitWounds[u.id] || u.w}</span><button onclick="updateWounds('${u.id}', 1)">+</button></div>
                                    <select onchange="assignToTeam('${u.id}', this.value)" style="background:#000; color:var(--faction-accent); border:1px solid var(--border-ui); font-size:0.5rem; padding:2px;">
                                        ${Object.keys(teams).map(t => `<option value="${t}" ${t === teamName ? 'selected' : ''}>${t}</option>`).join('')}
                                    </select>
                                    <button onclick="toggleRoster('${u.id}')" style="background:none; border:none; color:var(--text-dim); cursor:pointer;">✕</button>
                                </div>
                            </div>`).join('')}
                    </div>
                </div>`;
        }).join('')}
        <button class="action-btn" onclick="clearRoster()" style="width:100%; margin-top:20px; border-color:#ef4444; color:#ef4444;">TERMINATE_ALL_SESSIONS</button>`;
};

// --- 8. INIT & UTILS ---
window.updateWounds = (id, amt) => {
    const u = db.find(unit => unit.id === id);
    if (!u) return;
    unitWounds[id] = Math.max(0, Math.min(parseInt(u.w), (unitWounds[id] || parseInt(u.w)) + amt));
    if (unitWounds[id] === 0) showToast(`${u.name.toUpperCase()}_CRITICAL_FAILURE`, "hazard");
    const d1 = document.getElementById('wound-display-text'), d2 = document.getElementById(`roster-wounds-${id}`);
    if (d1) d1.innerText = unitWounds[id]; if (d2) d2.innerText = unitWounds[id];
    saveToDisk(true);
};

window.goHome = () => renderHome();
window.selectSuperFaction = (sf) => { viewHistory.push('factions'); renderFactions(sf); };
window.selectFaction = (f) => { viewHistory.push('subfactions'); renderSubfactions(f); };
window.switchTab = (id, btn) => {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + id).classList.remove('hidden');
    btn.classList.add('active');
};

const updateRosterBadge = () => { if (rosterBtn) rosterBtn.innerHTML = roster.length > 0 ? `ROSTER [${roster.length}]` : `ROSTER`; };

fetch('wehrselector_data.json').then(res => res.json()).then(data => {
    db = data; loadFromDisk(); renderHome(); renderTacticalHUD(); showToast("SYSTEM_READY // UPLINK_STABLE", "info");
});

searchBar.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    if (!q) { suggestionsDiv.classList.add('hidden'); renderHome(); return; }
    const matches = db.filter(u => u.name.toLowerCase().includes(q));
    suggestionsDiv.classList.toggle('hidden', matches.length === 0);
    suggestionsDiv.innerHTML = matches.slice(0,5).map(m => `<div class="suggestion-item" onclick="selectUnit('${m.id}')"><span>${m.name}</span><span style="font-size:0.5rem; color:var(--text-dim);">${m.faction}</span></div>`).join('');
});

backBtn.addEventListener('click', () => {
    if (viewHistory.length <= 1) return;
    viewHistory.pop();
    const p = viewHistory[viewHistory.length - 1];
    if (p === 'superfactions') renderHome();
    else if (p === 'factions') renderFactions(currentSelection.superFaction);
    else if (p === 'subfactions') renderSubfactions(currentSelection.faction);
    else if (p === 'units') renderUnitList(currentSelection.faction, currentSelection.subfaction);
    else if (p === 'roster') renderRoster();
    else if (p === 'card') renderCard(currentSelection.unitId);
});

// Added to handle the Roster toggle button in the header
if (rosterBtn) {
    rosterBtn.addEventListener('click', () => {
        viewHistory.push('roster');
        renderRoster();
    });
}