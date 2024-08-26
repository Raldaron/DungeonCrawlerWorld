const SkillModule = {
    baseScores: {},
    raceBonuses: {},
    classBonuses: {},
    equippedScores: {
        armor: {},
        weapons: {}
    },
    displayScores: {},
    availablePoints: 18,
    initialized: false,

    init() {
        if (this.initialized) return;
        console.log('Initializing SkillModule');
        this.loadInitialData();
        this.setupEventListeners();
        this.updateAllSkillScores();
        this.updateAvailablePoints();
        this.initialized = true;
    },
    
    updateRaceBonuses(bonuses) {
        this.raceBonuses = bonuses || {};
        this.updateAllSkillScores();
    },

    updateClassBonuses(bonuses) {
        this.classBonuses = bonuses || {};
        this.updateAllSkillScores();
    },

    updateSkillScore(skill) {
        const scoreElement = document.querySelector(`.skill-card[data-skill="${skill}"] .skill-score`);
        if (scoreElement) {
            scoreElement.textContent = this.displayScores[skill];
        }
    },

    incrementSkill(skill) {
        if (this.availablePoints > 0) {
            this.baseScores[skill] = (this.baseScores[skill] || 0) + 1;
            this.availablePoints--;
            this.updateAllSkillScores();
            this.updateAvailablePoints();
        }
    },

    decrementSkill(skill) {
        if (this.baseScores[skill] > 0) {
            this.baseScores[skill]--;
            this.availablePoints++;
            this.updateAllSkillScores();
            this.updateAvailablePoints();
        }
    },

    updateAvailablePoints() {
        const availablePointsElement = document.getElementById('available-skill-points');
        if (availablePointsElement) {
            availablePointsElement.textContent = this.availablePoints;
        }
    },

    setAvailablePoints(points) {
        this.availablePoints = points;
        this.updateAvailablePoints();
    },

    normalizeSkillName(skillName) {
        return skillName.toLowerCase().replace(/\s+/g, '-');
    },

    updateEquipmentBonuses(item, isEquipping) {
        console.log('Updating equipment bonuses:', item, isEquipping);
        const bonuses = item.skillBonus || {};
        const multiplier = isEquipping ? 1 : -1;
        const itemType = item.itemType.toLowerCase();
        
        if (!this.equippedScores[itemType]) {
            this.equippedScores[itemType] = {};
        }
        
        for (const [skill, bonus] of Object.entries(bonuses)) {
            const normalizedSkill = this.normalizeSkillName(skill);
            this.equippedScores[itemType][normalizedSkill] = 
                (this.equippedScores[itemType][normalizedSkill] || 0) + (bonus * multiplier);
            
            console.log(`Updated ${itemType} bonus for ${normalizedSkill}: ${this.equippedScores[itemType][normalizedSkill]}`);
        }
        
        this.updateAllSkillScores();
    },

    loadInitialData() {
        const skillCards = document.querySelectorAll('.skill-card');
        skillCards.forEach(card => {
            const skillName = card.dataset.skill;
            this.baseScores[skillName] = 0;
            this.displayScores[skillName] = 0;
        });
        console.log('Initial skill data loaded:', this.baseScores);
    },

    setupEventListeners() {
        document.querySelectorAll('.skill-card').forEach(card => {
            const skillName = card.dataset.skill;
            
            card.querySelector('.increment').addEventListener('click', () => this.incrementSkill(skillName));
            card.querySelector('.decrement').addEventListener('click', () => this.decrementSkill(skillName));
        });
    },

    updateEquippedScores(itemBonuses, itemType) {
        console.log(`Updating ${itemType} bonuses:`, itemBonuses);
        const normalizedBonuses = {};
        for (const [skill, bonus] of Object.entries(itemBonuses)) {
            const normalizedSkill = this.normalizeSkillName(skill);
            normalizedBonuses[normalizedSkill] = bonus;
        }
        this.equippedScores[itemType] = { ...this.equippedScores[itemType], ...normalizedBonuses };
        this.updateAllSkillScores();
    },
    
    removeEquippedScores(itemType) {
        console.log(`Removing ${itemType} bonuses`);
        this.equippedScores[itemType] = {};
        this.updateAllSkillScores();
    },
    
    updateAllSkillScores() {
        console.log('Updating all skill scores');
        console.log('Current equipped scores:', this.equippedScores);
    
        document.querySelectorAll('.skill-card').forEach(card => {
            const skill = this.normalizeSkillName(card.dataset.skill);
            const baseScore = this.baseScores[skill] || 0;
            const raceBonus = this.raceBonuses[skill] || 0;
            const classBonus = this.classBonuses[skill] || 0;
            const armorBonus = (this.equippedScores.armor && this.equippedScores.armor[skill]) || 0;
            const weaponBonus = (this.equippedScores.weapon && this.equippedScores.weapon[skill]) || 0;
    
            const totalScore = baseScore + raceBonus + classBonus + armorBonus + weaponBonus;
            console.log(`Updating ${skill}: base=${baseScore}, race=${raceBonus}, class=${classBonus}, armor=${armorBonus}, weapon=${weaponBonus}, total=${totalScore}`);
    
            this.displayScores[skill] = totalScore;
            this.updateSkillScore(skill);
        });
    },

    getAllSkillData() {
        return {
            baseScores: this.baseScores,
            availablePoints: this.availablePoints,
            raceBonuses: this.raceBonuses,
            classBonuses: this.classBonuses,
            equippedScores: this.equippedScores
        };
    },

    loadSavedData(data) {
        if (data) {
            this.baseScores = data.baseScores || {};
            this.availablePoints = data.availablePoints || 18;
            this.raceBonuses = data.raceBonuses || {};
            this.classBonuses = data.classBonuses || {};
            this.equippedScores = data.equippedScores || { armor: {}, weapons: {} };
            this.updateAllSkillScores();
            this.updateAvailablePoints();
        }
    }
};

export default SkillModule;