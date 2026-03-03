// --- ARK RAIDER COMMAND SCRIPT ---
let db = [];
let viewHistory = ['superfactions'];
let currentSelection = { superFaction: null, faction: null, subfaction: null };
let roster = [];
let unitWounds = {};

// --- DATA MAPPING ---
const factionColors = {
    "Adepta Sororitas": "#f2f2f2", "Adeptus Custodes": "#e5c100", "Adeptus Mechanicus": "#ff4422",
    "Astra Militarum": "#4e5d4a", "Chaos Daemons": "#ff00ff", "Chaos Space Marines": "#ff8800",
    "Death Guard": "#889966", "Necrons": "#00ff00", "Orks": "#228822", 
    "Space Marines": "#0077ff", "T’au Empire": "#ffcc33", "Tyranids": "#aa00ff", "World Eaters": "#ff0000"
};

const superFactions = {
    "Imperium": ["Adepta Sororitas", "Adeptus Custodes", "Adeptus Mechanicus", "Astra Militarum", "Space Marines"],
    "Chaos": ["Chaos Daemons", "Chaos Space Marines", "Death Guard", "World Eaters"],
    "Xenos": ["Aeldari", "Necrons", "Orks", "T’au Empire", "Tyranids"]
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

// --- DOM ELEMENTS ---
const contentDiv = document.getElementById('app-content');
const breadcrumbsDiv = document.getElementById('breadcrumbs');
const backBtn = document.getElementById('back-btn');

// --- THEME & UI HELPERS ---
const setTheme = (color) => {
    document.documentElement.style.setProperty('--faction-accent', color || 'var(--accent-safety)');
    document.documentElement.style.setProperty('--faction-glow', (color || '#ffb400') + '26');
};

const resetTheme = () => {
    document.documentElement.style.setProperty('--faction-accent', "var(--accent-safety)");
    document.documentElement.style.setProperty('--faction-glow', "rgba(255, 180, 0, 0.1)");
};

const updateUI = (view, unitId = null) => {
    if (!breadcrumbsDiv) return;
    renderBreadcrumbs(view, unitId);
    
    // Toggle visibility of Back Button
    if (backBtn) {
        backBtn.classList.toggle('hidden', view === 'superfactions');
    }
};

const renderBreadcrumbs = (view, unitId) => {
    breadcrumbsDiv.innerHTML = '';
    breadcrumbsDiv.classList.toggle('hidden', view === 'superfactions');
    
    let crumbs = [{ name: 'CMD', action: () => goHome() }];
    
    if (view === 'factions') crumbs.push({ name: currentSelection.superFaction });
    else if (view === 'subfactions') {
        crumbs.push({ name: currentSelection.superFaction, action: () => renderFactions(currentSelection.superFaction) });
        crumbs.push({ name: currentSelection.faction });
    } else if (view === 'units') {
        crumbs.push({ name: currentSelection.faction, action: () => renderSubfactions(currentSelection.faction) });
        crumbs.push({ name: currentSelection.subfaction });
    } else if (view === 'card') {
        const u = db.find(unit => unit.id === unitId);
        crumbs.push({ name: currentSelection.subfaction, action: () => renderUnitList(currentSelection.faction, currentSelection.subfaction) });
        crumbs.push({ name: u ? u.name : 'DATA' });
    }

    crumbs.forEach((p, i) => {
        const span = document.createElement('span');
        span.textContent = p.name ? p.name.toUpperCase() : '';
        span.className = "breadcrumb-item" + (i === crumbs.length - 1 ? " active" : "");
        if (p.action && i !== crumbs.length - 1) span.onclick = p.action;
        breadcrumbsDiv.appendChild(span);
        if (i < crumbs.length - 1) {
            const sep = document.createElement('span');
            sep.textContent = ' // ';
            sep.style.color = 'var(--text-dim)';
            breadcrumbsDiv.appendChild(sep);
        }
    });
};

// --- RENDER FUNCTIONS ---
const renderHome = () => {
    currentSelection = { superFaction: null, faction: null, subfaction: null };
    viewHistory = ['superfactions'];
    resetTheme();
    updateUI('superfactions');
    contentDiv.innerHTML = Object.keys(superFactions).map(sf => `
        <div class="menu-card" onclick="selectSuperFaction('${sf}')">
            <h2>${sf}</h2>
            <p>SYSTEM_OVERRIDE: ${superFactions[sf].length} ACTIVE_NODES</p>
        </div>`).join('');
};

const renderFactions = (sf) => {
    currentSelection.superFaction = sf;
    updateUI('factions');
    resetTheme();
    contentDiv.innerHTML = superFactions[sf].map(f => {
        const logo = factionLogos[f] || 'generic.svg'; 
        return `
            <div class="menu-card" style="border-left: 4px solid ${factionColors[f] || '#ccc'}" onclick="selectFaction('${f}')">
                <div class="faction-row" style="display: flex; align-items: center; gap: 15px;">
                    <img src="assets/logos/${logo}" class="faction-logo" style="filter: brightness(0) invert(1);" alt="${f}">
                    <h2>${f}</h2>
                </div>
            </div>`;
    }).join('');
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
        units.map(u => `
            <li class="menu-card" onclick="selectUnit('${u.id}')">
                <div class="faction-row">
                    <h2 style="font-size: 0.9rem;">${u.name}</h2>
                    <p style="font-size: 0.55rem; color: var(--text-dim);">STATUS: ACTIVE // READY_FOR_INTEL</p>
                </div>
            </li>`).join('') + `</ul>`;
};

const renderCard = (unitId) => {
    const unit = db.find(u => u.id === unitId);
    if (!unit) return;
    setTheme(unit.faction);
    updateUI('card', unitId);
    
    if (unitWounds[unit.id] === undefined) unitWounds[unit.id] = parseInt(unit.w);
    const logo = factionLogos[unit.faction] || 'generic.svg';

    contentDiv.innerHTML = `
        <div class="unit-card">
            <div class="unit-header">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="assets/logos/${logo}" class="faction-logo" style="width: 24px; height: 24px; filter: brightness(0) invert(1);">
                    <span class="unit-name">${unit.name}</span>
                </div>
                <span class="invuln-badge">${unit.invuln ? unit.invuln + '++' : 'NO_INV'}</span>
            </div>

            <div class="stat-bar">
                <div class="stat-item"><span class="stat-label">M</span><span class="stat-val">${unit.m}</span></div>
                <div class="stat-item"><span class="stat-label">T</span><span class="stat-val">${unit.t}</span></div>
                <div class="stat-item"><span class="stat-label">SV</span><span class="stat-val">${unit.sv}</span></div>
                <div class="stat-item"><span class="stat-label">W</span><span class="stat-val">${unit.w}</span></div>
                <div class="stat-item"><span class="stat-label">LD</span><span class="stat-val">${unit.ld}</span></div>
                <div class="stat-item"><span class="stat-label">OC</span><span class="stat-val">${unit.oc}</span></div>
            </div>

            <div class="tab-bar" style="display:flex; background:#000; border-bottom:1px solid var(--border-ui);">
                <button class="tab-btn active" onclick="switchTab('weapons', this)" style="flex:1; background:transparent; border:none; color:var(--faction-accent); border-bottom:2px solid var(--faction-accent); padding:10px; font-family:inherit; font-size:0.7rem; font-weight:800;">ARMAMENT</button>
                <button class="tab-btn" onclick="switchTab('abilities', this)" style="flex:1; background:transparent; border:none; color:var(--text-dim); padding:10px; font-family:inherit; font-size:0.7rem; font-weight:800;">INTEL</button>
            </div>

            <div id="tab-weapons" class="tab-content">
                <div class="weapon-row header" style="display:grid; grid-template-columns:2.2fr repeat(5,1fr); background:#0a0c0e; color:var(--faction-accent); padding:10px; font-size:0.6rem; font-weight:800; text-align:center;">
                    <span>WEAPON</span><span>R</span><span>A</span><span>BS</span><span>S</span><span>D</span>
                </div>
                ${unit.weapons.map(w => `
                    <div style="border-bottom: 1px solid rgba(255,255,255,0.05); padding: 8px 0;">
                        <div style="display:grid; grid-template-columns:2.2fr repeat(5,1fr); font-size:0.65rem; text-align:center; padding: 4px 0;">
                            <span style="font-weight:800; color:var(--text-high); text-align:left; padding-left:10px;">${w.name}</span>
                            <span>${w.range}</span><span>${w.a}</span><span>${w.ws_bs}+</span><span>${w.s}</span><span>${w.d}</span>
                        </div>
                        ${w.keywords ? `<div style="font-size:0.55rem; color:var(--faction-accent); padding-left:10px; font-style:italic;">// ${Array.isArray(w.keywords) ? w.keywords.join(' // ') : w.keywords}</div>` : ''}
                    </div>`).join('')}
            </div>

            <div id="tab-abilities" class="tab-content hidden" style="padding:15px; font-size:0.75rem;">
                <div style="font-size:0.6rem; color:var(--text-dim); margin-bottom:10px; letter-spacing:1px;">KEYWORDS: ${Array.isArray(unit.keywords) ? unit.keywords.join(' // ') : unit.keywords}</div>
                ${unit.abilities ? unit.abilities.map(a => `
                    <div style="margin-bottom:10px; padding:8px; background:rgba(0,0,0,0.3); border:1px solid var(--border-ui);">
                        <div style="color:var(--faction-accent); font-weight:800; font-size:0.7rem;">${a.name}</div>
                        <div style="font-size:0.65rem; color:var(--text-secondary); line-height:1.4;">${a.text}</div>
                    </div>`).join('') : ''}
            </div>

            <div class="wound-tracker" style="display:grid; grid-template-columns:1fr 2fr 1fr; align-items:center; background:#000; padding:10px; border-top:1px solid var(--border-ui);">
                <button class="counter-btn" style="background:var(--bg-elevated); border:none; color:var(--faction-accent); height:40px; font-size:1.2rem; cursor:pointer;" onclick="updateWounds('${unit.id}', -1)">−</button>
                <div style="text-align:center;">
                    <span id="wound-display-text" style="font-size:1.2rem; font-weight:800; color:var(--accent-hazard);">${unitWounds[unit.id]}</span>
                    <span style="font-size:0.6rem; color:var(--text-dim);">/ ${unit.w} HP</span>
                </div>
                <button class="counter-btn" style="background:var(--bg-elevated); border:none; color:var(--faction-accent); height:40px; font-size:1.2rem; cursor:pointer;" onclick="updateWounds('${unit.id}', 1)">+</button>
            </div>
        </div>`;
};

// --- INTERACTION HANDLERS ---
window.goHome = () => renderHome();
window.selectSuperFaction = (sf) => { viewHistory.push('factions'); renderFactions(sf); };
window.selectFaction = (f) => { viewHistory.push('subfactions'); renderSubfactions(f); };
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
    unitWounds[id] = Math.max(0, Math.min(parseInt(unit.w), (unitWounds[id] || parseInt(unit.w)) + amt));
    const txt = document.getElementById('wound-display-text');
    if (txt) txt.innerText = unitWounds[id];
};

if (backBtn) {
    backBtn.addEventListener('click', () => {
        viewHistory.pop();
        const prev = viewHistory[viewHistory.length - 1];
        if (prev === 'superfactions') renderHome();
        else if (prev === 'factions') renderFactions(currentSelection.superFaction);
        else if (prev === 'subfactions') renderSubfactions(currentSelection.faction);
        else if (prev === 'units') renderUnitList(currentSelection.faction, currentSelection.subfaction);
    });
}

// --- INIT ---
fetch('wehrselector_data.json')
    .then(res => res.json())
    .then(data => {
        db = data;
        renderHome();
    });