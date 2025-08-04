import * as express from "express";
import * as functions from "firebase-functions";

// eslint-disable-next-line new-cap
const router = express.Router();

router.post("/stripe", async (req, res) => {
  try {
    // Handle Stripe webhook verification and processing
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!sig || !webhookSecret) {
      functions.logger.error("Missing stripe signature or webhook secret");
      return res.status(400).send("Webhook Error: Missing configuration");
    }

    // TODO: Add Stripe library and verify webhook signature
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);

    res.status(200).json({received: true});
  } catch (error) {
    functions.logger.error("Stripe webhook error:", error);
    res.status(400).send("Webhook Error");
  }
});

export {router as stripeWebhooks};
