import { Router } from "express";
import { confirmEmail, confirmUpdateEmail, forgetPass, login, logout, logoutFromAllDevices, profile, refreshToken, resendOtp, resetPass, signUp, socialLogin, updateEmail, updatePass } from "./auth.service.js";
import { auth, authorization } from "../../middlewares/auth.middlware.js";
import { RoleEnum } from "../../utils/enums/user.enum.js";
import { validation } from "../../middlewares/validation.middleware.js";
import { loginSchema, signUpSchema } from "./auth.validation.js";

const router = Router();

router.post("/signup", validation(signUpSchema), signUp);
router.post("/login", validation(loginSchema), login);


router.patch("/confirm-email", confirmEmail)
router.post("/resend-otp", resendOtp)
//         {user}
router.get('/me', auth, authorization([RoleEnum.ADMIN, RoleEnum.USER]), profile)

router.post('/refresh-token', refreshToken);
router.post('/signup/gmail', socialLogin)



router.post('/logout', auth, logout)
router.post('/logout-all', auth, logoutFromAllDevices)

router.post("/forget-password", forgetPass)
router.patch("/reset-password", resetPass)

router.patch("/update-password", auth, updatePass)


router.post("/update-email", auth, updateEmail)
router.patch("/confirm-update-email", auth, confirmUpdateEmail)
export default router;
