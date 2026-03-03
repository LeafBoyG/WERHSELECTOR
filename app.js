// --- 1. STATE & DATA MANAGEMENT ---
let db = [];
let viewHistory = ['superfactions'];
let currentSelection = { superFaction: null, faction: null, subfaction: null };
let roster = [];
let unitWounds = {};

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
    "Adeptus Titanicus": "#556677", "Aeldari": "#00aba9", "Astra Militarum": "#4e5d4a",
    "Chaos Daemons": "#ff00ff", "Chaos Knights": "#440066", "Chaos Space Marines": "#ff8800",
    "Death Guard": "#889966", "Drukhari": "#117766", "Emperor’s Children": "#cc0088",
    "Genestealer Cults": "#663399", "Grey Knights": "#99ccff", "Imperial Agents": "#dddddd",
    "Imperial Knights": "#004488", "Leagues of Votann": "#ffaa00", "Necrons": "#00ff00",
    "Orks": "#228822", "Space Marines": "#0077ff", "T’au Empire": "#ffcc33",
    "Thousand Sons": "#0099cc", "Tyranids": "#aa00ff", "World Eaters": "#ff0000"
};

// --- 2. DOM ELEMENTS ---
const contentDiv = document.getElementById('app-content');
const backBtn = document.getElementById('back-btn');
const breadcrumbsDiv = document.getElementById('breadcrumbs');
const searchBar = document.getElementById('search-bar');
const rosterBtn = document.getElementById('roster-toggle');

// --- 3. INITIALIZATION ---
fetch('wehrselector_data.json')
    .then(res => res.json())
    .then(data => {
        db = data;
        renderSuperFactions();
    });

// --- 4. THEME & UI HELPERS ---
function setTheme(faction) {
    const color = factionColors[faction] || "#ffb400";
    document.documentElement.style.setProperty('--faction-accent', color);
    document.documentElement.style.setProperty('--faction-glow', color + "33");
}

function resetTheme() {
    document.documentElement.style.setProperty('--faction-accent', "#ffb400");
    document.documentElement.style.setProperty('--faction-glow', "rgba(255, 180, 0, 0.1)");
}

function updateUI(view, unitId = null) {
    if (!breadcrumbsDiv) return;

    let crumbs = [`<span class="crumb" onclick="goHome()">CMD</span>`];
    if (view === 'factions') crumbs.push(`<span class="crumb active">${currentSelection.superFaction}</span>`);
    else if (view === 'subfactions') {
        crumbs.push(`<span class="crumb" onclick="selectSuperFaction('${currentSelection.superFaction}')">${currentSelection.superFaction}</span>`);
        crumbs.push(`<span class="crumb active">${currentSelection.faction}</span>`);
    } else if (view === 'units') {
        crumbs.push(`<span class="crumb" onclick="selectFaction('${currentSelection.faction}')">${currentSelection.faction}</span>`);
        crumbs.push(`<span class="crumb active">${currentSelection.subfaction}</span>`);
    } else if (view === 'card') {
        const u = db.find(unit => unit.id === unitId);
        crumbs.push(`<span class="crumb" onclick="renderUnitList('${currentSelection.faction}', '${currentSelection.subfaction}')">${currentSelection.subfaction}</span>`);
        crumbs.push(`<span class="crumb active">${u ? u.name : 'DATA'}</span>`);
    }

    breadcrumbsDiv.innerHTML = crumbs.join(' // ');
    breadcrumbsDiv.className = (view === 'superfactions') ? 'hidden' : '';
    backBtn.className = (view === 'superfactions') ? 'hidden' : '';
}

// --- 5. RENDER FUNCTIONS ---

function renderSuperFactions() {
    updateUI('superfactions');
    resetTheme();
    const sfIcons = { "Imperium": "🦅", "Chaos": "🔥", "Xenos": "👽" };
    contentDiv.innerHTML = `<ul class="list-menu">` + 
        Object.keys(superFactions).map(sf => `
            <li class="menu-card" onclick="selectSuperFaction('${sf}')">
                <span style="font-size: 2rem; margin-bottom: 8px;">${sfIcons[sf]}</span>
                <span class="faction-name-sub">${sf}</span>
            </li>`).join('') + `</ul>`;
}

function renderFactions(superF) {
    updateUI('factions');
    resetTheme();
    contentDiv.innerHTML = `<ul class="list-menu">` + 
        superFactions[superF].map(f => {
            const logo = factionLogos[f] || 'generic.svg';
            return `
            <li class="menu-card" onclick="selectFaction('${f}')">
                <img src="assets/logos/${logo}" class="faction-logo" style="filter: brightness(0) invert(1);">
                <span class="faction-name-sub">${f}</span>
            </li>`;
        }).join('') + `</ul>`;
}

