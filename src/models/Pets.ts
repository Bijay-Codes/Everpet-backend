import type { DietType, Food, PetData } from "./Types/PetTypes.js";
import STAT_CONFIG from '../Configs/stats-calc-config.js';
import { SPECIES_CONFIG } from "../Configs/species-config.js";
import type { InitialPetData } from "./Types/PetTypes.js";
import { startsAt } from "../Configs/starting-values.js";
export class Pet {
    currentOwnerID: number | null;
    name: string;
    char: PetData['char'];
    state: PetData['state'];
    stats: PetData['stats'];
    lastTickedAt: Date;
    constructor(petInfo: PetData) {
        this.currentOwnerID = petInfo.ownerID;
        this.name = petInfo.name;
        this.char = petInfo.char;
        this.state = petInfo.state;
        this.stats = petInfo.stats;
        this.lastTickedAt = new Date();
    }


    increaseBond(increment: number) {
        this.stats.bond += Math.min(STAT_CONFIG.STATS_CAP, this.stats.bond + increment);
    }

    bondDecay() {
        const sc = SPECIES_CONFIG[this.char.species];
        const bondDrain = sc?.bondDecayPerTick ?? 0;
        this.stats.bond = Math.max(0, (this.stats.bond - bondDrain));
    }

    checkDiet(food: DietType): boolean {
        return this.char.diet === food;
    }

    feedFood(food: Food) {
        if (this.isDead()) return;
        const caloriesNeeded = SPECIES_CONFIG[this.char.species]?.caloriesNeeded ?? 0
        if (this.checkDiet(food.dietType)) {
            this.stats.caloriesConsumed = Math.min(caloriesNeeded,
                this.stats.caloriesConsumed + food.caloriesProvided
            )
            const percentOfCaloriesProvided = (caloriesNeeded / food.caloriesProvided) * 100;
            this.stats.appetite -= Math.max(100, percentOfCaloriesProvided);
        }
    }

    drainHP(amount: number) {
        this.stats.hp -= amount
    }
    makeSick(reason: string = 'food') {
        if (this.state.isSick || this.state.isHealing) return null;
        if (reason === 'food' || reason === 'stress') {
            this.state.isSick = true;
            this.char.sicknessStartedAt = new Date();;
        } else if (reason === 'random') {
            const chanceToCheckFor = STAT_CONFIG.SICKNESS_RANDOM_ROLL_CHANCE;
            const canGetSick = Math.random() < chanceToCheckFor;
            if (canGetSick) {
                this.state.isSick = true;
                this.char.sicknessStartedAt = new Date();
                return true;
            }
        }
    }
    startCuring() {
        if (this.isDead() || this.state.isHealing || !this.state.isSick) return;
        const now = Date.now();
        const oneDayInMS = 1 * 24 * 60 * 60 * 1000;
        const isSickFromDays = (now - this.char.sicknessStartedAt.getTime()) / oneDayInMS;
        this.state.isSick = true;
        this.state.isHealing = true;
        const { HEAL_MIN_DAYS, HEAL_MAX_DAYS } = STAT_CONFIG;
        if (isSickFromDays <= 1) {
            const msTimeStamp = now + (HEAL_MIN_DAYS * 24 * 60 * 60 * 1000);
            this.stats.sicknessLiftAt = new Date(msTimeStamp);
        } else if (isSickFromDays >= HEAL_MAX_DAYS) {
            const msTimeStamp = now + (HEAL_MAX_DAYS * 24 * 60 * 60 * 1000);
            this.stats.sicknessLiftAt = new Date(msTimeStamp);
        } else {
            const msTimeStamp = now + (isSickFromDays * 24 * 60 * 60 * 1000);
            this.stats.sicknessLiftAt = new Date(msTimeStamp);
        }
    }
    canCureSickness() {
        if (this.isDead()) return
        this.state.isSick = false;
        this.state.isHealing = false;
    }
    isDead() {
        return this.stats.hp <= 0;
    }
    killPet(reason: string) {
        if (!reason) return false;
        this.drainHP(this.stats.maxHp);
        this.state.isDead = true;
        this.char.dateOfDeath = new Date();
        this.char.reasonOfDeath = reason;
    }
    canReleasePet() {
        if (!this.isDead()) return true;
    }

