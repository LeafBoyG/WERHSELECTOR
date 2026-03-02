// --- 1. State Management ---
let db = []; 
let viewHistory = ['factions'];
let currentSelection = { faction: null, subfaction: null };
let roster = [];
let unitWounds = {};

// --- 2. DOM Elements (Static) ---
const contentDiv = document.getElementById('app-content');
const backBtn = document.getElementById('back-btn');
const searchBar = document.getElementById('search-bar');
const searchSection = document.getElementById('search-section');
const headerElement = document.querySelector('header');

// These will be defined after injection
let rosterBtn;
let breadcrumbsDiv;

const factionIcons = {
    "Space Marines": "🦅",
    "Adeptus Custodes": "🛡️",
    "Chaos": "😈",
    "World Eaters": "🩸",
    "Death Guard": "🤢",
    "Xenos": "👽",
    "Orks": "🪓",
    "Tyranids": "🦑",
    "Astra Militarum": "🎖️"
};

// --- 3. Initialization & Injection ---
fetch('wehrselector_data.json')
    .then(response => response.json())
    .then(data => {
        // Fix for PowerShell single-object stripping
        db = data.map(unit => {
            unit.weapons = Array.isArray(unit.weapons) ? unit.weapons : (unit.weapons ? [unit.weapons] : []);
            unit.abilities = Array.isArray(unit.abilities) ? unit.abilities : (unit.abilities ? [unit.abilities] : []);
            unit.keywords = Array.isArray(unit.keywords) ? unit.keywords : (unit.keywords ? [unit.keywords] : []);
            unit.weapons.forEach(w => {
                w.keywords = Array.isArray(w.keywords) ? w.keywords : (w.keywords ? [w.keywords] : []);
            });
            return unit;
        });

        // Inject Dynamic Elements
        if (!document.getElementById('roster-toggle')) {
            headerElement.insertAdjacentHTML('beforeend', `<button id="roster-toggle">Roster</button>`);
            headerElement.insertAdjacentHTML('afterend', `<div id="breadcrumbs" class="hidden"></div>`);
        }

        // CAPTURE the newly injected elements
        rosterBtn = document.getElementById('roster-toggle');
        breadcrumbsDiv = document.getElementById('breadcrumbs');

        // Add Roster Listener
        rosterBtn.addEventListener('click', handleRosterClick);

        renderFactions();
    })
    .catch(error => {
        console.error("Error loading the database:", error);
        contentDiv.innerHTML = `<div style="padding: 20px; text-align: center; color: #ef4444;">Error loading data.json. Check your local server.</div>`;
    });

// --- 4. Navigation & UI Logic ---

function handleRosterClick() {
    if (viewHistory[viewHistory.length - 1] === 'roster') {
        goHome(); 
        rosterBtn.classList.remove('active'); 
        rosterBtn.innerText = 'Roster';
    } else {
        resetTheme();
        viewHistory.push('roster'); 
        renderRoster(); 
        rosterBtn.classList.add('active'); 
        rosterBtn.innerText = 'Close';
    }
}

function setFactionTheme(factionName) {
    headerElement.className = ''; 
    const themeClass = `theme-${factionName.toLowerCase().replace(/\s+/g, '-')}`;
    headerElement.classList.add(themeClass);
}

function resetTheme() {
    headerElement.className = '';
}

window.goHome = function() { resetTheme(); viewHistory = ['factions']; renderFactions(); }
window.goToSubfactions = function() { viewHistory = ['factions', 'subfactions']; renderSubfactions(currentSelection.faction); }
window.goToUnits = function() { viewHistory = ['factions', 'subfactions', 'units']; renderUnits(currentSelection.subfaction); }

