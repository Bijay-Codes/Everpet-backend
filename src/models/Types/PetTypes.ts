import type { SPECIES_CONFIG } from "../../Configs/species-config.js";

export type DietType = "carnivore" | "herbivore" | "omnivore";
export type Species = keyof typeof SPECIES_CONFIG;

export type InitialPetData = {
    ownerID: string,
    name: string,
    species: Species,
};

export interface PetData {
    ownerID: string | null;
    name: string;
    char: {
        species: string;
        lifespan: number;   // years
        age: Date;
        diet: DietType;
        dateOfDeath: Date;
        reasonOfDeath: string;
        sicknessStartedAt: Date;
        createdAt: Date;
    };
    state: {
        isHungry: boolean;
        asleep: boolean;
        isSick: boolean;
        isHealing: boolean;
        isDead: boolean;
    };
    stats: {
        hp: number;
        maxHp: number;
        appetite: number;
        caloriesNeeded: number;
        caloriesConsumed: number;
        bond: number;
        stress: number;
        daysUnderfed: number;
        sicknessLiftAt: Date;
    };
    lastTickedAt: Date;
};

export interface PetObjectRaw {

    id: string,
    current_owner_id: string,
    name: string,
    species: keyof typeof SPECIES_CONFIG,
    age: number,
    life_span_days: number,
    diet: DietType,
    is_hungry: boolean,
    is_asleep: boolean,
    is_sick: boolean,
    sickness_started_at: Date,
    is_dead: boolean,
    date_of_death: Date,
    hp: number,
    max_hp: number,
    appetite: number,
    calories_needed: number,
    calories_consumed: number,
    days_underfed: number,
    bond: number,
    stress: number,
    last_ticked_at: Date,
    created_at: Date,
    sickness_lift_at: Date,
    reason_of_death: string,
    is_healing: boolean
}

export interface Food {
    name: string;
    caloriesProvided: number;
    dietType: DietType;
};

export interface SpeciesConfig {
    lifespanDays: number;
    diet: DietType;
    caloriesNeeded: number;
    bondDecayPerTick: number;      // higher = loses bond faster, less "loyal"
    metabolicRatePerTick: number;  // higher = burns appetite faster
    stressIncreasePerTick: number;
    stressDecreasePetTick: number
};