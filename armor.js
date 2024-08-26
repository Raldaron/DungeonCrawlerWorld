import VitalModule from './vital.js';
import SkillModule from './skill.js';
import AbilityModule from './ability.js';
import TraitModule from './trait.js';
import SpellModule from './spell.js';

const ArmorModule = {
    armor: {},
    selectedSlot: null,

    init() {
        this.loadArmor();
        this.setupEventListeners();
    },

    loadArmor() {
        fetch('armor.json')
            .then(response => response.json())
            .then(data => {
                this.armor = data.armor;
                console.log('Armor loaded:', this.armor);
            })
            .catch(error => console.error('Error loading armor:', error));
    },

    setupEventListeners() {
        document.querySelectorAll('.equipment-slot[data-slot-type]').forEach(slot => {
            if (this.isArmorSlot(slot.dataset.slotType)) {
                slot.addEventListener('click', () => this.handleArmorSlotClick(slot));
            }
        });

        const armorModal = document.getElementById('armor-modal');
        if (armorModal) {
            armorModal.querySelector('.close').addEventListener('click', () => this.closeArmorModal());
            document.getElementById('armor-search').addEventListener('input', (e) => this.filterArmor(e.target.value));
        }
    },

    isArmorSlot(slotType) {
        const armorSlotTypes = ['head', 'face', 'neck', 'shoulders', 'torso', 'arm', 'wrist', 'finger', 'waist', 'legs', 'ankle', 'feet', 'toe'];
        return armorSlotTypes.includes(slotType.toLowerCase());
    },

    handleArmorSlotClick(slot) {
        const slotType = slot.dataset.slotType.toLowerCase();
        const equippedArmorKey = slot.dataset.equippedArmor;
        if (equippedArmorKey) {
            this.showEquippedArmorDetails(equippedArmorKey, slot.id);
        } else {
            this.showEquippableArmor(slotType, slot.id);
        }
    },

    showEquippableArmor(slotType, slotId) {
        this.selectedSlot = slotId;
        const modal = document.getElementById('armor-modal');
        const container = document.getElementById('armor-cards-container');
        const searchInput = document.getElementById('armor-search');

        if (!modal || !container || !searchInput) {
            console.error('Armor modal elements not found');
            return;
        }

        searchInput.value = '';
        container.innerHTML = '';

        const filteredArmor = Object.entries(this.armor).filter(([key, armor]) =>
            armor.armorType.toLowerCase() === slotType
        );

        if (filteredArmor.length === 0) {
            container.innerHTML = '<p>No matching armor found</p>';
        } else {
            filteredArmor.forEach(([key, armor]) => {
                const card = this.createArmorCard(key, armor);
                container.appendChild(card);
            });
        }

        modal.style.display = 'block';
    },

    createArmorCard(key, armor) {
        const card = document.createElement('div');
        card.className = 'armor-card';
        card.innerHTML = `
            <h3>${armor.name || 'Unnamed armor'}</h3>
            <p>${armor.armorType || 'Unknown type'}</p>
            <div class="armor-card-buttons">
                <button class="equip-btn" data-armor-key="${key}">Equip</button>
                <button class="details-btn" data-armor-key="${key}">Details</button>
            </div>
        `;

        card.querySelector('.equip-btn').addEventListener('click', () => this.equipArmor(key));
        card.querySelector('.details-btn').addEventListener('click', () => this.showArmorDetails(key));

        return card;
    },

    equipArmor(armorKey) {
        const armor = this.armor[armorKey];
        const slot = document.getElementById(this.selectedSlot);
        if (slot) {
            // Unequip current item if there is one
            if (slot.dataset.equippedArmor) {
                this.unequipArmor(slot.id);
            }

            slot.textContent = armor.name;
            slot.dataset.equippedArmor = armorKey;

            // Update vital and skill scores
            if (armor.vitalBonus) {
                VitalModule.updateSingleItemBonus('armor', armor.vitalBonus);
            }
            if (armor.skillBonus) {
                SkillModule.updateEquippedScores(armor.skillBonus, 'armor');
            }

            // Update abilities and traits
            if (armor.abilities && Array.isArray(armor.abilities)) {
                AbilityModule.addEquipmentAbilities(armor.abilities);
            }
            if (armor.traits && Array.isArray(armor.traits)) {
                TraitModule.updateTraits('armor', armorKey, armor.traits);
            }

            // Add spells granted by the armor
            if (armor.spellsGranted && Array.isArray(armor.spellsGranted)) {
                SpellModule.addEquipmentSpells(armor.spellsGranted);
            }
        }
        this.closeModals();
    },
    
    unequipArmor(slotId) {
        const slot = document.getElementById(slotId);
        if (slot) {
            const armorKey = slot.dataset.equippedArmor;
            const armor = this.armor[armorKey];
            
            // Remove bonuses
            if (armor.vitalBonus) {
                VitalModule.removeSingleItemBonus('armor', armor.vitalBonus);
            }
            if (armor.skillBonus) {
                SkillModule.removeEquippedScores('armor');
            }
            
            // Remove abilities and traits
            if (armor.abilities && Array.isArray(armor.abilities)) {
                AbilityModule.removeEquipmentAbilities(armor.abilities);
            }
            if (armor.traits && Array.isArray(armor.traits)) {
                TraitModule.removeTraits('armor', armorKey);
            }
    
            // Remove spells granted by the armor
            if (armor.spellsGranted && Array.isArray(armor.spellsGranted)) {
                SpellModule.removeEquipmentSpells(armor.spellsGranted);
            }
    
            slot.textContent = '';
            slot.dataset.equippedArmor = '';
        }
    },

    showArmorDetails(armorKey) {
        const armor = this.armor[armorKey];
        this.displayItemDetailModal(armor, false);
    },

    showEquippedArmorDetails(armorKey, slotId) {
        const armor = this.armor[armorKey];
        this.selectedSlot = slotId;
        this.displayItemDetailModal(armor, true);
    },

    displayItemDetailModal(armor, isEquipped) {
        const modal = document.getElementById('item-detail-modal');
        const title = document.getElementById('item-detail-title');
        const content = document.getElementById('item-detail-content');

        if (!modal || !title || !content) {
            console.error('Item detail modal elements not found');
            return;
        }

        title.textContent = armor.name;
        content.innerHTML = '';

        for (const [key, value] of Object.entries(armor)) {
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
                this.unequipArmor(this.selectedSlot);
            } else {
                this.equipArmor(armor.name);
            }
            modal.style.display = 'none';
        });
        content.appendChild(actionButton);

        modal.style.display = 'block';
    },

    formatValue(value) {
        if (Array.isArray(value)) {
            return value.join(', ');
        } else if (typeof value === 'object' && value !== null) {
            return Object.entries(value).map(([k, v]) => `${k}: ${v}`).join(', ');
        }
        return value;
    },

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    },

    closeArmorModal() {
        document.getElementById('armor-modal').style.display = 'none';
    },

    filterArmor(query) {
        const container = document.getElementById('armor-cards-container');
        const lowercaseQuery = query.toLowerCase();

        container.innerHTML = '';

        Object.entries(this.armor).forEach(([key, armor]) => {
            if (armor.name.toLowerCase().includes(lowercaseQuery) || armor.armorType.toLowerCase().includes(lowercaseQuery)) {
                const card = this.createArmorCard(key, armor);
                container.appendChild(card);
            }
        });

        if (container.children.length === 0) {
            container.innerHTML = '<p>No matching armor found</p>';
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ArmorModule.init();
});

export default ArmorModule;