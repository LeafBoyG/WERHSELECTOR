/**
 * WEHRSELECTOR: COMMAND UPLINK V4.9
 * CORE COORDINATOR: MULTI-TEAM DATA, SEARCH, & STATE
 */

// --- 1. CONFIGURATION & STATIC DATA ---
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

// Explicit Global Declaration to stop SyntaxErrors
window.teamAccents = {
    1: "#ffb400", // Team 1: Amber
    2: "#00ff00", // Team 2: Toxic Green
    3: "#00e5ff"  // Team 3: Pulse Blue
};

// --- 2. GLOBAL STATE ---
window.db = [];
window.viewHistory = ['superfactions'];
window.currentSelection = { superFaction: null, faction: null, subfaction: null, unitId: null };
window.currentTeamContext = 1;

const UI = {
    content: document.getElementById('app-content'),
    backBtn: document.getElementById('back-btn'),
    breadcrumbs: document.getElementById('breadcrumbs'),
    searchBar: document.getElementById('search-bar'),
    suggestions: document.getElementById('search-suggestions'),
    rosterBtn: document.getElementById('roster-toggle')
};

// --- 3. VIEW & THEME COORDINATION ---

window.setTheme = (color) => {
    document.documentElement.style.setProperty('--faction-accent', color || 'var(--accent-amber)');
};

window.updateView = (view) => {
    if (!UI.content) return;
    UI.content.classList.remove('slide-in');
    void UI.content.offsetWidth; 
    UI.content.classList.add('slide-in');
    
    if (UI.backBtn) UI.backBtn.classList.toggle('hidden', view === 'superfactions');
    
    if (window.viewHistory[window.viewHistory.length - 1] !== view) {
        window.viewHistory.push(view);
        history.pushState({view, selection: {...window.currentSelection}}, "");
    }
    
    if (window.renderBreadcrumbs) window.renderBreadcrumbs(view);
};

window.goBack = () => {
    if (window.viewHistory.length <= 1) return;
    window.viewHistory.pop();
    const prev = window.viewHistory[window.viewHistory.length - 1];
    
    if (prev === 'superfactions') window.renderHome();
    else if (prev === 'factions') window.renderFactions(window.currentSelection.superFaction);
    else if (prev === 'subfactions') window.renderSubfactions(window.currentSelection.faction);
    else if (prev === 'units') window.renderUnitList(window.currentSelection.faction, window.currentSelection.subfaction);
    else if (prev === 'card') window.renderCard(window.currentSelection.unitId);
    else if (prev === 'roster') window.renderRoster();
};

// --- 4. CORE NAVIGATION RENDERERS ---

window.renderHome = () => {
    window.currentSelection = { superFaction: null, faction: null, subfaction: null, unitId: null };
    window.setTheme(null);
    window.updateView('superfactions');
    const sfLogos = { "Imperium": "IMPERIUM.svg", "Chaos": "CHAOS.svg", "Xenos": "XENOS.svg" };
    
    UI.content.innerHTML = `
        <div class="list-menu vertical">
            ${Object.keys(superFactions).map(sf => `
                <div class="menu-card zoom-effect" onclick="window.selectSuperFaction('${sf}')">
                    <div class="sf-icon-container">
                        <img src="assets/logos/${sfLogos[sf]}" class="sf-large-logo" style="filter: brightness(0) invert(1);">
                    </div>
                    <h2>${sf}</h2>
                    <p>ALLIANCE_STATUS: ${superFactions[sf].length} ACTIVE_NODES</p>
                </div>
            `).join('')}
        </div>`;
};

window.selectSuperFaction = (sf) => window.renderFactions(sf);

window.renderFactions = (sf) => {
    window.currentSelection.superFaction = sf;
    window.setTheme(null);
    window.updateView('factions');
    
    UI.content.innerHTML = `
        <div class="list-menu vertical">
            ${superFactions[sf].map(f => `
                <div class="menu-card zoom-effect" 
                     style="border-left: 4px solid ${factionColors[f] || 'var(--border-ui)'}" 
                     onclick="window.selectFaction('${f}')">
                    <div class="faction-row" style="display: flex; align-items: center; gap: 15px;">
                        <img src="assets/logos/${factionLogos[f] || 'generic.svg'}" 
                             class="faction-logo" style="width:40px; filter: brightness(0) invert(1);">
                        <h2>${f}</h2>
                    </div>
                </div>
            `).join('')}
        </div>`;
};

window.selectFaction = (f) => window.renderSubfactions(f);

window.renderSubfactions = (f) => {
    window.currentSelection.faction = f;
    window.setTheme(factionColors[f]);
    window.updateView('subfactions');
    
    const subs = [...new Set(window.db.filter(u => u.faction === f).map(u => u.subfaction))];
    
    UI.content.innerHTML = `
        <div class="list-menu vertical">
            ${subs.map(s => `
                <div class="menu-card zoom-effect" onclick="window.renderUnitList('${f}', '${s}')">
                    <h2>${s || 'GENERAL_UNITS'}</h2>
                </div>
            `).join('')}
        </div>`;
};

