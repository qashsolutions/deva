import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export const checkPremiumExpiration = async (): Promise<void> => {
  try {
    functions.logger.info("Starting premium placement expiration check");

    const now = admin.firestore.Timestamp.now();

    // Query for expired premium placements
    const expiredPremiumQuery = await admin.firestore()
      .collection("priests")
      .where("premiumStatus", "==", "active")
      .where("premiumExpiresAt", "<=", now)
      .get();

    if (expiredPremiumQuery.empty) {
      functions.logger.info("No expired premium placements found");
      return;
    }

    const batch = admin.firestore().batch();
    const expiredPriests: string[] = [];

    expiredPremiumQuery.docs.forEach((doc) => {
      const priestRef = doc.ref;

      // Update premium status to expired
      batch.update(priestRef, {
        premiumStatus: "expired",
        premiumExpiredAt: now,
        // Lower ranking
        searchRanking: admin.firestore.FieldValue.increment(-100),
      });

      expiredPriests.push(doc.id);
      functions.logger.info(`Expired premium for priest: ${doc.id}`);
    });

    // Commit all updates
    await batch.commit();

    // Send notifications to expired premium users
    const notificationPromises = expiredPriests.map(async (priestId) => {
      try {
        // Get priest's FCM token
        const priestDoc = await admin.firestore()
          .collection("priests")
          .doc(priestId)
          .get();

        const priestData = priestDoc.data();
        if (priestData?.fcmToken) {
          await admin.messaging().send({
            token: priestData.fcmToken,
            notification: {
              title: "Premium Placement Expired",
              body: "Your premium placement has expired. " +
                "Renew now to maintain higher visibility.",
            },
            data: {
              type: "premium_expired",
              priestId,
            },
          });
        }

        // Log expiration event
        await admin.firestore()
          .collection("premium_events")
          .add({
            priestId,
            eventType: "expired",
            timestamp: now,
            previousExpiryDate: priestData?.premiumExpiresAt,
          });
      } catch (notificationError) {
        functions.logger.error(
          `Failed to send notification to priest ${priestId}:`,
          notificationError
        );
      }
    });

    await Promise.allSettled(notificationPromises);

    const message =
      `Premium expiration check completed. Expired: ${expiredPriests.length}`;
    functions.logger.info(message);
  } catch (error) {
    functions.logger.error("Premium expiration check failed:", error);
    throw error;
  }
};

// Helper function to extend premium placement
export const extendPremiumPlacement = async (
  priestId: string,
  durationMonths: number
): Promise<void> => {
  try {
    const now = admin.firestore.Timestamp.now();
    // Approximate months to ms
    const extensionMs = durationMonths * 30 * 24 * 60 * 60 * 1000;
    const priestRef = admin.firestore().collection("priests").doc(priestId);
    const priestDoc = await priestRef.get();

    if (!priestDoc.exists) {
      throw new Error("Priest not found");
    }

    const priestData = priestDoc.data();
    const currentExpiry = priestData?.premiumExpiresAt || now;

    // Extend from current expiry or now, whichever is later
    const baseTime = currentExpiry.toMillis() > now.toMillis() ?
      currentExpiry.toMillis() : now.toMillis();

    const newExpiry = admin.firestore.Timestamp.fromMillis(
      baseTime + extensionMs
    );

    await priestRef.update({
      premiumStatus: "active",
      premiumExpiresAt: newExpiry,
      premiumExtendedAt: now,
      // Higher ranking
      searchRanking: admin.firestore.FieldValue.increment(100),
    });

    // Log extension event
    await admin.firestore()
      .collection("premium_events")
      .add({
        priestId,
        eventType: "extended",
        timestamp: now,
        durationMonths,
        newExpiryDate: newExpiry,
        previousExpiryDate: currentExpiry,
      });

    const extMsg = `Extended premium for priest ${priestId} by ` +
      `${durationMonths} months`;
    functions.logger.info(extMsg);
  } catch (error) {
    const errMsg = `Failed to extend premium for priest ${priestId}:`;
    functions.logger.error(errMsg, error);
    throw error;
  }
};

// Function to check priests expiring soon (for reminder notifications)
export const checkExpiringPremium = async (): Promise<void> => {
  try {
    const now = admin.firestore.Timestamp.now();
    const threeDaysFromNow = admin.firestore.Timestamp.fromMillis(
      now.toMillis() + (3 * 24 * 60 * 60 * 1000)
    );

    // Query for premium placements expiring in 3 days
    const expiringQuery = await admin.firestore()
      .collection("priests")
      .where("premiumStatus", "==", "active")
      .where("premiumExpiresAt", "<=", threeDaysFromNow)
      .where("premiumExpiresAt", ">", now)
      .get();

    if (expiringQuery.empty) {
      functions.logger.info("No premium placements expiring soon");
      return;
    }

    const reminderPromises = expiringQuery.docs.map(async (doc) => {
      const priestData = doc.data();
      const daysLeft = Math.ceil(
        (priestData.premiumExpiresAt.toMillis() - now.toMillis()) /
        (24 * 60 * 60 * 1000)
      );

      if (priestData.fcmToken) {
        await admin.messaging().send({
          token: priestData.fcmToken,
          notification: {
            title: "Premium Expiring Soon",
            body: `Your premium placement expires in ${daysLeft} days. ` +
              "Renew now to avoid interruption.",
          },
          data: {
            type: "premium_expiring",
            priestId: doc.id,
            daysLeft: daysLeft.toString(),
          },
        });
      }
    });

    await Promise.allSettled(reminderPromises);

    const reminderMsg =
      `Sent ${expiringQuery.docs.length} premium expiration reminders`;
    functions.logger.info(reminderMsg);
  } catch (error) {
    functions.logger.error("Premium expiration reminder check failed:", error);
  }
};
