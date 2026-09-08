import { requireAuth } from "../middleware/require-auth.js";
import { getAll, getSingleUserPet, getMultipleUserPets, postPet } from "../controllers/pets-controller.js";
import { Router } from "express";

const petRoutes = Router();
petRoutes.use(requireAuth);

petRoutes.post('/createpet', postPet);
petRoutes.get('/all', getAll);
petRoutes.get('/pet:id', getSingleUserPet);
petRoutes.get('/pets/:startID/:limit', getMultipleUserPets);

export default petRoutes;