window.renderUnitList = (f, s) => {
    window.currentSelection.subfaction = s;
    window.setTheme(window.teamAccents[window.currentTeamContext]);
    window.updateView('units');
    
    const units = window.db.filter(u => u.faction === f && u.subfaction === s).sort((a,b) => a.name.localeCompare(b.name));
    const roles = ["ALL", "CHARACTER", "BATTLELINE", "VEHICLE", "INFANTRY"];
    
    UI.content.innerHTML = `
        <div class="team-context-bar" style="display:flex; justify-content:center; gap:10px; margin-bottom:15px; background: rgba(0,0,0,0.3); padding: 10px; border: 1px solid rgba(255,255,255,0.05);">
            ${[1, 2, 3].map(t => `
                <button onclick="window.currentTeamContext = ${t}; window.renderUnitList('${f}','${s}')" 
                    style="background:${window.currentTeamContext === t ? window.teamAccents[t] : '#000'}; 
                           color:${window.currentTeamContext === t ? '#000' : 'var(--text-dim)'}; 
                           border:1px solid ${window.teamAccents[t]}; padding:6px 12px; font-size:0.6rem; font-weight:900; cursor:pointer;">
                    TEAM_${t}
                </button>
            `).join('')}
        </div>
        <div class="filter-scroller" style="display:flex; overflow-x:auto; gap:8px; margin-bottom:15px;">
            ${roles.map(r => `<button class="filter-chip" onclick="window.filterList('${r}', this)">${r}</button>`).join('')}
        </div>
        <ul class="list-menu vertical">
            ${units.map(u => {
                const isAdded = window.roster.some(item => item.unitId === u.id);
                return `
                <li class="menu-card unit-list-item" data-id="${u.id}" onclick="window.selectUnit('${u.id}')">
                    <div style="flex-grow:1;"><h2>${u.name}</h2></div>
                    <button class="add-unit-btn ${isAdded ? 'added' : ''}" 
                            style="border-color: ${window.teamAccents[window.currentTeamContext]}"
                            onclick="event.stopPropagation(); window.toggleRoster('${u.id}', event)">
                        ADD
                    </button>
                </li>`;
            }).join('')}
        </ul>`;
};

window.filterList = (keyword, btn) => {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    
    document.querySelectorAll('.unit-list-item').forEach(item => {
        const u = window.db.find(unit => unit.id === item.getAttribute('data-id'));
        const matches = keyword === 'ALL' || (u.keywords && u.keywords.includes(keyword));
        item.style.display = matches ? 'flex' : 'none';
    });
};

// --- 5. SEARCH & UI ACTIONS ---

UI.searchBar.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    if (!q) { UI.suggestions.classList.add('hidden'); return; }
    const matches = window.db.filter(u => u.name.toLowerCase().includes(q)).slice(0, 6);
    UI.suggestions.classList.toggle('hidden', matches.length === 0);
    UI.suggestions.innerHTML = matches.map(m => {
        const isAdded = window.roster.some(item => item.unitId === m.id);
        return `
        <div class="suggestion-item" onclick="window.selectUnit('${m.id}')">
            <div style="display:flex; flex-direction:column;">
                <span style="color: #fff; font-weight: 800;">${m.name}</span>
                <span style="font-size:0.5rem; color:var(--text-dim);">${m.faction.toUpperCase()}</span>
            </div>
            <button class="add-unit-btn small ${isAdded ? 'added' : ''}" 
                    onclick="event.stopPropagation(); window.toggleRoster('${m.id}', event)">
                +
            </button>
        </div>`;
    }).join('');
});

window.selectUnit = (id) => { 
    window.currentSelection.unitId = id; 
    UI.suggestions.classList.add('hidden'); 
    UI.searchBar.value = ""; 
    window.renderCard(id); 
};

window.goHome = () => window.renderHome();

// --- 6. INITIALIZATION ---

fetch('wehrselector_data.json')
    .then(res => res.json())
    .then(data => { 
        window.db = data; 
        if (window.loadFromDisk) window.loadFromDisk(); 
        if (window.renderTacticalNav) window.renderTacticalNav(); 
        window.renderHome(); 
    })
    .catch(err => console.error("DATABASE_LINK_FAILURE:", err));

UI.backBtn.addEventListener('click', window.goBack);
UI.rosterBtn.addEventListener('click', () => { if(window.renderRoster) window.renderRoster(); });

window.onpopstate = (e) => { 
    if (e.state) { 
        window.currentSelection = e.state.selection; 
        window.viewHistory.pop(); 
        window.goBack(); 
    } 
};