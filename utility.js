const UtilityModule = {
    utilityItems: {},

    init() {
        console.log('Initializing UtilityModule');
        this.loadUtilityItems().then(() => {
            console.log('Utility items loaded');
            this.setupEventListeners();
            this.initializeUtilitySlots();
        });
    },

    loadUtilityItems() {
        const files = ['throwables.json', 'explosives.json', 'potions.json', 'scrolls.json', 'ammunition.json', 'crafting_components.json', 'traps.json'];
        return Promise.all(files.map(file => fetch(file).then(response => response.json())))
            .then(data => {
                data.forEach(json => {
                    this.processJsonData(json);
                });
                console.log('Utility items loaded:', this.utilityItems);
            })
            .catch(error => console.error('Error loading utility items:', error));
    },

    processJsonData(json) {
        const processItem = (key, item) => {
            if (typeof item === 'object' && item !== null) {
                if (item.name && item.itemType) {
                    this.utilityItems[key] = item;
                } else {
                    Object.entries(item).forEach(([subKey, subItem]) => {
                        processItem(subKey, subItem);
                    });
                }
            }
        };

        Object.entries(json).forEach(([key, value]) => {
            processItem(key, value);
        });
    },

    setupEventListeners() {
        console.log('Setting up event listeners for UtilityModule');
        document.querySelectorAll('.equipment-slot[id^="utility-slot-"]').forEach(slot => {
            slot.addEventListener('click', (event) => {
                event.stopPropagation(); // Stop event from bubbling
                this.handleSlotClick(event.currentTarget);
            });
        });
        document.querySelectorAll('.equipment-slot[id^="utility-slot-"]').forEach(slot => {
            slot.addEventListener('click', () => this.handleSlotClick(slot));
        });
        const utilityModal = document.getElementById('utility-modal');
        const itemDetailModal = document.getElementById('item-detail-modal');

        if (utilityModal) {
            utilityModal.querySelector('.close').addEventListener('click', () => this.closeModals());
            const searchInput = utilityModal.querySelector('#utility-search');
            if (searchInput) {
                searchInput.addEventListener('input', () => this.filterUtilityItems(searchInput.value));
            }
        }
        if (itemDetailModal) {
            itemDetailModal.querySelector('.close').addEventListener('click', () => this.closeModals());
        }

        document.querySelectorAll('.equipment-slot[id^="utility-slot-"]').forEach(slot => {
            slot.addEventListener('click', () => this.handleSlotClick(slot));
        });

        window.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal')) {
                this.closeModals();
            }
        });
    },

    handleSlotClick(slot) {
        console.log('Utility slot clicked:', slot.id);
        const equippedItemKey = slot.dataset.equippedItem;
        if (equippedItemKey) {
            this.showItemDetails(equippedItemKey, slot.id);
        } else {
            this.showUtilityModal();
        }
    },

    showUtilityModal() {
        console.log('Showing utility modal');
        const modal = document.getElementById('utility-modal');
        const container = document.getElementById('utility-cards-container');
        const searchInput = document.getElementById('utility-search');

        if (!modal || !container || !searchInput) {
            console.error('Modal, container, or search input not found');
            return;
        }

        searchInput.value = '';
        container.innerHTML = '';
        container.className = 'utility-cards-grid';

        this.displayUtilityItems(this.utilityItems);

        modal.style.display = 'block';
    },

    filterUtilityItems(query) {
        const lowercaseQuery = query.toLowerCase();
        const filteredItems = Object.entries(this.utilityItems).reduce((acc, [key, item]) => {
            if (item.name.toLowerCase().includes(lowercaseQuery) || item.itemType.toLowerCase().includes(lowercaseQuery)) {
                acc[key] = item;
            }
            return acc;
        }, {});

        this.displayUtilityItems(filteredItems);
    },

    displayUtilityItems(items) {
        const container = document.getElementById('utility-cards-container');
        if (!container) {
            console.error('Utility cards container not found');
            return;
        }

        container.innerHTML = '';
        if (Object.keys(items).length === 0) {
            container.innerHTML = '<p>No matching utility items found</p>';
            return;
        }

        for (const [key, item] of Object.entries(items)) {
            const card = this.createUtilityCard(key, item);
            container.appendChild(card);
        }
    },

    createUtilityCard(key, item) {
        const card = document.createElement('div');
        card.className = 'utility-card';
        card.innerHTML = `
            <h3 title="${item.name || 'Unnamed item'}">${item.name || 'Unnamed item'}</h3>
            <p>${item.itemType || 'Unknown type'}</p>
            <div class="utility-card-buttons">
                <button class="equip-btn" data-item-key="${key}">Equip</button>
                <button class="details-btn" data-item-key="${key}">Details</button>
            </div>
        `;
    
        const equipButton = card.querySelector('.equip-btn');
        equipButton.addEventListener('click', () => {
            console.log('Equip button clicked for item:', key);
            this.equipItem(key);
        });
    
        const detailsButton = card.querySelector('.details-btn');
        detailsButton.addEventListener('click', () => {
            console.log('Details button clicked for item:', key);
            this.showItemDetails(key);
        });
    
        return card;
    },

    initializeUtilitySlots() {
        console.log('Initializing utility slots');
        document.querySelectorAll('.equipment-slot[id^="utility-slot-"]').forEach(slot => {
            const equippedItemKey = slot.dataset.equippedItem;
            if (equippedItemKey && this.utilityItems[equippedItemKey]) {
                console.log('Initializing slot:', slot.id, 'with item:', equippedItemKey);
                this.updateSlotContent(slot, equippedItemKey);
            }
        });
    },

    findEmptyUtilitySlot() {
        const slots = document.querySelectorAll('.equipment-slot[id^="utility-slot-"]');
        for (let slot of slots) {
            const slotContent = slot.querySelector('.equipment-slot-content');
            if (!slotContent || slotContent.textContent.trim() === '') {
                console.log('Found empty slot:', slot.id);
                return slot;
            }
        }
        console.log('No empty slots found');
        return null;
    },
    
    equipItem(itemKey) {
        console.log('equipItem called with key:', itemKey);
        const item = this.utilityItems[itemKey];
        console.log('Equipping item:', item);
        
        const emptySlot = this.findEmptyUtilitySlot();
        if (emptySlot) {
            console.log('Equipping item to slot:', emptySlot.id);
            this.updateSlotContent(emptySlot, itemKey);
            this.closeModals();
        } else {
            console.error('No empty utility slots available');
            // Optionally, show an alert to the user
            alert('No empty utility slots available. Please unequip an item first.');
        }
    },
    
    updateSlotContent(slot, itemKey) {
        const item = this.utilityItems[itemKey];
        let slotContent = slot.querySelector('.equipment-slot-content');
        if (!slotContent) {
            slotContent = document.createElement('div');
            slotContent.className = 'equipment-slot-content';
            slot.appendChild(slotContent);
        }
        slotContent.textContent = item.name;
        
        if (item.count && item.count > 1) {
            const countElement = document.createElement('span');
            countElement.className = 'equipment-slot-count';
            countElement.textContent = item.count;
            slotContent.appendChild(countElement);
        }
        slot.dataset.equippedItem = itemKey;
        console.log(`Updated slot ${slot.id} with item ${itemKey}`);
    },
    
    unequipItem(slotId) {
        const slot = document.getElementById(slotId);
        if (slot) {
            const slotContent = slot.querySelector('.equipment-slot-content');
            if (slotContent) {
                slotContent.textContent = '';
            }
            slot.dataset.equippedItem = '';
            console.log(`Unequipped item from slot ${slotId}`);
        }
        this.closeModals();
    },

    showItemDetails(itemKey, slotId) {
        console.log('showItemDetails called with key:', itemKey);
        const item = this.utilityItems[itemKey];
        this.displayItemDetailModal(item, !!slotId, slotId);
    },

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

    formatValue(value) {
        if (Array.isArray(value)) {
            return value.join(', ');
        } else if (typeof value === 'object' && value !== null) {
            return Object.entries(value).map(([k, v]) => `${k}: ${v}`).join(', ');
        }
        return value;
    },

    debugUtilitySlots() {
        const slots = document.querySelectorAll('.equipment-slot[id^="utility-slot-"]');
        console.log('Debugging utility slots:');
        slots.forEach(slot => {
            const slotContent = slot.querySelector('.equipment-slot-content');
            console.log(`Slot ${slot.id}:`, {
                content: slotContent ? slotContent.textContent : 'No content div',
                equippedItem: slot.dataset.equippedItem || 'None'
            });
        });
    },

    closeModals() {
        console.log('Closing modals');
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    UtilityModule.init();
});

export default UtilityModule;