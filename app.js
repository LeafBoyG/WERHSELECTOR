/**
 * WEHRSELECTOR: COMMAND UPLINK V4.6
 * RESTORED DETAIL + ARMY CREATOR ENGINE
 */

// --- 1. STATE & DATA ---
let db = [];
let viewHistory = ['superfactions'];
let currentSelection = { superFaction: null, faction: null, subfaction: null, unitId: null };
let roster = [];
let unitWounds = {};
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

const UI = {
    content: document.getElementById('app-content'),
    backBtn: document.getElementById('back-btn'),
    breadcrumbs: document.getElementById('breadcrumbs'),
    searchBar: document.getElementById('search-bar'),
    suggestions: document.getElementById('search-suggestions'),
    rosterBtn: document.getElementById('roster-toggle')
};

// --- 2. THEME & NAVIGATION ---
const setTheme = (c) => document.documentElement.style.setProperty('--faction-accent', c || 'var(--accent-amber)');
const resetTheme = () => document.documentElement.style.setProperty('--faction-accent', "var(--accent-amber)");

const updateView = (view) => {
    UI.content.classList.remove('slide-in');
    void UI.content.offsetWidth; 
    UI.content.classList.add('slide-in');
    
    if (UI.backBtn) UI.backBtn.classList.toggle('hidden', view === 'superfactions');
    
    if (viewHistory[viewHistory.length - 1] !== view) {
        viewHistory.push(view);
        history.pushState({view, selection: {...currentSelection}}, "");
    }
};

window.goBack = () => {
    if (viewHistory.length <= 1) return;
    viewHistory.pop();
    const prev = viewHistory[viewHistory.length - 1];
    if (prev === 'superfactions') renderHome();
    else if (prev === 'factions') renderFactions(currentSelection.superFaction);
    else if (prev === 'subfactions') renderSubfactions(currentSelection.faction);
    else if (prev === 'units') renderUnitList(currentSelection.faction, currentSelection.subfaction);
    else if (prev === 'card') renderCard(currentSelection.unitId);
    else if (prev === 'roster') renderRoster();
};

// --- 3. RENDERERS ---
const renderHome = () => {
    currentSelection = { superFaction: null, faction: null, subfaction: null, unitId: null };
    resetTheme();
    updateView('superfactions');
    const sfLogos = { "Imperium": "IMPERIUM.svg", "Chaos": "CHAOS.svg", "Xenos": "XENOS.svg" };
    UI.content.innerHTML = Object.keys(superFactions).map(sf => `
        <div class="menu-card zoom-effect" onclick="selectSuperFaction('${sf}')">
            <div class="sf-icon-container"><img src="assets/logos/${sfLogos[sf]}" class="sf-large-logo"></div>
            <h2>${sf}</h2>
            <p>SYSTEM_OVERRIDE: ${superFactions[sf].length} ACTIVE_NODES</p>
        </div>`).join('');
};

const renderFactions = (sf) => {
    currentSelection.superFaction = sf;
    resetTheme();
    updateView('factions');
    UI.content.innerHTML = superFactions[sf].map(f => `
        <div class="menu-card zoom-effect" style="border-left: 4px solid ${factionColors[f] || 'var(--border-ui)'}" onclick="selectFaction('${f}')">
            <div class="faction-row" style="display: flex; align-items: center; gap: 15px;">
                <img src="assets/logos/${factionLogos[f] || 'generic.svg'}" class="faction-logo" style="width:40px; filter: brightness(0) invert(1);">
                <h2>${f}</h2>
            </div>
        </div>`).join('');
};

const renderSubfactions = (f) => {
    currentSelection.faction = f;
    setTheme(factionColors[f]);
    updateView('subfactions');
    const subs = [...new Set(db.filter(u => u.faction === f).map(u => u.subfaction))];
    UI.content.innerHTML = subs.map(s => `
        <div class="menu-card zoom-effect" onclick="renderUnitList('${f}', '${s}')">
            <h2>${s || 'GENERAL_UNITS'}</h2>
        </div>`).join('');
};

const renderUnitList = (f, s) => {
    currentSelection.subfaction = s;
    updateView('units');
    const units = db.filter(u => u.faction === f && u.subfaction === s).sort((a,b) => a.name.localeCompare(b.name));
    UI.content.innerHTML = `<ul class="list-menu vertical">` + 
        units.map(u => `
            <li class="menu-card unit-list-item" onclick="selectUnit('${u.id}')">
                <div style="flex-grow:1;"><h2>${u.name}</h2></div>
                <button class="add-unit-btn ${roster.includes(u.id) ? 'added' : ''}" 
                        onclick="event.stopPropagation(); toggleRoster('${u.id}')">
                    ${roster.includes(u.id) ? 'REMOVE' : 'ADD'}
                </button>
            </li>`).join('') + `</ul>`;
};

