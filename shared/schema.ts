import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, numeric, index, date, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Organizations table (Aziende/Clienti SaaS)
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  subdomain: text("subdomain").unique(), // es: "azienda1" per azienda1.tuaapp.com
  logo: text("logo"), // URL del logo aziendale
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  // Subscription fields for SaaS
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  subscriptionStatus: varchar("subscription_status", { length: 50 }).notNull().default('trial'),
  subscriptionPlan: varchar("subscription_plan", { length: 50 }).notNull().default('free'),
  subscriptionId: varchar("subscription_id", { length: 255 }),
  trialEndDate: timestamp("trial_end_date"),
  billingEmail: text("billing_email"),
  subscriptionCurrentPeriodEnd: timestamp("subscription_current_period_end"),
  maxEmployees: integer("max_employees").default(5),
  // Anagrafica aziendale
  vatNumber: text("vat_number"), // Partita IVA
  phone: text("phone"), // Telefono
});

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id),
  username: text("username").notNull(),
  password: text("password").notNull(),
  mustResetPassword: boolean("must_reset_password").notNull().default(false), // true = must set new password at next login
  role: text("role").notNull().default("employee"), // employee, admin, superadmin, or teamleader
  fullName: text("full_name").notNull(),
  isActive: boolean("is_active").notNull().default(true), // true = attivo, false = licenziato
});

// Clients table
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  name: text("name").notNull(),
  description: text("description"),
});

// Work types master table (Lavorazioni)
export const workTypes = pgTable("work_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
});

// Materials master table (Materiali)
export const materials = pgTable("materials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
});

// Work orders (Commesse) table
export const workOrders = pgTable("work_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  estimatedHours: numeric("estimated_hours"), // Ore previste per completare la commessa
  availableWorkTypes: text("available_work_types").array().notNull().default(sql`ARRAY[]::text[]`),
  availableMaterials: text("available_materials").array().notNull().default(sql`ARRAY[]::text[]`),
}, (table) => ({
  orgActiveIdx: index("work_orders_org_active_idx").on(table.organizationId, table.isActive),
  clientIdx: index("work_orders_client_idx").on(table.clientId),
}));

// Work order expenses table (Spese per commesse)
export const workOrderExpenses = pgTable("work_order_expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  workOrderId: varchar("work_order_id").notNull().references(() => workOrders.id, { onDelete: 'cascade' }),
  amount: numeric("amount").notNull(), // Importo in €
  description: text("description").notNull(), // Descrizione/Note
  date: date("date").notNull(), // Data spesa
  category: text("category").notNull(), // carburante | materiali | trasferta | altro
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  workOrderIdx: index("expenses_work_order_idx").on(table.workOrderId),
  orgIdx: index("expenses_org_idx").on(table.organizationId),
}));

// Daily reports table
export const dailyReports = pgTable("daily_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  employeeId: varchar("employee_id").notNull().references(() => users.id),
  date: text("date").notNull(), // YYYY-MM-DD format
  status: text("status").notNull().default("In attesa"), // "In attesa" or "Approvato"
  createdBy: text("created_by").notNull().default("utente"), // "utente", "ufficio", "caposquadra"
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  // Campi per rapportini di squadra
  teamSubmissionId: varchar("team_submission_id").references(() => teamSubmissions.id),
  submittedById: varchar("submitted_by_id").references(() => users.id), // Chi ha compilato (caposquadra)
}, (table) => ({
  orgDateIdx: index("daily_reports_org_date_idx").on(table.organizationId, table.date),
  employeeDateIdx: index("daily_reports_employee_date_idx").on(table.employeeId, table.date),
  teamSubmissionIdx: index("daily_reports_team_submission_idx").on(table.teamSubmissionId),
}));