function updateBreadcrumbs(currentView, unitId = null) {
    if (!breadcrumbsDiv) return; // Safety check

    let crumbs = [`<span class="crumb" onclick="goHome()">🏠 Home</span>`];
    if (currentView === 'roster') crumbs.push(`<span class="crumb active">📌 My Roster</span>`);
    else if (currentView === 'subfactions') crumbs.push(`<span class="crumb active">${currentSelection.faction}</span>`);
    else if (currentView === 'units') {
        crumbs.push(`<span class="crumb" onclick="goToSubfactions()">${currentSelection.faction}</span>`);
        crumbs.push(`<span class="crumb active">${currentSelection.subfaction}</span>`);
    } else if (currentView === 'card') {
        if (currentSelection.faction) {
            crumbs.push(`<span class="crumb" onclick="goToSubfactions()">${currentSelection.faction}</span>`);
            crumbs.push(`<span class="crumb" onclick="goToUnits()">${currentSelection.subfaction}</span>`);
        } else { crumbs.push(`<span class="crumb">🔍 Search</span>`); }
        const uName = unitId ? db.find(u => u.id === unitId)?.name : 'Unit';
        crumbs.push(`<span class="crumb active">${uName}</span>`);
    }

    if (currentView === 'factions') {
        breadcrumbsDiv.classList.add('hidden');
    } else {
        breadcrumbsDiv.classList.remove('hidden');
        breadcrumbsDiv.innerHTML = crumbs.join(' <span class="crumb-separator">/</span> ');
    }
}

function updateUI(currentView, unitId = null) {
    updateBreadcrumbs(currentView, unitId);
    if (currentView === 'factions') {
        backBtn.classList.add('hidden'); searchSection.classList.remove('hidden');
    } else if (currentView === 'roster') {
        backBtn.classList.add('hidden'); searchSection.classList.add('hidden');
    } else {
        backBtn.classList.remove('hidden'); searchSection.classList.add('hidden'); 
    }
}

// --- 5. Render Functions ---

function renderFactions() {
    resetTheme();
    const factions = [...new Set(db.map(item => item.faction))].sort();
    let html = '<ul class="list-menu">';
    factions.forEach((faction, index) => {
        const icon = factionIcons[faction] || "🏳️";
        html += `<li style="animation-delay: ${index * 0.02}s" onclick="selectFaction('${faction}')">
            <span>${icon} ${faction}</span> 
            <span class="chevron">›</span>
        </li>`;
    });
    html += '</ul>';
    contentDiv.innerHTML = html;
    updateUI('factions');
}

function renderSubfactions(faction) {
    setFactionTheme(faction);
    const filtered = db.filter(item => item.faction === faction);
    const subfactions = [...new Set(filtered.map(item => item.subfaction))].sort();
    let html = '<ul class="list-menu">';
    subfactions.forEach((sub, index) => {
        html += `<li style="animation-delay: ${index * 0.02}s" onclick="selectSubfaction('${sub}')">${sub} <span class="chevron">›</span></li>`;
    });
    html += '</ul>';
    contentDiv.innerHTML = html;
    updateUI('subfactions');
}

function renderUnits(subfaction) {
    const units = db.filter(item => item.faction === currentSelection.faction && item.subfaction === subfaction);
    units.sort((a, b) => a.name.localeCompare(b.name));
    let html = '<ul class="list-menu">';
    units.forEach((unit, index) => {
        html += `<li style="animation-delay: ${index * 0.02}s" onclick="selectUnit('${unit.id}')">${unit.name} <span class="chevron">›</span></li>`;
    });
    html += '</ul>';
    contentDiv.innerHTML = html;
    updateUI('units');
}

function renderRoster() {
    resetTheme();
    if (roster.length === 0) {
        contentDiv.innerHTML = '<div style="padding: 40px 20px; text-align: center; color: #a1a1aa;">Your roster is empty. Pin units here!</div>';
        updateUI('roster'); return;
    }
    const units = db.filter(item => roster.includes(item.id));
    let html = '<ul class="list-menu">';
    units.forEach((unit, index) => {
        const cw = unitWounds[unit.id] !== undefined ? unitWounds[unit.id] : unit.w;
        html += `<li style="animation-delay: ${index * 0.02}s" onclick="selectUnit('${unit.id}')">
            <div>${unit.name} <span class="subtext">HP: <span style="color: ${cw === 0 ? '#ef4444' : '#00e676'}; font-weight:800">${cw}/${unit.w}</span> &bull; ${unit.faction}</span></div>
            <span class="chevron">›</span>
        </li>`;
    });
    html += '</ul>';
    contentDiv.innerHTML = html;
    updateUI('roster');
}

