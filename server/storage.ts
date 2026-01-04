import { 
  users,
  clients,
  workTypes,
  materials,
  workOrders,
  dailyReports,
  operations,
  attendanceEntries,
  hoursAdjustments,
  vehicles,
  fuelRefills,
  fuelTankLoads,
  organizations,
  type User, 
  type InsertUser,
  type Client,
  type InsertClient,
  type WorkType,
  type InsertWorkType,
  type Material,
  type InsertMaterial,
  type WorkOrder,
  type InsertWorkOrder,
  type DailyReport,
  type InsertDailyReport,
  type Operation,
  type InsertOperation,
  type AttendanceEntry,
  type InsertAttendanceEntry,
  type UpdateAttendanceEntry,
  type HoursAdjustment,
  type InsertHoursAdjustment,
  type UpdateHoursAdjustment,
  type Vehicle,
  type InsertVehicle,
  type UpdateVehicle,
  type FuelRefill,
  type InsertFuelRefill,
  type UpdateFuelRefill,
  type FuelTankLoad,
  type InsertFuelTankLoad,
  type UpdateFuelTankLoad,
  type UpdateDailyReport,
  type UpdateOperation,
  type Organization,
  type InsertOrganization
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { hashPassword } from "./auth";

// Helper functions for strategic absences detection
// Cache holidays by year to avoid recomputation
const holidaysCache = new Map<number, Set<string>>();

function getItalianHolidays(year: number): Set<string> {
  if (holidaysCache.has(year)) {
    return holidaysCache.get(year)!;
  }
  
  const holidays = new Set<string>();
  
  // Fixed Italian national holidays
  holidays.add(`${year}-01-01`); // Capodanno
  holidays.add(`${year}-01-06`); // Epifania
  holidays.add(`${year}-04-25`); // Liberazione
  holidays.add(`${year}-05-01`); // Festa del Lavoro
  holidays.add(`${year}-06-02`); // Festa della Repubblica
  holidays.add(`${year}-08-15`); // Ferragosto
  holidays.add(`${year}-11-01`); // Ognissanti
  holidays.add(`${year}-12-08`); // Immacolata
  holidays.add(`${year}-12-25`); // Natale
  holidays.add(`${year}-12-26`); // Santo Stefano
  
  // Easter and Easter Monday (calculated)
  const easter = calculateEaster(year);
  const easterMonday = new Date(easter);
  easterMonday.setDate(easterMonday.getDate() + 1);
  holidays.add(formatDateToString(easter));
  holidays.add(formatDateToString(easterMonday));
  
  holidaysCache.set(year, holidays);
  return holidays;
}

function formatDateToString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function calculateEaster(year: number): Date {
  // Anonymous Gregorian algorithm
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function getAllHolidaysForDateRange(dateStr: string): Set<string> {
  // Get holidays for current year and adjacent years to handle year boundaries
  const date = new Date(dateStr + 'T12:00:00'); // Use noon to avoid timezone issues
  const year = date.getFullYear();
  const allHolidays = new Set<string>();
  
  // Always include current year and adjacent years for boundary cases
  [year - 1, year, year + 1].forEach(y => {
    getItalianHolidays(y).forEach(h => allHolidays.add(h));
  });
  
  return allHolidays;
}

function isNonWorkingDay(date: Date, holidays: Set<string>): boolean {
  const dayOfWeek = date.getDay();
  // Weekend (Saturday = 6, Sunday = 0)
  if (dayOfWeek === 0 || dayOfWeek === 6) return true;
  // Holiday
  const dateStr = formatDateToString(date);
  return holidays.has(dateStr);
}

function isStrategicAbsence(dateStr: string): boolean {
  // Parse date at noon to avoid timezone issues
  const date = new Date(dateStr + 'T12:00:00');
  const holidays = getAllHolidaysForDateRange(dateStr);
  
  // Check if the day before is non-working
  const dayBefore = new Date(date);
  dayBefore.setDate(dayBefore.getDate() - 1);
  const beforeIsNonWorking = isNonWorkingDay(dayBefore, holidays);
  
  // Check if the day after is non-working
  const dayAfter = new Date(date);
  dayAfter.setDate(dayAfter.getDate() + 1);
  const afterIsNonWorking = isNonWorkingDay(dayAfter, holidays);
  
  // Strategic if adjacent to non-working day
  return beforeIsNonWorking || afterIsNonWorking;
}

export interface IStorage {
  // Organizations (Super Admin)
  getAllOrganizations(): Promise<Organization[]>;
  getOrganization(id: string): Promise<Organization | undefined>;
  getOrganizationByName(name: string): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganizationStatus(id: string, isActive: boolean): Promise<Organization | undefined>;

  // Users
  getAllUsers(organizationId: string): Promise<User[]>;
  getActiveUsers(organizationId: string): Promise<User[]>;
  getUser(id: string, organizationId?: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser, organizationId: string): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>, organizationId: string): Promise<User>;
  updateUserStatus(id: string, isActive: boolean, organizationId: string): Promise<User>;
  deleteUser(id: string, organizationId: string): Promise<boolean>;
  
  // Clients
  getAllClients(organizationId: string): Promise<Client[]>;
  createClient(client: InsertClient, organizationId: string): Promise<Client>;
  deleteClient(id: string, organizationId: string): Promise<boolean>;

  // Work Types (Lavorazioni)
  getAllWorkTypes(organizationId: string): Promise<WorkType[]>;
  getWorkType(id: string, organizationId: string): Promise<WorkType | undefined>;
  createWorkType(workType: InsertWorkType, organizationId: string): Promise<WorkType>;
  updateWorkType(id: string, updates: Partial<InsertWorkType>, organizationId: string): Promise<WorkType>;
  deleteWorkType(id: string, organizationId: string): Promise<boolean>;

  // Materials (Materiali)
  getAllMaterials(organizationId: string): Promise<Material[]>;
  getMaterial(id: string, organizationId: string): Promise<Material | undefined>;
  createMaterial(material: InsertMaterial, organizationId: string): Promise<Material>;
  updateMaterial(id: string, updates: Partial<InsertMaterial>, organizationId: string): Promise<Material>;
  deleteMaterial(id: string, organizationId: string): Promise<boolean>;

  // Work Orders
  getAllWorkOrders(organizationId: string): Promise<WorkOrder[]>;
  getWorkOrdersByClient(clientId: string, organizationId: string): Promise<WorkOrder[]>;
  getWorkOrder(id: string, organizationId: string): Promise<WorkOrder | undefined>;
  createWorkOrder(workOrder: InsertWorkOrder, organizationId: string): Promise<WorkOrder>;
  updateWorkOrder(id: string, updates: Partial<InsertWorkOrder>, organizationId: string): Promise<WorkOrder>;
  updateWorkOrderStatus(id: string, isActive: boolean, organizationId: string): Promise<WorkOrder>;
  deleteWorkOrder(id: string, organizationId: string): Promise<boolean>;
  
  // Daily Reports
  getAllDailyReports(organizationId: string): Promise<DailyReport[]>;
  getDailyReportsByDate(date: string, organizationId: string): Promise<DailyReport[]>;
  getDailyReport(id: string, organizationId: string): Promise<DailyReport | undefined>;
  getDailyReportByEmployeeAndDate(employeeId: string, date: string, organizationId: string): Promise<DailyReport | undefined>;
  createDailyReport(report: InsertDailyReport, organizationId: string): Promise<DailyReport>;
  updateDailyReport(id: string, updates: UpdateDailyReport): Promise<DailyReport>;
  updateDailyReportStatus(id: string, status: string): Promise<DailyReport>;
  deleteDailyReport(id: string, organizationId: string): Promise<boolean>;

  // Operations
  getOperationsByReportId(reportId: string, organizationId: string): Promise<Operation[]>;
  getOperationsByWorkOrderId(workOrderId: string, organizationId: string): Promise<Operation[]>;
  getOperationsCountByWorkOrderId(workOrderId: string, organizationId: string): Promise<number>;
  getOperationsCountByClientId(clientId: string): Promise<number>;
  getOperation(id: string, organizationId: string): Promise<Operation | undefined>;
  createOperation(operation: InsertOperation, organizationId: string): Promise<Operation>;
  updateOperation(id: string, updates: UpdateOperation, organizationId: string): Promise<Operation>;
  deleteOperation(id: string, organizationId: string): Promise<boolean>;
  deleteOperationsByReportId(reportId: string, organizationId: string): Promise<boolean>;
  deleteOperationsByWorkOrderId(workOrderId: string, organizationId: string): Promise<boolean>;
  deleteOperationsByClientId(clientId: string): Promise<boolean>;

  // Counts for cascade delete
  getDailyReportsCountByEmployeeId(employeeId: string): Promise<number>;
  getWorkOrdersCountByClientId(clientId: string): Promise<number>;
  deleteDailyReportsByEmployeeId(employeeId: string, organizationId: string): Promise<boolean>;
  deleteWorkOrdersByClientId(clientId: string, organizationId: string): Promise<boolean>;
  
  // Statistics
  getWorkOrdersStats(organizationId: string): Promise<Array<{
    workOrderId: string;
    totalOperations: number;
    totalHours: number;
    lastActivity: string | null;
  }>>;
  
  // Attendance Entries (Assenze)
  getAllAttendanceEntries(organizationId: string, year: string, month: string): Promise<AttendanceEntry[]>;
  getAttendanceEntriesByDate(date: string, organizationId: string): Promise<AttendanceEntry[]>;
  getAttendanceEntry(userId: string, date: string, organizationId: string): Promise<AttendanceEntry | undefined>;
  createAttendanceEntry(entry: InsertAttendanceEntry, organizationId: string): Promise<AttendanceEntry>;
  updateAttendanceEntry(id: string, updates: UpdateAttendanceEntry, organizationId: string): Promise<AttendanceEntry>;
  deleteAttendanceEntry(id: string, organizationId: string): Promise<boolean>;
  deleteAttendanceEntriesByUserId(userId: string, organizationId: string): Promise<boolean>;

  // Hours adjustments
  getHoursAdjustment(dailyReportId: string, organizationId: string): Promise<HoursAdjustment | undefined>;
  createHoursAdjustment(adjustment: InsertHoursAdjustment, organizationId: string, createdBy: string): Promise<HoursAdjustment>;
  updateHoursAdjustment(id: string, updates: UpdateHoursAdjustment, organizationId: string): Promise<HoursAdjustment>;
  deleteHoursAdjustment(id: string, organizationId: string): Promise<boolean>;
  deleteHoursAdjustmentsByReportId(reportId: string, organizationId: string): Promise<boolean>;
  
  // Vehicles (Mezzi)
  getAllVehicles(organizationId: string): Promise<Vehicle[]>;
  getVehicle(id: string): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle, organizationId: string): Promise<Vehicle>;
  updateVehicle(id: string, updates: UpdateVehicle, organizationId: string): Promise<Vehicle>;
  deleteVehicle(id: string, organizationId: string): Promise<boolean>;
  
  // Fuel Refills (Rifornimenti)
  getAllFuelRefills(organizationId: string): Promise<FuelRefill[]>;
  getFuelRefillsByVehicle(vehicleId: string, organizationId: string): Promise<FuelRefill[]>;
  getFuelRefill(id: string): Promise<FuelRefill | undefined>;
  createFuelRefill(refill: InsertFuelRefill, organizationId: string): Promise<FuelRefill>;
  updateFuelRefill(id: string, updates: UpdateFuelRefill, organizationId: string): Promise<FuelRefill>;
  deleteFuelRefill(id: string, organizationId: string): Promise<boolean>;
  deleteFuelRefillsByVehicleId(vehicleId: string): Promise<boolean>;
  
  // Fuel Tank Loads (Carichi cisterna)
  getAllFuelTankLoads(organizationId: string): Promise<FuelTankLoad[]>;
  getFuelTankLoad(id: string): Promise<FuelTankLoad | undefined>;
  createFuelTankLoad(load: InsertFuelTankLoad, organizationId: string): Promise<FuelTankLoad>;
  updateFuelTankLoad(id: string, updates: UpdateFuelTankLoad, organizationId: string): Promise<FuelTankLoad>;
  deleteFuelTankLoad(id: string, organizationId: string): Promise<boolean>;
  getRemainingFuelLiters(organizationId: string): Promise<number>;
  getFuelRefillsStatistics(organizationId: string, year?: string, month?: string): Promise<{
    byVehicle: Array<{
      vehicleId: string;
      vehicleName: string;
      totalLiters: number;
      totalCost: number;
      refillCount: number;
    }>;
    byMonth: Array<{
      month: string;
      year: string;
      totalLiters: number;
      totalCost: number;
      refillCount: number;
    }>;
  }>;
  
  // Monthly Attendance (Foglio Presenze)
  getMonthlyAttendance(organizationId: string, year: string, month: string): Promise<any>;
  
  // Attendance Statistics (Statistiche Assenze)
  getAttendanceStats(organizationId: string, days?: number): Promise<{
    byEmployee: Array<{
      userId: string;
      fullName: string;
      totalAbsences: number;
      strategicAbsences: number;
      byType: Record<string, number>;
      byDayOfWeek: Record<number, number>;
    }>;
    byType: Record<string, number>;
    byDayOfWeek: Record<number, number>;
    byMonth: Array<{
      month: string;
      year: string;
      count: number;
    }>;
    totalAbsences: number;
    totalStrategicAbsences: number;
  }>;
  
  // Strategic Absences Report (text format)
  getStrategicAbsencesReport(organizationId: string, days?: number): Promise<string>;
  
  // Employee-specific Attendance Statistics
  getEmployeeAttendanceStats(organizationId: string, userId: string, days?: number): Promise<{
    userId: string;
    fullName: string;
    byType: Record<string, number>;
    byDayOfWeek: Record<number, number>;
    byMonth: Array<{
      month: string;
      year: string;
      count: number;
    }>;
    totalAbsences: number;
    strategicAbsences: number;
    strategicPercentage: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  private initialized: boolean = false;

  private async ensureInitialized() {
    if (!this.initialized) {
      await this.initializeAdmin();
      this.initialized = true;
    }
  }

  private async initializeAdmin() {
    // Use default organization ID
    const defaultOrgId = "b578579d-c664-4382-8504-bd7740dbfd9b";
    
    // First, ensure the default organization exists
    const existingOrg = await db.select().from(organizations).where(eq(organizations.id, defaultOrgId));
    if (existingOrg.length === 0) {
      await db.insert(organizations).values({
        id: defaultOrgId,
        name: "Metaltec",
        subdomain: "default",
        isActive: true
      });
      console.log("✓ Organizzazione predefinita 'Metaltec' creata");
    }
    
    // Then, ensure the admin user exists
    const existingAdmin = await db.select().from(users).where(eq(users.username, "admin"));
    if (existingAdmin.length === 0) {
      const hashedPassword = await hashPassword("Metaltec11");
      await db.insert(users).values({
        username: "admin",
        password: hashedPassword,
        plainPassword: null,
        role: "admin",
        fullName: "Amministratore",
        organizationId: defaultOrgId
      });
      console.log("✓ Utente admin predefinito creato");
    }
  }

  // Organizations (Super Admin)
  async getAllOrganizations(): Promise<Organization[]> {
    await this.ensureInitialized();
    return await db.select().from(organizations).orderBy(desc(organizations.createdAt));
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    await this.ensureInitialized();
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org || undefined;
  }

  async getOrganizationByName(name: string): Promise<Organization | undefined> {
    await this.ensureInitialized();
    const [org] = await db.select().from(organizations).where(eq(organizations.name, name));
    return org || undefined;
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    await this.ensureInitialized();
    const [newOrg] = await db.insert(organizations).values(org).returning();
    return newOrg;
  }

  async updateOrganizationStatus(id: string, isActive: boolean): Promise<Organization | undefined> {
    await this.ensureInitialized();
    const [updated] = await db.update(organizations)
      .set({ isActive })
      .where(eq(organizations.id, id))
      .returning();
    return updated || undefined;
  }

  // Users
  async getAllUsers(organizationId: string): Promise<User[]> {
    await this.ensureInitialized();
    return await db.select().from(users).where(eq(users.organizationId, organizationId));
  }

  async getUser(id: string, organizationId?: string): Promise<User | undefined> {
    await this.ensureInitialized();
    const conditions = [eq(users.id, id)];
    if (organizationId) {
      conditions.push(eq(users.organizationId, organizationId));
    }
    const [user] = await db.select().from(users).where(and(...conditions));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    await this.ensureInitialized();
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser, organizationId: string): Promise<User> {
    await this.ensureInitialized();
    const hashedPassword = await hashPassword(insertUser.password);
    const role = insertUser.role || "employee";
    
    const [user] = await db.insert(users).values({
      ...insertUser,
      password: hashedPassword,
      plainPassword: role === 'employee' ? insertUser.password : null,
      role: role,
      organizationId
    }).returning();
    
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>, organizationId: string): Promise<User> {
    await this.ensureInitialized();
    const existingUser = await this.getUser(id, organizationId);
    if (!existingUser) {
      throw new Error("Utente non trovato");
    }

    const updatedData: any = { ...updates };
    if (updates.password) {
      updatedData.password = await hashPassword(updates.password);
      if (existingUser.role === 'employee') {
        updatedData.plainPassword = updates.password;
      }
    }

    const [updatedUser] = await db.update(users)
      .set(updatedData)
      .where(and(
        eq(users.id, id),
        eq(users.organizationId, organizationId)
      ))
      .returning();

    if (!updatedUser) {
      throw new Error("Utente non trovato");
    }

    return updatedUser;
  }

  async getActiveUsers(organizationId: string): Promise<User[]> {
    await this.ensureInitialized();
    return await db.select()
      .from(users)
      .where(and(
        eq(users.organizationId, organizationId),
        eq(users.isActive, true)
      ));
  }

  async updateUserStatus(id: string, isActive: boolean, organizationId: string): Promise<User> {
    await this.ensureInitialized();
    const [updatedUser] = await db.update(users)
      .set({ isActive })
      .where(and(
        eq(users.id, id),
        eq(users.organizationId, organizationId)
      ))
      .returning();

    if (!updatedUser) {
      throw new Error("Utente non trovato");
    }

    return updatedUser;
  }

  async deleteUser(id: string, organizationId: string): Promise<boolean> {
    await this.ensureInitialized();
    const user = await this.getUser(id, organizationId);
    if (!user) {
      return false;
    }
    await this.deleteDailyReportsByEmployeeId(id, organizationId);
    await this.deleteAttendanceEntriesByUserId(id, organizationId);

    const result = await db.delete(users).where(and(
      eq(users.id, id),
      eq(users.organizationId, organizationId)
    ));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Clients
  async getAllClients(organizationId: string): Promise<Client[]> {
    await this.ensureInitialized();
    return await db.select().from(clients).where(eq(clients.organizationId, organizationId));
  }

  async createClient(insertClient: InsertClient, organizationId: string): Promise<Client> {
    await this.ensureInitialized();
    const [client] = await db.insert(clients).values({
      ...insertClient,
      organizationId
    }).returning();
    return client;
  }

  async deleteClient(id: string, organizationId: string): Promise<boolean> {
    await this.ensureInitialized();
    // Verify client belongs to organization
    const [client] = await db.select()
      .from(clients)
      .where(and(
        eq(clients.id, id),
        eq(clients.organizationId, organizationId)
      ));

    if (!client) {
      return false;
    }

    await this.deleteWorkOrdersByClientId(id, organizationId);
    const result = await db.delete(clients).where(eq(clients.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Work Types (Lavorazioni)
  async getAllWorkTypes(organizationId: string): Promise<WorkType[]> {
    await this.ensureInitialized();
    return await db.select().from(workTypes).where(eq(workTypes.organizationId, organizationId));
  }

  async getWorkType(id: string, organizationId: string): Promise<WorkType | undefined> {
    await this.ensureInitialized();
    const [workType] = await db.select().from(workTypes).where(and(
      eq(workTypes.id, id),
      eq(workTypes.organizationId, organizationId)
    ));
    return workType || undefined;
  }

  async createWorkType(insertWorkType: InsertWorkType, organizationId: string): Promise<WorkType> {
    await this.ensureInitialized();
    const [workType] = await db.insert(workTypes).values({
      ...insertWorkType,
      organizationId
    }).returning();
    return workType;
  }

  async updateWorkType(id: string, updates: Partial<InsertWorkType>, organizationId: string): Promise<WorkType> {
    await this.ensureInitialized();
    const [updatedWorkType] = await db.update(workTypes)
      .set(updates)
      .where(and(
        eq(workTypes.id, id),
        eq(workTypes.organizationId, organizationId)
      ))
      .returning();

    if (!updatedWorkType) {
      throw new Error("Lavorazione non trovata");
    }

    return updatedWorkType;
  }

  async deleteWorkType(id: string, organizationId: string): Promise<boolean> {
    await this.ensureInitialized();
    const result = await db.delete(workTypes).where(and(
      eq(workTypes.id, id),
      eq(workTypes.organizationId, organizationId)
    ));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Materials (Materiali)
  async getAllMaterials(organizationId: string): Promise<Material[]> {
    await this.ensureInitialized();
    return await db.select().from(materials).where(eq(materials.organizationId, organizationId));
  }

  async getMaterial(id: string, organizationId: string): Promise<Material | undefined> {
    await this.ensureInitialized();
    const [material] = await db.select().from(materials).where(and(
      eq(materials.id, id),
      eq(materials.organizationId, organizationId)
    ));
    return material || undefined;
  }

  async createMaterial(insertMaterial: InsertMaterial, organizationId: string): Promise<Material> {
    await this.ensureInitialized();
    const [material] = await db.insert(materials).values({
      ...insertMaterial,
      organizationId
    }).returning();
    return material;
  }

  async updateMaterial(id: string, updates: Partial<InsertMaterial>, organizationId: string): Promise<Material> {
    await this.ensureInitialized();
    const [updatedMaterial] = await db.update(materials)
      .set(updates)
      .where(and(
        eq(materials.id, id),
        eq(materials.organizationId, organizationId)
      ))
      .returning();

    if (!updatedMaterial) {
      throw new Error("Materiale non trovato");
    }

    return updatedMaterial;
  }

  async deleteMaterial(id: string, organizationId: string): Promise<boolean> {
    await this.ensureInitialized();
    const result = await db.delete(materials).where(and(
      eq(materials.id, id),
      eq(materials.organizationId, organizationId)
    ));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Work Orders
  async getAllWorkOrders(organizationId: string): Promise<WorkOrder[]> {
    await this.ensureInitialized();
    return await db.select().from(workOrders).where(eq(workOrders.organizationId, organizationId));
  }

  async getAllActiveWorkOrders(organizationId: string): Promise<WorkOrder[]> {
    await this.ensureInitialized();
    return await db.select().from(workOrders).where(
      and(eq(workOrders.organizationId, organizationId), eq(workOrders.isActive, true))
    );
  }

  async getWorkOrdersByClient(clientId: string, organizationId: string): Promise<WorkOrder[]> {
    await this.ensureInitialized();
    return await db.select().from(workOrders).where(
      and(eq(workOrders.clientId, clientId), eq(workOrders.organizationId, organizationId))
    );
  }

  async getWorkOrder(id: string, organizationId: string): Promise<WorkOrder | undefined> {
    await this.ensureInitialized();
    const [workOrder] = await db.select().from(workOrders).where(
      and(eq(workOrders.id, id), eq(workOrders.organizationId, organizationId))
    );
    return workOrder || undefined;
  }

  async createWorkOrder(insertWorkOrder: InsertWorkOrder, organizationId: string): Promise<WorkOrder> {
    await this.ensureInitialized();
    const [workOrder] = await db.insert(workOrders).values({
      ...insertWorkOrder,
      organizationId
    }).returning();
    return workOrder;
  }

  async updateWorkOrder(id: string, updates: Partial<InsertWorkOrder>, organizationId: string): Promise<WorkOrder> {
    await this.ensureInitialized();
    const [updatedWorkOrder] = await db.update(workOrders)
      .set(updates)
      .where(and(
        eq(workOrders.id, id),
        eq(workOrders.organizationId, organizationId)
      ))
      .returning();

    if (!updatedWorkOrder) {
      throw new Error("Commessa non trovata");
    }

    return updatedWorkOrder;
  }

  async updateWorkOrderStatus(id: string, isActive: boolean, organizationId: string): Promise<WorkOrder> {
    await this.ensureInitialized();
    const [updatedWorkOrder] = await db.update(workOrders)
      .set({ isActive })
      .where(and(
        eq(workOrders.id, id),
        eq(workOrders.organizationId, organizationId)
      ))
      .returning();

    if (!updatedWorkOrder) {
      throw new Error("Commessa non trovata");
    }

    return updatedWorkOrder;
  }

  async deleteWorkOrder(id: string, organizationId: string): Promise<boolean> {
    await this.ensureInitialized();
    // Verify work order belongs to organization
    const [workOrder] = await db.select()
      .from(workOrders)
      .where(and(
        eq(workOrders.id, id),
        eq(workOrders.organizationId, organizationId)
      ));

    if (!workOrder) {
      return false;
    }

    await this.deleteOperationsByWorkOrderId(id, organizationId);
    const result = await db.delete(workOrders).where(eq(workOrders.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Daily Reports
  async getAllDailyReports(organizationId: string): Promise<DailyReport[]> {
    await this.ensureInitialized();
    return await db.select().from(dailyReports)
      .where(eq(dailyReports.organizationId, organizationId))
      .orderBy(desc(dailyReports.date));
  }

  async getDailyReportsByDate(date: string, organizationId: string): Promise<DailyReport[]> {
    await this.ensureInitialized();
    return await db.select().from(dailyReports).where(
      and(eq(dailyReports.date, date), eq(dailyReports.organizationId, organizationId))
    );
  }

  async getDailyReport(id: string, organizationId: string): Promise<DailyReport | undefined> {
    await this.ensureInitialized();
    const [report] = await db.select().from(dailyReports).where(
      and(
        eq(dailyReports.id, id),
        eq(dailyReports.organizationId, organizationId)
      )
    );
    return report || undefined;
  }

  async getDailyReportByEmployeeAndDate(employeeId: string, date: string, organizationId: string): Promise<DailyReport | undefined> {
    await this.ensureInitialized();
    const [report] = await db.select().from(dailyReports).where(
      and(
        eq(dailyReports.employeeId, employeeId), 
        eq(dailyReports.date, date),
        eq(dailyReports.organizationId, organizationId)
      )
    );
    return report || undefined;
  }

  async createDailyReport(insertReport: InsertDailyReport, organizationId: string): Promise<DailyReport> {
    await this.ensureInitialized();
    const [report] = await db.insert(dailyReports).values({
      ...insertReport,
      organizationId
    }).returning();
    return report;
  }

  async updateDailyReport(id: string, updates: UpdateDailyReport): Promise<DailyReport> {
    await this.ensureInitialized();
    const [updatedReport] = await db.update(dailyReports)
      .set(updates)
      .where(eq(dailyReports.id, id))
      .returning();
    
    if (!updatedReport) {
      throw new Error("Report not found");
    }
    
    return updatedReport;
  }

  async updateDailyReportStatus(id: string, status: string): Promise<DailyReport> {
    await this.ensureInitialized();
    const [updatedReport] = await db.update(dailyReports)
      .set({ status })
      .where(eq(dailyReports.id, id))
      .returning();
    
    if (!updatedReport) {
      throw new Error("Report not found");
    }
    
    return updatedReport;
  }

  async deleteDailyReport(id: string, organizationId: string): Promise<boolean> {
    await this.ensureInitialized();
    await this.deleteOperationsByReportId(id, organizationId);
    await this.deleteHoursAdjustmentsByReportId(id, organizationId);
    const result = await db.delete(dailyReports).where(eq(dailyReports.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Operations
  async getOperationsByReportId(reportId: string, organizationId: string): Promise<Operation[]> {
    await this.ensureInitialized();
    const result = await db.select({ operations })
      .from(operations)
      .innerJoin(dailyReports, eq(operations.dailyReportId, dailyReports.id))
      .where(and(
        eq(operations.dailyReportId, reportId),
        eq(dailyReports.organizationId, organizationId)
      ));
    return result.map(r => r.operations);
  }

  async getOperationsByWorkOrderId(workOrderId: string, organizationId: string): Promise<Operation[]> {
    await this.ensureInitialized();
    // Join with workOrders to ensure organization filtering
    const result = await db.select({ operations })
      .from(operations)
      .innerJoin(workOrders, eq(operations.workOrderId, workOrders.id))
      .where(
        and(
          eq(operations.workOrderId, workOrderId),
          eq(workOrders.organizationId, organizationId)
        )
      );
    return result.map(r => r.operations);
  }

  async getOperation(id: string, organizationId: string): Promise<Operation | undefined> {
    await this.ensureInitialized();
    const result = await db.select({ operations })
      .from(operations)
      .innerJoin(dailyReports, eq(operations.dailyReportId, dailyReports.id))
      .where(and(
        eq(operations.id, id),
        eq(dailyReports.organizationId, organizationId)
      ));
    return result[0]?.operations;
  }

  async createOperation(insertOperation: InsertOperation, organizationId: string): Promise<Operation> {
    await this.ensureInitialized();
    // Validate dailyReportId belongs to organization
    const [report] = await db.select()
      .from(dailyReports)
      .where(and(
        eq(dailyReports.id, insertOperation.dailyReportId),
        eq(dailyReports.organizationId, organizationId)
      ));
    if (!report) {
      throw new Error("Daily report not found or access denied");
    }

    // Validate clientId belongs to organization
    const [client] = await db.select()
      .from(clients)
      .where(and(
        eq(clients.id, insertOperation.clientId),
        eq(clients.organizationId, organizationId)
      ));
    if (!client) {
      throw new Error("Client not found or access denied");
    }

    // Validate workOrderId belongs to organization
    const [workOrder] = await db.select()
      .from(workOrders)
      .where(and(
        eq(workOrders.id, insertOperation.workOrderId),
        eq(workOrders.organizationId, organizationId)
      ));
    if (!workOrder) {
      throw new Error("Work order not found or access denied");
    }

    const [operation] = await db.insert(operations).values(insertOperation).returning();
    return operation;
  }

  async updateOperation(id: string, updates: UpdateOperation, organizationId: string): Promise<Operation> {
    await this.ensureInitialized();
    // Verify operation belongs to organization
    const existing = await this.getOperation(id, organizationId);
    if (!existing) {
      throw new Error("Operation not found or access denied");
    }

    // If updating foreign keys, validate them
    if (updates.clientId) {
      const [client] = await db.select()
        .from(clients)
        .where(and(
          eq(clients.id, updates.clientId),
          eq(clients.organizationId, organizationId)
        ));
      if (!client) {
        throw new Error("Client not found or access denied");
      }
    }

    if (updates.workOrderId) {
      const [workOrder] = await db.select()
        .from(workOrders)
        .where(and(
          eq(workOrders.id, updates.workOrderId),
          eq(workOrders.organizationId, organizationId)
        ));
      if (!workOrder) {
        throw new Error("Work order not found or access denied");
      }
    }

    const [updatedOperation] = await db.update(operations)
      .set(updates)
      .where(eq(operations.id, id))
      .returning();

    if (!updatedOperation) {
      throw new Error("Operation not found");
    }

    return updatedOperation;
  }

  async deleteOperation(id: string, organizationId: string): Promise<boolean> {
    await this.ensureInitialized();
    // Verify ownership before deleting
    const existing = await this.getOperation(id, organizationId);
    if (!existing) {
      return false;
    }

    const result = await db.delete(operations).where(eq(operations.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async deleteOperationsByReportId(reportId: string, organizationId: string): Promise<boolean> {
    await this.ensureInitialized();
    // Verify report belongs to organization
    const [report] = await db.select()
      .from(dailyReports)
      .where(and(
        eq(dailyReports.id, reportId),
        eq(dailyReports.organizationId, organizationId)
      ));

    if (!report) {
      return false;
    }

    const result = await db.delete(operations).where(eq(operations.dailyReportId, reportId));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getOperationsCountByWorkOrderId(workOrderId: string, organizationId: string): Promise<number> {
    await this.ensureInitialized();
    const result = await db.select({ operations })
      .from(operations)
      .innerJoin(workOrders, eq(operations.workOrderId, workOrders.id))
      .where(and(
        eq(operations.workOrderId, workOrderId),
        eq(workOrders.organizationId, organizationId)
      ));
    return result.length;
  }

  async deleteOperationsByWorkOrderId(workOrderId: string, organizationId: string): Promise<boolean> {
    await this.ensureInitialized();
    // Verify work order belongs to organization
    const [workOrder] = await db.select()
      .from(workOrders)
      .where(and(
        eq(workOrders.id, workOrderId),
        eq(workOrders.organizationId, organizationId)
      ));

    if (!workOrder) {
      return false;
    }

    const result = await db.delete(operations).where(eq(operations.workOrderId, workOrderId));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getOperationsCountByClientId(clientId: string): Promise<number> {
    await this.ensureInitialized();
    const clientWorkOrders = await db.select().from(workOrders).where(eq(workOrders.clientId, clientId));
    const workOrderIds = clientWorkOrders.map(wo => wo.id);
    
    if (workOrderIds.length === 0) {
      return 0;
    }
    
    const ops = await db.select().from(operations);
    const count = ops.filter(op => workOrderIds.includes(op.workOrderId)).length;
    return count;
  }

  async deleteOperationsByClientId(clientId: string): Promise<boolean> {
    await this.ensureInitialized();
    const clientWorkOrders = await db.select().from(workOrders).where(eq(workOrders.clientId, clientId));
    const workOrderIds = clientWorkOrders.map(wo => wo.id);
    
    if (workOrderIds.length === 0) {
      return true;
    }
    
    let totalDeleted = 0;
    for (const workOrderId of workOrderIds) {
      const result = await db.delete(operations).where(eq(operations.workOrderId, workOrderId));
      if (result.rowCount) totalDeleted += result.rowCount;
    }
    
    return totalDeleted > 0;
  }

  async getDailyReportsCountByEmployeeId(employeeId: string): Promise<number> {
    await this.ensureInitialized();
    const reports = await db.select().from(dailyReports).where(eq(dailyReports.employeeId, employeeId));
    return reports.length;
  }

  async getWorkOrdersCountByClientId(clientId: string): Promise<number> {
    await this.ensureInitialized();
    const orders = await db.select().from(workOrders).where(eq(workOrders.clientId, clientId));
    return orders.length;
  }

  async deleteDailyReportsByEmployeeId(employeeId: string, organizationId: string): Promise<boolean> {
    await this.ensureInitialized();
    const employeeReports = await db.select()
      .from(dailyReports)
      .where(and(
        eq(dailyReports.employeeId, employeeId),
        eq(dailyReports.organizationId, organizationId)
      ));

    for (const report of employeeReports) {
      await this.deleteOperationsByReportId(report.id, organizationId);
      await this.deleteHoursAdjustmentsByReportId(report.id, organizationId);
    }

    const result = await db.delete(dailyReports).where(and(
      eq(dailyReports.employeeId, employeeId),
      eq(dailyReports.organizationId, organizationId)
    ));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async deleteWorkOrdersByClientId(clientId: string, organizationId: string): Promise<boolean> {
    await this.ensureInitialized();
    const clientWorkOrders = await db.select()
      .from(workOrders)
      .where(and(
        eq(workOrders.clientId, clientId),
        eq(workOrders.organizationId, organizationId)
      ));

    for (const workOrder of clientWorkOrders) {
      await this.deleteOperationsByWorkOrderId(workOrder.id, organizationId);
    }

    const result = await db.delete(workOrders).where(and(
      eq(workOrders.clientId, clientId),
      eq(workOrders.organizationId, organizationId)
    ));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getWorkOrdersStats(organizationId: string): Promise<Array<{
    workOrderId: string;
    totalOperations: number;
    totalHours: number;
    lastActivity: string | null;
  }>> {
    await this.ensureInitialized();
    
    const allWorkOrders = await db.select().from(workOrders).where(eq(workOrders.organizationId, organizationId));
    const allOperations = await db.select().from(operations);
    const allReports = await db.select().from(dailyReports).where(eq(dailyReports.organizationId, organizationId));
    
    const approvedReportIds = new Set(
      allReports.filter(r => r.status === "Approvato").map(r => r.id)
    );
    
    const approvedOperations = allOperations.filter(op => 
      approvedReportIds.has(op.dailyReportId)
    );
    
    const statsMap = new Map<string, {
      totalOperations: number;
      totalHours: number;
      dates: string[];
    }>();
    
    for (const op of approvedOperations) {
      if (!op.workOrderId) continue;
      
      const existing = statsMap.get(op.workOrderId) || {
        totalOperations: 0,
        totalHours: 0,
        dates: []
      };
      
      const report = allReports.find(r => r.id === op.dailyReportId);
      if (report) {
        existing.totalOperations++;
        existing.totalHours += Number(op.hours) || 0;
        existing.dates.push(report.date);
        statsMap.set(op.workOrderId, existing);
      }
    }
    
    return allWorkOrders.map(wo => {
      const stats = statsMap.get(wo.id);
      return {
        workOrderId: wo.id,
        totalOperations: stats?.totalOperations || 0,
        totalHours: stats?.totalHours || 0,
        lastActivity: stats?.dates.length ? 
          stats.dates.sort().reverse()[0] : null
      };
    });
  }

  // Attendance Entries (Assenze)
  async getAllAttendanceEntries(organizationId: string, year: string, month: string): Promise<AttendanceEntry[]> {
    await this.ensureInitialized();
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = `${year}-${month.padStart(2, '0')}-31`;
    
    const allEntries = await db.select()
      .from(attendanceEntries)
      .where(eq(attendanceEntries.organizationId, organizationId));
    
    return allEntries.filter(entry => entry.date >= startDate && entry.date <= endDate);
  }

  async getAttendanceEntriesByDate(date: string, organizationId: string): Promise<AttendanceEntry[]> {
    await this.ensureInitialized();
    const entries = await db.select()
      .from(attendanceEntries)
      .where(
        and(
          eq(attendanceEntries.date, date),
          eq(attendanceEntries.organizationId, organizationId)
        )
      );
    return entries;
  }

  async getAttendanceEntry(userId: string, date: string, organizationId: string): Promise<AttendanceEntry | undefined> {
    await this.ensureInitialized();
    const entries = await db.select()
      .from(attendanceEntries)
      .where(
        and(
          eq(attendanceEntries.userId, userId),
          eq(attendanceEntries.date, date),
          eq(attendanceEntries.organizationId, organizationId)
        )
      );
    return entries[0];
  }

  async createAttendanceEntry(entry: InsertAttendanceEntry, organizationId: string): Promise<AttendanceEntry> {
    await this.ensureInitialized();
    const result = await db.insert(attendanceEntries).values({
      ...entry,
      organizationId
    }).returning();
    return result[0];
  }

  async updateAttendanceEntry(id: string, updates: UpdateAttendanceEntry, organizationId: string): Promise<AttendanceEntry> {
    await this.ensureInitialized();
    const result = await db.update(attendanceEntries)
      .set(updates)
      .where(and(
        eq(attendanceEntries.id, id),
        eq(attendanceEntries.organizationId, organizationId)
      ))
      .returning();

    if (!result[0]) {
      throw new Error("Attendance entry not found or access denied");
    }

    return result[0];
  }

  async deleteAttendanceEntry(id: string, organizationId: string): Promise<boolean> {
    await this.ensureInitialized();
    const result = await db.delete(attendanceEntries).where(and(
      eq(attendanceEntries.id, id),
      eq(attendanceEntries.organizationId, organizationId)
    ));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async deleteAttendanceEntriesByUserId(userId: string, organizationId: string): Promise<boolean> {
    await this.ensureInitialized();
    const result = await db.delete(attendanceEntries).where(
      and(
        eq(attendanceEntries.userId, userId),
        eq(attendanceEntries.organizationId, organizationId)
      )
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getHoursAdjustment(dailyReportId: string, organizationId: string): Promise<HoursAdjustment | undefined> {
    await this.ensureInitialized();
    const adjustments = await db.select()
      .from(hoursAdjustments)
      .where(
        and(
          eq(hoursAdjustments.dailyReportId, dailyReportId),
          eq(hoursAdjustments.organizationId, organizationId)
        )
      );
    return adjustments[0];
  }

  async createHoursAdjustment(adjustment: InsertHoursAdjustment, organizationId: string, createdBy: string): Promise<HoursAdjustment> {
    await this.ensureInitialized();
    const result = await db.insert(hoursAdjustments).values({
      ...adjustment,
      organizationId,
      createdBy
    }).returning();
    return result[0];
  }

  async updateHoursAdjustment(id: string, updates: UpdateHoursAdjustment, organizationId: string): Promise<HoursAdjustment> {
    await this.ensureInitialized();
    const result = await db.update(hoursAdjustments)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(and(
        eq(hoursAdjustments.id, id),
        eq(hoursAdjustments.organizationId, organizationId)
      ))
      .returning();

    if (!result[0]) {
      throw new Error("Hours adjustment not found or access denied");
    }

    return result[0];
  }

  async deleteHoursAdjustment(id: string, organizationId: string): Promise<boolean> {
    await this.ensureInitialized();
    const result = await db.delete(hoursAdjustments).where(and(
      eq(hoursAdjustments.id, id),
      eq(hoursAdjustments.organizationId, organizationId)
    ));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async deleteHoursAdjustmentsByReportId(reportId: string, organizationId: string): Promise<boolean> {
    await this.ensureInitialized();
    const result = await db.delete(hoursAdjustments).where(and(
      eq(hoursAdjustments.dailyReportId, reportId),
      eq(hoursAdjustments.organizationId, organizationId)
    ));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Vehicles (Mezzi)
  async getAllVehicles(organizationId: string): Promise<Vehicle[]> {
    await this.ensureInitialized();
    return await db.select().from(vehicles).where(eq(vehicles.organizationId, organizationId));
  }

  async getVehicle(id: string): Promise<Vehicle | undefined> {
    await this.ensureInitialized();
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle || undefined;
  }

  async createVehicle(vehicle: InsertVehicle, organizationId: string): Promise<Vehicle> {
    await this.ensureInitialized();
    const [created] = await db.insert(vehicles).values({
      ...vehicle,
      organizationId
    }).returning();
    return created;
  }

  async updateVehicle(id: string, updates: UpdateVehicle, organizationId: string): Promise<Vehicle> {
    await this.ensureInitialized();
    const [updated] = await db.update(vehicles)
      .set(updates)
      .where(
        and(
          eq(vehicles.id, id),
          eq(vehicles.organizationId, organizationId)
        )
      )
      .returning();
    if (!updated) {
      throw new Error("Vehicle not found or access denied");
    }
    return updated;
  }

  async deleteVehicle(id: string, organizationId: string): Promise<boolean> {
    await this.ensureInitialized();
    // First verify vehicle exists and belongs to the organization
    const [existing] = await db.select().from(vehicles).where(
      and(
        eq(vehicles.id, id),
        eq(vehicles.organizationId, organizationId)
      )
    );
    if (!existing) {
      return false; // Vehicle not found or access denied
    }
    // Now safe to delete fuel refills (we know vehicle belongs to this org)
    await this.deleteFuelRefillsByVehicleId(id);
    // Finally delete the vehicle
    const result = await db.delete(vehicles).where(eq(vehicles.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Fuel Refills (Rifornimenti)
  async getAllFuelRefills(organizationId: string): Promise<FuelRefill[]> {
    await this.ensureInitialized();
    return await db.select()
      .from(fuelRefills)
      .where(eq(fuelRefills.organizationId, organizationId))
      .orderBy(desc(fuelRefills.refillDate));
  }

  async getFuelRefillsByVehicle(vehicleId: string, organizationId: string): Promise<FuelRefill[]> {
    await this.ensureInitialized();
    return await db.select()
      .from(fuelRefills)
      .where(
        and(
          eq(fuelRefills.vehicleId, vehicleId),
          eq(fuelRefills.organizationId, organizationId)
        )
      )
      .orderBy(desc(fuelRefills.refillDate));
  }

  async getFuelRefill(id: string): Promise<FuelRefill | undefined> {
    await this.ensureInitialized();
    const [refill] = await db.select().from(fuelRefills).where(eq(fuelRefills.id, id));
    return refill || undefined;
  }

  async createFuelRefill(refill: InsertFuelRefill, organizationId: string): Promise<FuelRefill> {
    await this.ensureInitialized();
    const [created] = await db.insert(fuelRefills).values({
      ...refill,
      organizationId
    }).returning();
    return created;
  }

  async updateFuelRefill(id: string, updates: UpdateFuelRefill, organizationId: string): Promise<FuelRefill> {
    await this.ensureInitialized();
    const [updated] = await db.update(fuelRefills)
      .set(updates)
      .where(
        and(
          eq(fuelRefills.id, id),
          eq(fuelRefills.organizationId, organizationId)
        )
      )
      .returning();
    if (!updated) {
      throw new Error("Fuel refill not found or access denied");
    }
    return updated;
  }

  async deleteFuelRefill(id: string, organizationId: string): Promise<boolean> {
    await this.ensureInitialized();
    const result = await db.delete(fuelRefills).where(
      and(
        eq(fuelRefills.id, id),
        eq(fuelRefills.organizationId, organizationId)
      )
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  async deleteFuelRefillsByVehicleId(vehicleId: string): Promise<boolean> {
    await this.ensureInitialized();
    const result = await db.delete(fuelRefills).where(eq(fuelRefills.vehicleId, vehicleId));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Fuel Tank Loads (Carichi cisterna)
  async getAllFuelTankLoads(organizationId: string): Promise<FuelTankLoad[]> {
    await this.ensureInitialized();
    return await db.select()
      .from(fuelTankLoads)
      .where(eq(fuelTankLoads.organizationId, organizationId))
      .orderBy(desc(fuelTankLoads.loadDate));
  }

  async getFuelTankLoad(id: string): Promise<FuelTankLoad | undefined> {
    await this.ensureInitialized();
    const [load] = await db.select().from(fuelTankLoads).where(eq(fuelTankLoads.id, id));
    return load || undefined;
  }

  async createFuelTankLoad(load: InsertFuelTankLoad, organizationId: string): Promise<FuelTankLoad> {
    await this.ensureInitialized();
    const [created] = await db.insert(fuelTankLoads).values({
      ...load,
      organizationId
    }).returning();
    return created;
  }

  async updateFuelTankLoad(id: string, updates: UpdateFuelTankLoad, organizationId: string): Promise<FuelTankLoad> {
    await this.ensureInitialized();
    const [updated] = await db.update(fuelTankLoads)
      .set(updates)
      .where(
        and(
          eq(fuelTankLoads.id, id),
          eq(fuelTankLoads.organizationId, organizationId)
        )
      )
      .returning();
    if (!updated) {
      throw new Error("Fuel tank load not found or access denied");
    }
    return updated;
  }

  async deleteFuelTankLoad(id: string, organizationId: string): Promise<boolean> {
    await this.ensureInitialized();
    const result = await db.delete(fuelTankLoads).where(
      and(
        eq(fuelTankLoads.id, id),
        eq(fuelTankLoads.organizationId, organizationId)
      )
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getRemainingFuelLiters(organizationId: string): Promise<number> {
    await this.ensureInitialized();
    
    // Get all tank loads (carichi)
    const loads = await db.select()
      .from(fuelTankLoads)
      .where(eq(fuelTankLoads.organizationId, organizationId));
    
    const totalLoads = loads.reduce((sum, load) => {
      return sum + parseFloat(load.liters || '0');
    }, 0);
    
    // Get all fuel refills (scarichi)
    const refills = await db.select()
      .from(fuelRefills)
      .where(eq(fuelRefills.organizationId, organizationId));
    
    const totalRefills = refills.reduce((sum, refill) => {
      return sum + parseFloat(refill.litersRefilled || '0');
    }, 0);
    
    return totalLoads - totalRefills;
  }

  async getFuelRefillsStatistics(organizationId: string, year?: string, month?: string) {
    await this.ensureInitialized();
    
    // Get all refills for the organization
    let refills = await db.select()
      .from(fuelRefills)
      .where(eq(fuelRefills.organizationId, organizationId))
      .orderBy(desc(fuelRefills.refillDate));
    
    // Filter by year and month if provided (skip if "all")
    if (year && year !== 'all') {
      refills = refills.filter(r => {
        const refillDate = new Date(r.refillDate);
        return refillDate.getFullYear().toString() === year;
      });
    }
    if (month && month !== 'all') {
      refills = refills.filter(r => {
        const refillDate = new Date(r.refillDate);
        return (refillDate.getMonth() + 1).toString().padStart(2, '0') === month.padStart(2, '0');
      });
    }
    
    // Get all vehicles
    const allVehicles = await db.select()
      .from(vehicles)
      .where(eq(vehicles.organizationId, organizationId));
    
    // Aggregate by vehicle
    const vehicleStats = new Map<string, { totalLiters: number; totalCost: number; refillCount: number; vehicleName: string }>();
    
    for (const refill of refills) {
      const vehicleId = refill.vehicleId;
      const vehicle = allVehicles.find(v => v.id === vehicleId);
      const vehicleName = vehicle ? `${vehicle.name} (${vehicle.licensePlate})` : 'Sconosciuto';
      
      if (!vehicleStats.has(vehicleId)) {
        vehicleStats.set(vehicleId, {
          totalLiters: 0,
          totalCost: 0,
          refillCount: 0,
          vehicleName
        });
      }
      
      const stats = vehicleStats.get(vehicleId)!;
      stats.totalLiters += parseFloat(refill.litersRefilled || '0');
      // Calculate cost from litersRefilled (assuming price per liter can be calculated)
      // For now, we don't have cost data in refills, so we'll set it to 0
      stats.totalCost += 0;
      stats.refillCount += 1;
    }
    
    const byVehicle = Array.from(vehicleStats.entries()).map(([vehicleId, stats]) => ({
      vehicleId,
      vehicleName: stats.vehicleName,
      totalLiters: stats.totalLiters,
      totalCost: stats.totalCost,
      refillCount: stats.refillCount
    }));
    
    // Aggregate by month
    const monthStats = new Map<string, { totalLiters: number; totalCost: number; refillCount: number; year: string }>();
    
    for (const refill of refills) {
      const refillDate = new Date(refill.refillDate);
      const monthKey = refillDate.toISOString().substring(0, 7); // YYYY-MM
      const [yearStr, monthStr] = monthKey.split('-');
      
      if (!monthStats.has(monthKey)) {
        monthStats.set(monthKey, {
          totalLiters: 0,
          totalCost: 0,
          refillCount: 0,
          year: yearStr
        });
      }
      
      const stats = monthStats.get(monthKey)!;
      stats.totalLiters += parseFloat(refill.litersRefilled || '0');
      stats.totalCost += 0;
      stats.refillCount += 1;
    }
    
    const byMonth = Array.from(monthStats.entries())
      .map(([monthKey, stats]) => {
        const [year, month] = monthKey.split('-');
        return {
          month,
          year,
          totalLiters: stats.totalLiters,
          totalCost: stats.totalCost,
          refillCount: stats.refillCount
        };
      })
      .sort((a, b) => `${a.year}-${a.month}`.localeCompare(`${b.year}-${b.month}`));
    
    return {
      byVehicle,
      byMonth
    };
  }

  async getMonthlyAttendance(organizationId: string, year: string, month: string): Promise<any> {
    await this.ensureInitialized();
    
    // Get all employees
    const allEmployees = await db.select()
      .from(users)
      .where(
        and(
          eq(users.organizationId, organizationId),
          eq(users.role, 'employee')
        )
      );
    
    // Get daily reports for the month
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = `${year}-${month.padStart(2, '0')}-31`;
    
    const reports = await db.select()
      .from(dailyReports)
      .where(
        and(
          eq(dailyReports.organizationId, organizationId),
          eq(dailyReports.status, 'Approvato')
        )
      );
    
    const monthReports = reports.filter(r => r.date >= startDate && r.date <= endDate);
    
    // Get all operations for these reports
    const reportIds = monthReports.map(r => r.id);
    const allOperations = await db.select().from(operations);
    const monthOperations = allOperations.filter(op => reportIds.includes(op.dailyReportId));
    
    // Get attendance entries for the month
    const absences = await this.getAllAttendanceEntries(organizationId, year, month);
    
    // Get all hours adjustments for these reports
    const allAdjustments = await db.select().from(hoursAdjustments);
    const monthAdjustments = allAdjustments.filter(adj => reportIds.includes(adj.dailyReportId));
    
    // Get employee IDs who have reports or absences in this month
    const employeeIdsWithReports = new Set(monthReports.map(r => r.employeeId));
    const employeeIdsWithAbsences = new Set(absences.map(a => a.userId));
    
    // Filter employees: show active ones OR disabled ones with activity in this month
    const relevantUsers = allEmployees.filter(user => 
      user.isActive !== false || 
      employeeIdsWithReports.has(user.id) || 
      employeeIdsWithAbsences.has(user.id)
    );
    
    // Build attendance data
    const attendanceData = relevantUsers.map(user => {
      const userReports = monthReports.filter(r => r.employeeId === user.id);
      const userAbsences = absences.filter(a => a.userId === user.id);
      
      const dailyData: Record<string, { ordinary: number; overtime: number; absence?: string; adjustment?: number }> = {};
      
      // Process daily reports
      userReports.forEach(report => {
        const reportOps = monthOperations.filter(op => op.dailyReportId === report.id);
        let totalHours = reportOps.reduce((sum, op) => sum + Number(op.hours), 0);
        
        // Apply hours adjustment if exists
        const adjustment = monthAdjustments.find(adj => adj.dailyReportId === report.id);
        if (adjustment) {
          const adjustmentValue = Number(adjustment.adjustment);
          totalHours += adjustmentValue;
        }
        
        const ordinary = Math.min(totalHours, 8);
        const overtime = Math.max(totalHours - 8, 0);
        
        dailyData[report.date] = { 
          ordinary, 
          overtime,
          ...(adjustment && { adjustment: Number(adjustment.adjustment) })
        };
      });
      
      // Add absences
      userAbsences.forEach(absence => {
        if (!dailyData[absence.date]) {
          dailyData[absence.date] = { ordinary: 0, overtime: 0 };
        }
        dailyData[absence.date].absence = absence.absenceType;
      });
      
      return {
        userId: user.id,
        fullName: user.fullName,
        dailyData
      };
    });
    
    return attendanceData;
  }

  // Attendance Statistics (Statistiche Assenze)
  async getAttendanceStats(organizationId: string, days: number = 90): Promise<{
    byEmployee: Array<{
      userId: string;
      fullName: string;
      isActive: boolean;
      totalAbsences: number;
      strategicAbsences: number;
      byType: Record<string, number>;
      byDayOfWeek: Record<number, number>;
    }>;
    byType: Record<string, number>;
    byDayOfWeek: Record<number, number>;
    byMonth: Array<{
      month: string;
      year: string;
      count: number;
    }>;
    totalAbsences: number;
    totalStrategicAbsences: number;
  }> {
    await this.ensureInitialized();
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Get all attendance entries for the organization in the date range
    const allEntries = await db.select()
      .from(attendanceEntries)
      .where(eq(attendanceEntries.organizationId, organizationId));
    
    // Filter entries by date range
    const entries = allEntries.filter(entry => 
      entry.date >= startDateStr && entry.date <= endDateStr
    );
    
    // Get all active users for this organization
    const allUsers = await this.getAllUsers(organizationId);
    const userMap = new Map(allUsers.map(u => [u.id, u]));
    
    // Initialize aggregations
    const byType: Record<string, number> = {};
    const byDayOfWeek: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const byMonthMap: Map<string, number> = new Map();
    const byEmployeeMap: Map<string, {
      totalAbsences: number;
      strategicAbsences: number;
      byType: Record<string, number>;
      byDayOfWeek: Record<number, number>;
    }> = new Map();
    let totalStrategicAbsences = 0;
    
    // Process each entry
    for (const entry of entries) {
      // By type
      byType[entry.absenceType] = (byType[entry.absenceType] || 0) + 1;
      
      // By day of week
      const entryDate = new Date(entry.date);
      const dayOfWeek = entryDate.getDay();
      byDayOfWeek[dayOfWeek]++;
      
      // By month
      const monthKey = `${entry.date.substring(0, 7)}`; // YYYY-MM
      byMonthMap.set(monthKey, (byMonthMap.get(monthKey) || 0) + 1);
      
      // Check if strategic absence (exclude Ferie 'F')
      const isStrategic = entry.absenceType !== 'F' && isStrategicAbsence(entry.date);
      if (isStrategic) {
        totalStrategicAbsences++;
      }
      
      // By employee
      if (!byEmployeeMap.has(entry.userId)) {
        byEmployeeMap.set(entry.userId, {
          totalAbsences: 0,
          strategicAbsences: 0,
          byType: {},
          byDayOfWeek: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
        });
      }
      const empStats = byEmployeeMap.get(entry.userId)!;
      empStats.totalAbsences++;
      if (isStrategic) {
        empStats.strategicAbsences++;
      }
      empStats.byType[entry.absenceType] = (empStats.byType[entry.absenceType] || 0) + 1;
      empStats.byDayOfWeek[dayOfWeek]++;
    }
    
    // Build byEmployee array
    const byEmployee = Array.from(byEmployeeMap.entries()).map(([userId, stats]) => ({
      userId,
      fullName: userMap.get(userId)?.fullName || 'Utente sconosciuto',
      isActive: userMap.get(userId)?.isActive ?? false,
      totalAbsences: stats.totalAbsences,
      strategicAbsences: stats.strategicAbsences,
      byType: stats.byType,
      byDayOfWeek: stats.byDayOfWeek
    })).sort((a, b) => b.totalAbsences - a.totalAbsences);
    
    // Build byMonth array sorted by date (month in YYYY-MM format for frontend charts)
    const byMonth = Array.from(byMonthMap.entries())
      .map(([key, count]) => ({
        month: key,  // Keep as YYYY-MM format for frontend charts
        year: key.substring(0, 4),
        count
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
    
    return {
      byEmployee,
      byType,
      byDayOfWeek,
      byMonth,
      totalAbsences: entries.length,
      totalStrategicAbsences
    };
  }

  async getEmployeeAttendanceStats(organizationId: string, userId: string, days: number = 90): Promise<{
    userId: string;
    fullName: string;
    byType: Record<string, number>;
    byDayOfWeek: Record<number, number>;
    byMonth: Array<{
      month: string;
      year: string;
      count: number;
    }>;
    totalAbsences: number;
    strategicAbsences: number;
    strategicPercentage: number;
  }> {
    await this.ensureInitialized();
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Get user info
    const user = await this.getUser(userId);
    const fullName = user?.fullName || 'Utente sconosciuto';
    
    // Get attendance entries for this specific user
    const allEntries = await db.select()
      .from(attendanceEntries)
      .where(and(
        eq(attendanceEntries.organizationId, organizationId),
        eq(attendanceEntries.userId, userId)
      ));
    
    // Filter entries by date range
    const entries = allEntries.filter(entry => 
      entry.date >= startDateStr && entry.date <= endDateStr
    );
    
    // Initialize aggregations
    const byType: Record<string, number> = {};
    const byDayOfWeek: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const byMonthMap: Map<string, number> = new Map();
    let strategicAbsences = 0;
    
    // Process each entry
    for (const entry of entries) {
      // By type
      byType[entry.absenceType] = (byType[entry.absenceType] || 0) + 1;
      
      // By day of week
      const entryDate = new Date(entry.date);
      const dayOfWeek = entryDate.getDay();
      byDayOfWeek[dayOfWeek]++;
      
      // By month
      const monthKey = `${entry.date.substring(0, 7)}`; // YYYY-MM
      byMonthMap.set(monthKey, (byMonthMap.get(monthKey) || 0) + 1);
      
      // Check if strategic absence (exclude Ferie 'F')
      if (entry.absenceType !== 'F' && isStrategicAbsence(entry.date)) {
        strategicAbsences++;
      }
    }
    
    // Build byMonth array sorted by date
    const byMonth = Array.from(byMonthMap.entries())
      .map(([key, count]) => ({
        month: key,
        year: key.substring(0, 4),
        count
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
    
    // Calculate strategic percentage (excluding Ferie from total for percentage calculation)
    const absencesExcludingFerie = entries.filter(e => e.absenceType !== 'F').length;
    const strategicPercentage = absencesExcludingFerie > 0 
      ? Math.round((strategicAbsences / absencesExcludingFerie) * 100) 
      : 0;
    
    return {
      userId,
      fullName,
      byType,
      byDayOfWeek,
      byMonth,
      totalAbsences: entries.length,
      strategicAbsences,
      strategicPercentage
    };
  }

  async getStrategicAbsencesReport(organizationId: string, days: number = 90): Promise<string> {
    await this.ensureInitialized();
    
    const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    const absenceTypeNames: Record<string, string> = {
      'A': 'Assenza',
      'P': 'Permesso',
      'M': 'Malattia',
      'CP': 'Cassa Integrazione/Permesso',
      'L104': 'Legge 104',
      'F': 'Ferie'
    };
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Get all users for this organization
    const allUsers = await db.select().from(users).where(eq(users.organizationId, organizationId));
    const userMap = new Map(allUsers.map(u => [u.id, u.fullName]));
    
    // Get all attendance entries (excluding Ferie)
    const allEntries = await db.select()
      .from(attendanceEntries)
      .where(eq(attendanceEntries.organizationId, organizationId));
    
    const entries = allEntries.filter(entry => 
      entry.date >= startDateStr && 
      entry.date <= endDateStr && 
      entry.absenceType !== 'F'
    );
    
    // Find strategic absences
    const strategicAbsences: Array<{
      date: string;
      dayOfWeek: string;
      employee: string;
      type: string;
      typeName: string;
      reason: string;
    }> = [];
    
    for (const entry of entries) {
      const info = this.getAdjacentInfo(entry.date);
      if (info.isStrategic) {
        const date = new Date(entry.date + 'T12:00:00');
        strategicAbsences.push({
          date: entry.date,
          dayOfWeek: dayNames[date.getDay()],
          employee: userMap.get(entry.userId) || 'Utente sconosciuto',
          type: entry.absenceType,
          typeName: absenceTypeNames[entry.absenceType] || entry.absenceType,
          reason: info.reason
        });
      }
    }
    
    // Sort by date descending
    strategicAbsences.sort((a, b) => b.date.localeCompare(a.date));
    
    // Generate report
    const lines: string[] = [];
    lines.push('='.repeat(80));
    lines.push('REPORT ASSENZE STRATEGICHE');
    lines.push('Assenze (escluse Ferie) registrate il giorno prima o dopo weekend/festività');
    lines.push('='.repeat(80));
    lines.push(`Generato il: ${new Date().toLocaleString('it-IT')}`);
    lines.push(`Periodo: ultimi ${days} giorni`);
    lines.push(`Totale assenze strategiche: ${strategicAbsences.length}`);
    lines.push('');
    lines.push('-'.repeat(80));
    lines.push('');
    
    // Group by employee
    const byEmployee = new Map<string, typeof strategicAbsences>();
    for (const absence of strategicAbsences) {
      if (!byEmployee.has(absence.employee)) {
        byEmployee.set(absence.employee, []);
      }
      byEmployee.get(absence.employee)!.push(absence);
    }
    
    // Sort employees by count descending
    const sortedEmployees = Array.from(byEmployee.entries()).sort((a, b) => b[1].length - a[1].length);
    
    lines.push('RIEPILOGO PER DIPENDENTE:');
    lines.push('');
    for (let i = 0; i < sortedEmployees.length; i++) {
      const [employee, absences] = sortedEmployees[i];
      lines.push(`  ${employee}: ${absences.length} assenze strategiche`);
    }
    lines.push('');
    lines.push('-'.repeat(80));
    lines.push('');
    lines.push('DETTAGLIO ASSENZE STRATEGICHE:');
    lines.push('');
    
    for (let i = 0; i < sortedEmployees.length; i++) {
      const [employee, absences] = sortedEmployees[i];
      lines.push(`\n${employee} (${absences.length} assenze):`);
      lines.push('-'.repeat(40));
      for (let j = 0; j < absences.length; j++) {
        const absence = absences[j];
        const dateFormatted = absence.date.split('-').reverse().join('/');
        lines.push(`  ${dateFormatted} (${absence.dayOfWeek}) - ${absence.typeName}`);
        lines.push(`    Motivo: ${absence.reason}`);
      }
    }
    
    lines.push('');
    lines.push('='.repeat(80));
    lines.push('LEGENDA TIPI ASSENZA:');
    lines.push('  A  = Assenza');
    lines.push('  P  = Permesso');
    lines.push('  M  = Malattia');
    lines.push('  CP = Cassa Integrazione/Permesso');
    lines.push('  L104 = Legge 104');
    lines.push('='.repeat(80));
    
    return lines.join('\n');
  }
  
  private getAdjacentInfo(dateStr: string): { isStrategic: boolean; reason: string } {
    const date = new Date(dateStr + 'T12:00:00');
    const holidays = this.getAllHolidaysForDate(dateStr);
    
    const dayBefore = new Date(date);
    dayBefore.setDate(dayBefore.getDate() - 1);
    const dayBeforeStr = formatDateToString(dayBefore);
    const beforeDayOfWeek = dayBefore.getDay();
    const beforeIsWeekend = beforeDayOfWeek === 0 || beforeDayOfWeek === 6;
    const beforeIsHoliday = holidays.has(dayBeforeStr);
    
    const dayAfter = new Date(date);
    dayAfter.setDate(dayAfter.getDate() + 1);
    const dayAfterStr = formatDateToString(dayAfter);
    const afterDayOfWeek = dayAfter.getDay();
    const afterIsWeekend = afterDayOfWeek === 0 || afterDayOfWeek === 6;
    const afterIsHoliday = holidays.has(dayAfterStr);
    
    const reasons: string[] = [];
    
    if (beforeIsWeekend) {
      reasons.push(`giorno prima (${dayBeforeStr}) è weekend`);
    } else if (beforeIsHoliday) {
      reasons.push(`giorno prima (${dayBeforeStr}) è festività`);
    }
    
    if (afterIsWeekend) {
      reasons.push(`giorno dopo (${dayAfterStr}) è weekend`);
    } else if (afterIsHoliday) {
      reasons.push(`giorno dopo (${dayAfterStr}) è festività`);
    }
    
    return {
      isStrategic: reasons.length > 0,
      reason: reasons.join('; ')
    };
  }
  
  private getAllHolidaysForDate(dateStr: string): Set<string> {
    const date = new Date(dateStr + 'T12:00:00');
    const year = date.getFullYear();
    const allHolidays = new Set<string>();
    
    [year - 1, year, year + 1].forEach(y => {
      getItalianHolidays(y).forEach(h => allHolidays.add(h));
    });
    
    return allHolidays;
  }
}

export const storage = new DatabaseStorage();
