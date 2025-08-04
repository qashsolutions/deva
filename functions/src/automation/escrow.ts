import express from "express";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// eslint-disable-next-line new-cap
const router = express.Router();

router.post("/release", async (req, res) => {
  try {
    const {bookingId, releaseReason} = req.body;

    // Get booking details
    const bookingDoc = await admin.firestore()
      .collection("bookings")
      .doc(bookingId)
      .get();

    if (!bookingDoc.exists) {
      return res.status(404).json({error: "Booking not found"});
    }

    const booking = bookingDoc.data();

    if (booking?.paymentStatus !== "escrowed") {
      return res.status(400).json({
        error: "Payment is not in escrow status",
      });
    }

    // Release payment to priest
    // Stripe transfer logic would go here
    // const stripeService = functions.config().stripe;

    // Update booking status
    await admin.firestore()
      .collection("bookings")
      .doc(bookingId)
      .update({
        paymentStatus: "released",
        releaseReason,
        releasedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    // Log the transaction
    await admin.firestore()
      .collection("transactions")
      .add({
        bookingId,
        type: "escrow_release",
        amount: booking?.amount,
        priestId: booking?.priestId,
        devoteeId: booking?.devoteeId,
        releaseReason,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

    functions.logger.info(`Escrow released for booking: ${bookingId}`);

    return res.status(200).json({
      success: true,
      message: "Escrow released successfully",
      bookingId,
    });
  } catch (error) {
    functions.logger.error("Escrow release error:", error);
    return res.status(500).json({error: "Failed to release escrow"});
  }
});

router.post("/hold", async (req, res) => {
  try {
    const {bookingId, holdReason} = req.body;

    // Update booking to hold escrow longer
    await admin.firestore()
      .collection("bookings")
      .doc(bookingId)
      .update({
        paymentStatus: "held",
        holdReason,
        heldAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    functions.logger.info(`Escrow held for booking: ${bookingId}`);

    res.status(200).json({
      success: true,
      message: "Escrow held successfully",
    });
  } catch (error) {
    functions.logger.error("Escrow hold error:", error);
    res.status(500).json({error: "Failed to hold escrow"});
  }
});

router.get("/status/:bookingId", async (req, res) => {
  try {
    const {bookingId} = req.params;

    const bookingDoc = await admin.firestore()
      .collection("bookings")
      .doc(bookingId)
      .get();

    if (!bookingDoc.exists) {
      return res.status(404).json({error: "Booking not found"});
    }

    const booking = bookingDoc.data();

    return res.status(200).json({
      bookingId,
      paymentStatus: booking?.paymentStatus,
      amount: booking?.amount,
      createdAt: booking?.createdAt,
      releasedAt: booking?.releasedAt || null,
    });
  } catch (error) {
    functions.logger.error("Escrow status check error:", error);
    return res.status(500).json({error: "Failed to check escrow status"});
  }
});

export {router as escrowRelease};