const renderCard = (unitId) => {
    const unit = db.find(u => u.id === unitId);
    if (!unit) return;
    currentSelection.unitId = unitId;
    setTheme(factionColors[unit.faction]);
    updateView('card');

    if (unitWounds[unit.id] === undefined) unitWounds[unit.id] = parseInt(unit.w);

    UI.content.innerHTML = `
        <div class="unit-card">
            <div class="unit-header">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="assets/logos/${factionLogos[unit.faction] || 'generic.svg'}" class="faction-logo" style="width:22px; filter: brightness(0) invert(1);">
                    <span class="unit-name">${unit.name}</span>
                </div>
                <button class="add-unit-btn ${roster.includes(unit.id) ? 'added' : ''}" onclick="toggleRoster('${unit.id}')">
                    ${roster.includes(unit.id) ? '✕ DISENGAGE' : '📌 ENGAGE'}
                </button>
            </div>
            <div style="padding: 0 15px 10px;">
                <button class="action-btn ${warlordId === unit.id ? 'active' : ''}" onclick="setWarlord('${unit.id}')" style="width: 100%; font-size: 0.6rem;">
                    ${warlordId === unit.id ? '★ COMMAND_LINK_ACTIVE' : '☆ DESIGNATE_WARLORD'}
                </button>
            </div>
            <div class="stat-bar">
                <div class="stat-item"><span class="stat-label">M</span><span class="stat-val">${unit.m}</span></div>
                <div class="stat-item"><span class="stat-label">T</span><span class="stat-val">${unit.t}</span></div>
                <div class="stat-item"><span class="stat-label">SV</span><span class="stat-val">${unit.sv}</span></div>
                <div class="stat-item"><span class="stat-label">W</span><span class="stat-val">${unit.w}</span></div>
                <div class="stat-item"><span class="stat-label">LD</span><span class="stat-val">${unit.ld}</span></div>
                <div class="stat-item"><span class="stat-label">OC</span><span class="stat-val">${unit.oc}</span></div>
            </div>
            <div class="tab-bar">
                <button class="tab-btn active" onclick="switchTab('weapons', this)">ARMAMENT</button>
                <button class="tab-btn" onclick="switchTab('abilities', this)">INTEL</button>
            </div>
            <div id="tab-weapons" class="tab-content">
                <div class="weapon-row header"><span>WEAPON</span><span>R</span><span>A</span><span>BS</span><span>S</span><span>AP</span><span>D</span></div>
                ${unit.weapons.map(w => `
                    <div class="weapon-card-tactical">
                        <div class="weapon-row"><span>${w.name}</span><span>${w.range}</span><span>${w.a}</span><span>${w.ws_bs}+</span><span>${w.s}</span><span>${w.ap}</span><span>${w.d}</span></div>
                        ${w.keywords ? `<div class="weapon-keywords">// ${w.keywords}</div>` : ''}
                    </div>`).join('')}
            </div>
            <div id="tab-abilities" class="tab-content hidden">
                ${unit.abilities.map(a => `<div class="ability-card"><div class="ability-name">${a.name}</div><div class="ability-text">${a.text}</div></div>`).join('')}
            </div>
            <div class="wound-tracker">
                <button class="counter-btn" onclick="updateWounds('${unit.id}', -1)">−</button>
                <div class="wound-display"><span id="wound-display-text">${unitWounds[unit.id]}</span><span style="font-size:0.6rem;">/ ${unit.w} HP</span></div>
                <button class="counter-btn" onclick="updateWounds('${unit.id}', 1)">+</button>
            </div>
        </div>`;
};

// --- 4. SEARCH & ROSTER LOGIC ---
UI.searchBar.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    if (!q) { UI.suggestions.classList.add('hidden'); return; }
    const matches = db.filter(u => u.name.toLowerCase().includes(q)).slice(0, 6);
    UI.suggestions.classList.toggle('hidden', matches.length === 0);
    UI.suggestions.innerHTML = matches.map(m => `
        <div class="suggestion-item" onclick="selectUnit('${m.id}')">
            <div style="display:flex; flex-direction:column;"><span>${m.name}</span><span style="font-size:0.5rem; color:var(--text-dim);">${m.faction}</span></div>
            <button class="add-unit-btn small ${roster.includes(m.id) ? 'added' : ''}" 
                    onclick="event.stopPropagation(); toggleRoster('${m.id}')">
                ${roster.includes(m.id) ? '−' : '+'}
            </button>
        </div>`).join('');
});

