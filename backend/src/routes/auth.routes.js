import { Router } from "express";

import {
  changeInitialPassword,
  changePasswordWithPin,
  createOrChangeInitialPin,
  getAdminProfile,
  loginAdmin,
  masterLogin,
  masterUnlockAdminUser,
  verifyCurrentPin,
} from "../controllers/auth.controller.js";

import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/login", loginAdmin);

router.post("/master/login", masterLogin);
router.post("/master/unlock-user", masterUnlockAdminUser);

router.get("/me", requireAuth, getAdminProfile);

router.post("/change-initial-password", requireAuth, changeInitialPassword);
router.post("/create-initial-pin", requireAuth, createOrChangeInitialPin);
router.post("/change-password-with-pin", requireAuth, changePasswordWithPin);
router.post("/verify-pin", requireAuth, verifyCurrentPin);

export default router;