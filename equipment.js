// Import necessary modules
import ActionModule from './actionModule.js';
import VitalModule from './vital.js';
import SkillModule from './skill.js';
import AbilityModule from './ability.js';
import TraitModule from './trait.js';
import SpellModule from './spell.js';

// Define the EquipmentModule
const EquipmentModule = {
    items: {},
    equippedItems: {},
    selectedSlot: null,

    // Initialize the module
    init() {
        console.log('Initializing EquipmentModule');
        this.loadItems().then(() => {
            this.setupEventListeners();
            this.initializeEquippedItems();
            this.populateEquipmentSlots();
            this.switchEquipmentSection('weapons'); // Show weapons section by default
        });
        window.addEventListener('resize', this.resizeItemNames.bind(this));
    },

    loadItems() {
        console.log('Loading items');
        return Promise.all([
            fetch('weapons.json').then(response => response.json()),
            fetch('armor.json').then(response => response.json()),
        ])
            .then(([weaponsData, armorData]) => {
                this.items = { ...weaponsData.weapons, ...armorData.armor };
                console.log('All items loaded:', this.items);
            })
            .catch(error => console.error('Error loading items:', error));
    },

    // Setup event listeners for UI interactions
    setupEventListeners() {
        console.log('Setting up event listeners');
    
        // Event listeners for equipment slots
        document.querySelectorAll('.equipment-slot').forEach(slot => {
            if (!slot.id.startsWith('utility-slot-')) {
                slot.addEventListener('click', event => this.handleSlotClick(event.currentTarget));
            }
        });
    
        // Event listener for the equipment modal
        const equipmentModal = document.getElementById('equipment-modal');
        if (equipmentModal) {
            const closeButton = equipmentModal.querySelector('.close');
            if (closeButton) {
                closeButton.addEventListener('click', this.closeModals.bind(this));
            }
            const searchInput = document.getElementById('item-search');
            if (searchInput) {
                searchInput.addEventListener('input', e => this.filterItems(e.target.value));
            }
        } else {
            console.error('Equipment modal not found');
        }
    
        // Event listener for closing modals when clicking outside
        window.addEventListener('click', event => {
            if (event.target.classList.contains('modal')) {
                this.closeModals();
            }
        });
    
        // Event listeners for equipment navigation buttons
        const navButtons = document.querySelectorAll('.equipment-nav-btn');
        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const section = button.dataset.section;
                this.switchEquipmentSection(section);
            });
        });
    
        // Event listeners for equip and details buttons in the equipment modal
        document.getElementById('item-cards-container').addEventListener('click', event => {
            const target = event.target;
            if (target.classList.contains('equip-btn')) {
                const itemKey = target.dataset.itemKey;
                this.equipItem(itemKey);
            } else if (target.classList.contains('details-btn')) {
                const itemKey = target.dataset.itemKey;
                this.showItemDetails(itemKey);
            }
        });
    
        // Event listener for the item detail modal
        const itemDetailModal = document.getElementById('item-detail-modal');
        if (itemDetailModal) {
            const closeButton = itemDetailModal.querySelector('.close');
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    itemDetailModal.style.display = 'none';
                });
            }
        }
    
        // Event listener for equip/unequip button in item detail modal
        document.getElementById('item-detail-content').addEventListener('click', event => {
            if (event.target.id === 'equip-unequip-button') {
                const itemKey = document.getElementById('item-detail-title').dataset.itemKey;
                const isEquipped = event.target.textContent === 'Unequip';
                if (isEquipped) {
                    this.unequipItem(this.selectedSlot);
                } else {
                    this.equipItem(itemKey);
                }
                itemDetailModal.style.display = 'none';
            }
        });
    },

    initializeEquippedItems() {
        console.log('Initializing equipped items');
        document.querySelectorAll('.equipment-slot').forEach(slot => {
            const equippedItemKey = slot.dataset.equippedItem;
            if (equippedItemKey && this.items[equippedItemKey]) {
                this.equippedItems[slot.id] = this.items[equippedItemKey];
                this.updateSlotContent(slot, equippedItemKey);
                this.applyItemBonuses(this.items[equippedItemKey]);
            }
        });
    },

    // Update the content of an equipment slot
    updateSlotContent(slot, itemKey) {
        const item = this.items[itemKey];
        slot.textContent = item.name;
        slot.dataset.equippedItem = itemKey;
    },

    // Populate UI slots with equipment options
    populateEquipmentSlots() {
        console.log('Populating equipment slots');
        const equipmentContainer = document.querySelector('.equipment-container');
        if (!equipmentContainer) {
            console.error('Equipment container not found');
            return;
        }
    
        // Make sure all sections are present
        ['weapons', 'armor', 'utility'].forEach(sectionName => {
            const section = equipmentContainer.querySelector(`.${sectionName}-section`);
            if (!section) {
                console.error(`${sectionName} section not found`);
            }
        });
    
        this.setupWeaponSlots();
        this.setupArmorSlots();
        this.setupUtilitySlots();
    
        this.resizeItemNames();
    },

    // Apply bonuses from an equipped item
    applyItemBonuses(item) {
        if (item.vitalBonus) {
            VitalModule.updateSingleItemBonus(item.itemType.toLowerCase(), item.vitalBonus);
        }
        if (item.skillBonus) {
            SkillModule.updateSingleItemBonus(item.itemType.toLowerCase(), item.skillBonus);
        }
        if (item.abilities && Array.isArray(item.abilities)) {
            AbilityModule.addEquipmentAbilities(item.abilities);
        }
        if (item.traits && Array.isArray(item.traits)) {
            TraitModule.updateTraits(item.itemType.toLowerCase(), item.name, item.traits);
        }
    },

    // Remove bonuses from an unequipped item
    removeItemBonuses(item) {
        if (item.vitalBonus) {
            VitalModule.removeSingleItemBonus(item.itemType.toLowerCase(), item.vitalBonus);
        }
        if (item.skillBonus) {
            SkillModule.removeSingleItemBonus(item.itemType.toLowerCase(), item.skillBonus);
        }
        if (item.abilities && Array.isArray(item.abilities)) {
            AbilityModule.removeEquipmentAbilities(item.abilities);
        }
        if (item.traits && Array.isArray(item.traits)) {
            TraitModule.removeTraits(item.itemType.toLowerCase(), item.name);
        }
    },

    // Create slots for weapons
    createWeaponSlots() {
        const weaponGrid = document.querySelector('.weapons-section .equipment-grid');
        ['Primary Weapon', 'Secondary Weapon'].forEach(slotName => {
            const slot = this.createEquipmentSlot(slotName.toLowerCase().replace(' ', '-'), slotName, 'weapon');
            weaponGrid.appendChild(slot);
        });
    },

    // Create navigation for compact view
    createCompactNavigation() {
        const nav = document.createElement('div');
        nav.className = 'equipment-nav';
        ['Weapons', 'Armor', 'Utility'].forEach((section, index) => {
            const btn = document.createElement('button');
            btn.className = 'equipment-nav-btn' + (index === 0 ? ' active' : '');
            btn.textContent = section;
            btn.dataset.section = section.toLowerCase();
            btn.addEventListener('click', () => this.switchEquipmentSection(section.toLowerCase()));
            nav.appendChild(btn);
        });
        return nav;
    },

    // Switch between equipment sections
    switchEquipmentSection(sectionName) {
        const sections = document.querySelectorAll('.equipment-section');
        const buttons = document.querySelectorAll('.equipment-nav-btn');

        sections.forEach(section => {
            section.style.display = section.classList.contains(`${sectionName}-section`) ? 'block' : 'none';
        });

        buttons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.section === sectionName);
        });
    },

    resizeItemNames() {
        const slotContents = document.querySelectorAll('.equipment-slot-content');
        slotContents.forEach(content => {
            const slot = content.closest('.equipment-slot');
            const slotWidth = slot.offsetWidth;
            const slotHeight = slot.offsetHeight;
            let fontSize = 0.8;

            content.style.fontSize = `${fontSize}rem`;

            while (content.scrollWidth > slotWidth || content.scrollHeight > slotHeight - 20) {
                fontSize -= 0.05;
                content.style.fontSize = `${fontSize}rem`;
                if (fontSize <= 0.5) break; // Set a minimum font size
            }
        });
    },

    // Create slots for armor
    createArmorSlots() {
        const armorGrid = document.querySelector('.armor-section .equipment-grid');
        [
            'Head', 'Face', 'Neck', 'Shoulders', 'Torso',
            'Left Arm', 'Right Arm', 'Left Wrist', 'Right Wrist',
            'Left Hand', 'Right Hand',
            'Finger 1', 'Finger 2', 'Finger 3', 'Finger 4',
            'Waist', 'Legs',
            'Left Ankle', 'Right Ankle',
            'Left Foot', 'Right Foot',
            'Toe 1', 'Toe 2', 'Toe 3', 'Toe 4'
        ].forEach(slotName => {
            const slot = this.createEquipmentSlot(slotName.toLowerCase().replace(' ', '-'), slotName, 'armor');
            armorGrid.appendChild(slot);
        });
    },

    // Create an individual equipment slot
    createEquipmentSlot(id, name, type) {
        const slot = document.createElement('div');
        slot.className = 'equipment-card';
        slot.innerHTML = `
            <div id="${id}-slot" class="equipment-slot" data-slot-type="${type}">
                <span class="slot-label">${name}</span>
            </div>
        `;
        slot.querySelector('.equipment-slot').addEventListener('click', (event) => this.handleSlotClick(event.target));
        return slot;
    },

    // Handle clicks on equipment slots
    handleSlotClick(slot) {
        console.log('Slot clicked:', slot);
        this.selectedSlot = slot.id;
        const equippedItemKey = slot.dataset.equippedItem;
        const slotType = slot.dataset.slotType;
        console.log('Slot type:', slotType);
    
        if (equippedItemKey) {
            this.showItemDetails(equippedItemKey, slot.id);
        } else if (slotType) {
            this.showEquipmentModal(slotType);
        } else {
            console.error('Slot type is undefined');
        }
    },

    // Show modal for equipment selection
    showEquipmentModal(slotType) {
        console.log('Showing equipment modal for:', slotType);
        const modal = document.getElementById('equipment-modal');
        const container = document.getElementById('item-cards-container');
        const searchInput = document.getElementById('item-search');

        if (!modal || !container || !searchInput) {
            console.error('Equipment modal elements not found');
            return;
        }

        searchInput.value = '';
        container.innerHTML = '';

        console.log('All items:', this.items);
        const filteredItems = Object.entries(this.items).filter(([key, item]) => {
            if (!item || !item.itemType) {
                console.warn(`Item ${key} has no itemType:`, item);
                return false;
            }
            return item.itemType.toLowerCase() === slotType.toLowerCase();
        });
        console.log('Filtered items:', filteredItems);

        if (filteredItems.length === 0) {
            container.innerHTML = '<p>No matching items found</p>';
        } else {
            filteredItems.forEach(([key, item]) => {
                console.log('Creating card for item:', item);
                const card = this.createItemCard(key, item);
                container.appendChild(card);
            });
        }

        modal.style.display = 'block';
    },

    // Create a card for an item
    createItemCard(key, item) {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
            <h3>${item.name || 'Unnamed item'}</h3>
            <p>${item.itemType || 'Unknown type'}</p>
            <div class="item-card-buttons">
                <button class="equip-btn" data-item-key="${key}">Equip</button>
                <button class="details-btn" data-item-key="${key}">Details</button>
            </div>
        `;

        card.querySelector('.equip-btn').addEventListener('click', () => this.equipItem(key));
        card.querySelector('.details-btn').addEventListener('click', () => this.showItemDetails(key));

        return card;
    },

    // Equip an item to a slot
    equipItem(itemKey) {
        console.log(`Equipping item: ${itemKey}`);
        const item = this.items[itemKey];
        const slot = document.getElementById(this.selectedSlot);
        
        if (slot && item) {
            // Unequip current item if there is one
            if (slot.dataset.equippedItem) {
                this.unequipItem(this.selectedSlot);
            }
    
            // Update slot content
            slot.textContent = item.name;
            slot.dataset.equippedItem = itemKey;
            
            // Apply vital bonuses
            if (item.vitalBonus) {
                console.log(`Applying vital bonus for ${itemKey}:`, item.vitalBonus);
                VitalModule.updateSingleItemBonus(item.itemType.toLowerCase(), item.vitalBonus);
            }
            
            // Apply skill bonuses
            if (item.skillBonus) {
                console.log(`Applying skill bonus for ${itemKey}:`, item.skillBonus);
                SkillModule.updateEquippedScores(item.skillBonus, item.itemType.toLowerCase());
            }
            
            // Add abilities
            if (item.abilities && Array.isArray(item.abilities)) {
                AbilityModule.addEquipmentAbilities(item.abilities);
            }
    
            // Add traits
            if (item.traits && Array.isArray(item.traits)) {
                TraitModule.updateTraits(item.itemType.toLowerCase(), itemKey, item.traits);
            }
    
            // Add actions (if applicable)
            if (item.itemType === 'Weapon' || item.itemType === 'Scroll' || 
                item.itemType === 'Explosive' || item.itemType === 'Throwable') {
                ActionModule.addAction(item);
            }
        } else {
            console.error(`Failed to equip item: ${itemKey}. Slot or item not found.`);
        }
    
        this.handleEquipmentSpells(item, true);
        this.closeModals();
        this.refreshDisplays();
    },
    
    unequipItem(slotId) {
        console.log(`Unequipping item from slot: ${slotId}`);
        const slot = document.getElementById(slotId);
        if (slot) {
            const itemKey = slot.dataset.equippedItem;
            const item = this.items[itemKey];
            
            if (item) {
                // Remove vital bonuses
                VitalModule.removeSingleItemBonus(item.itemType.toLowerCase());
                
                // Remove skill bonuses
                SkillModule.removeEquippedScores(item.itemType.toLowerCase());
        
                // Remove abilities
                if (item.abilities && Array.isArray(item.abilities)) {
                    AbilityModule.removeEquipmentAbilities(item.abilities);
                }
        
                // Remove traits
                if (item.traits && Array.isArray(item.traits)) {
                    TraitModule.removeTraits(item.itemType.toLowerCase(), itemKey);
                }
    
                // Remove actions (if applicable)
                if (item.itemType === 'Weapon' || item.itemType === 'Scroll' || 
                    item.itemType === 'Explosive' || item.itemType === 'Throwable') {
                    ActionModule.removeAction(item.name);
                }
        
                // Clear slot
                slot.textContent = '';
                slot.dataset.equippedItem = '';
            } else {
                console.error(`Failed to unequip item: Item not found for slot ${slotId}`);
            }
        } else {
            console.error(`Failed to unequip item: Slot not found ${slotId}`);
        }
    
        this.handleEquipmentSpells(item, false);
        this.refreshDisplays();
    },

    refreshDisplays() {
        VitalModule.updateAllVitalScores();
        SkillModule.updateAllSkillScores();
        AbilityModule.displayCurrentAbilities();
        TraitModule.displayTraits();
        ActionModule.displayActions();
    },

    // Refresh various displays after changes
    refreshDisplays() {
        VitalModule.updateAllVitalScores();
        SkillModule.updateAllSkillScores();

        if (typeof AbilityModule.updateAbilitiesGrids === 'function') {
            AbilityModule.updateAbilitiesGrids();
        } else if (typeof AbilityModule.displayCurrentAbilities === 'function') {
            AbilityModule.displayCurrentAbilities();
        } else {
            console.warn('Unable to update abilities display: No suitable method found in AbilityModule');
        }

        TraitModule.displayTraits();
        ActionModule.displayActions();
    },

    // Show details of an item in a modal
    showItemDetails(itemKey, slotId = null) {
        const item = this.items[itemKey];
        const isEquipped = slotId !== null || this.isItemEquipped(itemKey);
        const equippedSlotId = slotId || this.getEquippedSlot(itemKey);
        this.displayItemDetailModal(item, isEquipped, equippedSlotId);
    },

    // Display the item detail modal with specific details
    displayItemDetailModal(item, isEquipped, slotId) {
        const modal = document.getElementById('item-detail-modal');
        const title = document.getElementById('item-detail-title');
        const content = document.getElementById('item-detail-content');

        if (!modal || !title || !content) {
            console.error('Item detail modal elements not found');
            return;
        }

        title.textContent = item.name;
        content.innerHTML = '';

        for (const [key, value] of Object.entries(item)) {
            if (value && value !== 'N/A' && value !== 0) {
                const detailElement = document.createElement('p');
                detailElement.innerHTML = `<strong>${key}:</strong> ${this.formatValue(value)}`;
                content.appendChild(detailElement);
            }
        }

        const actionButton = document.createElement('button');
        actionButton.textContent = isEquipped ? 'Unequip' : 'Equip';
        actionButton.addEventListener('click', () => {
            if (isEquipped) {
                this.unequipItem(slotId);
            } else {
                this.equipItem(item.name);
            }
            modal.style.display = 'none';
        });
        content.appendChild(actionButton);

        modal.style.display = 'block';
    },

    // Add this method to the EquipmentModule object
handleEquipmentSpells(item, isEquipping) {
    if (item.spellsGranted && Array.isArray(item.spellsGranted)) {
        if (isEquipping) {
            SpellModule.addEquipmentSpells(item.spellsGranted);
        } else {
            SpellModule.removeEquipmentSpells(item.spellsGranted);
        }
    }
},

    // Format values for display
    formatValue(value) {
        if (Array.isArray(value)) {
            return value.join(', ');
        } else if (typeof value === 'object' && value !== null) {
            return Object.entries(value).map(([k, v]) => `${k}: ${v}`).join(', ');
        }
        return value;
    },

    isItemEquipped(itemKey) {
        return Object.values(this.equippedItems).some(item => item.name === itemKey);
    },

    // Find which slot has an item equipped
    getEquippedSlot(itemKey) {
        return Object.keys(this.equippedItems).find(slotId => this.equippedItems[slotId].name === itemKey);
    },

    setupWeaponSlots() {
        this.setupSlots('.weapons-section .equipment-slot');
    },
    
    setupArmorSlots() {
        this.setupSlots('.armor-section .equipment-slot');
    },
    
    setupUtilitySlots() {
        this.setupSlots('.utility-section .equipment-slot');
    },
    
    setupSlots(selector) {
        const slots = document.querySelectorAll(selector);
        slots.forEach(slot => {
            slot.addEventListener('click', (event) => this.handleSlotClick(event.currentTarget));
        });
    },
    
    switchEquipmentSection(sectionName) {
        console.log(`Switching to ${sectionName} section`);
        const sections = document.querySelectorAll('.equipment-section');
        const buttons = document.querySelectorAll('.equipment-nav-btn');
    
        sections.forEach(section => {
            section.style.display = section.classList.contains(`${sectionName}-section`) ? 'block' : 'none';
        });
    
        buttons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.section === sectionName);
        });
    },

    filterItems(query) {
        const container = document.getElementById('item-cards-container');
        const lowercaseQuery = query.toLowerCase();

        container.innerHTML = '';

        Object.entries(this.items).forEach(([key, item]) => {
            if (item.name.toLowerCase().includes(lowercaseQuery) || item.itemType.toLowerCase().includes(lowercaseQuery)) {
                const card = this.createItemCard(key, item);
                container.appendChild(card);
            }
        });

        if (container.children.length === 0) {
            container.innerHTML = '<p>No matching items found</p>';
        }
    },

    // Close all modal windows
    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    },

    getAllEquipmentData() {
        return {
            equippedItems: this.equippedItems,
            items: this.items  // This includes all available items
        };
    },
    
    loadSavedData(data) {
        if (data) {
            this.equippedItems = data.equippedItems || {};
            this.items = data.items || {};
            this.initializeEquippedItems();
            this.populateEquipmentSlots();
        }
    },

    // Expose this module to the global scope for accessibility
    exposeToGlobalScope() {
        console.log('Exposing EquipmentModule to global scope');
        window.EquipmentModule = this;
    }
};

// Initialize the module when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');
    EquipmentModule.init();
    EquipmentModule.exposeToGlobalScope();
});

// Export the EquipmentModule
export default EquipmentModule;