import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  projectName: text("project_name"),
  clientName: text("client_name"),
  role: text("role"),
  location: text("location"),
});

// Modified schema: only email is required during registration
export const insertUserSchema = createInsertSchema(users)
  .pick({
    email: true,
    password: true, // Will be auto-generated and sent via email
    firstName: true,
    lastName: true,
    projectName: true,
    clientName: true,
    role: true,
    location: true,
  })
  .partial({
    password: true,
    firstName: true,
    lastName: true,
    projectName: true,
    clientName: true,
    role: true,
    location: true,
  });

export const loginUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Skills Schema
export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  level: text("level").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  certificationUrl: text("certification_url"),
});

export const insertSkillSchema = createInsertSchema(skills).pick({
  userId: true,
  name: true,
  level: true,
  certificationUrl: true,
});

// Skill History Schema
export const skillHistory = pgTable("skill_history", {
  id: serial("id").primaryKey(),
  skillId: integer("skill_id").notNull(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  level: text("level").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  certificationUrl: text("certification_url"),
});

export const insertSkillHistorySchema = createInsertSchema(skillHistory).pick({
  skillId: true,
  userId: true,
  name: true,
  level: true,
  certificationUrl: true,
});

// Profile History Schema
export const profileHistory = pgTable("profile_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  field: text("field").notNull(),
  previousValue: text("previous_value"),
  newValue: text("new_value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProfileHistorySchema = createInsertSchema(profileHistory).pick({
  userId: true,
  field: true,
  previousValue: true,
  newValue: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;

export type Skill = typeof skills.$inferSelect;
export type InsertSkill = z.infer<typeof insertSkillSchema>;

export type SkillHistory = typeof skillHistory.$inferSelect;
export type InsertSkillHistory = z.infer<typeof insertSkillHistorySchema>;

export type ProfileHistory = typeof profileHistory.$inferSelect;
export type InsertProfileHistory = z.infer<typeof insertProfileHistorySchema>;

// Exported constants
export const SKILL_LEVELS = ["Beginner", "Intermediate", "Expert"];
