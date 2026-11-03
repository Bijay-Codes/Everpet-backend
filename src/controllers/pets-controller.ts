import type { Response } from "express";
import pool from "../db/pool.js";
import type { AuthRequest } from "../middleware/require-auth.js";
import { formatAsRows, isNullorUndefined, isValidInitialData, sendErrorResponse } from "./util-functions.js";
import { createNewPet, formatAsPetData, Pet } from "../models/Pets.js";
import API_CONFIG from '../Configs/api-config.js'
import type { PetData } from "../models/Types/PetTypes.js";
import { SPECIES_CONFIG } from "../Configs/species-config.js";


export function getCreateablePets(_req: AuthRequest, res: Response) {
    try {
        const species = Object.entries(SPECIES_CONFIG).map(([k, v]) => {
            return { name: k, ...v }
        })

        return res.status(200).json({ isSuccess: true, data: species, err: null });
    } catch (err) {
        return sendErrorResponse(res);
    };
};

export async function getMultipleUserPets(req: AuthRequest, res: Response) {
    const { userID } = req;
    const { offset, limit } = req.params;
    if (Array.isArray(offset) || Array.isArray(limit))
        return sendErrorResponse(res, 401, 'The parameters like limit and offset cannot be an array')
    const maxFetchLimit = API_CONFIG.petfetchLimit;
    if (!limit)
        return sendErrorResponse(res, 401, 'Please provide a starting value, offset and limit stating how many pets you want to fetch', `Max limit is ${maxFetchLimit}`);

    const offsetNum = Number(offset);
    const requestedPets = limit;

    const finalLimit = Math.min(Number(requestedPets), Number(maxFetchLimit));
    try {
        const data = await pool.query('SELECT * FROM pets WHERE current_owner_id=$1 ORDER BY created_at LIMIT $2 OFFSET $3', [userID, finalLimit, offsetNum]);
        if (data.rows.length <= 0)
            return sendErrorResponse(res, 404, 'No pets found linked with your account', 'Create an pet to access it');

        const petsToSend = data.rows.map(data => {
            const rawPetObj = formatAsPetData(data);
            const petInstance = new Pet(rawPetObj);
            petInstance.applyTick();
            return petInstance.getFormatedObject();
        });

        const resObj = {
            isSuccess: true,
            data: petsToSend,
            err: null
        }
        return res.status(200).json(resObj);
    } catch (err) {
        return sendErrorResponse(res);
    };
};

