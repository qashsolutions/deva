import express from "express";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// eslint-disable-next-line new-cap
const router = express.Router();

router.post("/send", async (req, res) => {
  try {
    const {userId, title, body, data} = req.body;

    // Get user's FCM token from Firestore
    const userDoc = await admin.firestore()
      .collection("users")
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      return res.status(404).json({error: "User not found"});
    }

    const userData = userDoc.data();
    const fcmToken = userData?.fcmToken;

    if (!fcmToken) {
      return res.status(400).json({error: "No FCM token found for user"});
    }

    // Send push notification
    const message = {
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data: data || {},
    };

    const response = await admin.messaging().send(message);
    functions.logger.info("Push notification sent:", response);

    return res.status(200).json({
      success: true,
      messageId: response,
    });
  } catch (error) {
    functions.logger.error("Push notification error:", error);
    return res.status(500).json({error: "Failed to send notification"});
  }
});

// Bulk notification sender
router.post("/bulk", async (req, res) => {
  try {
    const {userIds, title, body, data} = req.body;

    // Get FCM tokens for all users
    const userPromises = userIds.map((userId: string) =>
      admin.firestore().collection("users").doc(userId).get()
    );

    const userDocs = await Promise.all(userPromises);
    const tokens = userDocs
      .filter((doc) => doc.exists && doc.data()?.fcmToken)
      .map((doc) => doc.data()?.fcmToken || "");

    if (tokens.length === 0) {
      return res.status(400).json({error: "No valid FCM tokens found"});
    }

    // Send to multiple devices
    const message = {
      tokens,
      notification: {
        title,
        body,
      },
      data: data || {},
    };

    const response = await admin.messaging().sendMulticast(message);
    functions.logger.info("Bulk notifications sent:", response);

    return res.status(200).json({
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    });
  } catch (error) {
    functions.logger.error("Bulk notification error:", error);
    return res.status(500).json({error: "Failed to send bulk notifications"});
  }
});

export {router as sendPushNotification};