// Operations table (multiple operations per daily report)
export const operations = pgTable("operations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dailyReportId: varchar("daily_report_id").notNull().references(() => dailyReports.id),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  workOrderId: varchar("work_order_id").notNull().references(() => workOrders.id),
  workTypes: text("work_types").array().notNull(), // Multiple work types: ["Taglio", "Saldatura", "Montaggio"]
  materials: text("materials").array().notNull().default(sql`ARRAY[]::text[]`), // Multiple materials: ["Acciaio", "Alluminio"]
  hours: numeric("hours").notNull(), // Ore lavorate per questa operazione (es. 2.5)
  notes: text("notes"),
  photos: text("photos").array().notNull().default(sql`ARRAY[]::text[]`), // Photo paths from object storage (max 5)
}, (table) => ({
  dailyReportIdx: index("operations_daily_report_idx").on(table.dailyReportId),
}));

// Attendance entries (Assenze manuali gestite dall'admin)
export const attendanceEntries = pgTable("attendance_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: text("date").notNull(), // YYYY-MM-DD format
  absenceType: text("absence_type").notNull(), // A, F, P, M, CP, L104
  hours: numeric("hours"), // Ore di permesso/assenza (null per giornata intera o tipi senza ore)
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Hours adjustments (Aggiustamenti ore per rapportini)
export const hoursAdjustments = pgTable("hours_adjustments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  dailyReportId: varchar("daily_report_id").notNull().references(() => dailyReports.id),
  adjustment: numeric("adjustment").notNull(), // Valore positivo o negativo (es. +0.5 o -1.5)
  reason: text("reason"), // Motivo opzionale dell'aggiustamento
  createdBy: varchar("created_by").notNull().references(() => users.id), // Admin che ha creato l'aggiustamento
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Advances (Acconti mensili per dipendenti)
export const advances = pgTable("advances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  yearMonth: text("year_month").notNull(), // Formato: "2026-01"
  amount: numeric("amount").notNull(), // Importo in euro (es. "150.00")
  notes: text("notes"), // Note opzionali
  createdBy: varchar("created_by").notNull().references(() => users.id), // Admin che ha registrato l'acconto
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  orgYearMonthIdx: index("advances_org_year_month_idx").on(table.organizationId, table.yearMonth),
  userYearMonthIdx: index("advances_user_year_month_idx").on(table.userId, table.yearMonth),
}));

// Vehicles table (Mezzi aziendali per gestione carburante)
export const vehicles = pgTable("vehicles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  name: text("name").notNull(), // Nome del mezzo (es. "Furgone 1", "Camion rosso")
  licensePlate: text("license_plate").notNull(), // Targa
  fuelType: text("fuel_type").notNull(), // Benzina, Diesel, GPL, Metano, Elettrico
  currentKm: numeric("current_km"), // Km attuali (opzionale)
  currentEngineHours: numeric("current_engine_hours"), // Ore motore attuali (opzionale, per mezzi da lavoro)
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  orgIdx: index("vehicles_org_idx").on(table.organizationId),
}));

// Fuel refills table (Rifornimenti carburante - scarichi dalla cisterna)
export const fuelRefills = pgTable("fuel_refills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  vehicleId: varchar("vehicle_id").notNull().references(() => vehicles.id),
  refillDate: timestamp("refill_date").notNull().default(sql`now()`), // Data e ora rifornimento
  operatorId: varchar("operator_id").references(() => users.id), // Chi ha fatto il rifornimento (opzionale)
  litersBefore: numeric("liters_before").notNull(), // Litri nel serbatoio prima del rifornimento
  litersAfter: numeric("liters_after").notNull(), // Litri nel serbatoio dopo il rifornimento
  litersRefilled: numeric("liters_refilled").notNull(), // Litri erogati (after - before)
  kmReading: numeric("km_reading"), // Lettura km al momento del rifornimento
  engineHoursReading: numeric("engine_hours_reading"), // Lettura ore motore (opzionale)
  totalCost: numeric("total_cost"), // Costo totale rifornimento (opzionale)
  notes: text("notes"), // Note aggiuntive
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  vehicleIdx: index("fuel_refills_vehicle_idx").on(table.vehicleId),
  orgDateIdx: index("fuel_refills_org_date_idx").on(table.organizationId, table.refillDate),
}));

