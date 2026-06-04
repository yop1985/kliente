import { Router } from "express";

import {
  createCustomer,
  getAdminDashboardData,
  getCustomers,
  getPurchases,
  registerPurchase,
  updateBusiness,
  updateContest,
  updateCustomer,
  updatePromotions,
  updateSocialLinks,
  uploadBusinessLogo,
} from "../controllers/admin.controller.js";

import { createNextContest } from "../controllers/contestCycle.controller.js";
import { getContestHistory } from "../controllers/contestHistory.controller.js";
import { getAdminWinner } from "../controllers/winner.controller.js";

import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireTenant } from "../middlewares/tenant.middleware.js";
import { uploadLogo } from "../middlewares/upload.middleware.js";

const router = Router();

router.use(requireAuth);
router.use(requireTenant);

router.get("/dashboard", getAdminDashboardData);

router.put("/business", updateBusiness);
router.post("/business/logo", uploadLogo.single("logo"), uploadBusinessLogo);

router.put("/contest", updateContest);
router.post("/contest/new", createNextContest);
router.get("/contest-history", getContestHistory);

router.put("/promotions", updatePromotions);
router.put("/social-links", updateSocialLinks);

router.get("/customers", getCustomers);
router.post("/customers", createCustomer);
router.put("/customers/:id", updateCustomer);

router.get("/purchases", getPurchases);
router.post("/purchases", registerPurchase);

router.get("/winner", getAdminWinner);

export default router;