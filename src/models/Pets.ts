import type { Food, PetData } from "./Types/PetTypes.js";
import STAT_CONFIG from '../Configs/stats-calc-config.js';
import { SPECIES_CONFIG } from "../Configs/species-config.js";
import type { InitialPetData } from "./Types/PetTypes.js";
import { startsAt } from "../Configs/starting-values.js";
export class Pet {
    currentOwnerID: string | null;
    name: string;
    char: PetData['char'];
    state: PetData['state'];
    stats: PetData['stats'];
    lastTickedAt: Date;
    gotTicked: boolean;

    constructor(petInfo: PetData) {
        this.currentOwnerID = petInfo.ownerID;
        this.name = petInfo.name;
        this.char = petInfo.char;
        this.state = petInfo.state;
        this.stats = petInfo.stats;
        this.lastTickedAt = petInfo.lastTickedAt ?? new Date();
        this.gotTicked = true;
    };

    checkIsDead(): boolean {
        return this.stats.hp <= 0;
    };

    #drainHp(amount: number) {
        return this.stats.hp = this.stats.hp - amount;
    };

    #applyAgeHpDrain() {
        const hpToDrain = STAT_CONFIG.BASE_HP_DRAIN_PER_DAY / STAT_CONFIG.TICKS_PER_DAY;
        this.#drainHp(hpToDrain);
    };

    #applyStatusEffectHpDrain() {
        let multiplier = 0;
        const { isSick, isHealing } = this.state;

        if (isSick && !isHealing)
            multiplier += STAT_CONFIG.SICKNESS_HP_MULTIPLIER;
        if (isHealing)
            multiplier += STAT_CONFIG.HEALING_HP_MULTIPLIER;

        const baseDrainPerTick = STAT_CONFIG.BASE_HP_DRAIN_PER_DAY / STAT_CONFIG.TICKS_PER_DAY
        const drain = baseDrainPerTick * multiplier;

        this.stats.hp = Math.max(0, this.stats.hp - drain);
    };

    #increaseStress() {
        const {
            STRESS_PER_TICK_BOND,
            STRESS_PER_TICK_SICK,
            STRESS_PER_TICK_UNDERFED,
            BOND_LOW_THRESHOLD,
            STRESS_SICKNESS_THRESHOLD
        } = STAT_CONFIG;

        let multiplier = 0;
        const species = SPECIES_CONFIG[this.char.species];
        const stressIncrease = species?.stressIncreasePerTick ?? 0;

        const { daysUnderfed, bond } = this.stats;
        const { isSick, isHealing } = this.state;

        if (daysUnderfed > 0)
            multiplier += STRESS_PER_TICK_UNDERFED;
        if (isSick && !isHealing)
            multiplier += STRESS_PER_TICK_SICK;
        if (bond < BOND_LOW_THRESHOLD)
            multiplier += STRESS_PER_TICK_BOND;

        if (this.stats.stress >= STRESS_SICKNESS_THRESHOLD)
            this.#applySicknessEffect(0.6);

        const stress = stressIncrease * multiplier;
        this.stats.stress = Math.min(100, this.stats.stress + stress);
    };

    #decreaseStress() {
        const { isHealing, isSick } = this.state;
        const { daysUnderfed, bond } = this.stats;
        const species = SPECIES_CONFIG[this.char.species];
        const decrease = species?.stressDecreasePetTick ?? 0;

        if ((!isSick || isHealing)
            && bond > STAT_CONFIG.BOND_LOW_THRESHOLD
            && daysUnderfed === 0)
            this.stats.stress = Math.max(0, this.stats.stress - decrease);
    };

    #applyBondDrain() {
        const config = SPECIES_CONFIG[this.char.species];
        const bondDecayPerTick = config?.bondDecayPerTick ?? 0;

        this.stats.bond = Math.max(0, this.stats.bond - bondDecayPerTick);
    };

    checkSicknessCured(tickTime: number) {
        if (!this.state.isSick || !this.state.isHealing || !this.stats.sicknessLiftAt || !tickTime)
            return;
        const curedAt = this.stats.sicknessLiftAt.getTime();
        if (tickTime >= curedAt) {
            this.#cureSickness();
        };
    };

    applyUnderFedDay() {
        const { caloriesConsumed, caloriesNeeded } = this.stats;

        const isUnderfedDay = (caloriesConsumed / caloriesNeeded) < STAT_CONFIG.UNDERFED_CALORIE_RATIO_THRESHOLD;
        if (isUnderfedDay) {
            this.state.isHungry = true;
            this.stats.daysUnderfed += 1;
        } else {
            this.stats.daysUnderfed = 0;
        };
    };

    #cureSickness() {
        this.stats.bond = 100;
        this.stats.stress = 0;
        this.state.isHealing = false;
        this.state.isSick = false;
    };

    startCureSickness() {
        if (!this.state.isSick)
            return;
        const now = Date.now();
        const dayMS = 24 * 60 * 60 * 1000;
        const sicknessStartedDays = (now - this.char.sicknessStartedAt.getTime()) / dayMS;
        const healDays = Math.min(4, Math.max(1, sicknessStartedDays));
        const healDaysMs = healDays * dayMS;

        this.state.isHealing = true;
        this.stats.sicknessLiftAt = new Date(now + healDaysMs);
    };

    #applySicknessEffect(chance?: number) {
        if (this.state.isSick)
            return;
        const percent = chance ? chance : STAT_CONFIG.SICKNESS_RANDOM_ROLL_CHANCE;
        const chanceToSickness = Math.random() < percent;
        if (chanceToSickness) {
            this.char.sicknessStartedAt = new Date();
            this.state.isSick = true;
        };
    };

    feedPet(food: Food) {
        if (this.checkIsDead())
            return;

        const caloriesToAdd = food.caloriesProvided;
        const appetiteDrop = (food.caloriesProvided / this.stats.caloriesNeeded) * STAT_CONFIG.STATS_CAP;
        if (food.dietType !== this.char.diet) {
            this.stats.caloriesConsumed = Math.min(this.stats.caloriesNeeded,
                this.stats.caloriesConsumed + (caloriesToAdd / 2));
            this.stats.appetite = 100;
            this.state.isHungry = true;
            this.#applySicknessEffect(0.4);
            return;
        };

        this.stats.caloriesConsumed = Math.min(this.stats.caloriesNeeded,
            this.stats.caloriesConsumed + caloriesToAdd);

        this.stats.appetite = Math.max(0, this.stats.appetite - appetiteDrop);
        this.state.isHungry = this.stats.appetite > 60;
    };

    interact(increase: number) {
        const increment = increase ? increase : STAT_CONFIG.BOND_INCREASE_ON_INTERACT;
        this.stats.bond = Math.min(100, this.stats.bond + increment);
    }

    #applyAppetiteIncrease() {
        const metabolicRatePerTick = SPECIES_CONFIG[this.char.species]?.metabolicRatePerTick ?? 0;
        if (!metabolicRatePerTick || this.stats.appetite === 100)
            return false;

        const {
            APPETITE_MULTIPLIER_NORMAL,
            APPETITE_MULTIPLIER_STRESSED,
            APPETITE_MULTIPLIER_SICK, MIN_CRITICAL_STRESS
        } = STAT_CONFIG;

        const { isSick } = this.state;
        const { appetite } = this.stats;

        let multiplier = APPETITE_MULTIPLIER_NORMAL;

        if (isSick)
            multiplier += APPETITE_MULTIPLIER_SICK;

        if (this.stats.stress >= MIN_CRITICAL_STRESS)
            multiplier += APPETITE_MULTIPLIER_STRESSED

        this.stats.appetite = Math.min(100, appetite + metabolicRatePerTick * multiplier);
        this.state.isHungry = this.stats.appetite > 60;
    };

    #getCauseOfDeath(): string {
        if (this.state.isSick)
            return this.state.isHealing ? 'Died while healing' : 'Died fighting sickness';

        const { MIN_CRITICAL_BOND, MIN_CRITICAL_STRESS } = STAT_CONFIG;
        if (this.stats.daysUnderfed >= 3)
            return 'Died from lack of food';

        if (this.stats.stress >= MIN_CRITICAL_STRESS)
            return 'Died from heavy stress and anxiety';

        if (this.stats.bond <= MIN_CRITICAL_BOND)
            return 'Died feeling sad and negleted';

        return 'Died of old age';
    };

    #killPet(reason = this.#getCauseOfDeath(), dateOfDeath = new Date()) {
        this.state.isDead = true;
        this.char.reasonOfDeath = reason;
        this.char.dateOfDeath = dateOfDeath;
    };

    #isNewDay(tickTime: Date): boolean {
        const currentDate = tickTime.getUTCDate();
        const previousTickTime = new Date(tickTime.getTime() - STAT_CONFIG.TICK_INTERVAL_MS);
        const previousTickDate = previousTickTime.getUTCDate();

        return currentDate !== previousTickDate;
    };

    applyTick() {
        if (this.state.isDead)
            return this.gotTicked = false;

        const now = new Date();
        const lastTick = this.lastTickedAt;
        const elapsedTimeMs = now.getTime() - lastTick.getTime();
        const ticks = Math.floor(elapsedTimeMs / STAT_CONFIG.TICK_INTERVAL_MS);

        if (ticks <= 0)
            return this.gotTicked = false;

        for (let i = 1; i <= ticks; i++) {
            const tickTimeMs = lastTick.getTime() + i * STAT_CONFIG.TICK_INTERVAL_MS;
            const isNewDay = this.#isNewDay(new Date(tickTimeMs));

            if (isNewDay) {
                this.applyUnderFedDay()
                this.stats.caloriesConsumed = 0;
            };

            this.checkSicknessCured(tickTimeMs);
            this.#applyAgeHpDrain();
            this.#increaseStress();
            this.#decreaseStress();
            this.#applyStatusEffectHpDrain();
            this.#applyBondDrain();
            this.#applyAppetiteIncrease();
            this.#applySicknessEffect();

            if (this.stats.hp <= 0) {

                const diedOnTick = new Date(
                    this.lastTickedAt.getTime() +
                    i *
                    STAT_CONFIG.TICK_INTERVAL_MS
                );

                this.#killPet(this.#getCauseOfDeath(), diedOnTick);
                break;
            };
        };
        const tickedAt = lastTick.getTime() + ticks * STAT_CONFIG.TICK_INTERVAL_MS
        this.lastTickedAt = new Date(tickedAt);
        this.gotTicked = true;
    };

    getFormatedObject() {
        const petinfo: PetData = {
            ownerID: this.currentOwnerID,
            name: this.name,
            char: this.char,
            state: this.state,
            stats: this.stats,
            lastTickedAt: this.lastTickedAt
        }
        return petinfo;
    };
};

export function createNewPet(InitialPetData: InitialPetData, ownerID: string) {
    const { name, species } = InitialPetData;
    const speciesConfig = SPECIES_CONFIG[species];

    if (!speciesConfig)
        return { isSuccess: false, err: 'Unknown species' };

    const { lifespanDays, caloriesNeeded, diet } = speciesConfig;
    const maxHp = lifespanDays * STAT_CONFIG.BASE_HP_DRAIN_PER_DAY;

    return {
        current_owner_id: ownerID,
        name: name,
        species: species,
        life_span_days: lifespanDays,
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
    };
};
