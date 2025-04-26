import { Router } from "express";
import { breachPassword, generatePassword, getIP, passwordStrength } from "../controllers/core.controller.js";
const router = Router();

router.route("/ip").get(getIP)
router.route("/breach-check").post(breachPassword)
router.route("/pass-strength").post(passwordStrength)
router.route("/generate-pass").post(generatePassword)

export default router;