// Teams table (Squadre con caposquadra)
export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  name: text("name").notNull(),
  teamLeaderId: varchar("team_leader_id").notNull().references(() => users.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  orgIdx: index("teams_org_idx").on(table.organizationId),
  leaderIdx: index("teams_leader_idx").on(table.teamLeaderId),
}));

// Team members table (Membri squadra)
export const teamMembers = pgTable("team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull().references(() => teams.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id),
  isActive: boolean("is_active").notNull().default(true),
  joinedAt: timestamp("joined_at").notNull().default(sql`now()`),
}, (table) => ({
  teamIdx: index("team_members_team_idx").on(table.teamId),
  userIdx: index("team_members_user_idx").on(table.userId),
}));

// Team submissions table (Invii rapportini di squadra - audit trail)
export const teamSubmissions = pgTable("team_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  teamId: varchar("team_id").notNull().references(() => teams.id),
  teamLeaderId: varchar("team_leader_id").notNull().references(() => users.id),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  workOrderId: varchar("work_order_id").notNull().references(() => workOrders.id),
  date: text("date").notNull(), // YYYY-MM-DD format
  hours: numeric("hours").notNull(), // Ore standard per tutti i dipendenti
  status: text("status").notNull().default("In attesa"), // "In attesa" or "Approvato"
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  orgDateIdx: index("team_submissions_org_date_idx").on(table.organizationId, table.date),
  teamIdx: index("team_submissions_team_idx").on(table.teamId),
  teamDateIdx: index("team_submissions_team_date_idx").on(table.teamId, table.date),
}));

// Fuel tank loads table (Carichi cisterna carburante)
export const fuelTankLoads = pgTable("fuel_tank_loads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  loadDate: timestamp("load_date").notNull().default(sql`now()`), // Data e ora carico
  liters: numeric("liters").notNull(), // Litri caricati nella cisterna
  totalCost: numeric("total_cost"), // Costo totale del carico (opzionale)
  supplier: text("supplier"), // Fornitore (opzionale)
  notes: text("notes"), // Note aggiuntive
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  orgDateIdx: index("fuel_tank_loads_org_date_idx").on(table.organizationId, table.loadDate),
}));

// Agenda items table (Eventi, scadenze, promemoria)
export const agendaItems = pgTable("agenda_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  title: text("title").notNull(),
  description: text("description"),
  eventDate: date("event_date").notNull(),
  eventTime: text("event_time"), // HH:MM format, NULL per eventi giornata intera
  eventType: text("event_type").notNull(), // 'deadline', 'appointment', 'reminder'
  recurrence: text("recurrence"), // NULL, 'daily', 'weekly', 'monthly', 'yearly'
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  orgDateIdx: index("agenda_items_org_date_idx").on(table.organizationId, table.eventDate),
  orgTypeIdx: index("agenda_items_org_type_idx").on(table.organizationId, table.eventType),
}));

// Report audit log table (Storico modifiche rapportini)
export const reportAuditLog = pgTable("report_audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dailyReportId: varchar("daily_report_id").notNull().references(() => dailyReports.id, { onDelete: 'cascade' }),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  changedById: varchar("changed_by_id").notNull().references(() => users.id),
  changeType: text("change_type").notNull(), // "creato", "modificato", "approvato", "riaperto"
  previousData: jsonb("previous_data"), // snapshot prima della modifica
  newData: jsonb("new_data"), // snapshot dopo la modifica
  summary: text("summary"), // descrizione leggibile (es. "Ore cambiate da 6 a 8")
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  reportIdx: index("report_audit_log_report_idx").on(table.dailyReportId),
  orgIdx: index("report_audit_log_org_idx").on(table.organizationId),
}));

