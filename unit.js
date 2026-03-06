/**
 * WEHRSELECTOR: UNIT DATASHEET ENGINE (unit.js)
 */

/**
 * Renders the full unit datasheet (Card View).
 */
window.renderCard = (unitId) => {
    const unit = db.find(u => u.id === unitId);
    if (!unit) return;

    currentSelection.unitId = unitId;
    
    // Set theme based on faction color
    if (window.setTheme) setTheme(factionColors[unit.faction]);
    updateView('card');

    // Initialize wounds for this session if not already tracked
    if (window.unitWounds[unit.id] === undefined) {
        window.unitWounds[unit.id] = parseInt(unit.w);
    }

    const curWounds = window.unitWounds[unit.id];
    const isAdded = window.roster.some(item => item.unitId === unit.id);

    UI.content.innerHTML = `
        <div class="unit-card">
            <div class="unit-header">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="assets/logos/${factionLogos[unit.faction] || 'generic.svg'}" class="faction-logo" style="width:22px; filter: brightness(0) invert(1);">
                    <span class="unit-name">${unit.name}</span>
                </div>
                <button class="add-unit-btn ${isAdded ? 'added' : ''}" onclick="window.toggleRoster('${unit.id}', event)">
                    ${isAdded ? '✕ DISENGAGE' : '📌 ENGAGE'}
                </button>
            </div>

            <div style="padding: 0 15px 10px;">
                <button class="action-btn ${window.warlordId === unit.id ? 'active' : ''}" 
                        onclick="window.setWarlord('${unit.id}')" 
                        style="width: 100%; font-size: 0.6rem;">
                    ${window.warlordId === unit.id ? '★ COMMAND_LINK_ACTIVE' : '☆ DESIGNATE_WARLORD'}
                </button>
            </div>

            <div class="stat-bar">
                ${['M','T','SV','W','LD','OC'].map(s => `
                    <div class="stat-item">
                        <span class="stat-label">${s}</span>
                        <span class="stat-val ${s === 'SV' ? 'save-highlight' : ''}">${unit[s.toLowerCase()]}</span>
                    </div>
                `).join('')}
            </div>

            <div class="tab-bar">
                <button class="tab-btn active" onclick="window.switchTab('weapons', this)">ARMAMENT</button>
                <button class="tab-btn" onclick="window.switchTab('abilities', this)">INTEL</button>
            </div>

            <div id="tab-weapons" class="tab-content">
                <div class="weapon-row header">
                    <span>WEAPON</span><span>R</span><span>A</span><span>BS</span><span>S</span><span>AP</span><span>D</span>
                </div>
                ${unit.weapons.map(w => renderWeaponRow(w)).join('')}
            </div>

            <div id="tab-abilities" class="tab-content hidden">
                ${unit.abilities.map(a => `
                    <div class="ability-card">
                        <div class="ability-name">${a.name}</div>
                        <div class="ability-text">${a.text}</div>
                    </div>
                `).join('')}
            </div>

            <div class="wound-tracker">
                <button class="counter-btn" onclick="window.updateWounds('${unit.id}', -1)">−</button>
                <div class="wound-display">
                    <span id="wound-display-text">${curWounds}</span>
                    <span style="font-size:0.6rem;">/ ${unit.w} HP</span>
                </div>
                <button class="counter-btn" onclick="window.updateWounds('${unit.id}', 1)">+</button>
            </div>
        </div>`;
};

/**
 * Helper to render individual weapon rows with tactical highlighting.
 */
const renderWeaponRow = (w) => {
    return `
        <div class="weapon-card-tactical">
            <div class="weapon-row">
                <span>${w.name}</span>
                <span>${w.range}</span>
                <span>${w.a}</span>
                <span>${w.ws_bs}+</span>
                <span>${w.s}</span>
                <span class="weapon-ap">${w.ap}</span>
                <span class="weapon-d">${w.d}</span>
            </div>
            ${w.keywords ? `<div class="weapon-keywords">// ${w.keywords}</div>` : ''}
        </div>
    `;
};

/**
 * Handles wound adjustments and updates the DOM display.
 */
window.updateWounds = (id, amt) => {
    const u = db.find(unit => unit.id === id);
    if (!u) return;

    window.unitWounds[id] = Math.max(0, Math.min(parseInt(u.w), (window.unitWounds[id] || parseInt(u.w)) + amt));
    
    const disp = document.getElementById('wound-display-text');
    if (disp) disp.innerText = window.unitWounds[id];
    
    if (window.saveToDisk) window.saveToDisk();
};