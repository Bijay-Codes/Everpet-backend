export type DietType = "carnivore" | "herbivore" | "omnivore";
export type Species = 'fox' | 'crocodile' | 'raccoon' | 'rabbit' | 'cat' | 'penguin';

export type InitialPetData = {
    ownerID: string,
    name: string,
    species: Species,
}

export interface PetData {
    ownerID: number | null;
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
}

export interface Food {
    name: string;
    caloriesProvided: number;
    dietType: DietType;
}

