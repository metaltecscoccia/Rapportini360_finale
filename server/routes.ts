import type { Express } from "express";
import { createServer, type Server } from "http";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { storage } from "./storage";
import { WordService } from "./wordService";
import { txtService } from "./txtService";
import { generateAttendanceExcel } from "./excelService";
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import streamifier from 'streamifier';
import { getTodayISO } from "@shared/dateUtils";
import {
  insertUserSchema,
  updateUserSchema,
  insertDailyReportSchema,
  updateDailyReportSchema,
  insertOperationSchema,
  updateOperationSchema,
  insertClientSchema,
  insertWorkTypeSchema,
  insertMaterialSchema,
  insertWorkOrderSchema,
  insertAttendanceEntrySchema,
  updateAttendanceEntrySchema,
  insertHoursAdjustmentSchema,
  updateHoursAdjustmentSchema,
  insertVehicleSchema,
  updateVehicleSchema,
  insertFuelRefillSchema,
  updateFuelRefillSchema,
  insertFuelTankLoadSchema,
  updateFuelTankLoadSchema,
  insertOrganizationSchema,
} from "@shared/schema";
import { validatePassword, verifyPassword, hashPassword } from "./auth";
import { generateTemporaryPassword } from "./utils/passwordGenerator";

// ============================================
// CLOUDINARY & MULTER CONFIGURATION
// ============================================

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage() });

// ============================================
// RATE LIMITING - Protezione contro brute force
// ============================================

// Rate limiter generale per API: max 100 richieste per 15 minuti
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Troppi richieste. Riprova più tardi." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === "development",
});

// ============================================
// MIDDLEWARE DI AUTENTICAZIONE
// ============================================

const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Autenticazione richiesta" });
  }
  next();
};

const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Autenticazione richiesta" });
  }
  if (req.session.userRole !== "admin") {
    return res
      .status(403)
      .json({ error: "Accesso riservato agli amministratori" });
  }
  next();
};

const requireSuperAdmin = (req: any, res: any, next: any) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Autenticazione richiesta" });
  }
  if (req.session.userRole !== "superadmin") {
    return res
      .status(403)
      .json({ error: "Accesso riservato ai super amministratori" });
  }
  next();
};

// ============================================
// ROUTES
// ============================================

