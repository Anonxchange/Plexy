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
  addressProof: text("address_proof"),
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

export const insertVerificationSchema = createInsertSchema(verifications).omit({
  id: true,
  submittedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Verification = typeof verifications.$inferSelect;
export type InsertVerification = z.infer<typeof insertVerificationSchema>;
