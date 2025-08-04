import * as functions from "firebase-functions";
import {pubsub} from "firebase-functions/v1";
import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";

admin.initializeApp();

const app = express();
app.use(cors({origin: true}));

// Import your endpoint modules
import {stripeWebhooks} from "./webhooks/stripe";
import {connectOnboarding} from "./payments/connect";
import {sendPushNotification} from "./notifications/push";
import {escrowRelease} from "./automation/escrow";
import {checkPremiumExpiration} from "./automation/premium";

// Webhook endpoints
app.use("/webhooks", stripeWebhooks);
app.use("/connect", connectOnboarding);
app.use("/notifications", sendPushNotification);
app.use("/escrow", escrowRelease);

// Scheduled functions - using v1 API for scheduled functions
export const checkPremiumPlacements = pubsub
  .schedule("every 24 hours")
  .timeZone("America/New_York")
  .onRun(async () => {
    await checkPremiumExpiration();
    return null;
  });

// Main API
export const api = functions.https.onRequest(app);
