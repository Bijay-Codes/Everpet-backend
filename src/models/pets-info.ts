// speciesConfig.js
import type { Species, DietType } from "./Types/PetTypes.js";
export interface SpeciesConfig {
    lifespanYears: number;
    diet: DietType;
    caloriesNeeded: number;
    bondDecayPerTick: number;      // higher = loses bond faster, less "loyal"
    metabolicRatePerTick: number;  // higher = burns appetite faster
    stressIncreasePerTick: number;
}