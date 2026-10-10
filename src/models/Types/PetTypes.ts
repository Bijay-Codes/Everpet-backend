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