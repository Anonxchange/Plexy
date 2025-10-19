import { sql } from "drizzle-orm";
import { pgTable, text, varchar, numeric, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  dateOfBirth: text("date_of_birth"),
  fullName: text("full_name"),
  country: text("country"),
  verificationLevel: numeric("verification_level", { precision: 3, scale: 1 }).default("0").notNull(),
  lifetimeTradeVolume: numeric("lifetime_trade_volume", { precision: 15, scale: 2 }).default("0"),
  lifetimeSendVolume: numeric("lifetime_send_volume", { precision: 15, scale: 2 }).default("0"),
  referralCode: text("referral_code").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const verifications = pgTable("verifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id),
  requestedLevel: numeric("requested_level", { precision: 3, scale: 1 }).notNull(),
  documentType: text("document_type"),
  documentUrl: text("document_url"),
  documentBackUrl: text("document_back_url"),
  addressProof: text("address_proof"),
  livenessImageUrl: text("liveness_image_url"),
  livenessCheckPassed: text("liveness_check_passed"),
  livenessConfidence: numeric("liveness_confidence", { precision: 4, scale: 3 }),
  livenessCheckedAt: timestamp("liveness_checked_at"),
  status: text("status").default("pending").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by"),
  rejectionReason: text("rejection_reason"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const pexlyBalances = pgTable("pexly_balances", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  balance: numeric("balance", { precision: 15, scale: 2 }).default("0").notNull(),
  lockedBalance: numeric("locked_balance", { precision: 15, scale: 2 }).default("0").notNull(),
  totalReceived: numeric("total_received", { precision: 15, scale: 2 }).default("0").notNull(),
  totalSent: numeric("total_sent", { precision: 15, scale: 2 }).default("0").notNull(),
  cashbackEarned: numeric("cashback_earned", { precision: 15, scale: 2 }).default("0").notNull(),
  autoEarnBalance: numeric("auto_earn_balance", { precision: 15, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const pexlyTransactions = pgTable("pexly_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  receiverId: varchar("receiver_id").notNull().references(() => users.id),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  fee: numeric("fee", { precision: 15, scale: 2 }).default("0").notNull(),
  status: text("status").default("completed").notNull(),
  note: text("note"),
  transactionType: text("transaction_type").default("transfer").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const referrals = pgTable("referrals", {
  id: uuid("id").primaryKey().defaultRandom(),
  referrerId: varchar("referrer_id").notNull().references(() => users.id),
  referredUserId: varchar("referred_user_id").notNull().references(() => users.id).unique(),
  rewardAmount: numeric("reward_amount", { precision: 15, scale: 2 }).default("2.5").notNull(),
  rewardPaid: numeric("reward_paid", { precision: 15, scale: 2 }).default("0").notNull(),
  status: text("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertVerificationSchema = createInsertSchema(verifications).omit({
  id: true,
  submittedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Verification = typeof verifications.$inferSelect;
export type InsertVerification = z.infer<typeof insertVerificationSchema>;
export type PexlyBalance = typeof pexlyBalances.$inferSelect;
export type PexlyTransaction = typeof pexlyTransactions.$inferSelect;
export type Referral = typeof referrals.$inferSelect;
