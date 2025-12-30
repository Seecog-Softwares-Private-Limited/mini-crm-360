// src/billing/constants/billing.constant.js

export const BILLING_STATUS = Object.freeze({
  PENDING: "pending",
  ACTIVE: "active",
  PAST_DUE: "past_due",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
  TRIAL: "trial"
});

export const PAYMENT_STATUS = Object.freeze({
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  REFUNDED: "refunded"
});
