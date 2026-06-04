import {
  autoDrawWinnerIfReady,
  getLatestWinnerForBusiness,
} from "../services/winner.service.js";

const DEFAULT_BUSINESS_ID = 1;

function getBusinessId(req) {
  return Number(req.query.businessId || req.body?.businessId || DEFAULT_BUSINESS_ID);
}

export async function getPublicWinner(req, res, next) {
  try {
    const businessId = getBusinessId(req);

    const winner = await getLatestWinnerForBusiness(businessId);

    res.json({
      ok: true,
      data: {
        winner,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function autoDrawPublicWinner(req, res, next) {
  try {
    const businessId = getBusinessId(req);

    const result = await autoDrawWinnerIfReady(businessId);

    res.json({
      ok: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}