// Insert schemas
export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  stripeCustomerId: true, // Managed by Stripe webhooks
  subscriptionId: true, // Managed by Stripe webhooks
  subscriptionCurrentPeriodEnd: true, // Managed by Stripe webhooks
}).extend({
  subscriptionStatus: z.enum(['trial', 'active', 'past_due', 'canceled', 'incomplete', 'paused', 'pending_approval']).optional().default('trial'),
  subscriptionPlan: z.enum(['free', 'starter_monthly', 'starter_yearly', 'business_monthly', 'business_yearly', 'professional_monthly', 'professional_yearly']).optional().default('free'),
  trialEndDate: z.union([z.string(), z.date(), z.null()]).optional().transform(val => {
    if (!val) return null;
    if (typeof val === 'string') return new Date(val);
    return val;
  }),
  billingEmail: z.string().email("Email non valida").optional(),
  maxEmployees: z.number().min(1).optional().default(5),
  vatNumber: z.string().optional(),
  phone: z.string().optional(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  organizationId: true, // Will be set automatically from session
}).extend({
  // Password validation - no requirements
  password: z.string().min(1, "Password è richiesta"),
  username: z.string().min(3, "Username deve essere di almeno 3 caratteri"),
  fullName: z.string().min(2, "Nome e cognome devono essere di almeno 2 caratteri")
});

// Update user schema for partial updates
export const updateUserSchema = insertUserSchema.partial().extend({
  id: z.string().optional()
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  organizationId: true, // Will be set automatically from session
});

export const insertWorkTypeSchema = createInsertSchema(workTypes).omit({
  id: true,
  organizationId: true, // Will be set automatically from session
});

export const insertMaterialSchema = createInsertSchema(materials).omit({
  id: true,
  organizationId: true, // Will be set automatically from session
});

export const insertWorkOrderSchema = createInsertSchema(workOrders).omit({
  id: true,
  organizationId: true, // Will be set automatically from session
}).extend({
  estimatedHours: z.union([z.string(), z.number(), z.null()])
    .transform(val => val === null || val === '' ? null : String(val))
    .optional(),
});

export const insertExpenseSchema = createInsertSchema(workOrderExpenses).omit({
  id: true,
  organizationId: true, // Will be set automatically from session
  createdBy: true,
  createdAt: true,
}).extend({
  amount: z.union([z.string(), z.number()])
    .transform(val => String(val)),
  category: z.enum(['carburante', 'materiali', 'trasferta', 'altro']),
});

export const insertDailyReportSchema = createInsertSchema(dailyReports).omit({
  id: true,
  organizationId: true, // Will be set automatically from session
  createdAt: true,
  updatedAt: true,
  teamSubmissionId: true, // Set automatically when created by team leader
  submittedById: true, // Set automatically when created by team leader
}).extend({
  createdBy: z.enum(["utente", "ufficio", "caposquadra"]).optional().default("utente")
});

export const insertOperationSchema = createInsertSchema(operations).omit({
  id: true,
}).extend({
  hours: z.union([z.string(), z.number()]).transform(val => String(val))
});

export const insertAttendanceEntrySchema = createInsertSchema(attendanceEntries).omit({
  id: true,
  organizationId: true, // Will be set automatically from session
  createdAt: true,
}).extend({
  absenceType: z.string().min(1, "Tipo assenza richiesto"),
  hours: z.union([z.string(), z.number(), z.null()]).transform(val =>
    val === null || val === undefined ? null : String(val)
  ).optional()
});

export const insertHoursAdjustmentSchema = createInsertSchema(hoursAdjustments).omit({
  id: true,
  organizationId: true, // Will be set automatically from session
  createdBy: true, // Will be set automatically from session
  createdAt: true,
  updatedAt: true,
}).extend({
  adjustment: z.union([z.string(), z.number()]).transform(val => String(val))
});

export const insertAdvanceSchema = createInsertSchema(advances).omit({
  id: true,
  organizationId: true, // Will be set automatically from session
  createdBy: true, // Will be set automatically from session
  createdAt: true,
}).extend({
  amount: z.union([z.string(), z.number()]).transform(val => String(val)),
  yearMonth: z.string().regex(/^\d{4}-\d{2}$/, "Formato mese non valido (deve essere YYYY-MM)"),
  notes: z.string().optional(),
});

export const updateAdvanceSchema = insertAdvanceSchema.partial().extend({
  id: z.string().optional()
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
  organizationId: true, // Will be set automatically from session
  createdAt: true,
}).extend({
  currentKm: z.union([z.string(), z.number(), z.null()]).optional().transform(val => val ? String(val) : null),
  currentEngineHours: z.union([z.string(), z.number(), z.null()]).optional().transform(val => val ? String(val) : null),
});

export const insertFuelRefillSchema = createInsertSchema(fuelRefills).omit({
  id: true,
  organizationId: true, // Will be set automatically from session
  createdAt: true,
}).extend({
  refillDate: z.union([z.string(), z.date()]).transform(val => {
    if (typeof val === 'string') return new Date(val);
    return val;
  }),
  litersBefore: z.union([z.string(), z.number()]).transform(val => String(val)),
  litersAfter: z.union([z.string(), z.number()]).transform(val => String(val)),
  litersRefilled: z.union([z.string(), z.number()]).transform(val => String(val)),
  kmReading: z.union([z.string(), z.number(), z.null()]).optional().transform(val => val ? String(val) : null),
  engineHoursReading: z.union([z.string(), z.number(), z.null()]).optional().transform(val => val ? String(val) : null),
  totalCost: z.union([z.string(), z.number(), z.null()]).optional().transform(val => val ? String(val) : null),
});

export const insertFuelTankLoadSchema = createInsertSchema(fuelTankLoads).omit({
  id: true,
  organizationId: true, // Will be set automatically from session
  createdAt: true,
}).extend({
  loadDate: z.union([z.string(), z.date()]).transform(val => {
    if (typeof val === 'string') return new Date(val);
    return val;
  }),
  liters: z.union([z.string(), z.number()]).transform(val => String(val)),
  totalCost: z.union([z.string(), z.number(), z.null()]).optional().transform(val => val ? String(val) : null),
});

// Teams insert schemas
export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  organizationId: true, // Will be set automatically from session
  createdAt: true,
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertTeamSubmissionSchema = createInsertSchema(teamSubmissions).omit({
  id: true,
  organizationId: true, // Will be set automatically from session
  createdAt: true,
}).extend({
  hours: z.union([z.string(), z.number()]).transform(val => String(val)),
});

// Update schemas for editing
export const updateDailyReportSchema = insertDailyReportSchema.partial().extend({
  id: z.string().optional()
});

export const updateOperationSchema = insertOperationSchema.partial().extend({
  id: z.string().optional()
});

export const updateWorkOrderSchema = insertWorkOrderSchema.partial().extend({
  id: z.string().optional()
});

export const updateAttendanceEntrySchema = insertAttendanceEntrySchema.partial().extend({
  id: z.string().optional(),
  absenceType: z.enum(["A", "F", "P", "M", "CP", "L104"]).optional()
});

export const updateHoursAdjustmentSchema = insertHoursAdjustmentSchema.partial().extend({
  id: z.string().optional()
});

export const updateVehicleSchema = insertVehicleSchema.partial().extend({
  id: z.string().optional()
});

export const updateFuelRefillSchema = insertFuelRefillSchema.partial().extend({
  id: z.string().optional()
});

export const updateFuelTankLoadSchema = insertFuelTankLoadSchema.partial().extend({
  id: z.string().optional()
});

// Agenda items insert schema
export const insertAgendaItemSchema = createInsertSchema(agendaItems).omit({
  id: true,
  organizationId: true, // Will be set automatically from session
  createdBy: true, // Will be set automatically from session
  createdAt: true,
  updatedAt: true,
}).extend({
  eventType: z.enum(['deadline', 'appointment', 'reminder']),
  recurrence: z.enum(['daily', 'weekly', 'monthly', 'yearly']).nullable().optional(),
  eventTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato ora non valido (HH:MM)").nullable().optional(),
});

export const updateAgendaItemSchema = insertAgendaItemSchema.partial().extend({
  id: z.string().optional()
});

// Types
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizations.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

export type InsertWorkType = z.infer<typeof insertWorkTypeSchema>;
export type WorkType = typeof workTypes.$inferSelect;

export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type Material = typeof materials.$inferSelect;

export type InsertWorkOrder = z.infer<typeof insertWorkOrderSchema>;
export type WorkOrder = typeof workOrders.$inferSelect;
export type UpdateWorkOrder = z.infer<typeof updateWorkOrderSchema>;

export type InsertWorkOrderExpense = z.infer<typeof insertExpenseSchema>;
export type WorkOrderExpense = typeof workOrderExpenses.$inferSelect;

export type InsertDailyReport = z.infer<typeof insertDailyReportSchema>;
export type DailyReport = typeof dailyReports.$inferSelect;

export type InsertOperation = z.infer<typeof insertOperationSchema>;
export type Operation = typeof operations.$inferSelect;

export type InsertAttendanceEntry = z.infer<typeof insertAttendanceEntrySchema>;
export type AttendanceEntry = typeof attendanceEntries.$inferSelect;
export type UpdateAttendanceEntry = z.infer<typeof updateAttendanceEntrySchema>;

export type InsertHoursAdjustment = z.infer<typeof insertHoursAdjustmentSchema>;
export type HoursAdjustment = typeof hoursAdjustments.$inferSelect;
export type UpdateHoursAdjustment = z.infer<typeof updateHoursAdjustmentSchema>;

export type InsertAdvance = z.infer<typeof insertAdvanceSchema>;
export type Advance = typeof advances.$inferSelect;
export type UpdateAdvance = z.infer<typeof updateAdvanceSchema>;

export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;
export type UpdateVehicle = z.infer<typeof updateVehicleSchema>;

export type InsertFuelRefill = z.infer<typeof insertFuelRefillSchema>;
export type FuelRefill = typeof fuelRefills.$inferSelect;
export type UpdateFuelRefill = z.infer<typeof updateFuelRefillSchema>;

export type InsertFuelTankLoad = z.infer<typeof insertFuelTankLoadSchema>;
export type FuelTankLoad = typeof fuelTankLoads.$inferSelect;
export type UpdateFuelTankLoad = z.infer<typeof updateFuelTankLoadSchema>;

export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;

export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;

export type InsertTeamSubmission = z.infer<typeof insertTeamSubmissionSchema>;
export type TeamSubmission = typeof teamSubmissions.$inferSelect;

export type UpdateDailyReport = z.infer<typeof updateDailyReportSchema>;
export type UpdateOperation = z.infer<typeof updateOperationSchema>;

export type ReportAuditLog = typeof reportAuditLog.$inferSelect;

export type InsertAgendaItem = z.infer<typeof insertAgendaItemSchema>;
export type AgendaItem = typeof agendaItems.$inferSelect;
export type UpdateAgendaItem = z.infer<typeof updateAgendaItemSchema>;

// Status enum
export const StatusEnum = z.enum(["In attesa", "Approvato"]);
export type Status = z.infer<typeof StatusEnum>;

// Absence type enum - AGGIORNATO CON "A"
export const AbsenceTypeEnum = z.enum(["A", "F", "P", "M", "CP", "L104"]);
export type AbsenceType = z.infer<typeof AbsenceTypeEnum>;

// Created by enum - Chi ha creato il rapportino
export const CreatedByEnum = z.enum(["utente", "ufficio", "caposquadra"]);
export type CreatedBy = z.infer<typeof CreatedByEnum>;

// User role enum
export const UserRoleEnum = z.enum(["employee", "admin", "superadmin", "teamleader"]);
export type UserRole = z.infer<typeof UserRoleEnum>;

// Event type enum (Agenda)
export const EventTypeEnum = z.enum(["deadline", "appointment", "reminder"]);
export type EventType = z.infer<typeof EventTypeEnum>;

// Recurrence enum (Agenda)
export const RecurrenceEnum = z.enum(["daily", "weekly", "monthly", "yearly"]);
export type Recurrence = z.infer<typeof RecurrenceEnum>;