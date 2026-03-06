/**
 * WEHRSELECTOR: COMMAND UPLINK V4.7
 * CORE COORDINATOR: DATA, SEARCH, & STATE
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

// --- 2. GLOBAL STATE ---
window.db = [];
window.viewHistory = ['superfactions'];
window.currentSelection = { superFaction: null, faction: null, subfaction: null, unitId: null };

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
    UI.content.classList.remove('slide-in');
    void UI.content.offsetWidth; 
    UI.content.classList.add('slide-in');
    
    if (UI.backBtn) UI.backBtn.classList.toggle('hidden', view === 'superfactions');
    
    if (viewHistory[viewHistory.length - 1] !== view) {
        viewHistory.push(view);
        history.pushState({view, selection: {...currentSelection}}, "");
    }
    
    if (window.renderBreadcrumbs) window.renderBreadcrumbs(view);
};

window.goBack = () => {
    if (viewHistory.length <= 1) return;
    viewHistory.pop();
    const prev = viewHistory[viewHistory.length - 1];
    
    if (prev === 'superfactions') renderHome();
    else if (prev === 'factions') renderFactions(currentSelection.superFaction);
    else if (prev === 'subfactions') renderSubfactions(currentSelection.faction);
    else if (prev === 'units') renderUnitList(currentSelection.faction, currentSelection.subfaction);
    else if (prev === 'card') window.renderCard(currentSelection.unitId);
    else if (prev === 'roster') window.renderRoster();
};

// --- 4. CORE NAVIGATION RENDERERS ---

const renderHome = () => {
    currentSelection = { superFaction: null, faction: null, subfaction: null, unitId: null };
    setTheme(null);
    updateView('superfactions');
    const sfLogos = { "Imperium": "IMPERIUM.svg", "Chaos": "CHAOS.svg", "Xenos": "XENOS.svg" };
    
    UI.content.innerHTML = `
        <div class="list-menu vertical">
            ${Object.keys(superFactions).map(sf => `
                <div class="menu-card zoom-effect" onclick="selectSuperFaction('${sf}')">
                    <div class="sf-icon-container">
                        <img src="assets/logos/${sfLogos[sf]}" class="sf-large-logo" style="filter: brightness(0) invert(1);">
                    </div>
                    <h2>${sf}</h2>
                    <p>SYSTEM_OVERRIDE: ${superFactions[sf].length} ACTIVE_NODES</p>
                </div>
            `).join('')}
        </div>`;
};

window.selectSuperFaction = (sf) => renderFactions(sf);

const renderFactions = (sf) => {
    currentSelection.superFaction = sf;
    setTheme(null);
    updateView('factions');
    
    UI.content.innerHTML = `
        <div class="list-menu vertical">
            ${superFactions[sf].map(f => `
                <div class="menu-card zoom-effect" 
                     style="border-left: 4px solid ${factionColors[f] || 'var(--border-ui)'}" 
                     onclick="selectFaction('${f}')">
                    <div class="faction-row" style="display: flex; align-items: center; gap: 15px;">
                        <img src="assets/logos/${factionLogos[f] || 'generic.svg'}" 
                             class="faction-logo" 
                             style="width:40px; filter: brightness(0) invert(1);">
                        <h2>${f}</h2>
                    </div>
                </div>
            `).join('')}
        </div>`;
};

window.selectFaction = (f) => renderSubfactions(f);

const renderSubfactions = (f) => {
    currentSelection.faction = f;
    setTheme(factionColors[f]);
    updateView('subfactions');
    
    const subs = [...new Set(db.filter(u => u.faction === f).map(u => u.subfaction))];
    
    UI.content.innerHTML = `
        <div class="list-menu vertical">
            ${subs.map(s => `
                <div class="menu-card zoom-effect" onclick="renderUnitList('${f}', '${s}')">
                    <h2>${s || 'GENERAL_UNITS'}</h2>
                </div>
            `).join('')}
        </div>`;
};

window.renderUnitList = (f, s) => {
    currentSelection.subfaction = s;
    updateView('units');
    const units = db.filter(u => u.faction === f && u.subfaction === s).sort((a,b) => a.name.localeCompare(b.name));
    
    const roles = ["ALL", "CHARACTER", "BATTLELINE", "VEHICLE", "INFANTRY"];
    
    UI.content.innerHTML = `
        <div class="filter-scroller" style="display:flex; overflow-x:auto; gap:8px; margin-bottom:15px;">
            ${roles.map(r => `<button class="filter-chip" onclick="filterList('${r}', this)">${r}</button>`).join('')}
        </div>
        <ul class="list-menu vertical">
            ${units.map(u => {
                const isAdded = window.roster.some(item => item.unitId === u.id);
                return `
                <li class="menu-card unit-list-item" data-id="${u.id}" onclick="window.selectUnit('${u.id}')">
                    <div style="flex-grow:1;"><h2>${u.name}</h2></div>
                    <button class="add-unit-btn ${isAdded ? 'added' : ''}" 
                            onclick="event.stopPropagation(); window.toggleRoster('${u.id}', event)">
                        ADD
                    </button>
                </li>`;
            }).join('')}
        </ul>`;
};

window.filterList = (keyword, btn) => {
    document.querySelectorAll('.filter-chip').forEach(c => {
        c.style.borderColor = 'var(--border-ui)';
        c.style.color = 'var(--text-dim)';
    });
    btn.style.borderColor = 'var(--faction-accent)';
    btn.style.color = 'var(--faction-accent)';
    
    document.querySelectorAll('.unit-list-item').forEach(item => {
        const u = db.find(unit => unit.id === item.getAttribute('data-id'));
        const matches = keyword === 'ALL' || (u.keywords && u.keywords.includes(keyword));
        item.style.display = matches ? 'flex' : 'none';
    });
};

// --- 5. SEARCH & UI ACTIONS ---

UI.searchBar.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    if (!q) { UI.suggestions.classList.add('hidden'); return; }
    const matches = db.filter(u => u.name.toLowerCase().includes(q)).slice(0, 6);
    UI.suggestions.classList.toggle('hidden', matches.length === 0);
    UI.suggestions.innerHTML = matches.map(m => {
        const isAdded = window.roster.some(item => item.unitId === m.id);
        return `
        <div class="suggestion-item" onclick="window.selectUnit('${m.id}')">
            <div style="display:flex; flex-direction:column;">
                <span>${m.name}</span>
                <span style="font-size:0.5rem; color:var(--text-dim);">${m.faction}</span>
            </div>
            <button class="add-unit-btn small ${isAdded ? 'added' : ''}" 
                    onclick="event.stopPropagation(); window.toggleRoster('${m.id}', event)">
                +
            </button>
        </div>`;
    }).join('');
});

window.selectUnit = (id) => { 
    currentSelection.unitId = id; 
    UI.suggestions.classList.add('hidden'); 
    UI.searchBar.value = ""; 
    window.renderCard(id); 
};

window.goHome = () => renderHome();

// --- 6. INITIALIZATION ---

fetch('wehrselector_data.json')
    .then(res => res.json())
    .then(data => { 
        window.db = data; 
        if (window.loadFromDisk) window.loadFromDisk(); 
        if (window.renderTacticalNav) window.renderTacticalNav(); 
        renderHome(); 
    });

UI.backBtn.addEventListener('click', goBack);
UI.rosterBtn.addEventListener('click', () => { if(window.renderRoster) window.renderRoster(); });
window.onpopstate = (e) => { if (e.state) { currentSelection = e.state.selection; viewHistory.pop(); goBack(); } };