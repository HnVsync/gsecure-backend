import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addEntry, deleteEntryById, viewEntry } from "../controllers/vault.controller.js";

const router = Router();

router.route("/add-items").post(verifyJWT,addEntry)
router.route("/expose-Vault").get(verifyJWT,viewEntry)

router.route("/entry/:id").delete(verifyJWT,deleteEntryById)
// a route for edit vault entries

export default router;