function renderSubfactions(faction) {
    setTheme(faction);
    updateUI('subfactions');
    const subs = [...new Set(db.filter(i => i.faction === faction).map(i => i.subfaction))].sort();
    contentDiv.innerHTML = `<ul class="list-menu vertical">` + 
        subs.map(s => `
            <li class="menu-card" onclick="selectSubfaction('${s}')">
                <h2 style="font-size: 0.9rem;">${s || 'GENERAL_UNITS'}</h2>
            </li>`).join('') + `</ul>`;
}

function renderUnitList(f, s) {
    currentSelection.subfaction = s;
    updateUI('units');
    const units = db.filter(u => u.faction === f && u.subfaction === s).sort((a,b) => a.name.localeCompare(b.name));
    
    contentDiv.innerHTML = `<ul class="list-menu vertical">` + 
        units.map(u => `
            <li class="menu-card" onclick="selectUnit('${u.id}')">
                <div class="faction-row">
                    <h2 style="font-size: 0.85rem;">${u.name}</h2>
                    <p style="font-size: 0.5rem; color: var(--text-dim);">STATUS: ACTIVE // READY_FOR_INTEL</p>
                </div>
            </li>`).join('') + `</ul>`;
}

function renderCard(unitId) {
    const unit = db.find(u => u.id === unitId);
    if (!unit) return;
    setTheme(unit.faction);
    updateUI('card', unitId);
    
    if (unitWounds[unit.id] === undefined) unitWounds[unit.id] = parseInt(unit.w);
    const logo = factionLogos[unit.faction] || 'generic.svg';

    contentDiv.innerHTML = `
        <div class="unit-card">
            <div class="card-header-actions" style="display:flex; justify-content:space-between; padding:10px 15px;">
                <button class="action-btn" style="background:transparent; border:1px solid var(--faction-accent); color:var(--faction-accent); font-size:0.6rem; padding:4px 8px;" onclick="toggleRoster('${unit.id}')">
                    ${roster.includes(unit.id) ? 'DISENGAGE' : 'ENGAGE'}
                </button>
                <div class="wound-tracker" style="display:flex; align-items:center; gap:10px; background:#000; padding:4px 8px; border-radius:4px;">
                    <button class="wound-btn" style="background:transparent; border:none; color:white; font-size:1.2rem;" onclick="updateWounds('${unit.id}', -1)">−</button>
                    <div class="wound-display" style="font-weight:900; color:var(--accent-hazard); font-size:1rem;" id="wound-display-text">${unitWounds[unit.id]} / ${unit.w}</div>
                    <button class="wound-btn" style="background:transparent; border:none; color:white; font-size:1.2rem;" onclick="updateWounds('${unit.id}', 1)">+</button>
                </div>
            </div>

            <div class="unit-header" style="padding:15px; background:#000; border-bottom:1px solid var(--border-ui); display:flex; justify-content:space-between; align-items:center;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="assets/logos/${logo}" class="faction-logo" style="width: 24px; height: 24px; filter: brightness(0) invert(1);">
                    <span class="unit-name" style="font-weight:800; text-transform:uppercase;">${unit.name}</span>
                </div>
                <span class="invuln-badge" style="background:var(--faction-accent); color:black; font-size:0.65rem; padding:2px 6px; font-weight:900;">${unit.invuln ? unit.invuln + '++' : 'NO_INV'}</span>
            </div>

            <div class="stat-bar" style="display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:var(--border-ui);">
                <div class="stat-item" style="background:var(--bg-deep); padding:10px 0; display:flex; flex-direction:column; align-items:center;"><span class="stat-label" style="font-size:0.6rem; color:var(--text-dim);">M</span><span class="stat-val" style="font-size:1.1rem; font-weight:800; color:var(--faction-accent);">${unit.m}</span></div>
                <div class="stat-item" style="background:var(--bg-deep); padding:10px 0; display:flex; flex-direction:column; align-items:center;"><span class="stat-label" style="font-size:0.6rem; color:var(--text-dim);">T</span><span class="stat-val" style="font-size:1.1rem; font-weight:800; color:var(--faction-accent);">${unit.t}</span></div>
                <div class="stat-item" style="background:var(--bg-deep); padding:10px 0; display:flex; flex-direction:column; align-items:center;"><span class="stat-label" style="font-size:0.6rem; color:var(--text-dim);">SV</span><span class="stat-val" style="font-size:1.1rem; font-weight:800; color:var(--faction-accent);">${unit.sv}</span></div>
                <div class="stat-item" style="background:var(--bg-deep); padding:10px 0; display:flex; flex-direction:column; align-items:center;"><span class="stat-label" style="font-size:0.6rem; color:var(--text-dim);">W</span><span class="stat-val" style="font-size:1.1rem; font-weight:800; color:var(--faction-accent);">${unit.w}</span></div>
                <div class="stat-item" style="background:var(--bg-deep); padding:10px 0; display:flex; flex-direction:column; align-items:center;"><span class="stat-label" style="font-size:0.6rem; color:var(--text-dim);">LD</span><span class="stat-val" style="font-size:1.1rem; font-weight:800; color:var(--faction-accent);">${unit.ld}</span></div>
                <div class="stat-item" style="background:var(--bg-deep); padding:10px 0; display:flex; flex-direction:column; align-items:center;"><span class="stat-label" style="font-size:0.6rem; color:var(--text-dim);">OC</span><span class="stat-val" style="font-size:1.1rem; font-weight:800; color:var(--faction-accent);">${unit.oc}</span></div>
            </div>

            <div class="tab-bar" style="display:flex; background:#000; border-bottom:1px solid var(--border-ui);">
                <button class="tab-btn active" style="flex:1; background:transparent; border:none; color:var(--faction-accent); border-bottom:2px solid var(--faction-accent); padding:10px; font-family:inherit; font-size:0.7rem; font-weight:800;" onclick="switchTab('weapons', this)">ARMAMENT</button>
                <button class="tab-btn" style="flex:1; background:transparent; border:none; color:var(--text-dim); padding:10px; font-family:inherit; font-size:0.7rem; font-weight:800;" onclick="switchTab('abilities', this)">INTEL</button>
            </div>

            <div id="tab-weapons" class="tab-content">
                <div class="weapon-row header" style="display:grid; grid-template-columns:2.2fr repeat(5,1fr); background:#0a0c0e; color:var(--faction-accent); padding:10px; font-size:0.6rem; font-weight:800; text-align:center;"><span>WEAPON</span><span>R</span><span>A</span><span>BS</span><span>S</span><span>D</span></div>
                <div style="max-height: 200px; overflow-y: auto;">
                    ${unit.weapons.map(w => `
                        <div style="border-bottom: 1px solid rgba(255,255,255,0.05); padding: 8px 0;">
                            <div style="display:grid; grid-template-columns:2.2fr repeat(5,1fr); font-size:0.65rem; text-align:center; padding: 4px 0;">
                                <span style="font-weight:800; color:var(--text-high); text-align:left; padding-left:10px;">${w.name}</span>
                                <span>${w.range}</span><span>${w.a}</span><span>${w.ws_bs}+</span><span>${w.s}</span><span>${w.d}</span>
                            </div>
                            ${w.keywords.length ? `<div style="font-size:0.55rem; color:var(--faction-accent); padding-left:10px; font-style:italic;">// ${w.keywords.join(' // ')}</div>` : ''}
                        </div>`).join('')}
                </div>
            </div>

            <div id="tab-abilities" class="tab-content hidden" style="padding:15px; font-size:0.75rem;">
                <div style="font-size:0.6rem; color:var(--text-dim); margin-bottom:10px; letter-spacing:1px;">KEYWORDS: ${unit.keywords.join(' // ')}</div>
                ${unit.abilities.map(a => `
                    <div style="margin-bottom:10px; padding:8px; background:rgba(0,0,0,0.3); border:1px solid var(--border-ui);">
                        <div style="color:var(--faction-accent); font-weight:800; font-size:0.7rem;">${a.name}</div>
                        <div style="font-size:0.65rem; color:var(--text-secondary); line-height:1.4;">${a.text}</div>
                    </div>`).join('')}
            </div>
        </div>`;
}

