import { db } from '../server/db';
import { 
  organizations, clients, users, workOrders, workTypes, materials,
  dailyReports, operations, attendanceEntries
} from '../shared/schema';
import { eq } from 'drizzle-orm';

// Organization ID for Esempio Srl (from the create-demo-data script)
const ORG_ID = 'c560eda3-eb9d-451e-b39b-03842602e36f';

function escapeString(str: string | null | undefined): string {
  if (str === null || str === undefined) return 'NULL';
  return `'${str.replace(/'/g, "''").replace(/\n/g, '\\n').replace(/\r/g, '')}'`;
}

function formatArray(arr: string[] | null | undefined): string {
  if (!arr || arr.length === 0) return "'{}'";
  const escaped = arr.map(s => `"${s.replace(/"/g, '\\"')}"`).join(',');
  return `'{${escaped}}'`;
}

async function exportEsempioSrl() {
  console.log('-- ═══════════════════════════════════════════════════════');
  console.log('-- Export dati Esempio Srl per produzione');
  console.log('-- Organization ID: ' + ORG_ID);
  console.log('-- Data export: ' + new Date().toISOString());
  console.log('-- ═══════════════════════════════════════════════════════');
  console.log('');
  console.log('BEGIN;');
  console.log('');

  // 1. Export organization
  console.log('-- ═══════════════════════════════════════════════════════');
  console.log('-- ORGANIZATIONS');
  console.log('-- ═══════════════════════════════════════════════════════');
  const orgs = await db.select().from(organizations).where(eq(organizations.id, ORG_ID));
  for (const org of orgs) {
    console.log(`INSERT INTO organizations (id, name, subdomain, logo, is_active, created_at) VALUES (${escapeString(org.id)}, ${escapeString(org.name)}, ${escapeString(org.subdomain)}, ${escapeString(org.logo)}, ${org.isActive}, ${org.createdAt ? `'${org.createdAt.toISOString()}'` : 'NOW()'});`);
  }
  console.log('');

  // 2. Export clients
  console.log('-- ═══════════════════════════════════════════════════════');
  console.log('-- CLIENTS');
  console.log('-- ═══════════════════════════════════════════════════════');
  const clientList = await db.select().from(clients).where(eq(clients.organizationId, ORG_ID));
  for (const client of clientList) {
    console.log(`INSERT INTO clients (id, organization_id, name, description) VALUES (${escapeString(client.id)}, ${escapeString(client.organizationId)}, ${escapeString(client.name)}, ${escapeString(client.description)});`);
  }
  console.log('');

  // 3. Export users
  console.log('-- ═══════════════════════════════════════════════════════');
  console.log('-- USERS');
  console.log('-- ═══════════════════════════════════════════════════════');
  const userList = await db.select().from(users).where(eq(users.organizationId, ORG_ID));
  for (const user of userList) {
    console.log(`INSERT INTO users (id, organization_id, username, password, plain_password, role, full_name, is_active) VALUES (${escapeString(user.id)}, ${escapeString(user.organizationId)}, ${escapeString(user.username)}, ${escapeString(user.password)}, ${escapeString(user.plainPassword)}, ${escapeString(user.role)}, ${escapeString(user.fullName)}, ${user.isActive});`);
  }
  console.log('');

  // 4. Export work types
  console.log('-- ═══════════════════════════════════════════════════════');
  console.log('-- WORK TYPES');
  console.log('-- ═══════════════════════════════════════════════════════');
  const workTypeList = await db.select().from(workTypes).where(eq(workTypes.organizationId, ORG_ID));
  for (const wt of workTypeList) {
    console.log(`INSERT INTO work_types (id, organization_id, name, description, is_active) VALUES (${escapeString(wt.id)}, ${escapeString(wt.organizationId)}, ${escapeString(wt.name)}, ${escapeString(wt.description)}, ${wt.isActive});`);
  }
  console.log('');

  // 5. Export materials
  console.log('-- ═══════════════════════════════════════════════════════');
  console.log('-- MATERIALS');
  console.log('-- ═══════════════════════════════════════════════════════');
  const materialList = await db.select().from(materials).where(eq(materials.organizationId, ORG_ID));
  for (const mat of materialList) {
    console.log(`INSERT INTO materials (id, organization_id, name, description, is_active) VALUES (${escapeString(mat.id)}, ${escapeString(mat.organizationId)}, ${escapeString(mat.name)}, ${escapeString(mat.description)}, ${mat.isActive});`);
  }
  console.log('');

  // 6. Export work orders
  console.log('-- ═══════════════════════════════════════════════════════');
  console.log('-- WORK ORDERS');
  console.log('-- ═══════════════════════════════════════════════════════');
  const workOrderList = await db.select().from(workOrders).where(eq(workOrders.organizationId, ORG_ID));
  for (const wo of workOrderList) {
    console.log(`INSERT INTO work_orders (id, organization_id, client_id, name, description, is_active, available_work_types, available_materials) VALUES (${escapeString(wo.id)}, ${escapeString(wo.organizationId)}, ${escapeString(wo.clientId)}, ${escapeString(wo.name)}, ${escapeString(wo.description)}, ${wo.isActive}, ${formatArray(wo.availableWorkTypes)}, ${formatArray(wo.availableMaterials)});`);
  }
  console.log('');

  // 7. Export daily reports
  console.log('-- ═══════════════════════════════════════════════════════');
  console.log('-- DAILY REPORTS');
  console.log('-- ═══════════════════════════════════════════════════════');
  const reportList = await db.select().from(dailyReports).where(eq(dailyReports.organizationId, ORG_ID));
  for (const report of reportList) {
    console.log(`INSERT INTO daily_reports (id, organization_id, employee_id, date, status, created_at, updated_at) VALUES (${escapeString(report.id)}, ${escapeString(report.organizationId)}, ${escapeString(report.employeeId)}, ${escapeString(report.date)}, ${escapeString(report.status)}, ${report.createdAt ? `'${report.createdAt.toISOString()}'` : 'NOW()'}, ${report.updatedAt ? `'${report.updatedAt.toISOString()}'` : 'NOW()'});`);
  }
  console.log('');

  // 8. Export operations
  console.log('-- ═══════════════════════════════════════════════════════');
  console.log('-- OPERATIONS');
  console.log('-- ═══════════════════════════════════════════════════════');
  const reportIds = reportList.map(r => r.id);
  if (reportIds.length > 0) {
    const allOperations = await db.select().from(operations);
    const filteredOperations = allOperations.filter(op => reportIds.includes(op.dailyReportId));
    for (const op of filteredOperations) {
      console.log(`INSERT INTO operations (id, daily_report_id, client_id, work_order_id, work_types, materials, hours, notes, photos) VALUES (${escapeString(op.id)}, ${escapeString(op.dailyReportId)}, ${escapeString(op.clientId)}, ${escapeString(op.workOrderId)}, ${formatArray(op.workTypes)}, ${formatArray(op.materials)}, ${op.hours}, ${escapeString(op.notes)}, ${formatArray(op.photos)});`);
    }
  }
  console.log('');

  // 9. Export attendance entries
  console.log('-- ═══════════════════════════════════════════════════════');
  console.log('-- ATTENDANCE ENTRIES');
  console.log('-- ═══════════════════════════════════════════════════════');
  const attendanceList = await db.select().from(attendanceEntries).where(eq(attendanceEntries.organizationId, ORG_ID));
  for (const att of attendanceList) {
    console.log(`INSERT INTO attendance_entries (id, organization_id, user_id, date, absence_type, notes, created_at) VALUES (${escapeString(att.id)}, ${escapeString(att.organizationId)}, ${escapeString(att.userId)}, ${escapeString(att.date)}, ${escapeString(att.absenceType)}, ${escapeString(att.notes)}, ${att.createdAt ? `'${att.createdAt.toISOString()}'` : 'NOW()'});`);
  }
  console.log('');

  console.log('COMMIT;');
  console.log('');
  console.log('-- ═══════════════════════════════════════════════════════');
  console.log('-- Export completato!');
  console.log('-- ═══════════════════════════════════════════════════════');
}

exportEsempioSrl()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("-- Error:", err);
    process.exit(1);
  });
