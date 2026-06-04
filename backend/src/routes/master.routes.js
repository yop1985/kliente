import { Router } from "express";

import {
  cancelMasterBusiness,
  createMasterBusiness,
  getMasterBusinessById,
  getMasterBusinesses,
  getMasterSummary,
  reactivateMasterBusiness,
  registerMasterBusinessPayment,
  suspendMasterBusiness,
  unlockMasterAdminUser,
} from "../controllers/master.controller.js";

const router = Router();

router.post("/summary", getMasterSummary);

router.post("/businesses", createMasterBusiness);
router.get("/businesses", getMasterBusinesses);
router.post("/businesses/search", getMasterBusinesses);
router.post("/businesses/:businessId", getMasterBusinessById);

router.post("/businesses/:businessId/payment", registerMasterBusinessPayment);
router.post("/businesses/:businessId/suspend", suspendMasterBusiness);
router.post("/businesses/:businessId/reactivate", reactivateMasterBusiness);
router.post("/businesses/:businessId/cancel", cancelMasterBusiness);

router.post("/users/unlock", unlockMasterAdminUser);

export default router;