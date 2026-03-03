// --- STATE ---
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
const searchInput = document.getElementById('search-bar');

// --- NAVIGATION LOGIC ---

const renderBreadcrumbs = () => {
    breadcrumbsDiv.innerHTML = '';
    breadcrumbsDiv.classList.toggle('hidden', !currentSelection.superFaction);
    
    const parts = [
        { name: 'HOME', action: () => renderHome() },
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
            sep.textContent = ' › ';
            sep.style.color = 'var(--text-dim)';
            breadcrumbsDiv.appendChild(sep);
        }
    });
};

const renderCard = (id) => {
    const u = db.find(unit => unit.id === id);
    if (!unitWounds[id]) unitWounds[id] = u.w;

    contentDiv.innerHTML = `
        <div class="unit-card">
            <div class="unit-header">
                <span class="unit-name">${u.name}</span>
                <span class="invuln-badge">${u.invuln ? u.invuln + '++' : 'NO SV+'}</span>
            </div>

            <div class="stat-bar">
                <div class="stat-item"><span class="stat-label">M</span><span class="stat-value">${u.m}</span></div>
                <div class="stat-item"><span class="stat-label">T</span><span class="stat-value">${u.t}</span></div>
                <div class="stat-item"><span class="stat-label">SV</span><span class="stat-value">${u.sv}</span></div>
                <div class="stat-item"><span class="stat-label">W</span><span class="stat-value">${u.w}</span></div>
                <div class="stat-item"><span class="stat-label">LD</span><span class="stat-value">${u.ld}</span></div>
                <div class="stat-item"><span class="stat-label">OC</span><span class="stat-value">${u.oc}</span></div>
            </div>

            <div class="weapon-section">
                <div class="weapon-row header">
                    <span>Weapon</span><span>R</span><span>A</span><span>BS</span><span>S</span><span>D</span>
                </div>
                ${u.weapons.map(w => `
                    <div class="weapon-row">
                        <span style="color:var(--text-high); font-weight:700">${w.name}</span>
                        <span>${w.range}</span>
                        <span>${w.a}</span>
                        <span>${w.ws_bs}+</span>
                        <span>${w.s}</span>
                        <span>${w.d}</span>
                    </div>
                `).join('')}
            </div>

            <div class="wound-tracker">
                <button class="counter-btn" onclick="changeW('${id}', -1)">−</button>
                <div class="hp-display">
                    <div class="hp-current">${unitWounds[id]}</div>
                    <div class="hp-total">/ ${u.w} WOUNDS</div>
                </div>
                <button class="counter-btn" onclick="changeW('${id}', 1)">+</button>
            </div>
        </div>
    `;
};

const renderHome = () => {
    currentSelection = { superFaction: null, faction: null, subfaction: null };
    renderBreadcrumbs();
    document.documentElement.style.setProperty('--faction-accent', 'var(--accent-safety)');
    
    contentDiv.innerHTML = Object.keys(superFactions).map(sf => `
        <div class="menu-card" onclick="renderFactions('${sf}')">
            <h2>${sf}</h2>
            <p>${superFactions[sf].length} Factions Available</p>
        </div>
    `).join('');
};

const renderFactions = (sf) => {
    currentSelection.superFaction = sf;
    currentSelection.faction = null;
    renderBreadcrumbs();
    
    contentDiv.innerHTML = superFactions[sf].map(f => `
        <div class="menu-card" style="border-left: 4px solid ${factionColors[f] || '#ccc'}" onclick="renderSubfactions('${f}')">
            <h2>${f}</h2>
        </div>
    `).join('');
};

const renderSubfactions = (f) => {
    currentSelection.faction = f;
    const color = factionColors[f] || "#ffb400";
    document.documentElement.style.setProperty('--faction-accent', color);
    renderBreadcrumbs();

    const subs = [...new Set(db.filter(u => u.faction === f).map(u => u.subfaction))];
    contentDiv.innerHTML = subs.map(s => `
        <div class="menu-card" onclick="renderUnitList('${f}', '${s}')">
            <h2>${s || 'General Units'}</h2>
        </div>
    `).join('');
};

const renderUnitList = (f, s) => {
    const units = db.filter(u => u.faction === f && u.subfaction === s);
    contentDiv.innerHTML = units.map(u => `
        <div class="unit-card">
            <div class="unit-header">
                <h3>${u.name}</h3>
                <span class="invuln-badge">${u.invuln ? u.invuln + '++' : 'No Sv+'}</span>
            </div>
            
            <div class="stat-bar">
                <div class="stat-item"><span class="stat-label">M</span><span class="stat-value">${u.m}</span></div>
                <div class="stat-item"><span class="stat-label">T</span><span class="stat-value">${u.t}</span></div>
                <div class="stat-item"><span class="stat-label">SV</span><span class="stat-value">${u.sv}</span></div>
                <div class="stat-item"><span class="stat-label">W</span><span class="stat-value">${u.w}</span></div>
                <div class="stat-item"><span class="stat-label">LD</span><span class="stat-value">${u.ld}</span></div>
                <div class="stat-item"><span class="stat-label">OC</span><span class="stat-value">${u.oc}</span></div>
            </div>

            <div class="tab-container">
                <button class="tab-button active">WEAPONS</button>
                <button class="tab-button">ABILITIES</button>
            </div>

            <div class="wound-tracker">
                <button onclick="updateWounds('${u.id}', -1)">-</button>
                <span>HP: ${unitWounds[u.id] || u.w} / ${u.w}</span>
                <button onclick="updateWounds('${u.id}', 1)">+</button>
            </div>
        </div>
    `).join('');
};

window.updateWounds = (id, amt) => {
    const unit = db.find(u => u.id === id);
    if (!unitWounds[id]) unitWounds[id] = unit.w;
    unitWounds[id] = Math.max(0, Math.min(unit.w, unitWounds[id] + amt));
    renderUnitList(currentSelection.faction, unit.subfaction);
};

// --- INIT ---
fetch('wehrselector_data.json')
    .then(res => res.json())
    .then(data => {
        db = data;
        renderHome();
    });