// --- 6. INTERACTION & NAVIGATION ---

window.goHome = () => { viewHistory = ['superfactions']; renderSuperFactions(); };
window.selectSuperFaction = (sf) => { currentSelection.superFaction = sf; viewHistory.push('factions'); renderFactions(sf); };
window.selectFaction = (f) => { currentSelection.faction = f; viewHistory.push('subfactions'); renderSubfactions(f); };
window.selectSubfaction = (s) => { viewHistory.push('units'); renderUnitList(currentSelection.faction, s); };
window.selectUnit = (id) => { viewHistory.push('card'); renderCard(id); };

window.switchTab = (id, btn) => {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('active');
        b.style.color = 'var(--text-dim)';
        b.style.borderBottom = 'none';
    });
    document.getElementById('tab-' + id).classList.remove('hidden');
    btn.classList.add('active');
    btn.style.color = 'var(--faction-accent)';
    btn.style.borderBottom = '2px solid var(--faction-accent)';
};

window.updateWounds = (id, amt) => {
    const unit = db.find(u => u.id === id);
    unitWounds[id] = Math.max(0, Math.min(unit.w, (unitWounds[id] || unit.w) + amt));
    const txt = document.getElementById('wound-display-text');
    if (txt) txt.innerText = `${unitWounds[id]} / ${unit.w}`;
};

window.toggleRoster = (id) => {
    if (roster.includes(id)) roster = roster.filter(i => i !== id);
    else roster.push(id);
    renderCard(id);
};

backBtn.addEventListener('click', () => {
    viewHistory.pop();
    const prev = viewHistory[viewHistory.length - 1];
    if (prev === 'superfactions') renderSuperFactions();
    else if (prev === 'factions') renderFactions(currentSelection.superFaction);
    else if (prev === 'subfactions') renderSubfactions(currentSelection.faction);
    else if (prev === 'units') renderUnitList(currentSelection.faction, currentSelection.subfaction);
});