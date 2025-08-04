import * as express from "express";
import * as functions from "firebase-functions";

// eslint-disable-next-line new-cap
const router = express.Router();

router.post("/onboard", async (req, res) => {
  try {
    // Handle Stripe Connect onboarding
    // const {priestId} = req.body;

    // Create Stripe Connect account

    res.status(200).json({accountId: "acct_xxx"});
  } catch (error) {
    functions.logger.error("Connect onboarding error:", error);
    res.status(500).json({error: "Onboarding failed"});
  }
});

export {router as connectOnboarding};