window.toggleRoster = (id) => {
    const unit = db.find(u => u.id === id);
    if (!unit) return;
    const index = roster.indexOf(id);
    if (index === -1) {
        if (lockedFaction && unit.faction !== lockedFaction) { alert(`LOCKED TO ${lockedFaction.toUpperCase()}`); return; }
        roster.push(id);
        lockedFaction = unit.faction;
    } else {
        roster.splice(index, 1);
        if (roster.length === 0) { lockedFaction = null; warlordId = null; }
    }
    const cur = viewHistory[viewHistory.length - 1];
    if (cur === 'units') renderUnitList(currentSelection.faction, currentSelection.subfaction);
    else if (cur === 'card') renderCard(id);
    else if (cur === 'roster') renderRoster();
    updateRosterBadge();
    saveToDisk();
};

const renderRoster = () => {
    updateView('roster');
    resetTheme();
    UI.content.innerHTML = `<h1 style="color:var(--accent-hazard); margin-bottom:15px;">ACTIVE_BATTLEGROUP</h1>` + 
        roster.map(id => {
            const u = db.find(unit => unit.id === id);
            return `<div class="menu-card" style="display:flex; justify-content:space-between; align-items:center;">
                <div onclick="selectUnit('${u.id}')">
                    <h2 style="font-size:0.9rem;">${u.name}</h2>
                    <p style="font-size:0.5rem; color:var(--faction-accent);">${u.faction}</p>
                </div>
                <button onclick="toggleRoster('${u.id}')" style="background:none; border:none; color:#ef4444; font-size:1.2rem; cursor:pointer;">✕</button>
            </div>`;
        }).join('') + (roster.length > 0 ? `<button class="action-btn danger-btn" onclick="clearRoster()" style="width:100%; margin-top:20px;">TERMINATE_ALL_LINKS</button>` : '');
};

window.clearRoster = () => { if(confirm("DISENGAGE ALL?")) { roster = []; lockedFaction = null; warlordId = null; renderRoster(); updateRosterBadge(); saveToDisk(); } };
window.setWarlord = (id) => { warlordId = id; renderCard(id); saveToDisk(); };
window.selectUnit = (id) => { currentSelection.unitId = id; UI.suggestions.classList.add('hidden'); UI.searchBar.value = ""; renderCard(id); };
window.selectSuperFaction = (sf) => renderFactions(sf);
window.selectFaction = (f) => renderSubfactions(f);
window.goHome = () => renderHome();

window.switchTab = (id, btn) => {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + id).classList.remove('hidden');
    btn.classList.add('active');
};

const updateWounds = (id, amt) => {
    const u = db.find(unit => unit.id === id);
    unitWounds[id] = Math.max(0, Math.min(parseInt(u.w), (unitWounds[id] || parseInt(u.w)) + amt));
    const disp = document.getElementById('wound-display-text');
    if (disp) disp.innerText = unitWounds[id];
    saveToDisk();
};

const saveToDisk = () => localStorage.setItem('arkRaider_session', JSON.stringify({roster, lockedFaction, warlordId, unitWounds}));
const loadFromDisk = () => {
    const s = localStorage.getItem('arkRaider_session');
    if (s) { 
        const d = JSON.parse(s); 
        roster = d.roster || []; 
        lockedFaction = d.lockedFaction || null; 
        warlordId = d.warlordId || null; 
        unitWounds = d.unitWounds || {}; 
        updateRosterBadge(); 
    }
};

const updateRosterBadge = () => { if (UI.rosterBtn) UI.rosterBtn.innerHTML = roster.length > 0 ? `ROSTER [${roster.length}]` : `ROSTER`; };

// --- 5. INITIALIZATION ---
fetch('wehrselector_data.json').then(res => res.json()).then(data => { db = data; loadFromDisk(); renderHome(); });
UI.backBtn.addEventListener('click', goBack);
UI.rosterBtn.addEventListener('click', renderRoster);
window.onpopstate = (e) => { if (e.state) { currentSelection = e.state.selection; viewHistory.pop(); goBack(); } };