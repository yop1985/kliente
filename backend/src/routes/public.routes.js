import { Router } from "express";

import {
  getPublicBusiness,
  getPublicContest,
  getPublicDashboard,
  getPublicPromotions,
  getPublicRanking,
  getPublicSocialLinks,
  registerPublicVisit,
} from "../controllers/public.controller.js";

import {
  autoDrawPublicWinner,
  getPublicWinner,
} from "../controllers/winner.controller.js";

import { resolvePublicTenant } from "../middlewares/publicTenant.middleware.js";

const router = Router();

router.use(resolvePublicTenant);

router.get("/business", getPublicBusiness);
router.get("/contest", getPublicContest);
router.get("/promotions", getPublicPromotions);
router.get("/ranking", getPublicRanking);
router.get("/social-links", getPublicSocialLinks);
router.get("/dashboard", getPublicDashboard);
router.post("/visit", registerPublicVisit);

router.get("/winner", getPublicWinner);
router.post("/winner/auto-draw", autoDrawPublicWinner);

export default router;