export async function getSingleUserPet(req: AuthRequest, res: Response) {
    const userID = req.userID;
    let petId = req.body;

    if (!petId)
        return sendErrorResponse(res, 400, 'Provide the pet id you want to get info on');
    petId = petId.trim();
    if (!petId)
        return sendErrorResponse(res, 400, 'Provide the pet id you want to get info on');

    try {
        const petInfo = await pool.query('SELECT * FROM pets WHERE current_owner_id=$1 AND id=$2', [userID, petId]);
        const usersPet = petInfo.rows[0];
        if (!usersPet)
            return sendErrorResponse(res, 404, 'This pet doesnt exist or not yours');

        const constructorObj: PetData = {
            ownerID: usersPet.owner_id,
            name: usersPet.name,
            char: {
                species: usersPet.species,
                lifespan: usersPet.life_span_years,
                diet: usersPet.diet,
                dateOfDeath: usersPet.date_of_death,
                reasonOfDeath: usersPet.reason_of_death,
                sicknessStartedAt: usersPet.sickness_started_at,
                createdAt: usersPet.created_at,
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
        };

        const petInstance = new Pet(constructorObj);
        petInstance.applyTick();
        const formatedPet = petInstance.getFormatedObject();
        return res.status(200).json({ res: formatedPet });

    } catch (err) {
        return sendErrorResponse(res);
    };
};

export async function postPet(req: AuthRequest, res: Response) {
    const userID = req.userID;
    const { petData } = req.body;

    if (!userID)
        return sendErrorResponse(res, 401, 'Create an account to add a pet to database');
    if (!petData)
        return sendErrorResponse(res, 400, 'Data to create pet not provided');

    if (!isValidInitialData(petData))
        return sendErrorResponse(res, 400, 'Not a valid pet data');

    const newPetData = createNewPet(petData, userID);

    const { columns, placeholders, values } = formatAsRows(newPetData);
    const poolClient = await pool.connect();
    try {
        const userInfo = await pool.query('SELECT username FROM users WHERE id=$1;', [userID]);
        const usernameSnapshot = userInfo.rows[0].username;

        if (userInfo.rows.length <= 0)
            return sendErrorResponse(res, 404, 'No user found with the given id, are you sure you have an account');

        await poolClient.query('BEGIN;');
        const petInfo = await poolClient.query(
            `INSERT INTO pets (${columns}) VALUES (${placeholders}) RETURNING *;`,
            values
        );

        const petID = petInfo.rows[0].id;
        await poolClient.query('INSERT INTO ownership_history (pet_id,user_id,username_snapshot) values($1,$2,$3);', [petID, userID, usernameSnapshot]);


        const formatedPetObject = formatAsPetData(petInfo.rows[0]);

        await poolClient.query('COMMIT;');
        return res.status(201).json({ isSuccess: true, data: formatedPetObject });

    } catch (err) {
        await poolClient.query('ROLLBACK;');
        return sendErrorResponse(res);
    } finally {
        poolClient.release();
    };
};

export async function releasePet(req: AuthRequest, res: Response) {
    const { userID } = req;
    const { petID } = req.body;
    if (!petID)
        return sendErrorResponse(res, 400, 'Attach pet id to request body');

    const poolClient = await pool.connect();

    try {
        await poolClient.query('BEGIN;');
        await poolClient.query('UPDATE pets SET owner_id=null  WHERE id=$1 AND owner_id=$2', [petID, userID]);
        await poolClient.query('UPDATE ownership_history SET abandoned_at=$1 WHERE pet_id=$2 AND user_id=$3;', [new Date, petID, userID]);
        await poolClient.query('COMMIT;');
        return res.status(200).json({ res: 'ok' });
    } catch (err) {
        return sendErrorResponse(res);
    }
};

export async function getStorePets(req: AuthRequest, res: Response) {
    const { offset, limit } = req.params;
    if (Array.isArray(offset) || Array.isArray(limit))
        return sendErrorResponse(res, 401, 'The parameters like limit and offset cannot be an array')

    if (isNullorUndefined(limit ?? ''))
        return sendErrorResponse(res, 401, 'Please provide a starting value, offset and limit stating how many pets you want to fetch', `Max limit is ${API_CONFIG.petfetchLimit}`);

    const finalLimit = Math.min(Number(limit), API_CONFIG.petfetchLimit);

    try {
        const petInfo = await pool.query('SELECT * FROM pets WHERE current_owner_id=null ORDER BY created_at LIMIT $1 OFFSET $2', [finalLimit, offset ?? 0]);
        return res.status(200).json({ isSuccess: true, data: petInfo.rows });
    } catch {
        sendErrorResponse(res);
    };
};

export async function abandonPet(req: AuthRequest, res: Response) {
    const petId = req.body.petId;
    if (isNullorUndefined(petId))
        return sendErrorResponse(res, 401, 'Please enter pet id of the pet you want to abandon in the request body');

    const userId = req.userID;
    const poolClient = await pool.connect();

    try {
        await poolClient.query('BEGIN;');
        const petInfo = await poolClient.query('SELECT * FROM pets WHERE id=$1 AND current_owner_id=$2 FOR UPDATE;', [petId, userId]);
        if (!petInfo.rowCount) {
            await poolClient.query('ROLLBACK;');
            return sendErrorResponse(res, 404, 'You do not own this pet');
        };

        const petInstance = new Pet(petInfo.rows[0]);
        petInstance.applyTick();

        const dateTimeNow = new Date();
        await poolClient.query('UPDATE ownership_history SET abandoned_at=$1 WHERE user_id=$2 and pet_id=$3', [dateTimeNow, userId, petId]);
        await poolClient.query('UPDATE pets SET current_owner_id=null WHERE id=$1 AND current_owner_id=$2 AND abandoned_at=null;', [petId, userId]);
        await poolClient.query('COMMIT;');

        return res.status(200).json({ isSuccess: true, data: 'done' });
    }
    catch {
        poolClient.query('ROLLBACK;');
        return sendErrorResponse(res);
    } finally {
        poolClient.release();
    };
};