export async function registerRoutes(app: Express): Promise<Server> {
  const wordService = new WordService();

  // ============================================
  // AUTHENTICATION (senza rate limiting)
  // ============================================

  // Login route (senza rate limiting)
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username) {
        return res.status(400).json({ error: "Username è richiesto" });
      }

      if (!password) {
        return res.status(400).json({ error: "Password è richiesta" });
      }

      // Get user by username
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Credenziali non valide" });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({ error: "Account disabilitato. Contattare l'amministratore." });
      }

      // Verify password for ALL users (including admin)
      const isValidPassword = await verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Credenziali non valide" });
      }

      // Create session
      (req as any).session.userId = user.id;
      (req as any).session.userRole = user.role;
      (req as any).session.organizationId = user.organizationId;

      // DEBUG: Log session info
      console.log(`[LOGIN] User: ${user.username}, OrgId: ${user.organizationId}, SessionOrgId: ${(req as any).session.organizationId}`);

      // Return user data without password
      const { password: _, ...userWithoutPassword } = user;

      // Check if user must reset password (temporary password)
      if (user.mustResetPassword) {
        return res.json({
          success: true,
          user: userWithoutPassword,
          mustResetPassword: true, // Client will redirect to SetPasswordForm
        });
      }

      res.json({
        success: true,
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  });

  // Logout route
  app.post("/api/logout", (req: any, res: any) => {
    req.session.destroy((err: any) => {
      if (err) {
        console.error("Error during logout:", err);
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true, message: "Logout effettuato con successo" });
    });
  });

  // Applica rate limiting generale a tutte le altre API
  app.use("/api", apiLimiter);

  // ============================================
  // SUPER ADMIN - GESTIONE ORGANIZZAZIONI
  // ============================================

  // Get all organizations (super admin only)
  app.get("/api/superadmin/organizations", requireSuperAdmin, async (req, res) => {
    try {
      const organizations = await storage.getAllOrganizations();
      res.json(organizations);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ error: "Failed to fetch organizations" });
    }
  });

  // Create new organization (super admin only)
  app.post("/api/superadmin/organizations", requireSuperAdmin, async (req, res) => {
    try {
      const result = insertOrganizationSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({ error: "Invalid organization data", issues: result.error.issues });
      }

      // Check if organization name already exists
      const existingOrg = await storage.getOrganizationByName(result.data.name);
      if (existingOrg) {
        return res.status(400).json({ error: "Un'organizzazione con questo nome esiste già" });
      }

      const organization = await storage.createOrganization(result.data);
      res.status(201).json(organization);
    } catch (error) {
      console.error("Error creating organization:", error);
      res.status(500).json({ error: "Failed to create organization" });
    }
  });

  // Toggle organization active status (super admin only) - NO DELETE
  app.put("/api/superadmin/organizations/:id/status", requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== "boolean") {
        return res.status(400).json({ error: "isActive deve essere true o false" });
      }

      const organization = await storage.updateOrganizationStatus(id, isActive);
      if (!organization) {
        return res.status(404).json({ error: "Organizzazione non trovata" });
      }

      res.json(organization);
    } catch (error) {
      console.error("Error updating organization status:", error);
      res.status(500).json({ error: "Failed to update organization status" });
    }
  });

  // Create admin for organization (super admin only)
  app.post("/api/superadmin/organizations/:id/admin", requireSuperAdmin, async (req, res) => {
    try {
      const { id: organizationId } = req.params;
      const { username, password, fullName } = req.body;

      if (!username || !password || !fullName) {
        return res.status(400).json({ error: "username, password e fullName sono richiesti" });
      }

      // Check if organization exists
      const organization = await storage.getOrganization(organizationId);
      if (!organization) {
        return res.status(404).json({ error: "Organizzazione non trovata" });
      }

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username già in uso" });
      }

      // Create admin - password will be hashed by storage.createUser
      const admin = await storage.createUser({
        username,
        password,
        fullName,
        role: "admin",
      }, organizationId);

      const { password: _, ...adminWithoutPassword } = admin;
      res.status(201).json(adminWithoutPassword);
    } catch (error) {
      console.error("Error creating admin:", error);
      res.status(500).json({ error: "Failed to create admin" });
    }
  });

  // Get admins for an organization (super admin only)
  app.get("/api/superadmin/organizations/:id/admins", requireSuperAdmin, async (req, res) => {
    try {
      const { id: organizationId } = req.params;
      
      const organization = await storage.getOrganization(organizationId);
      if (!organization) {
        return res.status(404).json({ error: "Organizzazione non trovata" });
      }

      const users = await storage.getAllUsers(organizationId);
      const admins = users.filter(u => u.role === "admin").map(({ password, ...admin }) => admin);
      
      res.json(admins);
    } catch (error) {
      console.error("Error fetching admins:", error);
      res.status(500).json({ error: "Failed to fetch admins" });
    }
  });

  // Update admin for an organization (super admin only)
  app.put("/api/superadmin/organizations/:id/admin/:adminId", requireSuperAdmin, async (req, res) => {
    try {
      const { id: organizationId, adminId } = req.params;
      
      // Validate request body
      const updateAdminSchema = z.object({
        username: z.string().min(3, "Username deve avere almeno 3 caratteri"),
        fullName: z.string().min(2, "Nome deve avere almeno 2 caratteri"),
        password: z.string().min(1).optional(),
      });
      
      const parsed = updateAdminSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Dati non validi", details: parsed.error });
      }
      
      const { username, password, fullName } = parsed.data;

      // Check if organization exists
      const organization = await storage.getOrganization(organizationId);
      if (!organization) {
        return res.status(404).json({ error: "Organizzazione non trovata" });
      }

      // Check if admin exists and belongs to this organization
      const existingAdmin = await storage.getUser(adminId);
      if (!existingAdmin || existingAdmin.organizationId !== organizationId || existingAdmin.role !== "admin") {
        return res.status(404).json({ error: "Admin non trovato" });
      }

      // Check if username is already taken by another user
      if (username !== existingAdmin.username) {
        const userWithUsername = await storage.getUserByUsername(username);
        if (userWithUsername && userWithUsername.id !== adminId) {
          return res.status(400).json({ error: "Username già in uso" });
        }
      }

      // Build update data - password will be hashed by storage.updateUser
      const updateData: { username: string; password?: string; fullName: string } = { username, fullName };
      if (password) updateData.password = password;

      const updatedAdmin = await storage.updateUser(adminId, updateData, existingAdmin.organizationId);
      const { password: _, ...adminWithoutPassword } = updatedAdmin;
      
      res.json(adminWithoutPassword);
    } catch (error) {
      console.error("Error updating admin:", error);
      res.status(500).json({ error: "Failed to update admin" });
    }
  });

  // Delete admin for an organization (super admin only)
  app.delete("/api/superadmin/organizations/:id/admin/:adminId", requireSuperAdmin, async (req, res) => {
    try {
      const { id: organizationId, adminId } = req.params;

      // Check if organization exists
      const organization = await storage.getOrganization(organizationId);
      if (!organization) {
        return res.status(404).json({ error: "Organizzazione non trovata" });
      }

      // Check if admin exists and belongs to this organization
      const existingAdmin = await storage.getUser(adminId);
      if (!existingAdmin || existingAdmin.organizationId !== organizationId || existingAdmin.role !== "admin") {
        return res.status(404).json({ error: "Admin non trovato" });
      }

      // Delete the admin
      await storage.deleteUser(adminId, existingAdmin.organizationId);
      
      res.json({ success: true, message: "Admin eliminato con successo" });
    } catch (error) {
      console.error("Error deleting admin:", error);
      res.status(500).json({ error: "Failed to delete admin" });
    }
  });

  // Get organization details with admin count (super admin only)
  app.get("/api/superadmin/organizations/:id", requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const organization = await storage.getOrganization(id);
      
      if (!organization) {
        return res.status(404).json({ error: "Organizzazione non trovata" });
      }

      // Get admin and employee counts for this organization
      const users = await storage.getAllUsers(id);
      const adminCount = users.filter(u => u.role === "admin").length;
      const employeeCount = users.filter(u => u.role === "employee" && u.isActive !== false).length;

      res.json({
        ...organization,
        adminCount,
        employeeCount,
      });
    } catch (error) {
      console.error("Error fetching organization:", error);
      res.status(500).json({ error: "Failed to fetch organization" });
    }
  });

  // ============================================
  // USER MANAGEMENT
  // ============================================

  // Get current user info
  app.get("/api/me", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session.userId;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Get all users (admin only)
  app.get("/api/users", requireAdmin, async (req, res) => {
    try {
      const organizationId = (req as any).session.organizationId;
      const users = await storage.getAllUsers(organizationId);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/users/active", requireAdmin, async (req, res) => {
    try {
      const organizationId = (req as any).session.organizationId;
      const users = await storage.getActiveUsers(organizationId);
      res.json(users);
    } catch (error) {
      console.error("Error fetching active users:", error);
      res.status(500).json({ error: "Failed to fetch active users" });
    }
  });

  // Create new user (admin only)
  app.post("/api/users", requireAdmin, async (req, res) => {
    try {
      const result = insertUserSchema.safeParse(req.body);

      if (!result.success) {
        console.error("User validation failed:", result.error.issues);
        return res
          .status(400)
          .json({ error: "Invalid user data", issues: result.error.issues });
      }

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(
        result.data.username,
      );
      if (existingUser) {
        return res.status(400).json({ error: "Username già esistente" });
      }

      const organizationId = (req as any).session.organizationId;

      // Generate temporary password for new employee
      const tempPassword = generateTemporaryPassword();

      // Create user with temp password and mustResetPassword flag
      const user = await storage.createUser({
        ...result.data,
        password: tempPassword,
        mustResetPassword: true,
      }, organizationId);

      // Return user + temporary password (shown once to admin)
      const { password: _, ...userWithoutPassword } = user;
      res.json({
        ...userWithoutPassword,
        temporaryPassword: tempPassword, // Admin must communicate this to employee
      });
    } catch (error: any) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Update user (admin only)
  app.put("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).session.organizationId;
      const result = updateUserSchema.safeParse(req.body);

      if (!result.success) {
        return res
          .status(400)
          .json({ error: "Invalid user data", issues: result.error.issues });
      }

      const existingUser = await storage.getUser(id, organizationId);
      if (!existingUser) {
        return res.status(404).json({ error: "Utente non trovato" });
      }

      // If updating username, check it doesn't exist
      if (
        result.data.username &&
        result.data.username !== existingUser.username
      ) {
        const existingUserWithUsername = await storage.getUserByUsername(
          result.data.username,
        );
        if (existingUserWithUsername && existingUserWithUsername.organizationId === organizationId) {
          return res.status(400).json({ error: "Username già esistente" });
        }
      }

      const updatedUser = await storage.updateUser(id, result.data, organizationId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Get daily reports count for a user (admin only)
  app.get(
    "/api/users/:id/daily-reports/count",
    requireAdmin,
    async (req, res) => {
      try {
        const { id } = req.params;
        const count = await storage.getDailyReportsCountByEmployeeId(id);
        res.json({ count });
      } catch (error) {
        console.error("Error counting daily reports:", error);
        res.status(500).json({ error: "Failed to count daily reports" });
      }
    },
  );

  // Delete user (admin only)
  app.delete("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).session.organizationId;

      const existingUser = await storage.getUser(id, organizationId);
      if (!existingUser) {
        return res.status(404).json({ error: "Utente non trovato" });
      }

      // Prevent deletion of admin users
      if (existingUser.role === "admin") {
        return res
          .status(403)
          .json({ error: "Non è possibile eliminare utenti amministratori" });
      }

      const deleted = await storage.deleteUser(id, organizationId);

      if (deleted) {
        res.json({ success: true, message: "Utente eliminato con successo" });
      } else {
        res.status(500).json({ error: "Failed to delete user" });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Update user status (enable/disable account) - admin only
  app.put("/api/users/:id/status", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const organizationId = (req as any).session.organizationId;

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ error: "isActive deve essere true o false" });
      }

      const existingUser = await storage.getUser(id, organizationId);
      if (!existingUser) {
        return res.status(404).json({ error: "Utente non trovato" });
      }

      // Prevent disabling admin users
      if (existingUser.role === "admin") {
        return res
          .status(403)
          .json({ error: "Non è possibile disabilitare utenti amministratori" });
      }

      const updatedUser = await storage.updateUserStatus(id, isActive, organizationId);

      res.json({
        success: true,
        message: isActive ? "Utente abilitato con successo" : "Utente disabilitato con successo",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ error: "Failed to update user status" });
    }
  });

  // Reset user password (admin only) - Generates temporary password
  app.post("/api/users/:id/reset-password", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).session.organizationId;

      const existingUser = await storage.getUser(id, organizationId);
      if (!existingUser) {
        return res.status(404).json({ error: "Utente non trovato" });
      }

      // Prevent reset of admin password
      if (existingUser.role === "admin") {
        return res
          .status(403)
          .json({
            error: "Non è possibile resettare la password dell'amministratore",
          });
      }

      // Generate temporary password
      const tempPassword = generateTemporaryPassword();

      // Update user with temp password and mustResetPassword flag
      const updatedUser = await storage.updateUser(id, {
        password: tempPassword,
        mustResetPassword: true,
      }, organizationId);

      // Return temporary password to admin (shown only once)
      res.json({
        success: true,
        message: "Password temporanea generata con successo.",
        username: existingUser.username,
        fullName: existingUser.fullName,
        temporaryPassword: tempPassword, // Admin must communicate this to employee
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  });

  // Set permanent password (employee after first login with temp password)
  app.post("/api/set-password", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session.userId;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.trim().length < 8) {
        return res.status(400).json({
          error: "La password deve essere di almeno 8 caratteri"
        });
      }

      // Validate password strength: at least 1 uppercase, 1 number
      const hasUppercase = /[A-Z]/.test(newPassword);
      const hasNumber = /[0-9]/.test(newPassword);

      if (!hasUppercase || !hasNumber) {
        return res.status(400).json({
          error: "La password deve contenere almeno una lettera maiuscola e un numero"
        });
      }

      const user = await storage.getUser(userId, (req as any).session.organizationId);
      if (!user) {
        return res.status(404).json({ error: "Utente non trovato" });
      }

      // Prevent admin from using this endpoint
      if (user.role === "admin") {
        return res.status(403).json({
          error: "Gli amministratori non possono usare questo endpoint"
        });
      }

      // Update password and clear mustResetPassword flag
      await storage.updateUser(userId, {
        password: newPassword.trim(),
        mustResetPassword: false,
      }, (req as any).session.organizationId);

      res.json({
        success: true,
        message: "Password impostata con successo.",
      });
    } catch (error) {
      console.error("Error setting password:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  });

  // ============================================
  // CLIENTS
  // ============================================

  app.get("/api/clients", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as any).session.organizationId;
      console.log(`[GET /api/clients] SessionOrgId: ${organizationId}`);
      const clients = await storage.getAllClients(organizationId);
      console.log(`[GET /api/clients] Found ${clients.length} clients for org ${organizationId}`);
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  app.post("/api/clients", requireAdmin, async (req, res) => {
    try {
      const result = insertClientSchema.safeParse(req.body);

      if (!result.success) {
        return res
          .status(400)
          .json({
            error: "Dati cliente non validi",
            issues: result.error.issues,
          });
      }

      const organizationId = (req as any).session.organizationId;
      const client = await storage.createClient(result.data, organizationId);
      res.status(201).json(client);
    } catch (error: any) {
      console.error("Error creating client:", error);
      res.status(500).json({ error: "Failed to create client" });
    }
  });

  app.get(
    "/api/clients/:id/work-orders/count",
    requireAdmin,
    async (req, res) => {
      try {
        const { id } = req.params;
        const count = await storage.getWorkOrdersCountByClientId(id);
        res.json({ count });
      } catch (error) {
        console.error("Error counting work orders:", error);
        res.status(500).json({ error: "Failed to count work orders" });
      }
    },
  );

  app.get(
    "/api/clients/:id/operations/count",
    requireAdmin,
    async (req, res) => {
      try {
        const { id } = req.params;
        const count = await storage.getOperationsCountByClientId(id);
        res.json({ count });
      } catch (error) {
        console.error("Error counting operations:", error);
        res.status(500).json({ error: "Failed to count operations" });
      }
    },
  );

  app.delete("/api/clients/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).session.organizationId;

      // deleteClient now handles cascading deletes internally with org validation
      const deleted = await storage.deleteClient(id, organizationId);

      if (!deleted) {
        return res.status(404).json({ error: "Cliente non trovato" });
      }

      res.json({ success: true, message: "Cliente eliminato con successo" });
    } catch (error: any) {
      console.error("Error deleting client:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to delete client" });
    }
  });

  // ============================================
  // WORK TYPES (Lavorazioni)
  // ============================================

  app.get("/api/work-types", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as any).session.organizationId;
      const workTypes = await storage.getAllWorkTypes(organizationId);
      res.json(workTypes);
    } catch (error) {
      console.error("Error fetching work types:", error);
      res.status(500).json({ error: "Failed to fetch work types" });
    }
  });

  app.post("/api/work-types", requireAdmin, async (req, res) => {
    try {
      const result = insertWorkTypeSchema.safeParse(req.body);

      if (!result.success) {
        return res
          .status(400)
          .json({
            error: "Dati lavorazione non validi",
            issues: result.error.issues,
          });
      }

      const organizationId = (req as any).session.organizationId;
      const workType = await storage.createWorkType(
        result.data,
        organizationId,
      );
      res.status(201).json(workType);
    } catch (error: any) {
      console.error("Error creating work type:", error);
      res.status(500).json({ error: "Failed to create work type" });
    }
  });

  app.patch("/api/work-types/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).session.organizationId;
      const updatedWorkType = await storage.updateWorkType(id, req.body, organizationId);
      res.json(updatedWorkType);
    } catch (error: any) {
      console.error("Error updating work type:", error);
      res.status(500).json({ error: "Failed to update work type" });
    }
  });

  app.delete("/api/work-types/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).session.organizationId;
      const deleted = await storage.deleteWorkType(id, organizationId);

      if (!deleted) {
        return res.status(404).json({ error: "Lavorazione non trovata" });
      }

      res.json({
        success: true,
        message: "Lavorazione eliminata con successo",
      });
    } catch (error: any) {
      console.error("Error deleting work type:", error);
      res.status(500).json({ error: "Failed to delete work type" });
    }
  });

  // ============================================
  // MATERIALS (Materiali)
  // ============================================

  app.get("/api/materials", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as any).session.organizationId;
      const materials = await storage.getAllMaterials(organizationId);
      res.json(materials);
    } catch (error) {
      console.error("Error fetching materials:", error);
      res.status(500).json({ error: "Failed to fetch materials" });
    }
  });

  app.post("/api/materials", requireAdmin, async (req, res) => {
    try {
      const result = insertMaterialSchema.safeParse(req.body);

      if (!result.success) {
        return res
          .status(400)
          .json({
            error: "Dati materiale non validi",
            issues: result.error.issues,
          });
      }

      const organizationId = (req as any).session.organizationId;
      const material = await storage.createMaterial(
        result.data,
        organizationId,
      );
      res.status(201).json(material);
    } catch (error: any) {
      console.error("Error creating material:", error);
      res.status(500).json({ error: "Failed to create material" });
    }
  });

  app.patch("/api/materials/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).session.organizationId;
      const updatedMaterial = await storage.updateMaterial(id, req.body, organizationId);
      res.json(updatedMaterial);
    } catch (error: any) {
      console.error("Error updating material:", error);
      res.status(500).json({ error: "Failed to update material" });
    }
  });

  app.delete("/api/materials/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).session.organizationId;
      const deleted = await storage.deleteMaterial(id, organizationId);

      if (!deleted) {
        return res.status(404).json({ error: "Materiale non trovato" });
      }

      res.json({ success: true, message: "Materiale eliminato con successo" });
    } catch (error: any) {
      console.error("Error deleting material:", error);
      res.status(500).json({ error: "Failed to delete material" });
    }
  });

  // ============================================
  // WORK ORDERS (Commesse)
  // ============================================

  app.get(
    "/api/clients/:clientId/work-orders",
    requireAuth,
    async (req, res) => {
      try {
        const organizationId = (req as any).session.organizationId;
        const workOrders = await storage.getWorkOrdersByClient(
          req.params.clientId,
          organizationId,
        );
        res.json(workOrders);
      } catch (error) {
        console.error("Error fetching work orders:", error);
        res.status(500).json({ error: "Failed to fetch work orders" });
      }
    },
  );

  app.post(
    "/api/clients/:clientId/work-orders",
    requireAdmin,
    async (req, res) => {
      try {
        const { clientId } = req.params;
        const result = insertWorkOrderSchema.safeParse({
          ...req.body,
          clientId,
        });

        if (!result.success) {
          return res
            .status(400)
            .json({
              error: "Dati commessa non validi",
              issues: result.error.issues,
            });
        }

        const organizationId = (req as any).session.organizationId;
        const workOrder = await storage.createWorkOrder(
          result.data,
          organizationId,
        );
        res.status(201).json(workOrder);
      } catch (error: any) {
        console.error("Error creating work order:", error);
        res.status(500).json({ error: "Failed to create work order" });
      }
    },
  );

  app.get("/api/work-orders", requireAdmin, async (req, res) => {
    try {
      const organizationId = (req as any).session.organizationId;
      const workOrders = await storage.getAllWorkOrders(organizationId);
      res.json(workOrders);
    } catch (error: any) {
      console.error("Error fetching work orders:", error);
      res.status(500).json({ error: "Failed to fetch work orders" });
    }
  });

  app.get("/api/work-orders/active", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as any).session.organizationId;
      const workOrders = await storage.getAllActiveWorkOrders(organizationId);
      res.json(workOrders);
    } catch (error: any) {
      console.error("Error fetching active work orders:", error);
      res.status(500).json({ error: "Failed to fetch active work orders" });
    }
  });

  app.get("/api/work-orders/stats", requireAdmin, async (req, res) => {
    try {
      const organizationId = (req as any).session.organizationId;
      const stats = await storage.getWorkOrdersStats(organizationId);
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching work order stats:", error);
      res.status(500).json({ error: "Failed to fetch work order statistics" });
    }
  });

  app.put("/api/work-orders/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).session.organizationId;
      const result = insertWorkOrderSchema.safeParse(req.body);

      if (!result.success) {
        return res
          .status(400)
          .json({
            error: "Dati commessa non validi",
            issues: result.error.issues,
          });
      }

      const updatedWorkOrder = await storage.updateWorkOrder(id, result.data, organizationId);
      res.json(updatedWorkOrder);
    } catch (error: any) {
      console.error("Error updating work order:", error);
      res.status(500).json({ error: "Failed to update work order" });
    }
  });

  app.patch("/api/work-orders/:id/status", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const organizationId = (req as any).session.organizationId;

      if (typeof isActive !== "boolean") {
        return res
          .status(400)
          .json({ error: "isActive deve essere un valore booleano" });
      }

      const updatedWorkOrder = await storage.updateWorkOrderStatus(
        id,
        isActive,
        organizationId
      );
      res.json(updatedWorkOrder);
    } catch (error: any) {
      console.error("Error updating work order status:", error);
      res.status(500).json({ error: "Failed to update work order status" });
    }
  });

  app.delete("/api/work-orders/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).session.organizationId;

      // deleteWorkOrder now handles cascading deletes internally with org validation
      const deleted = await storage.deleteWorkOrder(id, organizationId);
      if (deleted) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Commessa non trovata" });
      }
    } catch (error: any) {
      console.error("Error deleting work order:", error);
      res.status(500).json({ error: "Failed to delete work order" });
    }
  });

  // ============================================
  // DAILY REPORTS (Rapportini)
  // ============================================

  app.get("/api/daily-reports/today", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session.userId;
      const organizationId = (req as any).session.organizationId;
      const today = getTodayISO();

      const report = await storage.getDailyReportByEmployeeAndDate(
        userId,
        today,
        organizationId,
      );

      if (!report) {
        return res
          .status(404)
          .json({ error: "Nessun rapportino trovato per oggi" });
      }

      const operations = await storage.getOperationsByReportId(report.id, organizationId);

      res.json({
        ...report,
        operations,
      });
    } catch (error) {
      console.error("Error fetching today's daily report:", error);
      res.status(500).json({ error: "Failed to fetch today's daily report" });
    }
  });

  app.get("/api/daily-reports", requireAuth, async (req, res) => {
    try {
      const organizationId = (req as any).session.organizationId;
      const daysParam = req.query.days as string;

      let days: number | null = null;

      if (daysParam === "all") {
        days = null;
      } else {
        const parsedDays = parseInt(daysParam || "7", 10);

        if (isNaN(parsedDays) || parsedDays < 0) {
          return res.status(400).json({
            error: "Il parametro 'days' deve essere un numero positivo o 'all'",
          });
        }

        days = parsedDays;
      }

      let reports = await storage.getAllDailyReports(organizationId);

      if (days !== null) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - (days - 1));
        const cutoffDateStr = cutoffDate.toISOString().split("T")[0];

        reports = reports.filter((report) => report.date >= cutoffDateStr);
      }

      const enrichedReports = await Promise.all(
        reports.map(async (report) => {
          const employee = await storage.getUser(report.employeeId);
          const operations = await storage.getOperationsByReportId(report.id, organizationId);

          const totalHours = operations.reduce((total, op) => {
            return total + (Number(op.hours) || 0);
          }, 0);

          return {
            ...report,
            employeeName: employee?.fullName || "Unknown",
            operations: operations.length,
            totalHours: Math.round(totalHours * 10) / 10,
            createdBy: report.createdBy || "employee", // Fallback for legacy reports
          };
        }),
      );

      res.json(enrichedReports);
    } catch (error) {
      console.error("Error fetching daily reports:", error);
      res.status(500).json({ error: "Failed to fetch daily reports" });
    }
  });

  app.get(
    "/api/daily-reports/missing-employees",
    requireAdmin,
    async (req, res) => {
      try {
        const organizationId = (req as any).session.organizationId;
        const date = (req.query.date as string) || getTodayISO();

        const allUsers = await storage.getAllUsers(organizationId);
        const employees = allUsers.filter((user) => user.role === "employee" && user.isActive !== false);

        const reportsForDate = await storage.getDailyReportsByDate(
          date,
          organizationId,
        );
        const employeeIdsWithReports = new Set(
          reportsForDate.map((report) => report.employeeId),
        );

        // Get attendance entries (absences, leaves, etc.) for this date
        const attendanceForDate = await storage.getAttendanceEntriesByDate(
          date,
          organizationId,
        );
        const employeeIdsWithAttendance = new Set(
          attendanceForDate.map((entry) => entry.userId),
        );

        // Exclude employees who have either a report OR an attendance entry
        const missingEmployees = employees
          .filter((employee) => 
            !employeeIdsWithReports.has(employee.id) && 
            !employeeIdsWithAttendance.has(employee.id)
          )
          .map((employee) => ({
            id: employee.id,
            fullName: employee.fullName,
            username: employee.username,
          }));

        res.json({
          date,
          missingCount: missingEmployees.length,
          missingEmployees,
        });
      } catch (error) {
        console.error("Error fetching missing employees:", error);
        res.status(500).json({ error: "Failed to fetch missing employees" });
      }
    },
  );

  app.post("/api/daily-reports", requireAuth, async (req, res) => {
    try {
      const { operations, date, employeeId } = req.body;

      const userId = (req as any).session.userId;
      const userRole = (req as any).session.userRole;
      const organizationId = (req as any).session.organizationId;

      let actualEmployeeId = userId;

      if (employeeId && employeeId !== userId) {
        if (userRole !== "admin") {
          return res.status(403).json({
            error:
              "Solo gli amministratori possono creare rapportini per altri dipendenti",
          });
        }

        const targetEmployee = await storage.getUser(employeeId);
        if (!targetEmployee) {
          return res.status(404).json({ error: "Dipendente non trovato" });
        }
        if (targetEmployee.organizationId !== organizationId) {
          return res.status(403).json({ error: "Accesso negato" });
        }

        actualEmployeeId = employeeId;
      }

      const reportData = {
        employeeId: actualEmployeeId,
        date: date || new Date().toISOString().split("T")[0],
        status: "In attesa",
        createdBy: (employeeId && employeeId !== userId) ? "admin" : "employee",
      };

      const reportResult = insertDailyReportSchema.safeParse(reportData);
      if (!reportResult.success) {
        return res
          .status(400)
          .json({
            error: "Dati rapportino non validi",
            issues: reportResult.error.issues,
          });
      }

      const newReport = await storage.createDailyReport(
        reportResult.data,
        organizationId,
      );

      if (operations && Array.isArray(operations)) {
        for (const operation of operations) {
          const operationData = {
            ...operation,
            dailyReportId: newReport.id,
          };

          const operationResult =
            insertOperationSchema.safeParse(operationData);

          if (operationResult.success) {
            await storage.createOperation(operationResult.data, organizationId);
          }
        }
      }

      const finalOperations = await storage.getOperationsByReportId(
        newReport.id,
        organizationId
      );

      res.status(201).json({
        ...newReport,
        operations: finalOperations,
      });
    } catch (error) {
      console.error("Error creating daily report:", error);
      res.status(500).json({ error: "Failed to create daily report" });
    }
  });

  app.post("/api/operations", requireAuth, async (req, res) => {
    try {
      const operationData = req.body;
      const organizationId = (req as any).session.organizationId;

      const operationResult = insertOperationSchema.safeParse(operationData);
      if (!operationResult.success) {
        return res.status(400).json({
          error: "Dati operazione non validi",
          issues: operationResult.error.issues,
        });
      }

      const newOperation = await storage.createOperation(operationResult.data, organizationId);

      res.status(201).json(newOperation);
    } catch (error) {
      console.error("Error creating operation:", error);
      res.status(500).json({ error: "Failed to create operation" });
    }
  });

  // Export daily reports as Word document (admin only)
  app.get("/api/export/daily-reports/:date", requireAdmin, async (req, res) => {
    try {
      const { date } = req.params;
      const organizationId = (req as any).session.organizationId;

      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res
          .status(400)
          .json({ error: "Invalid date format. Use YYYY-MM-DD" });
      }

      const docBuffer = await wordService.generateDailyReportWord(
        date,
        organizationId,
      );

      const filename = `Rapportini_${date}.docx`;

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`,
      );
      res.setHeader("Content-Length", docBuffer.length);

      res.send(docBuffer);
    } catch (error) {
      console.error("Error generating Word document:", error);
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to generate Word report" });
      }
    }
  });

  // Export daily reports as TXT document (admin only)
  app.get("/api/export/daily-reports-txt/:date", requireAdmin, async (req, res) => {
    try {
      const { date } = req.params;
      const organizationId = (req as any).session.organizationId;

      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res
          .status(400)
          .json({ error: "Invalid date format. Use YYYY-MM-DD" });
      }

      const txtContent = await txtService.generateDailyReportTxt(
        date,
        organizationId,
      );

      const filename = `Rapportini_${date}.txt`;

      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`,
      );
      res.setHeader("Content-Length", Buffer.byteLength(txtContent, 'utf8'));

      res.send(txtContent);
    } catch (error) {
      console.error("Error generating TXT document:", error);
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to generate TXT report" });
      }
    }
  });

  app.get("/api/export/daily-reports-range", requireAdmin, async (req, res) => {
    try {
      const { from, to, status, search } = req.query;
      const organizationId = (req as any).session.organizationId;

      const docBuffer = await wordService.generateDailyReportWordRange(
        {
          fromDate: from as string | undefined,
          toDate: to as string | undefined,
          status: status as string | undefined,
          searchTerm: search as string | undefined,
        },
        organizationId,
      );

      let filename = "Rapportini";
      if (from && to) {
        filename += `_${from}_${to}`;
      } else if (from) {
        filename += `_da_${from}`;
      } else if (to) {
        filename += `_fino_${to}`;
      } else {
        filename += `_${new Date().toISOString().split("T")[0]}`;
      }
      filename += ".docx";

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`,
      );
      res.setHeader("Content-Length", docBuffer.length);

      res.send(docBuffer);
    } catch (error) {
      console.error("Error generating filtered Word document:", error);
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res
          .status(500)
          .json({ error: "Failed to generate filtered Word report" });
      }
    }
  });

  app.get("/api/export/daily-reports-txt-range", requireAdmin, async (req, res) => {
    try {
      const { from, to, status, search } = req.query;
      const organizationId = (req as any).session.organizationId;

      const txtContent = await txtService.generateDailyReportTxtRange(
        {
          fromDate: from as string | undefined,
          toDate: to as string | undefined,
          status: status as string | undefined,
          searchTerm: search as string | undefined,
        },
        organizationId,
      );

      let filename = "Rapportini";
      if (from && to) {
        filename += `_${from}_${to}`;
      } else if (from) {
        filename += `_da_${from}`;
      } else if (to) {
        filename += `_fino_${to}`;
      } else {
        filename += `_${new Date().toISOString().split("T")[0]}`;
      }
      filename += ".txt";

      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`,
      );
      res.setHeader("Content-Length", Buffer.byteLength(txtContent, 'utf8'));

      res.send(txtContent);
    } catch (error) {
      console.error("Error generating filtered TXT document:", error);
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res
          .status(500)
          .json({ error: "Failed to generate filtered TXT report" });
      }
    }
  });

  app.get(
    "/api/export/work-order/:workOrderId",
    requireAdmin,
    async (req, res) => {
      try {
        const { workOrderId } = req.params;
        const organizationId = (req as any).session.organizationId;

        const docBuffer = await wordService.generateWorkOrderReportWord(
          workOrderId,
          organizationId,
        );

        const workOrder = await storage.getWorkOrder(
          workOrderId,
          organizationId,
        );
        const filename = `Commessa_${workOrder?.name.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().split("T")[0]}.docx`;

        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${filename}"`,
        );
        res.setHeader("Content-Length", docBuffer.length);

        res.send(docBuffer);
      } catch (error) {
        console.error("Error generating work order Word document:", error);
        if (error instanceof Error) {
          res.status(500).json({ error: error.message });
        } else {
          res
            .status(500)
            .json({ error: "Failed to generate work order report" });
        }
      }
    },
  );

  app.get("/api/daily-reports/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).session.organizationId;

      const report = await storage.getDailyReport(id, organizationId);
      if (!report) {
        return res.status(404).json({ error: "Rapportino non trovato" });
      }

      const operations = await storage.getOperationsByReportId(id, organizationId);

      const enrichedOperations = await Promise.all(
        operations.map(async (op) => {
          const client = await storage
            .getAllClients(organizationId)
            .then((clients) => clients.find((c) => c.id === op.clientId));
          const workOrder = await storage
            .getWorkOrdersByClient(op.clientId, organizationId)
            .then((orders) => orders.find((wo) => wo.id === op.workOrderId));

          return {
            ...op,
            clientName: client?.name || "Cliente eliminato",
            workOrderName: workOrder?.name || "Commessa sconosciuta",
          };
        }),
      );

      res.json({
        ...report,
        operations: enrichedOperations,
      });
    } catch (error) {
      console.error("Error fetching daily report:", error);
      res.status(500).json({ error: "Failed to fetch daily report" });
    }
  });

  app.put("/api/daily-reports/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { operations } = req.body;
      const organizationId = (req as any).session.organizationId;

      const existingReport = await storage.getDailyReport(id, organizationId);
      if (!existingReport) {
        return res.status(404).json({ error: "Rapportino non trovato" });
      }

      if (
        (req as any).session.userRole !== "admin" &&
        (req as any).session.userId !== existingReport.employeeId
      ) {
        return res
          .status(403)
          .json({ error: "Non autorizzato a modificare questo rapportino" });
      }

      if (operations && Array.isArray(operations)) {
        await storage.deleteOperationsByReportId(id, organizationId);

        for (const operation of operations) {
          const operationResult = insertOperationSchema.safeParse({
            ...operation,
            dailyReportId: id,
          });

          if (operationResult.success) {
            await storage.createOperation(operationResult.data, organizationId);
          }
        }
      }

      const finalOperations = await storage.getOperationsByReportId(id, organizationId);
      res.json({
        ...existingReport,
        operations: finalOperations,
      });
    } catch (error) {
      console.error("Error updating daily report:", error);
      res.status(500).json({ error: "Failed to update daily report" });
    }
  });

  app.patch(
    "/api/daily-reports/:id/approve",
    requireAdmin,
    async (req, res) => {
      try {
        const updatedReport = await storage.updateDailyReportStatus(
          req.params.id,
          "Approvato",
        );
        res.json(updatedReport);
      } catch (error) {
        console.error("Error approving report:", error);
        res.status(500).json({ error: "Failed to approve report" });
      }
    },
  );

  app.patch(
    "/api/daily-reports/:id/change-date",
    requireAdmin,
    async (req, res) => {
      try {
        const { id } = req.params;
        const { newDate } = req.body;
        const organizationId = (req as any).session.organizationId;

        if (!newDate || typeof newDate !== "string") {
          return res.status(400).json({ error: "Data non valida" });
        }

        const existingReport = await storage.getDailyReport(id, organizationId);
        if (!existingReport) {
          return res.status(404).json({ error: "Rapportino non trovato" });
        }

        const conflictingReport = await storage.getDailyReportByEmployeeAndDate(
          existingReport.employeeId,
          newDate,
          organizationId,
        );

        if (conflictingReport && conflictingReport.id !== id) {
          return res.status(409).json({
            error:
              "Esiste già un rapportino per questo dipendente in questa data",
          });
        }

        const updatedReport = await storage.updateDailyReport(id, {
          date: newDate,
        });
        res.json(updatedReport);
      } catch (error) {
        console.error("Error changing report date:", error);
        res
          .status(500)
          .json({ error: "Impossibile modificare la data del rapportino" });
      }
    },
  );

  app.patch("/api/daily-reports/hours", requireAdmin, async (req, res) => {
    try {
      const { userId, date, ordinary, overtime } = req.body;
      const organizationId = (req as any).session.organizationId;

      if (!userId || !date || ordinary === undefined) {
        return res
          .status(400)
          .json({ error: "userId, date, and ordinary are required" });
      }

      const report = await storage.getDailyReportByEmployeeAndDate(
        userId,
        date,
        organizationId,
      );
      if (!report) {
        return res
          .status(404)
          .json({ error: "Rapportino non trovato per questa data" });
      }

      if (report.status !== "Approvato") {
        return res
          .status(400)
          .json({
            error: "Solo i rapportini approvati possono essere modificati",
          });
      }

      const operations = await storage.getOperationsByReportId(report.id, organizationId);
      if (operations.length === 0) {
        return res
          .status(400)
          .json({ error: "Nessuna operazione trovata per questo rapportino" });
      }

      const currentTotal = operations.reduce(
        (sum, op) => sum + Number(op.hours),
        0,
      );
      const targetTotal = Number(ordinary) + Number(overtime || 0);

      if (operations.length === 1) {
        await storage.updateOperation(
          operations[0].id,
          { hours: String(targetTotal) },
          organizationId
        );
      } else {
        if (currentTotal > 0) {
          const scaleFactor = targetTotal / currentTotal;
          for (const op of operations) {
            const newHours = Number(op.hours) * scaleFactor;
            await storage.updateOperation(
              op.id,
              { hours: String(newHours) },
              organizationId
            );
          }
        } else {
          await storage.updateOperation(
            operations[0].id,
            { hours: String(targetTotal) },
            organizationId
          );
          for (let i = 1; i < operations.length; i++) {
            await storage.updateOperation(
              operations[i].id,
              { hours: "0" },
              organizationId
            );
          }
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating report hours:", error);
      res.status(500).json({ error: "Impossibile aggiornare le ore" });
    }
  });

  app.delete("/api/daily-reports/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).session.organizationId;

      const existingReport = await storage.getDailyReport(id, organizationId);
      if (!existingReport) {
        return res.status(404).json({ error: "Rapportino non trovato" });
      }

      await storage.deleteOperationsByReportId(id, organizationId);
      const deleted = await storage.deleteDailyReport(id, organizationId);

      if (deleted) {
        res.json({ success: true });
      } else {
        res.status(500).json({ error: "Failed to delete report" });
      }
    } catch (error) {
      console.error("Error deleting daily report:", error);
      res.status(500).json({ error: "Failed to delete daily report" });
    }
  });

  app.get(
    "/api/work-orders/:workOrderId/operations/count",
    requireAuth,
    async (req, res) => {
      try {
        const { workOrderId } = req.params;
        const organizationId = (req as any).session.organizationId;
        const count =
          await storage.getOperationsCountByWorkOrderId(workOrderId, organizationId);
        res.json({ count });
      } catch (error) {
        console.error("Error fetching work order operations count:", error);
        res.status(500).json({ error: "Failed to fetch operations count" });
      }
    },
  );

  app.get(
    "/api/work-orders/:workOrderId/operations",
    requireAuth,
    async (req, res) => {
      try {
        const { workOrderId } = req.params;
        const organizationId = (req as any).session.organizationId;
        const operations = await storage.getOperationsByWorkOrderId(
          workOrderId,
          organizationId,
        );

        const enrichedOperations = await Promise.all(
          operations.map(async (op) => {
            const dailyReport = await storage
              .getAllDailyReports(organizationId)
              .then((reports) =>
                reports.find((r) => r.id === op.dailyReportId),
              );
            const employee = dailyReport
              ? await storage.getUser(dailyReport.employeeId)
              : null;
            const client = await storage
              .getAllClients(organizationId)
              .then((clients) => clients.find((c) => c.id === op.clientId));
            const workOrder = await storage
              .getWorkOrdersByClient(op.clientId, organizationId)
              .then((orders) => orders.find((wo) => wo.id === op.workOrderId));

            return {
              ...op,
              employeeName: employee?.fullName || "Dipendente sconosciuto",
              employeeId: dailyReport?.employeeId,
              date: dailyReport?.date,
              clientName: client?.name || "Cliente eliminato",
              workOrderName: workOrder?.name || "Commessa sconosciuta",
              reportStatus: dailyReport?.status || "Stato sconosciuto",
            };
          }),
        );

        const approvedOperations = enrichedOperations.filter(
          (op) => op.reportStatus === "Approvato",
        );

        res.json(approvedOperations);
      } catch (error) {
        console.error("Error fetching work order operations:", error);
        res
          .status(500)
          .json({ error: "Failed to fetch work order operations" });
      }
    },
  );

  // ============================================
  // ATTENDANCE ENTRIES (ASSENZE)
  // ============================================

  app.get("/api/attendance-entries", requireAdmin, async (req, res) => {
    try {
      const { year, month } = req.query;

      if (!year || !month) {
        return res.status(400).json({ error: "Year and month are required" });
      }

      const organizationId = (req as any).session.organizationId;
      const entries = await storage.getAllAttendanceEntries(
        organizationId,
        year as string,
        month as string,
      );

      res.json(entries);
    } catch (error) {
      console.error("Error fetching attendance entries:", error);
      res.status(500).json({ error: "Failed to fetch attendance entries" });
    }
  });

  app.post("/api/attendance-entries", requireAdmin, async (req, res) => {
    try {
      const result = insertAttendanceEntrySchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          error: "Dati assenza non validi",
          issues: result.error.issues,
        });
      }

      const organizationId = (req as any).session.organizationId;

      const existing = await storage.getAttendanceEntry(
        result.data.userId,
        result.data.date,
        organizationId,
      );

      if (existing) {
        return res.status(400).json({
          error: "Esiste già un'assenza per questo dipendente in questa data",
        });
      }

      const entry = await storage.createAttendanceEntry(
        result.data,
        organizationId,
      );
      res.json(entry);
    } catch (error) {
      console.error("Error creating attendance entry:", error);
      res.status(500).json({ error: "Failed to create attendance entry" });
    }
  });

  app.put("/api/attendance-entries/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).session.organizationId;
      const result = updateAttendanceEntrySchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          error: "Dati assenza non validi",
          issues: result.error.issues,
        });
      }

      const entry = await storage.updateAttendanceEntry(id, result.data, organizationId);
      res.json(entry);
    } catch (error) {
      console.error("Error updating attendance entry:", error);
      res.status(500).json({ error: "Failed to update attendance entry" });
    }
  });

  app.delete("/api/attendance-entries/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).session.organizationId;
      const deleted = await storage.deleteAttendanceEntry(id, organizationId);

      if (deleted) {
        res.json({ success: true });
      } else {
        res.status(500).json({ error: "Failed to delete attendance entry" });
      }
    } catch (error) {
      console.error("Error deleting attendance entry:", error);
      res.status(500).json({ error: "Failed to delete attendance entry" });
    }
  });

  // ============================================
  // HOURS ADJUSTMENTS
  // ============================================

  app.get(
    "/api/hours-adjustment/:dailyReportId",
    requireAdmin,
    async (req, res) => {
      try {
        const { dailyReportId } = req.params;
        const organizationId = (req as any).session.organizationId;

        const adjustment = await storage.getHoursAdjustment(
          dailyReportId,
          organizationId,
        );
        res.json(adjustment || null);
      } catch (error) {
        console.error("Error fetching hours adjustment:", error);
        res.status(500).json({ error: "Failed to fetch hours adjustment" });
      }
    },
  );

  app.post("/api/hours-adjustment", requireAdmin, async (req, res) => {
    try {
      const result = insertHoursAdjustmentSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          error: "Dati aggiustamento non validi",
          issues: result.error.issues,
        });
      }

      const organizationId = (req as any).session.organizationId;
      const userId = (req as any).session.userId;

      const existing = await storage.getHoursAdjustment(
        result.data.dailyReportId,
        organizationId,
      );

      if (existing) {
        return res.status(400).json({
          error: "Esiste già un aggiustamento per questo rapportino",
        });
      }

      const adjustment = await storage.createHoursAdjustment(
        {
          dailyReportId: result.data.dailyReportId,
          adjustment: result.data.adjustment,
          reason: result.data.reason,
        },
        organizationId,
        userId,
      );
      res.json(adjustment);
    } catch (error) {
      console.error("Error creating hours adjustment:", error);
      res.status(500).json({ error: "Failed to create hours adjustment" });
    }
  });

  app.patch("/api/hours-adjustment/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).session.organizationId;
      const result = updateHoursAdjustmentSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          error: "Dati aggiustamento non validi",
          issues: result.error.issues,
        });
      }

      const adjustment = await storage.updateHoursAdjustment(id, result.data, organizationId);
      res.json(adjustment);
    } catch (error) {
      console.error("Error updating hours adjustment:", error);
      res.status(500).json({ error: "Failed to update hours adjustment" });
    }
  });

  app.delete("/api/hours-adjustment/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).session.organizationId;
      const deleted = await storage.deleteHoursAdjustment(id, organizationId);

      if (deleted) {
        res.json({ success: true });
      } else {
        res.status(500).json({ error: "Failed to delete hours adjustment" });
      }
    } catch (error) {
      console.error("Error deleting hours adjustment:", error);
      res.status(500).json({ error: "Failed to delete hours adjustment" });
    }
  });

  // ============================================
  // MONTHLY ATTENDANCE (FOGLIO PRESENZE)
  // ============================================

  app.get("/api/attendance/monthly", requireAdmin, async (req, res) => {
    try {
      const { year, month } = req.query;

      if (!year || !month) {
        return res.status(400).json({ error: "Year and month are required" });
      }

      const organizationId = (req as any).session.organizationId;
      const data = await storage.getMonthlyAttendance(
        organizationId,
        year as string,
        month as string,
      );

      res.json(data);
    } catch (error) {
      console.error("Error fetching monthly attendance:", error);
      res.status(500).json({ error: "Failed to fetch monthly attendance" });
    }
  });

  app.get("/api/attendance/export-excel", requireAdmin, async (req, res) => {
    try {
      const { year, month } = req.query;

      if (!year || !month) {
        return res.status(400).json({ error: "Year and month are required" });
      }

      const organizationId = (req as any).session.organizationId;
      const buffer = await generateAttendanceExcel(
        organizationId,
        year as string,
        month as string,
      );

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=Presenze_${year}-${month}.xlsx`,
      );

      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error("Error exporting attendance to Excel:", error);
      res.status(500).json({ error: "Failed to export attendance to Excel" });
    }
  });

  // Get attendance statistics (absences) for admin dashboard
  app.get("/api/attendance/stats", requireAdmin, async (req, res) => {
    try {
      // Header anti-cache aggressivi
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
      
      const { days } = req.query;
      const organizationId = (req as any).session.organizationId;
      
      const daysNum = days ? parseInt(days as string, 10) : 90;
      const stats = await storage.getAttendanceStats(organizationId, daysNum);
      
      console.log("[DEBUG] Attendance stats for org", organizationId, ":", JSON.stringify({
        totalAbsences: stats.totalAbsences,
        byEmployeeCount: stats.byEmployee?.length,
        byTypeKeys: Object.keys(stats.byType || {}),
        byMonthCount: stats.byMonth?.length
      }));
      
      res.status(200).json(stats);
    } catch (error) {
      console.error("Error fetching attendance stats:", error);
      res.status(500).json({ error: "Failed to fetch attendance statistics" });
    }
  });

  // Get attendance statistics for a specific employee
  app.get("/api/attendance/stats/:userId", requireAdmin, async (req, res) => {
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      const { userId } = req.params;
      const { days } = req.query;
      const organizationId = (req as any).session.organizationId;
      
      const daysNum = days ? parseInt(days as string, 10) : 90;
      const stats = await storage.getEmployeeAttendanceStats(organizationId, userId, daysNum);
      
      res.status(200).json(stats);
    } catch (error) {
      console.error("Error fetching employee attendance stats:", error);
      res.status(500).json({ error: "Failed to fetch employee attendance statistics" });
    }
  });

  // Export strategic absences report as text
  app.get("/api/attendance/strategic-report", requireAdmin, async (req, res) => {
    try {
      const organizationId = (req as any).session.organizationId;
      const { days } = req.query;
      const daysNum = days ? parseInt(days as string, 10) : 90;
      
      const report = await storage.getStrategicAbsencesReport(organizationId, daysNum);
      
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="report_assenze_strategiche_${new Date().toISOString().split('T')[0]}.txt"`);
      res.send(report);
    } catch (error) {
      console.error("Error generating strategic absences report:", error);
      res.status(500).json({ error: "Failed to generate strategic absences report" });
    }
  });

  // ============================================
  // PHOTO UPLOADS (Cloudinary)
  // ============================================

  app.post("/api/upload", requireAuth, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nessun file caricato" });
      }

      const uploadFromBuffer = (buffer: Buffer): Promise<any> => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "operation-photos",
              resource_type: "image",
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          );
          streamifier.createReadStream(buffer).pipe(uploadStream);
        });
      };

      const result = await uploadFromBuffer(req.file.buffer);
      res.json({ url: result.secure_url });
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
      res.status(500).json({ error: "Errore durante il caricamento dell'immagine" });
    }
  });

  // ============================================
  // VEHICLES (MEZZI)
  // ============================================

  app.get("/api/vehicles", requireAdmin, async (req, res) => {
    try {
      const organizationId = (req as any).session.organizationId;
      const vehiclesList = await storage.getAllVehicles(organizationId);
      res.json(vehiclesList);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      res.status(500).json({ error: "Failed to fetch vehicles" });
    }
  });

  app.post("/api/vehicles", requireAdmin, async (req, res) => {
    try {
      const organizationId = (req as any).session.organizationId;
      const parsed = insertVehicleSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ error: "Invalid vehicle data", details: parsed.error });
      }
      const vehicle = await storage.createVehicle(parsed.data, organizationId);
      res.json(vehicle);
    } catch (error) {
      console.error("Error creating vehicle:", error);
      res.status(500).json({ error: "Failed to create vehicle" });
    }
  });

  app.patch("/api/vehicles/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).session.organizationId;
      const parsed = updateVehicleSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ error: "Invalid vehicle data", details: parsed.error });
      }
      const vehicle = await storage.updateVehicle(
        id,
        parsed.data,
        organizationId,
      );
      res.json(vehicle);
    } catch (error) {
      console.error("Error updating vehicle:", error);
      res.status(500).json({ error: "Failed to update vehicle" });
    }
  });

  app.delete("/api/vehicles/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).session.organizationId;
      const deleted = await storage.deleteVehicle(id, organizationId);
      if (deleted) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Vehicle not found" });
      }
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      res.status(500).json({ error: "Failed to delete vehicle" });
    }
  });

  // ============================================
  // FUEL REFILLS (RIFORNIMENTI)
  // ============================================

  app.get("/api/fuel-refills", requireAdmin, async (req, res) => {
    try {
      const organizationId = (req as any).session.organizationId;
      const refills = await storage.getAllFuelRefills(organizationId);
      res.json(refills);
    } catch (error) {
      console.error("Error fetching fuel refills:", error);
      res.status(500).json({ error: "Failed to fetch fuel refills" });
    }
  });

  app.get(
    "/api/fuel-refills/vehicle/:vehicleId",
    requireAdmin,
    async (req, res) => {
      try {
        const organizationId = (req as any).session.organizationId;
        const { vehicleId } = req.params;
        const refills = await storage.getFuelRefillsByVehicle(
          vehicleId,
          organizationId,
        );
        res.json(refills);
      } catch (error) {
        console.error("Error fetching fuel refills for vehicle:", error);
        res.status(500).json({ error: "Failed to fetch fuel refills" });
      }
    },
  );

  app.post("/api/fuel-refills", requireAdmin, async (req, res) => {
    try {
      const organizationId = (req as any).session.organizationId;
      const parsed = insertFuelRefillSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ error: "Invalid fuel refill data", details: parsed.error });
      }
      const refill = await storage.createFuelRefill(
        parsed.data,
        organizationId,
      );
      res.json(refill);
    } catch (error) {
      console.error("Error creating fuel refill:", error);
      res.status(500).json({ error: "Failed to create fuel refill" });
    }
  });

  app.patch("/api/fuel-refills/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).session.organizationId;
      const parsed = updateFuelRefillSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ error: "Invalid fuel refill data", details: parsed.error });
      }
      const refill = await storage.updateFuelRefill(
        id,
        parsed.data,
        organizationId,
      );
      res.json(refill);
    } catch (error) {
      console.error("Error updating fuel refill:", error);
      res.status(500).json({ error: "Failed to update fuel refill" });
    }
  });

  app.delete("/api/fuel-refills/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).session.organizationId;
      const deleted = await storage.deleteFuelRefill(id, organizationId);
      if (deleted) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Fuel refill not found" });
      }
    } catch (error) {
      console.error("Error deleting fuel refill:", error);
      res.status(500).json({ error: "Failed to delete fuel refill" });
    }
  });

  app.get("/api/fuel-refills/export", requireAdmin, async (req, res) => {
    try {
      const organizationId = (req as any).session.organizationId;
      const vehicleId = req.query.vehicleId as string | undefined;
      const month = req.query.month as string | undefined;
      const year = req.query.year as string | undefined;

      const allRefills = await storage.getAllFuelRefills(organizationId);
      const allTankLoads = await storage.getAllFuelTankLoads(organizationId);
      const allVehicles = await storage.getAllVehicles(organizationId);

      const filteredRefills = allRefills.filter((refill: any) => {
        const refillDate = new Date(refill.refillDate);
        const refillMonth = (refillDate.getMonth() + 1).toString();
        const refillYear = refillDate.getFullYear().toString();

        if (vehicleId && vehicleId !== "all" && refill.vehicleId !== vehicleId)
          return false;
        if (month && refillMonth !== month) return false;
        if (year && refillYear !== year) return false;

        return true;
      });

      const filteredTankLoads = allTankLoads.filter((load: any) => {
        const loadDate = new Date(load.loadDate);
        const loadMonth = (loadDate.getMonth() + 1).toString();
        const loadYear = loadDate.getFullYear().toString();

        if (month && loadMonth !== month) return false;
        if (year && loadYear !== year) return false;

        return true;
      });

      const ExcelJS = await import("exceljs");
      const workbook = new ExcelJS.default.Workbook();

      const refillsSheet = workbook.addWorksheet("Rifornimenti (Scarichi)");

      refillsSheet.columns = [
        { header: "Data/Ora", key: "date", width: 18 },
        { header: "Mezzo", key: "vehicle", width: 30 },
        { header: "Litri Prima", key: "litersBefore", width: 14 },
        { header: "Litri Dopo", key: "litersAfter", width: 14 },
        { header: "Litri Erogati", key: "litersRefilled", width: 14 },
        { header: "Km", key: "km", width: 12 },
        { header: "Ore Motore", key: "hours", width: 14 },
        { header: "Note", key: "notes", width: 35 },
      ];

      const headerStyle = {
        font: { bold: true, color: { argb: "FFFFFFFF" }, size: 11 },
        fill: { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FF2E7D32" } },
        alignment: { horizontal: "center" as const, vertical: "middle" as const },
        border: {
          top: { style: "thin" as const, color: { argb: "FF1B5E20" } },
          bottom: { style: "thin" as const, color: { argb: "FF1B5E20" } },
          left: { style: "thin" as const, color: { argb: "FF1B5E20" } },
          right: { style: "thin" as const, color: { argb: "FF1B5E20" } },
        },
      };

      const thinBorder = {
        top: { style: "thin" as const, color: { argb: "FFB0BEC5" } },
        bottom: { style: "thin" as const, color: { argb: "FFB0BEC5" } },
        left: { style: "thin" as const, color: { argb: "FFB0BEC5" } },
        right: { style: "thin" as const, color: { argb: "FFB0BEC5" } },
      };

      refillsSheet.getRow(1).height = 22;
      refillsSheet.getRow(1).eachCell((cell: any) => {
        cell.font = headerStyle.font;
        cell.fill = headerStyle.fill;
        cell.alignment = headerStyle.alignment;
        cell.border = headerStyle.border;
      });

      let totalLitersRefilled = 0;
      filteredRefills.forEach((refill: any, index: number) => {
        const vehicle = allVehicles.find((v: any) => v.id === refill.vehicleId);
        const vehicleName = vehicle
          ? `${vehicle.name} (${vehicle.licensePlate})`
          : "Sconosciuto";
        const refillDate = new Date(refill.refillDate);
        const dateStr = refillDate.toLocaleDateString("it-IT", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
        const timeStr = refillDate.toLocaleTimeString("it-IT", {
          hour: "2-digit",
          minute: "2-digit",
        });

        const litersRefilled = refill.litersRefilled != null ? parseFloat(refill.litersRefilled) : 0;
        totalLitersRefilled += litersRefilled;

        const row = refillsSheet.addRow({
          date: `${dateStr} ${timeStr}`,
          vehicle: vehicleName,
          litersBefore: refill.litersBefore != null ? parseFloat(refill.litersBefore).toFixed(2) : "-",
          litersAfter: refill.litersAfter != null ? parseFloat(refill.litersAfter).toFixed(2) : "-",
          litersRefilled: refill.litersRefilled != null ? parseFloat(refill.litersRefilled).toFixed(2) : "-",
          km: refill.kmReading != null ? parseFloat(refill.kmReading).toFixed(0) : "-",
          hours: refill.engineHoursReading != null ? parseFloat(refill.engineHoursReading).toFixed(1) : "-",
          notes: refill.notes || "",
        });

        const rowFill = index % 2 === 0 
          ? { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFF5F5F5" } }
          : { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFFFFFFF" } };

        row.eachCell((cell: any, colNumber: number) => {
          cell.border = thinBorder;
          cell.fill = rowFill;
          if (colNumber >= 3 && colNumber <= 7) {
            cell.alignment = { horizontal: "center" as const };
          }
        });
      });

      if (filteredRefills.length > 0) {
        const totalRow = refillsSheet.addRow({
          date: "",
          vehicle: "TOTALE",
          litersBefore: "",
          litersAfter: "",
          litersRefilled: totalLitersRefilled.toFixed(2),
          km: "",
          hours: "",
          notes: "",
        });
        totalRow.font = { bold: true };
        totalRow.eachCell((cell: any) => {
          cell.fill = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFE8F5E9" } };
          cell.border = thinBorder;
        });
        totalRow.getCell(5).alignment = { horizontal: "center" as const };
      }

      const loadsSheet = workbook.addWorksheet("Carichi Cisterna");

      loadsSheet.columns = [
        { header: "Data/Ora", key: "date", width: 18 },
        { header: "Litri Caricati", key: "liters", width: 16 },
        { header: "Costo Totale", key: "cost", width: 14 },
        { header: "Fornitore", key: "supplier", width: 30 },
        { header: "Note", key: "notes", width: 40 },
      ];

      const loadsHeaderStyle = {
        font: { bold: true, color: { argb: "FFFFFFFF" }, size: 11 },
        fill: { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FF1565C0" } },
        alignment: { horizontal: "center" as const, vertical: "middle" as const },
        border: {
          top: { style: "thin" as const, color: { argb: "FF0D47A1" } },
          bottom: { style: "thin" as const, color: { argb: "FF0D47A1" } },
          left: { style: "thin" as const, color: { argb: "FF0D47A1" } },
          right: { style: "thin" as const, color: { argb: "FF0D47A1" } },
        },
      };

      loadsSheet.getRow(1).height = 22;
      loadsSheet.getRow(1).eachCell((cell: any) => {
        cell.font = loadsHeaderStyle.font;
        cell.fill = loadsHeaderStyle.fill;
        cell.alignment = loadsHeaderStyle.alignment;
        cell.border = loadsHeaderStyle.border;
      });

      let totalLitersLoaded = 0;
      let totalCost = 0;
      filteredTankLoads.forEach((load: any, index: number) => {
        const loadDate = new Date(load.loadDate);
        const dateStr = loadDate.toLocaleDateString("it-IT", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
        const timeStr = loadDate.toLocaleTimeString("it-IT", {
          hour: "2-digit",
          minute: "2-digit",
        });

        const liters = load.liters != null ? parseFloat(load.liters) : 0;
        const cost = load.totalCost ? parseFloat(load.totalCost) : 0;
        totalLitersLoaded += liters;
        totalCost += cost;

        const row = loadsSheet.addRow({
          date: `${dateStr} ${timeStr}`,
          liters: load.liters != null ? parseFloat(load.liters).toFixed(2) : "-",
          cost: load.totalCost ? `€${parseFloat(load.totalCost).toFixed(2)}` : "-",
          supplier: load.supplier || "",
          notes: load.notes || "",
        });

        const rowFill = index % 2 === 0 
          ? { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFF5F5F5" } }
          : { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFFFFFFF" } };

        row.eachCell((cell: any, colNumber: number) => {
          cell.border = thinBorder;
          cell.fill = rowFill;
          if (colNumber === 2 || colNumber === 3) {
            cell.alignment = { horizontal: "center" as const };
          }
        });
      });

      if (filteredTankLoads.length > 0) {
        const totalRow = loadsSheet.addRow({
          date: "TOTALE",
          liters: totalLitersLoaded.toFixed(2),
          cost: `€${totalCost.toFixed(2)}`,
          supplier: "",
          notes: "",
        });
        totalRow.font = { bold: true };
        totalRow.eachCell((cell: any) => {
          cell.fill = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFE3F2FD" } };
          cell.border = thinBorder;
        });
        totalRow.getCell(2).alignment = { horizontal: "center" as const };
        totalRow.getCell(3).alignment = { horizontal: "center" as const };
      }

      const buffer = await workbook.xlsx.writeBuffer();

      const monthName = month
        ? [
            "Gen",
            "Feb",
            "Mar",
            "Apr",
            "Mag",
            "Giu",
            "Lug",
            "Ago",
            "Set",
            "Ott",
            "Nov",
            "Dic",
          ][parseInt(month) - 1]
        : "";
      const fileName = `gestione_carburante${monthName ? `_${monthName}` : ""}${year ? `_${year}` : ""}.xlsx`;

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`,
      );
      res.send(buffer);
    } catch (error) {
      console.error("Error exporting fuel data:", error);
      res.status(500).json({ error: "Failed to export fuel data" });
    }
  });

  // ============================================
  // FUEL TANK LOADS (CARICHI CISTERNA)
  // ============================================

  app.get("/api/fuel-tank-loads", requireAdmin, async (req, res) => {
    try {
      const organizationId = (req as any).session.organizationId;
      const loads = await storage.getAllFuelTankLoads(organizationId);
      res.json(loads);
    } catch (error) {
      console.error("Error fetching fuel tank loads:", error);
      res.status(500).json({ error: "Failed to fetch fuel tank loads" });
    }
  });

  app.post("/api/fuel-tank-loads", requireAdmin, async (req, res) => {
    try {
      const organizationId = (req as any).session.organizationId;
      const parsed = insertFuelTankLoadSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({
            error: "Invalid fuel tank load data",
            details: parsed.error,
          });
      }
      const load = await storage.createFuelTankLoad(
        parsed.data,
        organizationId,
      );
      res.json(load);
    } catch (error) {
      console.error("Error creating fuel tank load:", error);
      res.status(500).json({ error: "Failed to create fuel tank load" });
    }
  });

  app.delete("/api/fuel-tank-loads/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).session.organizationId;
      const deleted = await storage.deleteFuelTankLoad(id, organizationId);
      if (deleted) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Fuel tank load not found" });
      }
    } catch (error) {
      console.error("Error deleting fuel tank load:", error);
      res.status(500).json({ error: "Failed to delete fuel tank load" });
    }
  });

  app.get("/api/fuel-remaining", requireAdmin, async (req, res) => {
    try {
      const organizationId = (req as any).session.organizationId;
      const remaining = await storage.getRemainingFuelLiters(organizationId);
      res.json({ remaining });
    } catch (error) {
      console.error("Error fetching remaining fuel:", error);
      res.status(500).json({ error: "Failed to fetch remaining fuel" });
    }
  });

  app.get("/api/fuel-refills/statistics", requireAdmin, async (req, res) => {
    try {
      const organizationId = (req as any).session.organizationId;
      const year = req.query.year as string | undefined;
      const month = req.query.month as string | undefined;
      const statistics = await storage.getFuelRefillsStatistics(
        organizationId,
        year,
        month,
      );
      res.json(statistics);
    } catch (error) {
      console.error("Error fetching fuel refills statistics:", error);
      res
        .status(500)
        .json({ error: "Failed to fetch fuel refills statistics" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
