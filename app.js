// --- ARK RAIDER COMMAND SCRIPT ---
let db = [];
let currentSelection = { superFaction: null, faction: null, subfaction: null };
let unitWounds = {};

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

const contentDiv = document.getElementById('app-content');
const breadcrumbsDiv = document.getElementById('breadcrumbs');

const setTheme = (color) => {
    document.documentElement.style.setProperty('--faction-accent', color || 'var(--accent-amber)');
    document.documentElement.style.setProperty('--faction-glow', (color || '#ffb400') + '26');
};

const renderBreadcrumbs = () => {
    breadcrumbsDiv.innerHTML = '';
    breadcrumbsDiv.classList.toggle('hidden', !currentSelection.superFaction);
    
    const parts = [
        { name: 'CMD', action: () => renderHome() },
        { name: currentSelection.superFaction, action: () => renderFactions(currentSelection.superFaction) },
        { name: currentSelection.faction, action: () => renderSubfactions(currentSelection.faction) }
    ].filter(p => p.name);

    parts.forEach((p, i) => {
        const span = document.createElement('span');
        span.textContent = p.name.toUpperCase();
        span.className = "breadcrumb-item";
        span.onclick = p.action;
        breadcrumbsDiv.appendChild(span);
        if (i < parts.length - 1) {
            const sep = document.createElement('span');
            sep.textContent = ' // ';
            sep.style.color = 'var(--text-dim)';
            breadcrumbsDiv.appendChild(sep);
        }
    });
};

const renderHome = () => {
    currentSelection = { superFaction: null, faction: null, subfaction: null };
    setTheme();
    renderBreadcrumbs();
    contentDiv.innerHTML = Object.keys(superFactions).map(sf => `
        <div class="menu-card" onclick="renderFactions('${sf}')">
            <h2>${sf}</h2>
            <p>SYSTEM_OVERRIDE: ${superFactions[sf].length} ACTIVE_NODES</p>
        </div>
    `).join('');
};

const renderFactions = (sf) => {
    currentSelection.superFaction = sf;
    currentSelection.faction = null;
    setTheme();
    renderBreadcrumbs();
    contentDiv.innerHTML = superFactions[sf].map(f => `
        <div class="menu-card" style="border-left: 4px solid ${factionColors[f] || '#ccc'}" onclick="renderSubfactions('${f}')">
            <h2>${f}</h2>
        </div>
    `).join('');
};

const renderSubfactions = (f) => {
    currentSelection.faction = f;
    setTheme(factionColors[f]);
    renderBreadcrumbs();
    const subs = [...new Set(db.filter(u => u.faction === f).map(u => u.subfaction))];
    contentDiv.innerHTML = subs.map(s => `
        <div class="menu-card" onclick="renderUnitList('${f}', '${s}')">
            <h2>${s || 'GENERAL_UNITS'}</h2>
        </div>
    `).join('');
};

const renderUnitList = (f, s) => {
    const units = db.filter(u => u.faction === f && u.subfaction === s);
    contentDiv.innerHTML = units.map(u => `
        <div class="unit-card">
            <div class="unit-header">
                <span class="unit-name">${u.name}</span>
            </div>
            <div class="stat-bar">
                <div class="stat-item"><span class="stat-label">M</span><span class="stat-val">${u.m}</span></div>
                <div class="stat-item"><span class="stat-label">T</span><span class="stat-val">${u.t}</span></div>
                <div class="stat-item"><span class="stat-label">SV</span><span class="stat-val">${u.sv}</span></div>
                <div class="stat-item"><span class="stat-label">W</span><span class="stat-val">${u.w}</span></div>
                <div class="stat-item"><span class="stat-label">LD</span><span class="stat-val">${u.ld}</span></div>
                <div class="stat-item"><span class="stat-label">OC</span><span class="stat-val">${u.oc}</span></div>
            </div>
        </div>
    `).join('');
};

fetch('wehrselector_data.json').then(res => res.json()).then(data => {
    db = data;
    renderHome();
});