// Create a new file: actionModule.js

const ActionModule = {
    actions: [],

    init() {
        this.displayActions();
    },

    addAction(item) {
        if (item.itemType === 'Weapon') {
            this.addWeaponAction(item);
        } else if (item.itemType === 'Scroll') {
            this.addScrollAction(item);
        } else if (item.itemType === 'Explosive') {
            this.addExplosiveAction(item);
        } else if (item.itemType === 'Throwable') {
            this.addThrowableAction(item);
        }
        this.displayActions();
    },

    removeAction(itemName) {
        this.actions = this.actions.filter(action => action.name !== itemName);
        this.displayActions();
    },

    addWeaponAction(weapon) {
        this.actions.push({
            type: 'weapon',
            name: weapon.name,
            damageAmount: weapon.damageAmount,
            damageType: weapon.damageType,
            traits: weapon.traits || []
        });
    },

    addScrollAction(scroll) {
        this.actions.push({
            type: 'scroll',
            name: scroll.name,
            damageAmount: scroll.damage,
            damageType: scroll.damageType,
            castingTime: scroll.castingTime,
            abilityPointCost: scroll.abilityPointCost,
            cooldown: scroll.cooldown,
            scaling: scroll.scaling,
            spellCastingModifier: scroll.spellCastingModifier
        });
    },

    addExplosiveAction(explosive) {
        this.actions.push({
            type: 'explosive',
            name: explosive.name,
            damage: explosive.damage,
            damageType: explosive.damageType,
            duration: explosive.duration,
            range: explosive.range,
            blastRadius: explosive.blastRadius,
            triggerMechanism: explosive.triggerMechanism
        });
    },

    addThrowableAction(throwable) {
        this.actions.push({
            type: 'throwable',
            name: throwable.name,
            duration: throwable.duration,
            range: throwable.range,
            damage: throwable.damage,
            damageType: throwable.damageType,
            radius: throwable.radius,
            triggerMechanism: throwable.triggerMechanism
        });
    },

    displayActions() {
        const actionsContainer = document.getElementById('actions-grid');
        if (actionsContainer) {
            actionsContainer.innerHTML = '';
            this.actions.forEach(action => {
                const actionCard = this.createActionCard(action);
                actionsContainer.appendChild(actionCard);
            });
        } else {
            console.error('Actions container not found');
        }
    },

    createActionCard(action) {
        const card = document.createElement('div');
        card.className = 'action-card';
        
        switch (action.type) {
            case 'weapon':
                card.innerHTML = `
                    <h3>${action.name}</h3>
                    <p>${action.damageAmount} - ${action.damageType}</p>
                    ${action.traits.map(trait => `<span class="trait" data-trait="${trait}">${trait}</span>`).join('')}
                `;
                break;
            case 'scroll':
                card.innerHTML = `
                    <h3>${action.name}</h3>
                    ${action.damageAmount && action.damageType !== 'N/A' ? `<p>${action.damageAmount} - ${action.damageType}</p>` : ''}
                    <p>Casting Time: ${action.castingTime}</p>
                    <p>APC: ${action.abilityPointCost}</p>
                    <p>Cooldown: ${action.cooldown}</p>
                    <p>Scaling Level: ${action.scaling[action.scaling.length - 1].split(':')[0]}</p>
                    <p>Spell Casting Modifier: ${action.spellCastingModifier}</p>
                `;
                break;
            case 'explosive':
            case 'throwable':
                card.innerHTML = `
                    <h3>${action.name}</h3>
                    <p>${action.damage} - ${action.damageType}</p>
                    <p>Duration: ${action.duration}</p>
                    <p>Range: ${action.range}</p>
                    <p>Blast Radius: ${action.blastRadius || action.radius}</p>
                    <p>Trigger: ${action.triggerMechanism}</p>
                `;
                break;
        }

        card.addEventListener('click', () => this.showActionDetails(action));
    return card;
},

showActionDetails(action) {
    const modal = document.getElementById('item-detail-modal');
    const title = document.getElementById('item-detail-title');
    const content = document.getElementById('item-detail-content');

    if (!modal || !title || !content) {
        console.error('Action detail modal elements not found');
        return;
    }

    title.textContent = action.name;
    content.innerHTML = '';

    for (const [key, value] of Object.entries(action)) {
        if (value && value !== 'N/A' && value !== 0) {
            const detailElement = document.createElement('p');
            detailElement.innerHTML = `<strong>${key}:</strong> ${this.formatValue(value)}`;
            content.appendChild(detailElement);
        }
    }

    modal.style.display = 'block';
},

formatValue(value) {
    if (Array.isArray(value)) {
        return value.join(', ');
    } else if (typeof value === 'object' && value !== null) {
        return Object.entries(value).map(([k, v]) => `${k}: ${v}`).join(', ');
    }
    return value;
}
};

export default ActionModule;