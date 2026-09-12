import type { Response } from "express";
import pool from "../db/pool.js";
import type { AuthRequest } from "../middleware/require-auth.js";
import { formatAsRows, isValidInitialData } from "./util-functions.js";
import { createNewPet, Pet } from "../models/Pets.js";
import API_CONFIG from '../Configs/api-config.js'
import type { PetData } from "../models/Types/PetTypes.js";

export async function getMultipleUserPets(req: AuthRequest, res: Response) {
    const { userID } = req;
    const { startID, limit } = req.params;
    if (!startID || !limit) {
        return res.status(401).json({ err: 'Please provide a starting value, startID and limit stating how many pets you want to fetch' });
    }

    const maxFetchLimit = API_CONFIG.petfetchLimit;
    const startIDNum = Number(startID);
    const requestedPets = limit;

    const finalLimit = Math.min(Number(requestedPets), Number(maxFetchLimit));
    try {
        const data = await pool.query('SELECT * FROM pets WHERE current_owner_id=$1 ORDER BY created_at LIMIT $2 OFFSET $3', [userID, finalLimit, startIDNum]);
        if (data.rows.length <= 0) return res.status(404).json({ err: 'No pets found' });

        const petsToSend = data.rows.map(data => {
            const petInstance = new Pet(data);
            petInstance.applyTick();
            return petInstance.getFormat();
        });

        return res.status(200).json({ pets: petsToSend });
    } catch (err) {
        res.status(500).json({ err: 'Something went wrong, please try again later' });
    }
}

export async function getSingleUserPet(req: AuthRequest, res: Response) {
    const userID = req.userID;
    let petId = req.body;

    if (!petId) return res.status(400).json({ err: 'Provide the pet id you want to get info on' });
    petId = petId.trim();
    if (!petId) return res.status(400).json({ err: 'Provide the pet id you want to get info on' });

    try {
        const petInfo = await pool.query('SELECT * FROM pets WHERE current_owner_id=$1 AND id=$2', [userID, petId]);
        const usersPet = petInfo.rows[0];
        if (!usersPet) return res.status(404).json({ err: 'No pets found for this user' });

        const constructorObj: PetData = {
            ownerID: usersPet.owner_id,
            name: usersPet.name,
            char: {
                species: usersPet.species,
                lifespan: usersPet.life_span_years,
                age: usersPet.age,
                diet: usersPet.diet,
                dateOfDeath: usersPet.date_of_death,
                reasonOfDeath: usersPet.reason_of_death,
                sicknessStartedAt: usersPet.sickness_started_at,
            },
            state: {
                isHungry: usersPet.is_hungry,
                asleep: usersPet.is_asleep,
                isSick: usersPet.is_sick,
                isHealing: usersPet.is_healing,
                isDead: usersPet.is_dead,
            },
            stats: {
                hp: usersPet.hp,
                maxHp: usersPet.max_hp,
                appetite: usersPet.appetite,
                caloriesNeeded: usersPet.calories_needed,
                caloriesConsumed: usersPet.calories_consumed,
                bond: usersPet.bond,
                stress: usersPet.stress,
                daysUnderfed: usersPet.days_underfed,
                sicknessLiftAt: usersPet.sickness_lift_at
            },
            lastTickedAt: usersPet.last_ticked_at
        }

        const petInstance = new Pet(constructorObj);
        petInstance.applyTick();
        const formatedPet = petInstance.getFormat();
        return res.status(200).json({ res: formatedPet });

    } catch (err) {
        return res.status(500).json({ err: 'Something went wrong, please try again later' });
    }
}

export async function postPet(req: AuthRequest, res: Response) {
    const userID = req.userID;
    const petData = req.body;
    if (!userID) return res.status(401).json({ err: 'Create an account to add a pet to database' });
    if (!petData) return res.status(400).json({ err: 'Data to create pet not provided' });

    if (!isValidInitialData(petData)) return res.status(400).json({ err: 'Not a valid pet data' });

    const newPetData = createNewPet(petData, userID);
    const { formatedRows, formatedValues } = formatAsRows(newPetData);
    const poolClient = await pool.connect();
    try {
        const userInfo = await pool.query('SELECT username FROM users WHERE id=$1;', [userID]);
        const usernameSnapshot = userInfo.rows[0].id;

        if (userInfo.rows.length <= 0) return res.status(404).json({ err: 'No user found with the given id, are you sure you have an account' });

        await poolClient.query('BEGIN;');
        const petInfo = await poolClient.query('INSERT INTO pets ($1) values($2) returning $1;', [formatedRows, formatedValues]);

        const petID = petInfo.rows[0].id;
        await poolClient.query('INSERT INTO ownership_history (pet_id,user_id,username_snapshot) values($1,$2,$3);', [petID, userID, usernameSnapshot]);

        await poolClient.query('COMMIT;');
        return res.status(201).json({ newPet: petInfo.rows[0] });

    } catch (err) {
        await poolClient.query('ROLLBACK;');
        return res.status(401).json({ errMsg: 'Something went wrong, please try again later' });
    } finally {
        poolClient.release();
    }
}

export async function releasePet(req: AuthRequest, res: Response) {
    const { userID } = req;
    const { petID } = req.body;
    if (!petID) return res.status(400).json({ err: 'Attach pet id to request body' });

    const poolClient = await pool.connect();

    try {
        await poolClient.query('BEGIN;');
        await poolClient.query('UPDATE pets SET owner_id=null  WHERE id=$1 AND owner_id=$2', [petID, userID]);
        await poolClient.query('UPDATE ownership_history SET abandoned_at=$1 WHERE pet_id=$2 AND user_id=$3;', [new Date, petID, userID]);
        await poolClient.query('COMMIT;');
        return res.status(200).json({ res: 'ok' });
    } catch (err) {
        return res.status(500).json({ err: 'Something went wrong, please try again later' });
    }
}