    increaseStress() {
        // linear growth of stress not explosive using exponent by trackig how much time condition was true
        const { STRESS_PER_TICK_BOND, STRESS_PER_TICK_SICK, STRESS_PER_TICK_UNDERFED } = STAT_CONFIG;
        if (this.stats.bond < 20) {
            this.stats.stress += STRESS_PER_TICK_BOND;
        }
        if (this.state.isSick) {
            this.stats.stress += STRESS_PER_TICK_SICK;
        }
        if (this.stats.daysUnderfed > 0) {
            this.stats.stress += STRESS_PER_TICK_UNDERFED;
        }
    }

    reduceApetite() {
        if (this.isDead()) return;
        const metabolicRatePerTick = SPECIES_CONFIG[this.char.species]?.metabolicRatePerTick ?? 0;
        this.stats.appetite = Math.min(100, this.stats.appetite + metabolicRatePerTick);
    }
    hpDrainMultiplier() {
        const { SICKNESS_HP_MULTIPLIER,
            HEALING_HP_MULTIPLIER } = STAT_CONFIG;
        if (this.state.isSick && this.state.isHealing) {
            return HEALING_HP_MULTIPLIER;
        } else if (this.state.isSick && !this.state.isHealing) {
            return SICKNESS_HP_MULTIPLIER;
        } else {
            return 1;
        }
    }
    applyTick() {
        if (this.isDead()) return;
        const ticksSinceLastCheck = (Date.now() - this.lastTickedAt.getTime()) / STAT_CONFIG.TICK_INTERVAL_MS;
        const flooredTicks = Math.floor(ticksSinceLastCheck);
        const { BASE_HP_DRAIN_PER_TICK,
            TICK_INTERVAL_MS,
            TICKS_PER_DAY,
            UNDERFED_CALORIE_RATIO_THRESHOLD } = STAT_CONFIG;


        for (let tick = 1; tick <= flooredTicks; tick++) {

            if (this.stats.sicknessLiftAt <= new Date()) {
                this.canCureSickness(); // only tries to cure sickness not confirmed if it will be cured
            }
            if (tick % TICKS_PER_DAY === 0) {
                const caloriesConsumed = this.stats.caloriesConsumed;
                const caloriesNeeded = this.stats.caloriesNeeded;
                if (caloriesConsumed / caloriesNeeded <= UNDERFED_CALORIE_RATIO_THRESHOLD) {
                    this.stats.daysUnderfed++;
                } else {
                    this.stats.daysUnderfed = 0;
                }
                this.stats.caloriesConsumed = 0;
            }
            this.increaseStress();

            if (this.stats.stress < STAT_CONFIG.STRESS_SICKNESS_THRESHOLD) {
                this.makeSick('random');
            } else {
                this.makeSick('stress');
            }

            this.bondDecay();
            this.reduceApetite();
            const drainMultiplier = this.hpDrainMultiplier();
            const hpDrain = BASE_HP_DRAIN_PER_TICK * drainMultiplier;
            this.drainHP(hpDrain);
            if (this.stats.hp <= 0) break;
        }

        this.lastTickedAt = new Date(this.lastTickedAt.getTime() + flooredTicks * TICK_INTERVAL_MS);
        if (this.stats.hp <= 0) {
            if (this.state.isSick && !this.state.isHealing) {
                this.killPet('Died from sickness');
            } else if (this.state.isHealing) {
                this.killPet('Died from sickness while healing');
            } else {
                this.killPet('Old age');
            }
        }
    }
}

export function createNewPet(InitialPetData: InitialPetData, ownerID: string) {
    const { name, species } = InitialPetData;
    const speciesConfig = SPECIES_CONFIG[species];

    if (!speciesConfig) {
        return { err: 'Unknown species' }
    }

    const { lifespanYears, caloriesNeeded, diet } = speciesConfig;
    const maxHp = lifespanYears * 365;

    return {
        current_owner_id: ownerID,
        name: name,
        species: species,
        life_span_years: lifespanYears,
        age: 0,
        diet: diet,
        is_hungry: false,
        is_asleep: false,
        is_sick: false,
        is_healing: false,
        is_dead: false,
        sickness_started_at: null,
        sickness_lift_at: null,
        date_of_death: null,
        reason_of_death: null,
        hp: maxHp * startsAt.hp,
        max_hp: maxHp,
        appetite: startsAt.appetite * 100,
        calories_needed: caloriesNeeded,
        calories_consumed: Math.round(startsAt.caloriesConsumed * caloriesNeeded),
        bond: startsAt.bond * 100,
        stress: startsAt.stress * 100,
        days_underfed: 0,
        last_ticked_at: new Date()
    }
};
