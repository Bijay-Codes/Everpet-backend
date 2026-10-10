import type { SpeciesConfig } from "../models/Types/PetTypes.js"

export const SPECIES_CONFIG: Record<string, SpeciesConfig> = {
    ferret: {
        lifespanDays: 90,
        diet: 'carnivore',
        caloriesNeeded: 450,
        bondDecayPerTick: 0.15,
        metabolicRatePerTick: 12,
        stressIncreasePerTick: 1.4,
        stressDecreasePetTick: 0.3
    },
    fox: {
        lifespanDays: 120,
        diet: 'omnivore',
        caloriesNeeded: 900,
        bondDecayPerTick: 0.25,
        metabolicRatePerTick: 6.5,
        stressIncreasePerTick: 1.3,
        stressDecreasePetTick: 0.2
    },
    rabbit: {
        lifespanDays: 60,
        diet: 'herbivore',
        caloriesNeeded: 400,
        bondDecayPerTick: 0.12,
        metabolicRatePerTick: 10,
        stressIncreasePerTick: 1.1,
        stressDecreasePetTick: 0.1
    },
    raccoon: {
        lifespanDays: 90,
        diet: 'omnivore',
        caloriesNeeded: 700,
        bondDecayPerTick: 0.18,
        metabolicRatePerTick: 6,
        stressIncreasePerTick: 1,
        stressDecreasePetTick: 0.2
    },
    cat: {
        lifespanDays: 150,
        diet: 'carnivore',
        caloriesNeeded: 600,
        bondDecayPerTick: 0.1,
        metabolicRatePerTick: 5,
        stressIncreasePerTick: 0.8,
        stressDecreasePetTick: 0.2
    },
    capybara: {
        lifespanDays: 150,
        diet: 'herbivore',
        caloriesNeeded: 1400,
        bondDecayPerTick: 0.08,
        metabolicRatePerTick: 8.5,
        stressIncreasePerTick: 0.6,
        stressDecreasePetTick: 0.4
    },
} as const;