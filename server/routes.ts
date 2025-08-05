import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertLeaveRequestSchema, insertDepartmentAssignmentSchema } from "@shared/schema";
import { z } from "zod";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Leave request routes
  app.post("/api/leave-requests", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "student") {
        return res.status(403).json({ message: "Access denied" });
      }

      const validatedRequest = insertLeaveRequestSchema.parse({
        ...req.body,
        studentId: req.user.id,
      });

      const leaveRequest = await storage.createLeaveRequest(validatedRequest);
      res.status(201).json(leaveRequest);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/leave-requests/my", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const requests = await storage.getLeaveRequestsByStudent(req.user.id);
      res.json(requests);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/leave-requests/pending", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !["teacher", "hod"].includes(req.user?.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const requests = await storage.getPendingLeaveRequestsForReviewer(req.user.id);
      res.json(requests);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/leave-requests/:id/status", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !["teacher", "hod"].includes(req.user?.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { status } = z.object({ status: z.enum(["approved", "rejected"]) }).parse(req.body);
      const request = await storage.updateLeaveRequestStatus(req.params.id, status, req.user.id);
      
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      res.json(request);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/leave-requests/recent", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !["teacher", "hod"].includes(req.user?.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const requests = await storage.getRecentLeaveRequests(req.user.id, 7);
      res.json(requests);
    } catch (error) {
      next(error);
    }
  });

  // Admin routes
  app.get("/api/users", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/users/:id/role", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { role } = z.object({ role: z.enum(["student", "teacher", "hod", "admin"]) }).parse(req.body);
      const user = await storage.updateUserRole(req.params.id, role);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/department-assignments", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const assignments = await storage.getAllDepartmentAssignments();
      res.json(assignments);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/department-assignments", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const validatedAssignment = insertDepartmentAssignmentSchema.parse(req.body);
      const assignment = await storage.createDepartmentAssignment(validatedAssignment);
      res.status(201).json(assignment);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/department-assignments/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const updateData = insertDepartmentAssignmentSchema.partial().parse(req.body);
      const assignment = await storage.updateDepartmentAssignment(req.params.id, updateData);
      
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }

      res.json(assignment);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
