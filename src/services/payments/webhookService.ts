import { STRIPE_WEBHOOK_EVENTS } from '../../config/stripe';
import * as firestoreService from '../firestore';
import { 
  sendLocalNotification, 
  createNotificationContent,
  NotificationTypes 
} from '../notifications';

export class WebhookService {
  // Handle successful payment
  static async handlePaymentSucceeded(event: any): Promise<void> {
    try {
      const paymentIntent = event.data.object;
      const { bookingId, priestId, devoteeId } = paymentIntent.metadata;
      
      // Update booking payment status
      await firestoreService.updateBooking(bookingId, {
        'payment.advancePaid': true,
        'payment.advancePaidAt': new Date(),
        'payment.paymentMethod': paymentIntent.payment_method_types[0],
        status: 'confirmed',
      });
      
      // Get booking details for notifications
      const booking = await firestoreService.getBooking(bookingId);
      if (!booking) return;
      
      // Get priest and devotee details
      const [priest, devotee] = await Promise.all([
        firestoreService.getUser(priestId),
        firestoreService.getUser(devoteeId),
      ]);
      
      // Send notifications
      if (priest && devotee) {
        // Notify priest
        await sendLocalNotification(
          createNotificationContent('PAYMENT_RECEIVED', {
            amount: `$${(paymentIntent.amount / 100).toFixed(2)}`,
            serviceName: booking.serviceDetails.name,
            bookingId,
          })
        );
        
        // Notify devotee
        await sendLocalNotification(
          createNotificationContent('BOOKING_CONFIRMED', {
            priestName: priest.name,
            serviceName: booking.serviceDetails.name,
            bookingId,
          })
        );
      }
    } catch (error) {
      console.error('Error handling payment succeeded:', error);
      throw error;
    }
  }

  // Handle failed payment
  static async handlePaymentFailed(event: any): Promise<void> {
    try {
      const paymentIntent = event.data.object;
      const { bookingId } = paymentIntent.metadata;
      
      // Update booking status
      await firestoreService.updateBooking(bookingId, {
        'payment.lastError': {
          code: paymentIntent.last_payment_error?.code,
          message: paymentIntent.last_payment_error?.message,
          timestamp: new Date(),
        },
      });
      
      // Send notification to devotee
      const booking = await firestoreService.getBooking(bookingId);
      if (booking) {
        await sendLocalNotification({
          title: '❌ Payment Failed',
          body: 'Your payment could not be processed. Please try again.',
          data: { type: 'payment_failed', bookingId },
        });
      }
    } catch (error) {
      console.error('Error handling payment failed:', error);
      throw error;
    }
  }

  // Handle Connect account updates
  static async handleAccountUpdated(event: any): Promise<void> {
    try {
      const account = event.data.object;
      const priestId = account.metadata?.priestId;
      
      if (!priestId) return;
      
      // Update priest's Connect account status
      await firestoreService.updateUser(priestId, {
        stripeConnectStatus: {
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          requiresInfo: account.requirements?.currently_due?.length > 0,
          updatedAt: new Date(),
        },
      });
      
      // Notify priest if action required
      if (account.requirements?.currently_due?.length > 0) {
        await sendLocalNotification({
          title: '📋 Action Required',
          body: 'Please complete your payment account setup to receive payouts.',
          data: { type: 'connect_requirements' },
        });
      }
    } catch (error) {
      console.error('Error handling account updated:', error);
      throw error;
    }
  }

  // Handle transfer completion
  static async handleTransferPaid(event: any): Promise<void> {
    try {
      const transfer = event.data.object;
      const { bookingId, priestId } = transfer.metadata;
      
      // Update transfer status in database
      // This would update a transfers collection
      
      // Notify priest of payout
      const priest = await firestoreService.getUser(priestId);
      if (priest) {
        await sendLocalNotification({
          title: '💸 Payout Sent',
          body: `Your earnings of $${(transfer.amount / 100).toFixed(2)} have been sent to your bank.`,
          data: { type: 'payout_sent', bookingId },
        });
      }
    } catch (error) {
      console.error('Error handling transfer paid:', error);
      throw error;
    }
  }

  // Handle refund completion
  static async handleRefundCreated(event: any): Promise<void> {
    try {
      const refund = event.data.object;
      const { bookingId, devoteeId } = refund.metadata;
      
      // Update booking with refund details
      await firestoreService.updateBooking(bookingId, {
        'payment.refundAmount': refund.amount,
        'payment.refundedAt': new Date(),
        'payment.refundId': refund.id,
      });
      
      // Notify devotee
      await sendLocalNotification({
        title: '💰 Refund Processed',
        body: `Your refund of $${(refund.amount / 100).toFixed(2)} has been processed.`,
        data: { type: 'refund_processed', bookingId },
      });
    } catch (error) {
      console.error('Error handling refund created:', error);
      throw error;
    }
  }

  // Handle charge dispute
  static async handleChargeDispute(event: any): Promise<void> {
    try {
      const dispute = event.data.object;
      const paymentIntentId = dispute.payment_intent;
      
      // Find booking by payment intent
      // This would require a query or storing payment intent ID in booking
      
      // Notify admin and priest
      await sendLocalNotification({
        title: '⚠️ Payment Dispute',
        body: 'A payment dispute has been initiated. Please check your dashboard.',
        data: { type: 'payment_dispute', disputeId: dispute.id },
      });
    } catch (error) {
      console.error('Error handling charge dispute:', error);
      throw error;
    }
  }

  // Main webhook handler
  static async handleWebhook(event: any): Promise<void> {
    console.log(`Handling webhook event: ${event.type}`);
    
    switch (event.type) {
      case STRIPE_WEBHOOK_EVENTS.PAYMENT_INTENT_SUCCEEDED:
        await this.handlePaymentSucceeded(event);
        break;
        
      case STRIPE_WEBHOOK_EVENTS.PAYMENT_INTENT_FAILED:
        await this.handlePaymentFailed(event);
        break;
        
      case STRIPE_WEBHOOK_EVENTS.ACCOUNT_UPDATED:
        await this.handleAccountUpdated(event);
        break;
        
      case STRIPE_WEBHOOK_EVENTS.TRANSFER_PAID:
        await this.handleTransferPaid(event);
        break;
        
      case STRIPE_WEBHOOK_EVENTS.REFUND_CREATED:
        await this.handleRefundCreated(event);
        break;
        
      case STRIPE_WEBHOOK_EVENTS.CHARGE_DISPUTE_CREATED:
        await this.handleChargeDispute(event);
        break;
        
      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }
  }

  // Verify webhook signature
  static verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    // This would use Stripe's webhook signature verification
    // Implementation depends on the Stripe SDK version
    return true; // Placeholder
  }

  // Log webhook event
  static async logWebhookEvent(
    eventId: string,
    eventType: string,
    status: 'success' | 'failed',
    error?: string
  ): Promise<void> {
    // This would log to a webhooks collection for debugging
    console.log(`Webhook ${eventId} (${eventType}): ${status}`, error);
  }
}