import type { Request, Response } from "express";
import pool from "../db/pool.js";
import type { AuthRequest } from "../middleware/require-auth.js";
import { formatAsRows } from "../util.js";
import { createNewPet } from "../models/Pets.js";
import { isValidInitialData } from "../util.js";
import API_CONFIG from '../Configs/api-config.js'

export async function getAll(req: Request, res: Response) {
    try {
        const petInfo = await pool.query('SELECT * FROM pets');
        const allPetData = petInfo.rows
        return res.status(200).json({
            totalPets: petInfo.rowCount,
            allPets: allPetData
        })
    } catch {
        res.status(500).json({ err: 'Some error happened noob' })
    }
}

export async function getMultipleUserPets(req: AuthRequest, res: Response) {
    const { userID } = req;
    const { startID, limit } = req.params;
    console.log({ 'start': startID, 'limit': limit });
    if (!startID) {
        return res.status(401).json({ err: 'Please provide a starting value, startID' })
    }
    const normalizedLimit = Array.isArray(limit) ? limit[0] : limit;
    if (!normalizedLimit) return res.status(401).json({ err: 'The number of pets being requested must be provided' });

    const maxFetchLimit = API_CONFIG.petfetchLimit;
    const startIDNum = Number(startID);
    const requestedPets = limit;

    const finalLimit = Math.min(Number(requestedPets), Number(maxFetchLimit));
    console.log(finalLimit,startIDNum,requestedPets)
    try {
        const data = await pool.query('SELECT * FROM pets WHERE current_owner_id=$1 ORDER BY created_at LIMIT $2 OFFSET $3', [userID, finalLimit, startIDNum]);
        const petsToSend = data.rows;
        return res.status(200).json({ pets: petsToSend });
    } catch(err) {
        console.error(err);
        res.status(500).json({ err: 'something went wrong' });
    }
}

export async function getSingleUserPet(req: AuthRequest, res: Response) {
    const userID = req.userID;
    try {
        const usersPets = await pool.query('SELECT * FROM pets WHERE current_owner_id=$1', [userID]);
        const rows = usersPets.rows;
        return res.status(200).json({ rows });
    } catch (err) {
        return res.status(500).json({ err: 'Server facing an issue, try again later' });
    }
}

export async function postPet(req: AuthRequest, res: Response) {
    const userID = req.userID;
    const petData = req.body;
    if (!userID) return res.status(401).json({ err: 'Create an account to add a pet to database' });
    if (!petData) return res.status(400).json({ err: 'Data to create pet not provided' });
    if (!isValidInitialData(petData)) return res.status(400).json({ err: 'Not a valid pet data' });
    const newPetData = createNewPet(petData, userID);
    const query = formatAsRows(newPetData);
    try {
        const data = await pool.query(`insert into pets (${query[0]}) values(${query[1]}) returning id ${query[0]}`, query[2]);
        const userInfo = await pool.query('SELECT username FROM users WHERE id=$1;', [userID]);
        const usernameSnapshot = userInfo.rows[0]?.username;
        const petID = data.rows[0]?.id;
        await pool.query('INSERT INTO ownership_history (pet_id,user_id,username_snapshot) values($1,$2,$3);', [petID, userID, usernameSnapshot]);
        return res.status(201).json({ newPet: data.rows[0] });
    } catch (err) {
        console.error(err);
        return res.status(401).json({ errMsg: 'Something went wrong, please try again', ERROR: err });
    }
}

export async function releasePet(req: AuthRequest, res: Response) {
    const { userID } = req;
    const { petID } = req.body;
    if (!petID) return res.status(400).json({ err: 'Need to attach pet id to request body' })
    try {
        const data = await pool.query('UPDATE pets SET owner_id=null  WHERE id=$1 AND owner_id=$2', [petID, userID]);
        if (data.rowCount === 0) return res.status(404).json({ err: 'Pet not found or Not owned by you' })
        await pool.query('UPDATE ownership_history SET abandoned_at=$1 WHERE pet_id=$2 AND user_id=$3;', [new Date, petID, userID])
        return res.status(200).json({ res: 'ok' });
    } catch (err) {
        console.error(err)
    }
}
