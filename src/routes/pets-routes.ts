import { requireAuth } from "../middleware/require-auth.js";
import { getSingleUserPet, getMultipleUserPets, postPet, getStorePets, getCreateablePets, abandonPet } from "../controllers/pets-controller.js";
import { Router } from "express";

const petRoutes = Router();
petRoutes.use(requireAuth);


petRoutes.post('/createpet', postPet);
petRoutes.get('/pet:id', getSingleUserPet);
petRoutes.get('/pets/:offset/:limit', getMultipleUserPets);
petRoutes.get('/:offset/:limit', getStorePets);
petRoutes.get('/species', getCreateablePets);
petRoutes.post('/abandon', abandonPet);
export default petRoutes;