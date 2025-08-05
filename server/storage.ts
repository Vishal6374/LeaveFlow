import { 
  users, 
  leaveRequests, 
  departmentAssignments,
  activityLogs,
  type User, 
  type InsertUser, 
  type LeaveRequest,
  type InsertLeaveRequest,
  type DepartmentAssignment,
  type InsertDepartmentAssignment,
  type ActivityLog,
  type InsertActivityLog
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte, or } from "drizzle-orm";
import session from "express-session";

import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserRole(id: string, role: string): Promise<User | undefined>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  // Leave request operations
  createLeaveRequest(request: InsertLeaveRequest): Promise<LeaveRequest>;
  getLeaveRequestsByStudent(studentId: string): Promise<LeaveRequest[]>;
  getPendingLeaveRequestsForReviewer(reviewerId: string): Promise<(LeaveRequest & { student: User })[]>;
  updateLeaveRequestStatus(id: string, status: string, reviewerId: string): Promise<LeaveRequest | undefined>;
  getRecentLeaveRequests(reviewerId: string, days: number): Promise<(LeaveRequest & { student: User })[]>;

  // Department assignment operations
  getDepartmentAssignment(department: string, year: number): Promise<DepartmentAssignment | undefined>;
  createDepartmentAssignment(assignment: InsertDepartmentAssignment): Promise<DepartmentAssignment>;
  updateDepartmentAssignment(id: string, assignment: Partial<InsertDepartmentAssignment>): Promise<DepartmentAssignment | undefined>;
  getAllDepartmentAssignments(): Promise<(DepartmentAssignment & { classAdvisor?: User; hod?: User })[]>;

  // Activity log operations
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getActivityLogsForReviewer(reviewerId: string): Promise<any[]>;

  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserRole(id: string, role: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role: role as any })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createLeaveRequest(request: InsertLeaveRequest): Promise<LeaveRequest> {
    const [leaveRequest] = await db
      .insert(leaveRequests)
      .values(request)
      .returning();
    return leaveRequest;
  }

  async getLeaveRequestsByStudent(studentId: string): Promise<LeaveRequest[]> {
    return await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.studentId, studentId))
      .orderBy(desc(leaveRequests.submittedAt));
  }

  async getPendingLeaveRequestsForReviewer(reviewerId: string): Promise<(LeaveRequest & { student: User })[]> {
    const reviewer = await this.getUser(reviewerId);
    if (!reviewer) return [];

    if (reviewer.role === 'admin') {
      // Admin can see all pending requests
      const result = await db
        .select({
          id: leaveRequests.id,
          studentId: leaveRequests.studentId,
          type: leaveRequests.type,
          fromDate: leaveRequests.fromDate,
          toDate: leaveRequests.toDate,
          reason: leaveRequests.reason,
          status: leaveRequests.status,
          reviewedBy: leaveRequests.reviewedBy,
          reviewedAt: leaveRequests.reviewedAt,
          submittedAt: leaveRequests.submittedAt,
          student: users,
        })
        .from(leaveRequests)
        .innerJoin(users, eq(leaveRequests.studentId, users.id))
        .where(eq(leaveRequests.status, 'pending'))
        .orderBy(desc(leaveRequests.submittedAt));
      return result;
    }

    if (reviewer.role === 'hod') {
      // HOD can see all pending requests from their department
      const result = await db
        .select({
          id: leaveRequests.id,
          studentId: leaveRequests.studentId,
          type: leaveRequests.type,
          fromDate: leaveRequests.fromDate,
          toDate: leaveRequests.toDate,
          reason: leaveRequests.reason,
          status: leaveRequests.status,
          reviewedBy: leaveRequests.reviewedBy,
          reviewedAt: leaveRequests.reviewedAt,
          submittedAt: leaveRequests.submittedAt,
          student: users,
        })
        .from(leaveRequests)
        .innerJoin(users, eq(leaveRequests.studentId, users.id))
        .where(and(
          eq(leaveRequests.status, 'pending'),
          eq(users.department, reviewer.department!)
        ))
        .orderBy(desc(leaveRequests.submittedAt));
      return result;
    }

    if (reviewer.role === 'teacher') {
      // Teacher can only see requests from classes they are assigned to
      const assignments = await db
        .select()
        .from(departmentAssignments)
        .where(eq(departmentAssignments.classAdvisorId, reviewerId));

      if (assignments.length === 0) return [];

      // Create conditions for each assignment (department + year combination)
      const assignmentConditions = assignments.map(assignment => 
        and(
          eq(users.department, assignment.department),
          eq(users.year, assignment.year)
        )
      );

      const result = await db
        .select({
          id: leaveRequests.id,
          studentId: leaveRequests.studentId,
          type: leaveRequests.type,
          fromDate: leaveRequests.fromDate,
          toDate: leaveRequests.toDate,
          reason: leaveRequests.reason,
          status: leaveRequests.status,
          reviewedBy: leaveRequests.reviewedBy,
          reviewedAt: leaveRequests.reviewedAt,
          submittedAt: leaveRequests.submittedAt,
          student: users,
        })
        .from(leaveRequests)
        .innerJoin(users, eq(leaveRequests.studentId, users.id))
        .where(and(
          eq(leaveRequests.status, 'pending'),
          // Student must be in one of the teacher's assigned classes
          assignmentConditions.length === 1 ? assignmentConditions[0] : or(...assignmentConditions)
        ))
        .orderBy(desc(leaveRequests.submittedAt));
      return result;
    }

    return [];
  }

  async updateLeaveRequestStatus(id: string, status: string, reviewerId: string): Promise<LeaveRequest | undefined> {
    // Get the leave request with student info to determine department/year
    const leaveRequestWithStudent = await db
      .select({
        leaveRequest: leaveRequests,
        student: users
      })
      .from(leaveRequests)
      .innerJoin(users, eq(leaveRequests.studentId, users.id))
      .where(eq(leaveRequests.id, id))
      .limit(1);

    if (leaveRequestWithStudent.length === 0) return undefined;

    const { student } = leaveRequestWithStudent[0];

    // Update the leave request status
    const [request] = await db
      .update(leaveRequests)
      .set({ 
        status: status as any, 
        reviewedBy: reviewerId, 
        reviewedAt: new Date() 
      })
      .where(eq(leaveRequests.id, id))
      .returning();

    // Create activity log for shared viewing between HOD and class advisor
    if (request && student.department && student.year) {
      await this.createActivityLog({
        leaveRequestId: id,
        actionBy: reviewerId,
        action: status,
        department: student.department,
        year: student.year
      });
    }

    return request || undefined;
  }

  async getRecentLeaveRequests(reviewerId: string, days: number): Promise<(LeaveRequest & { student: User })[]> {
    const user = await this.getUser(reviewerId);
    if (!user) return [];

    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    const query = db
      .select({
        id: leaveRequests.id,
        studentId: leaveRequests.studentId,
        type: leaveRequests.type,
        fromDate: leaveRequests.fromDate,
        toDate: leaveRequests.toDate,
        reason: leaveRequests.reason,
        status: leaveRequests.status,
        reviewedBy: leaveRequests.reviewedBy,
        reviewedAt: leaveRequests.reviewedAt,
        submittedAt: leaveRequests.submittedAt,
        student: users,
      })
      .from(leaveRequests)
      .innerJoin(users, eq(leaveRequests.studentId, users.id))
      .where(
        and(
          gte(leaveRequests.submittedAt, dateThreshold),
          eq(leaveRequests.reviewedBy, reviewerId)
        )
      )
      .orderBy(desc(leaveRequests.reviewedAt));

    return await query;
  }

  async getDepartmentAssignment(department: string, year: number): Promise<DepartmentAssignment | undefined> {
    const [assignment] = await db
      .select()
      .from(departmentAssignments)
      .where(
        and(
          eq(departmentAssignments.department, department as any),
          eq(departmentAssignments.year, year)
        )
      );
    return assignment || undefined;
  }

  async createDepartmentAssignment(assignment: InsertDepartmentAssignment): Promise<DepartmentAssignment> {
    const [created] = await db
      .insert(departmentAssignments)
      .values(assignment)
      .returning();
    return created;
  }

  async updateDepartmentAssignment(id: string, assignment: Partial<InsertDepartmentAssignment>): Promise<DepartmentAssignment | undefined> {
    const [updated] = await db
      .update(departmentAssignments)
      .set(assignment)
      .where(eq(departmentAssignments.id, id))
      .returning();
    return updated || undefined;
  }

  async getAllDepartmentAssignments(): Promise<(DepartmentAssignment & { classAdvisor?: User; hod?: User })[]> {
    const result = await db
      .select()
      .from(departmentAssignments);

    // Get class advisor and HOD information for each assignment
    const withDetails = await Promise.all(result.map(async (assignment) => {
      let classAdvisor: User | undefined;
      let hod: User | undefined;
      
      if (assignment.classAdvisorId) {
        classAdvisor = await this.getUser(assignment.classAdvisorId);
      }
      if (assignment.hodId) {
        hod = await this.getUser(assignment.hodId);
      }
      
      return {
        ...assignment,
        classAdvisor,
        hod,
      };
    }));

    return withDetails;
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    return updated || undefined;
  }

  // Activity log operations
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [result] = await db
      .insert(activityLogs)
      .values(log)
      .returning();
    return result;
  }

  async getActivityLogsForReviewer(reviewerId: string): Promise<any[]> {
    const reviewer = await this.getUser(reviewerId);
    if (!reviewer) return [];

    let query;

    if (reviewer.role === 'admin') {
      // Admin can see all activity logs
      query = db
        .select({
          id: activityLogs.id,
          leaveRequestId: activityLogs.leaveRequestId,
          actionBy: activityLogs.actionBy,
          action: activityLogs.action,
          actionAt: activityLogs.actionAt,
          department: activityLogs.department,
          year: activityLogs.year,
          leaveRequest: {
            id: leaveRequests.id,
            studentId: leaveRequests.studentId,
            type: leaveRequests.type,
            fromDate: leaveRequests.fromDate,
            toDate: leaveRequests.toDate,
            reason: leaveRequests.reason,
            status: leaveRequests.status,
            reviewedBy: leaveRequests.reviewedBy,
            reviewedAt: leaveRequests.reviewedAt,
            submittedAt: leaveRequests.submittedAt,
            student: {
              id: users.id,
              username: users.username,
              name: users.name,
              role: users.role,
              department: users.department,
              year: users.year,
              email: users.email,
              sinNumber: users.sinNumber,
              password: users.password,
              createdAt: users.createdAt,
            }
          },
          actionBy: {
            id: users.id,
            username: users.username,
            name: users.name,
            role: users.role,
            department: users.department,
            year: users.year,
            email: users.email,
            sinNumber: users.sinNumber,
            password: users.password,
            createdAt: users.createdAt,
          }
        })
        .from(activityLogs)
        .innerJoin(leaveRequests, eq(activityLogs.leaveRequestId, leaveRequests.id))
        .innerJoin(users, eq(leaveRequests.studentId, users.id))
        .innerJoin(users, eq(activityLogs.actionBy, users.id))
        .orderBy(desc(activityLogs.actionAt));
    } else if (reviewer.role === 'hod') {
      // HOD can see activity logs for their department
      query = db
        .select({
          id: activityLogs.id,
          leaveRequestId: activityLogs.leaveRequestId,
          actionBy: activityLogs.actionBy,
          action: activityLogs.action,
          actionAt: activityLogs.actionAt,
          department: activityLogs.department,
          year: activityLogs.year,
          leaveRequest: leaveRequests,
          actionBy: users
        })
        .from(activityLogs)
        .innerJoin(leaveRequests, eq(activityLogs.leaveRequestId, leaveRequests.id))
        .innerJoin(users, eq(activityLogs.actionBy, users.id))
        .where(eq(activityLogs.department, reviewer.department!))
        .orderBy(desc(activityLogs.actionAt));
    } else if (reviewer.role === 'teacher') {
      // Teacher can see activity logs for classes they are assigned to
      const assignments = await db
        .select()
        .from(departmentAssignments)
        .where(eq(departmentAssignments.classAdvisorId, reviewerId));

      if (assignments.length === 0) return [];

      const assignmentConditions = assignments.map(assignment => 
        and(
          eq(activityLogs.department, assignment.department),
          eq(activityLogs.year, assignment.year)
        )
      );

      query = db
        .select({
          id: activityLogs.id,
          leaveRequestId: activityLogs.leaveRequestId,
          actionBy: activityLogs.actionBy,
          action: activityLogs.action,
          actionAt: activityLogs.actionAt,
          department: activityLogs.department,
          year: activityLogs.year,
          leaveRequest: leaveRequests,
          actionBy: users
        })
        .from(activityLogs)
        .innerJoin(leaveRequests, eq(activityLogs.leaveRequestId, leaveRequests.id))
        .innerJoin(users, eq(activityLogs.actionBy, users.id))
        .where(assignmentConditions.length === 1 ? assignmentConditions[0] : or(...assignmentConditions))
        .orderBy(desc(activityLogs.actionAt));
    } else {
      return [];
    }

    const result = await query;
    
    // For each result, fetch the student info for the leave request
    const withStudentInfo = await Promise.all(result.map(async (log) => {
      const student = await this.getUser(log.leaveRequest.studentId);
      return {
        ...log,
        leaveRequest: {
          ...log.leaveRequest,
          student: student!
        }
      };
    }));

    return withStudentInfo as any;
  }
}

export const storage = new DatabaseStorage();
