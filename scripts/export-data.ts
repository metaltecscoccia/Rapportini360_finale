/**
 * Script per esportare tutti i dati dal database in formato SQL
 * Uso: npx tsx scripts/export-data.ts > backup.sql
 */

import { db } from "../server/db";
import { 
  organizations, 
  clients, 
  users, 
  workTypes, 
  materials, 
  workOrders, 
  dailyReports, 
  operations,
  attendanceEntries,
  vehicles,
  fuelRefills,
  fuelTankLoads,
  hoursAdjustments
} from "../shared/schema";

function escapeValue(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);
  if (val instanceof Date) return `'${val.toISOString()}'`;
  
  // Handle arrays - use single quotes for PostgreSQL string literals
  if (Array.isArray(val)) {
    if (val.length === 0) return "ARRAY[]::text[]";
    const escapedItems = val.map(item => {
      const escaped = String(item)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "''");
      return `'${escaped}'`;
    });
    return `ARRAY[${escapedItems.join(',')}]::text[]`;
  }
  
  // Escape stringhe
  const str = String(val)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "''")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
  
  return `E'${str}'`;
}

// Map camelCase JS property names to snake_case DB column names
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function generateInsert(tableName: string, rows: any[], propNames: string[]): string {
  if (rows.length === 0) return `-- No data in ${tableName}\n`;
  
  const lines: string[] = [];
  const colNames = propNames.map(camelToSnake);
  
  lines.push(`-- ${tableName}: ${rows.length} records`);
  lines.push(`DELETE FROM ${tableName};`);
  
  for (const row of rows) {
    const values = propNames.map(prop => escapeValue(row[prop]));
    lines.push(`INSERT INTO ${tableName} (${colNames.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')});`);
  }
  
  lines.push('');
  return lines.join('\n');
}

async function exportData() {
  console.log('-- Metaltec Data Export');
  console.log(`-- Generated: ${new Date().toISOString()}`);
  console.log('-- Run with: psql $DATABASE_URL < backup.sql');
  console.log('');
  console.log('BEGIN;');
  console.log('');
  
  // 1. Organizations (nessuna dipendenza)
  const orgs = await db.select().from(organizations);
  console.log(generateInsert('organizations', orgs, ['id', 'name', 'subdomain', 'logo', 'isActive', 'createdAt']));
  
  // 2. Clients (dipende da organizations)
  const cls = await db.select().from(clients);
  console.log(generateInsert('clients', cls, ['id', 'organizationId', 'name', 'description']));
  
  // 3. Users (dipende da organizations)
  const usrs = await db.select().from(users);
  console.log(generateInsert('users', usrs, ['id', 'organizationId', 'username', 'password', 'plainPassword', 'role', 'fullName', 'isActive']));
  
  // 4. Work Types (dipende da organizations)
  const wts = await db.select().from(workTypes);
  console.log(generateInsert('work_types', wts, ['id', 'organizationId', 'name', 'description', 'isActive']));
  
  // 5. Materials (dipende da organizations)
  const mats = await db.select().from(materials);
  console.log(generateInsert('materials', mats, ['id', 'organizationId', 'name', 'description', 'isActive']));
  
  // 6. Work Orders (dipende da organizations, clients)
  const wos = await db.select().from(workOrders);
  console.log(generateInsert('work_orders', wos, ['id', 'organizationId', 'clientId', 'name', 'description', 'isActive', 'availableWorkTypes', 'availableMaterials']));
  
  // 7. Vehicles (dipende da organizations)
  const vehs = await db.select().from(vehicles);
  console.log(generateInsert('vehicles', vehs, ['id', 'organizationId', 'name', 'licensePlate', 'fuelType', 'currentKm', 'currentEngineHours', 'isActive', 'createdAt']));
  
  // 8. Daily Reports (dipende da organizations, users)
  const drs = await db.select().from(dailyReports);
  console.log(generateInsert('daily_reports', drs, ['id', 'organizationId', 'employeeId', 'date', 'status', 'createdAt', 'updatedAt']));
  
  // 9. Operations (dipende da daily_reports, clients, work_orders)
  const ops = await db.select().from(operations);
  console.log(generateInsert('operations', ops, ['id', 'dailyReportId', 'clientId', 'workOrderId', 'workTypes', 'materials', 'hours', 'notes', 'photos']));
  
  // 10. Attendance Entries (dipende da organizations, users)
  const atts = await db.select().from(attendanceEntries);
  console.log(generateInsert('attendance_entries', atts, ['id', 'organizationId', 'userId', 'date', 'absenceType', 'notes', 'createdAt']));
  
  // 11. Hours Adjustments (dipende da organizations, daily_reports, users)
  const adjs = await db.select().from(hoursAdjustments);
  console.log(generateInsert('hours_adjustments', adjs, ['id', 'organizationId', 'dailyReportId', 'adjustment', 'reason', 'createdBy', 'createdAt', 'updatedAt']));
  
  // 12. Fuel Refills (dipende da vehicles, users)
  const refs = await db.select().from(fuelRefills);
  console.log(generateInsert('fuel_refills', refs, ['id', 'organizationId', 'vehicleId', 'refillDate', 'operatorId', 'litersBefore', 'litersAfter', 'litersRefilled', 'kmReading', 'engineHoursReading', 'totalCost', 'notes', 'createdAt']));
  
  // 13. Fuel Tank Loads (dipende da organizations)
  const loads = await db.select().from(fuelTankLoads);
  console.log(generateInsert('fuel_tank_loads', loads, ['id', 'organizationId', 'loadDate', 'liters', 'totalCost', 'supplier', 'notes', 'createdAt']));
  
  console.log('COMMIT;');
  console.log('');
  console.log('-- Export completed');
  
  process.exit(0);
}

exportData().catch(err => {
  console.error('Export failed:', err);
  process.exit(1);
});
