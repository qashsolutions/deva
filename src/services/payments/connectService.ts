import { functions } from '../../config/firebase';
import { httpsCallable } from 'firebase/functions';
import { 
  ConnectAccount, 
  PriestType,
  ConnectAccountStatus,
  Transfer
} from '../../types';
import { StripeConfig } from '../../config/stripe';

// Cloud function references
const createConnectAccountFn = httpsCallable(functions, 'createConnectAccount');
const createOnboardingLinkFn = httpsCallable(functions, 'createOnboardingLink');
const getAccountStatusFn = httpsCallable(functions, 'getConnectAccountStatus');
const createTransferFn = httpsCallable(functions, 'createTransfer');
const updateAccountFn = httpsCallable(functions, 'updateConnectAccount');

export class StripeConnectService {
  // Create Stripe Connect account for priest
  static async createConnectAccount(
    priestId: string,
    priestType: PriestType,
    businessProfile: {
      name: string;
      email: string;
      phone: string;
      address?: {
        line1: string;
        city: string;
        state: string;
        postal_code: string;
      };
    }
  ): Promise<ConnectAccount> {
    try {
      const accountType = priestType === 'temple_owner' ? 'company' : 'individual';
      
      const result = await createConnectAccountFn({
        priestId,
        type: 'express', // Using Connect Express for simplified onboarding
        country: 'US',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: accountType,
        business_profile: {
          mcc: '8661', // Religious organizations
          name: businessProfile.name,
          support_email: businessProfile.email,
          support_phone: businessProfile.phone,
          url: 'https://devebhyo.com', // App website
        },
        metadata: {
          priestId,
          priestType,
          platform: 'devebhyo',
        },
      });
      
      const data = result.data as any;
      
      return {
        id: data.id,
        priestId,
        stripeAccountId: data.stripeAccountId,
        accountStatus: 'pending',
        requiresInfo: true,
        chargesEnabled: false,
        payoutsEnabled: false,
        requirements: {
          currentlyDue: data.requirements?.currently_due || [],
          eventuallyDue: data.requirements?.eventually_due || [],
          pastDue: data.requirements?.past_due || [],
          errors: [],
        },
        capabilities: {
          cardPayments: 'inactive',
          transfers: 'inactive',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error: any) {
      throw new Error(`Failed to create Connect account: ${error.message}`);
    }
  }

  // Generate onboarding link for priest to complete KYC
  static async createOnboardingLink(
    stripeAccountId: string,
    refreshUrl: string,
    returnUrl: string
  ): Promise<string> {
    try {
      const result = await createOnboardingLinkFn({
        accountId: stripeAccountId,
        refreshUrl,
        returnUrl,
        type: 'account_onboarding',
      });
      
      const data = result.data as any;
      return data.url;
    } catch (error: any) {
      throw new Error(`Failed to create onboarding link: ${error.message}`);
    }
  }

  // Check Connect account status and requirements
  static async getAccountStatus(stripeAccountId: string): Promise<ConnectAccount> {
    try {
      const result = await getAccountStatusFn({ accountId: stripeAccountId });
      const data = result.data as any;
      
      return {
        id: data.id,
        priestId: data.metadata?.priestId || '',
        stripeAccountId: data.id,
        accountStatus: this.mapAccountStatus(data),
        requiresInfo: data.requirements?.currently_due?.length > 0,
        chargesEnabled: data.charges_enabled,
        payoutsEnabled: data.payouts_enabled,
        requirements: {
          currentlyDue: data.requirements?.currently_due || [],
          eventuallyDue: data.requirements?.eventually_due || [],
          pastDue: data.requirements?.past_due || [],
          errors: data.requirements?.errors || [],
        },
        capabilities: {
          cardPayments: data.capabilities?.card_payments || 'inactive',
          transfers: data.capabilities?.transfers || 'inactive',
        },
        bankAccount: data.external_accounts?.data?.[0] ? {
          last4: data.external_accounts.data[0].last4,
          bankName: data.external_accounts.data[0].bank_name,
          currency: data.external_accounts.data[0].currency,
        } : undefined,
        businessProfile: data.business_profile,
        payoutSchedule: data.settings?.payouts?.schedule,
        createdAt: new Date(data.created * 1000),
        updatedAt: new Date(),
      };
    } catch (error: any) {
      throw new Error(`Failed to get account status: ${error.message}`);
    }
  }

  // Create transfer to priest's Connect account
  static async createTransfer(
    amount: number,
    stripeAccountId: string,
    transferGroupId: string,
    bookingId: string,
    description: string
  ): Promise<Transfer> {
    try {
      const result = await createTransferFn({
        amount,
        currency: StripeConfig.currency,
        destination: stripeAccountId,
        transferGroup: transferGroupId,
        metadata: {
          bookingId,
          platform: 'devebhyo',
          type: 'service_payment',
        },
        description,
      });
      
      const data = result.data as any;
      
      return {
        id: data.id,
        bookingId,
        paymentIntentId: '', // Will be linked from payment intent
        amount: data.amount,
        currency: data.currency,
        destinationAccountId: data.destination,
        destinationType: 'priest',
        stripeTransferId: data.id,
        transferGroupId: data.transfer_group,
        status: this.mapTransferStatus(data.status),
        createdAt: new Date(data.created * 1000),
        availableOn: new Date(data.available_on * 1000),
        metadata: {
          priestId: stripeAccountId,
          priestName: description.split(' - ')[0] || '',
          serviceType: description.split(' - ')[1] || '',
          bookingDate: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      throw new Error(`Failed to create transfer: ${error.message}`);
    }
  }

  // Update Connect account details
  static async updateAccount(
    stripeAccountId: string,
    updates: {
      businessProfile?: any;
      settings?: any;
      metadata?: any;
    }
  ): Promise<void> {
    try {
      await updateAccountFn({
        accountId: stripeAccountId,
        ...updates,
      });
    } catch (error: any) {
      throw new Error(`Failed to update account: ${error.message}`);
    }
  }

  // Create login link for Express dashboard
  static async createLoginLink(stripeAccountId: string): Promise<string> {
    const createLoginLinkFn = httpsCallable(functions, 'createLoginLink');
    
    try {
      const result = await createLoginLinkFn({ accountId: stripeAccountId });
      const data = result.data as any;
      return data.url;
    } catch (error: any) {
      throw new Error(`Failed to create login link: ${error.message}`);
    }
  }

  // Helper methods
  private static mapAccountStatus(account: any): ConnectAccountStatus {
    if (!account.charges_enabled || !account.payouts_enabled) {
      return 'restricted';
    }
    if (account.requirements?.currently_due?.length > 0) {
      return 'pending';
    }
    return 'enabled';
  }

  private static mapTransferStatus(status: string): Transfer['status'] {
    switch (status) {
      case 'pending':
        return 'pending';
      case 'in_transit':
        return 'in_transit';
      case 'paid':
        return 'paid';
      case 'failed':
        return 'failed';
      case 'reversed':
        return 'reversed';
      default:
        return 'pending';
    }
  }

  // Check if priest can receive payouts
  static canReceivePayouts(account: ConnectAccount): boolean {
    return account.chargesEnabled && account.payoutsEnabled && !account.requiresInfo;
  }

  // Get onboarding status message
  static getOnboardingStatusMessage(account: ConnectAccount): string {
    if (account.accountStatus === 'enabled') {
      return 'Your account is fully set up and ready to receive payments.';
    }
    
    if (account.requirements.errors.length > 0) {
      return 'There are issues with your account that need to be resolved.';
    }
    
    if (account.requirements.currentlyDue.length > 0) {
      return `Please complete ${account.requirements.currentlyDue.length} required items to activate your account.`;
    }
    
    if (account.requirements.eventuallyDue.length > 0) {
      return 'Your account is active but additional information will be required soon.';
    }
    
    return 'Your account is being reviewed.';
  }
}