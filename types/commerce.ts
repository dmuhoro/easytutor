export type TransactionStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'REVERSED'
  | 'CANCELLED'
  | 'EXPIRED';

export type PaymentProvider =
  | 'MPESA'
  | 'AIRTEL_MONEY'
  | 'MTN_MOMO'
  | 'STRIPE'
  | 'FLUTTERWAVE'
  | 'PAYSTACK';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export interface Amount {
  value: number;
  currency: string;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: Amount;
  provider: PaymentProvider;
  providerReference?: string;
  status: TransactionStatus;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRequest {
  userId: string;
  amount: Amount;
  provider: PaymentProvider;
  phoneNumber?: string;
  email?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  providerReference?: string;
  error?: string;
  status: TransactionStatus;
}

export interface SettlementRecord {
  id: string;
  transactionId: string;
  amount: Amount;
  settledAt: string;
  verified: boolean;
}