function renderCard(unitId) {
    const unit = db.find(u => u.id === unitId);
    if (!unit) return;
    setFactionTheme(unit.faction);

    const isAdded = roster.includes(unit.id);
    if (unitWounds[unit.id] === undefined) unitWounds[unit.id] = unit.w;
    
    let html = `
        <div class="unit-card">
            <div class="card-header-actions">
                <button class="action-btn ${isAdded ? 'added' : ''}" onclick="toggleRoster('${unit.id}')" id="pin-btn-${unit.id}">
                    ${isAdded ? '✓ Pinned' : '📌 Pin'}
                </button>
                <div class="wound-tracker" id="wound-tracker-container">
                    <button class="wound-btn" onclick="updateWounds('${unit.id}', -1)">−</button>
                    <div class="wound-display" id="wound-display-text" style="color: ${unitWounds[unit.id] === 0 ? '#ef4444' : '#fff'}">${unitWounds[unit.id]} / ${unit.w}</div>
                    <button class="wound-btn" onclick="updateWounds('${unit.id}', 1)">+</button>
                </div>
            </div>

            <div class="unit-title">${unit.name}</div>
            
            <div class="tab-bar">
                <button class="tab-btn active" onclick="switchTab('stats', this)">📊 Stats</button>
                <button class="tab-btn" onclick="switchTab('weapons', this)">⚔️ Guns (${unit.weapons.length})</button>
                <button class="tab-btn" onclick="switchTab('abilities', this)">📜 Rules</button>
            </div>

            <div id="tab-stats" class="tab-content">
                <div class="section-wrapper">
                    <div class="stat-row" style="margin: 0;">
                        <div class="stat-item"><span class="stat-label">M</span><span class="stat-val">${unit.m}</span></div>
                        <div class="stat-item"><span class="stat-label">T</span><span class="stat-val">${unit.t}</span></div>
                        <div class="stat-item"><span class="stat-label" style="color:#fff">SV</span><span class="stat-val" style="color:#ef4444">${unit.sv}</span></div>
                        <div class="stat-item"><span class="stat-label">W</span><span class="stat-val">${unit.w}</span></div>
                        <div class="stat-item"><span class="stat-label">LD</span><span class="stat-val" style="color:#a855f7">${unit.ld}</span></div>
                        <div class="stat-item"><span class="stat-label">OC</span><span class="stat-val">${unit.oc}</span></div>
                    </div>
                </div>
                ${unit.keywords && unit.keywords.length > 0 ? `
                <div class="keywords-section">
                    <div class="kw-title">🏷️ Keywords</div>
                    <div class="kw-list">${unit.keywords.join(', ')}</div>
                </div>` : ''}
            </div>

            <div id="tab-weapons" class="tab-content hidden">
                <div class="section-wrapper">
                    ${unit.weapons.map(w => {
                        const isMelee = w.range.toLowerCase() === 'melee';
                        const wClass = isMelee ? 'melee' : 'ranged';
                        const wIcon = isMelee ? '⚔️' : '🎯';
                        return `
                        <div class="weapon-card ${wClass}">
                            <div class="weapon-name"><span>${w.name}</span> <span>${wIcon}</span></div>
                            ${w.keywords.length > 0 ? `<div class="weapon-keywords">[${w.keywords.join('], [')}]</div>` : ''}
                            <div class="weapon-stats">
                                <div class="w-stat"><span class="l">Rng</span><span class="v">${w.range}</span></div>
                                <div class="w-stat"><span class="l">A</span><span class="v">${w.a}</span></div>
                                <div class="w-stat"><span class="l">BS/WS</span><span class="v">${w.ws_bs}</span></div>
                                <div class="w-stat"><span class="l">S</span><span class="v">${w.s}</span></div>
                                <div class="w-stat"><span class="l">AP</span><span class="v">${w.ap}</span></div>
                                <div class="w-stat"><span class="l">D</span><span class="v">${w.d}</span></div>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>

            <div id="tab-abilities" class="tab-content hidden">
                <div class="section-wrapper">
                    ${unit.invuln ? `
                    <div class="ability-card" style="border-left: 4px solid #ef4444;">
                        <div class="ability-name">🛡️ Invulnerable: ${unit.invuln}</div>
                    </div>` : ''}
                    ${unit.abilities.map(a => `
                        <div class="ability-card">
                            <div class="ability-name">${a.name}</div>
                            <div class="ability-text">${a.text}</div>
                        </div>`).join('')}
                </div>
            </div>
        </div>
    `;
    
    contentDiv.innerHTML = html;
    updateUI('card', unitId);
}

// --- 6. Interaction Logic ---

window.selectFaction = function(faction) { currentSelection.faction = faction; viewHistory.push('subfactions'); renderSubfactions(faction); }
window.selectSubfaction = function(subfaction) { currentSelection.subfaction = subfaction; viewHistory.push('units'); renderUnits(subfaction); }
window.selectUnit = function(unitId) {
    const unit = db.find(u => u.id === unitId);
    if (!unit) return;
    if (viewHistory[viewHistory.length - 1] === 'factions') {
        currentSelection.faction = unit.faction;
        currentSelection.subfaction = unit.subfaction;
    }
    viewHistory.push('card');
    renderCard(unitId);
}

window.toggleRoster = function(unitId) {
    const btn = document.getElementById(`pin-btn-${unitId}`);
    if (roster.includes(unitId)) {
        roster = roster.filter(id => id !== unitId);
        if(btn) { btn.classList.remove('added'); btn.innerText = '📌 Pin'; }
    } else {
        roster.push(unitId);
        if(btn) { btn.classList.add('added'); btn.innerText = '✓ Pinned'; }
    }
}

window.updateWounds = function(unitId, change) {
    const unit = db.find(u => u.id === unitId);
    let newWounds = unitWounds[unitId] + change;
    if (newWounds < 0) newWounds = 0;
    if (newWounds > unit.w) newWounds = unit.w;
    unitWounds[unitId] = newWounds;

    const displayText = document.getElementById('wound-display-text');
    const trackerBox = document.getElementById('wound-tracker-container');
    
    if (displayText && trackerBox) {
        displayText.innerText = `${newWounds} / ${unit.w}`;
        displayText.style.color = newWounds === 0 ? '#ef4444' : '#fff';
        trackerBox.classList.remove('flash-damage', 'flash-heal');
        void trackerBox.offsetWidth;
        trackerBox.classList.add(change < 0 ? 'flash-damage' : 'flash-heal');
    }
}

window.switchTab = function(tabId, btnElement) {
    document.getElementById('tab-stats').classList.add('hidden');
    document.getElementById('tab-weapons').classList.add('hidden');
    document.getElementById('tab-abilities').classList.add('hidden');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + tabId).classList.remove('hidden');
    btnElement.classList.add('active');
}

backBtn.addEventListener('click', () => {
    viewHistory.pop(); 
    const previousView = viewHistory[viewHistory.length - 1];
    if (previousView === 'factions') renderFactions();
    else if (previousView === 'subfactions') renderSubfactions(currentSelection.faction);
    else if (previousView === 'units') renderUnits(currentSelection.subfaction);
    else if (previousView === 'roster') renderRoster();
});

searchBar.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    if (query === '') { renderFactions(); return; }
    resetTheme();
    const results = db.filter(unit => {
        const matchesName = unit.name.toLowerCase().includes(query);
        const matchesWeapon = unit.weapons.some(w => w.name.toLowerCase().includes(query));
        return matchesName || matchesWeapon;
    });
    let html = '<ul class="list-menu">';
    results.forEach((unit, index) => {
        const icon = factionIcons[unit.faction] || "🏳️";
        html += `<li style="animation-delay: ${index * 0.02}s" onclick="selectUnit('${unit.id}')">
            <div>${icon} ${unit.name} <span class="subtext">${unit.subfaction} &bull; ${unit.faction}</span></div>
            <span class="chevron">›</span>
        </li>`;
    });
    html += '</ul>';
    contentDiv.innerHTML = html;
});