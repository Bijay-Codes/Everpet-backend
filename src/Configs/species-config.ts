import type { SpeciesConfig } from "../models/pets-info.js";

export const SPECIES_CONFIG: Record<string, SpeciesConfig> = {
    crocodile: {
        lifespanYears: 70,
        diet: 'carnivore',
        caloriesNeeded: 1500,
        bondDecayPerTick: 0.4,   // fast — low loyalty, per your design
        metabolicRatePerTick: 0.2, // slow — cold-blooded, low metabolic need
        stressIncreasePerTick: 0.6
    },
    fox: {
        lifespanYears: 8,
        diet: 'omnivore',
        caloriesNeeded: 900,
        bondDecayPerTick: 0.2,   // medium
        metabolicRatePerTick: 0.5, // placeholder, unconfirmed
        stressIncreasePerTick: 0.4
    },
    rabbit: {
        lifespanYears: 3,
        diet: 'herbivore',
        caloriesNeeded: 400,
        bondDecayPerTick: 0.1,   // placeholder, unconfirmed
        metabolicRatePerTick: 0.7, // placeholder, unconfirmed
        stressIncreasePerTick: 0.3
    },
    raccoon: {
        lifespanYears: 5,
        diet: 'omnivore',
        caloriesNeeded: 700,
        bondDecayPerTick: 0.15,  // placeholder, unconfirmed
        metabolicRatePerTick: 0.5, // placeholder, unconfirmed
        stressIncreasePerTick: 0.2
    },
    cat: {
        lifespanYears: 15,
        diet: 'carnivore',
        caloriesNeeded: 600,
        bondDecayPerTick: 0.1,   // placeholder, unconfirmed
        metabolicRatePerTick: 0.4, // placeholder, unconfirmed
        stressIncreasePerTick: 0.1
    },
    penguin: {
        lifespanYears: 20,
        diet: 'carnivore',
        caloriesNeeded: 800,
        bondDecayPerTick: 0.15,  // placeholder, unconfirmed
        metabolicRatePerTick: 0.3, // placeholder, unconfirmed
        stressIncreasePerTick: 0.4
    },
};