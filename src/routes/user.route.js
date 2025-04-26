import { Router } from "express";
import { getCurrentUser, logoutUser, signInUser, signUpUser } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/sign_up").post(signUpUser);
router.route("/sign_in").post(signInUser);

// secured route 
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/getme").get(verifyJWT,getCurrentUser)

export default router;  