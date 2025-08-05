import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum("role", ["student", "teacher", "hod", "admin"]);
export const leaveStatusEnum = pgEnum("leave_status", ["pending", "approved", "rejected"]);
export const leaveTypeEnum = pgEnum("leave_type", ["sick", "personal", "emergency", "medical"]);
export const departmentEnum = pgEnum("department", ["CSE", "AIDS", "ECE", "EEE", "MECH", "CIVIL"]);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: roleEnum("role").notNull().default("student"),
  department: departmentEnum("department"),
  year: integer("year"),
  sinNumber: text("sin_number"),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Leave requests table
export const leaveRequests = pgTable("leave_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => users.id),
  type: leaveTypeEnum("type").notNull(),
  fromDate: timestamp("from_date").notNull(),
  toDate: timestamp("to_date").notNull(),
  reason: text("reason").notNull(),
  status: leaveStatusEnum("status").notNull().default("pending"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

// Department assignments table
export const departmentAssignments = pgTable("department_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  department: departmentEnum("department").notNull(),
  year: integer("year").notNull(),
  classAdvisorId: varchar("class_advisor_id").references(() => users.id),
  hodId: varchar("hod_id").references(() => users.id),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  leaveRequests: many(leaveRequests),
  reviewedRequests: many(leaveRequests, {
    relationName: "reviewer",
  }),
  classAdvisorAssignments: many(departmentAssignments, {
    relationName: "classAdvisor",
  }),
  hodAssignments: many(departmentAssignments, {
    relationName: "hod",
  }),
}));

export const leaveRequestsRelations = relations(leaveRequests, ({ one }) => ({
  student: one(users, {
    fields: [leaveRequests.studentId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [leaveRequests.reviewedBy],
    references: [users.id],
    relationName: "reviewer",
  }),
}));

export const departmentAssignmentsRelations = relations(departmentAssignments, ({ one }) => ({
  classAdvisor: one(users, {
    fields: [departmentAssignments.classAdvisorId],
    references: [users.id],
    relationName: "classAdvisor",
  }),
  hod: one(users, {
    fields: [departmentAssignments.hodId],
    references: [users.id],
    relationName: "hod",
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertLeaveRequestSchema = createInsertSchema(leaveRequests).omit({
  id: true,
  submittedAt: true,
  status: true,
  reviewedBy: true,
  reviewedAt: true,
});

export const insertDepartmentAssignmentSchema = createInsertSchema(departmentAssignments).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type InsertLeaveRequest = z.infer<typeof insertLeaveRequestSchema>;
export type DepartmentAssignment = typeof departmentAssignments.$inferSelect;
export type InsertDepartmentAssignment = z.infer<typeof insertDepartmentAssignmentSchema>;

// Registration schema for students
export const studentRegistrationSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type StudentRegistration = z.infer<typeof studentRegistrationSchema>;
