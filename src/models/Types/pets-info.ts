import type { DietType } from "./PetTypes.js";
export interface SpeciesConfig {
    lifespanDays: number;
    diet: DietType;
    caloriesNeeded: number;
    bondDecayPerTick: number;      // higher = loses bond faster, less "loyal"
    metabolicRatePerTick: number;  // higher = burns appetite faster
    stressIncreasePerTick: number;
    stressDecreasePetTick: number
}