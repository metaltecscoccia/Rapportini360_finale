import { db } from '../server/db';
import { 
  organizations, clients, users, workOrders, workTypes, materials,
  dailyReports, operations, attendanceEntries
} from '../shared/schema';
import bcrypt from 'bcrypt';

// Configuration
const DEMO_ORG_NAME = "Esempio Srl";
const NUM_EMPLOYEES = 10;
const NUM_CLIENTS = 3;
const WORK_ORDERS_PER_CLIENT = 2;
const MONTHS_OF_DATA = 2;
const ABSENCES_PER_WEEK = 2;

// Demo data
const employeeNames = [
  { firstName: "Marco", lastName: "Rossi" },
  { firstName: "Luca", lastName: "Bianchi" },
  { firstName: "Giuseppe", lastName: "Verdi" },
  { firstName: "Andrea", lastName: "Ferrari" },
  { firstName: "Mario", lastName: "Conti" },
  { firstName: "Paolo", lastName: "Romano" },
  { firstName: "Stefano", lastName: "Galli" },
  { firstName: "Roberto", lastName: "Costa" },
  { firstName: "Francesco", lastName: "Fontana" },
  { firstName: "Alessandro", lastName: "Rizzo" }
];

const clientNames = [
  { name: "Edilizia Rossi S.r.l." },
  { name: "Costruzioni Verdi S.p.A." },
  { name: "Impresa Bianchi & C." }
];

const workOrderDescriptions = [
  ["Manutenzione impianto industriale", "Installazione linea produzione"],
  ["Ristrutturazione capannone", "Ampliamento magazzino"],
  ["Realizzazione struttura metallica", "Montaggio scaffalature"]
];

// Use unique names for demo org to avoid constraint conflicts
const workTypesList = [
  { name: "Saldatura TIG industriale" },
  { name: "Montaggio componenti" },
  { name: "Carpenteria metallica" },
  { name: "Manutenzione preventiva" },
  { name: "Installazione linee" }
];

const materialsList = [
  { name: "Acciaio AISI 304" },
  { name: "Tubolari quadri" },
  { name: "Bulloneria M10" },
  { name: "Lamiere zincate" },
  { name: "Profili HEA" }
];

const absenceTypes = ['I', 'O', 'S', 'CP', 'M', 'A'];

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getWorkingDays(startDate: Date, endDate: Date): Date[] {
  const days: Date[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip weekends
      days.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  
  return days;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomElements<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function createDemoData() {
  console.log("🚀 Starting demo data creation for Esempio Srl...\n");

  // 1. Create organization
  console.log("📁 Creating organization...");
  const orgId = generateUUID();
  await db.insert(organizations).values({
    id: orgId,
    name: DEMO_ORG_NAME
  });
  console.log(`   ✓ Created: ${DEMO_ORG_NAME} (${orgId})\n`);

  // 2. Create admin user
  console.log("👤 Creating admin user...");
  const adminId = generateUUID();
  const hashedPassword = await bcrypt.hash("admin123", 10);
  await db.insert(users).values({
    id: adminId,
    username: "admin_esempio",
    password: hashedPassword,
    fullName: "Admin Esempio",
    role: "admin",
    organizationId: orgId,
    isActive: true
  });
  console.log(`   ✓ Created admin: admin_esempio / admin123\n`);

  // 3. Create employees
  console.log("👥 Creating employees...");
  const employeeIds: string[] = [];
  for (let i = 0; i < NUM_EMPLOYEES; i++) {
    const emp = employeeNames[i];
    const empId = generateUUID();
    const username = `${emp.firstName.toLowerCase()}${emp.lastName.toLowerCase().charAt(0)}`;
    
    await db.insert(users).values({
      id: empId,
      username: username,
      password: await bcrypt.hash("dipendente1", 10),
      plainPassword: "dipendente1",
      fullName: `${emp.firstName} ${emp.lastName}`,
      role: "employee",
      organizationId: orgId,
      isActive: true
    });
    
    employeeIds.push(empId);
    console.log(`   ✓ ${emp.firstName} ${emp.lastName} (${username}/dipendente1)`);
  }
  console.log("");

  // 4. Create clients
  console.log("🏢 Creating clients...");
  const clientIds: string[] = [];
  for (let i = 0; i < NUM_CLIENTS; i++) {
    const client = clientNames[i];
    const clientId = generateUUID();
    
    await db.insert(clients).values({
      id: clientId,
      name: client.name,
      organizationId: orgId
    });
    
    clientIds.push(clientId);
    console.log(`   ✓ ${client.name}`);
  }
  console.log("");

  // 5. Create work types
  console.log("🔧 Creating work types...");
  const workTypeIds: string[] = [];
  for (const wt of workTypesList) {
    const wtId = generateUUID();
    await db.insert(workTypes).values({
      id: wtId,
      name: wt.name,
      organizationId: orgId
    });
    workTypeIds.push(wtId);
    console.log(`   ✓ ${wt.name}`);
  }
  console.log("");

  // 6. Create materials
  console.log("📦 Creating materials...");
  const materialIds: string[] = [];
  for (const mat of materialsList) {
    const matId = generateUUID();
    await db.insert(materials).values({
      id: matId,
      name: mat.name,
      organizationId: orgId
    });
    materialIds.push(matId);
    console.log(`   ✓ ${mat.name}`);
  }
  console.log("");

  // 7. Create work orders
  console.log("📋 Creating work orders...");
  const workOrderData: Array<{ id: string; clientId: string }> = [];
  for (let i = 0; i < NUM_CLIENTS; i++) {
    for (let j = 0; j < WORK_ORDERS_PER_CLIENT; j++) {
      const woId = generateUUID();
      const orderName = `WO-2024-${String(i * WORK_ORDERS_PER_CLIENT + j + 1).padStart(3, '0')}`;
      
      await db.insert(workOrders).values({
        id: woId,
        name: orderName,
        description: workOrderDescriptions[i][j],
        clientId: clientIds[i],
        isActive: true,
        organizationId: orgId,
        availableWorkTypes: workTypeIds,
        availableMaterials: materialIds
      });
      
      workOrderData.push({ id: woId, clientId: clientIds[i] });
      console.log(`   ✓ ${orderName}: ${workOrderDescriptions[i][j]}`);
    }
  }
  console.log("");

  // 8. Calculate date range (2 months of working days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - MONTHS_OF_DATA);
  
  const workingDays = getWorkingDays(startDate, endDate);
  const lastWorkingDay = formatDate(workingDays[workingDays.length - 1]);
  
  console.log(`📅 Generating data for ${workingDays.length} working days`);
  console.log(`   From: ${formatDate(workingDays[0])} To: ${lastWorkingDay}\n`);

  // 9. Generate absences and daily reports
  console.log("📝 Creating daily reports, operations, and absences...");
  let reportCount = 0;
  let operationCount = 0;
  let absenceCount = 0;

  // Pre-calculate weekly absences (2 employees per week, random day)
  const weeklyAbsences: Map<string, Array<{ empId: string; day: number; type: string }>> = new Map();
  
  for (const day of workingDays) {
    const weekStart = new Date(day);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
    const weekKey = formatDate(weekStart);
    
    if (!weeklyAbsences.has(weekKey)) {
      // Select 2 random employees and assign them random absence days and types
      const selectedEmps = randomElements(employeeIds, ABSENCES_PER_WEEK);
      const absences = selectedEmps.map(empId => ({
        empId,
        day: randomInt(1, 5), // Monday to Friday
        type: randomElement(absenceTypes)
      }));
      weeklyAbsences.set(weekKey, absences);
    }
  }

  for (const day of workingDays) {
    const dateStr = formatDate(day);
    const isLastDay = dateStr === lastWorkingDay;
    const dayOfWeek = day.getDay(); // 1-5 for Mon-Fri
    
    // Get week absences
    const weekStart = new Date(day);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    const weekKey = formatDate(weekStart);
    const weekAbsences = weeklyAbsences.get(weekKey) || [];
    
    for (const empId of employeeIds) {
      // Check if employee is absent today
      const isAbsent = weekAbsences.some(a => a.empId === empId && a.day === dayOfWeek);
      
      if (isAbsent) {
        const absenceInfo = weekAbsences.find(a => a.empId === empId && a.day === dayOfWeek)!;
        await db.insert(attendanceEntries).values({
          id: generateUUID(),
          userId: empId,
          date: dateStr,
          absenceType: absenceInfo.type,
          organizationId: orgId
        });
        absenceCount++;
        continue; // Skip daily report for this employee
      }
      
      // Create daily report
      const reportId = generateUUID();
      const status = isLastDay ? "In attesa" : "Approvato";
      
      await db.insert(dailyReports).values({
        id: reportId,
        employeeId: empId,
        date: dateStr,
        status: status,
        organizationId: orgId
      });
      reportCount++;
      
      // Create 1-3 operations per report
      const numOperations = randomInt(1, 3);
      for (let op = 0; op < numOperations; op++) {
        const selectedWO = randomElement(workOrderData);
        const selectedWorkTypes = randomElements(workTypeIds, randomInt(1, 2));
        const selectedMaterials = randomElements(materialIds, randomInt(0, 2));
        const hours = randomInt(2, 4);
        
        await db.insert(operations).values({
          id: generateUUID(),
          dailyReportId: reportId,
          clientId: selectedWO.clientId,
          workOrderId: selectedWO.id,
          workTypes: selectedWorkTypes,
          materials: selectedMaterials,
          hours: String(hours),
          notes: ""
        });
        operationCount++;
      }
    }
    
    if (reportCount % 100 === 0) {
      process.stdout.write(`   ${reportCount} reports created...\r`);
    }
  }
  
  console.log(`   ✓ Created ${reportCount} daily reports`);
  console.log(`   ✓ Created ${operationCount} operations`);
  console.log(`   ✓ Created ${absenceCount} absences\n`);

  // 10. Summary
  console.log("═══════════════════════════════════════════════════════");
  console.log("✅ Demo data creation complete!");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`Organization: ${DEMO_ORG_NAME}`);
  console.log(`Organization ID: ${orgId}`);
  console.log(`Admin: admin_esempio / admin123`);
  console.log(`Employees: ${NUM_EMPLOYEES}`);
  console.log(`Clients: ${NUM_CLIENTS}`);
  console.log(`Work Orders: ${workOrderData.length}`);
  console.log(`Daily Reports: ${reportCount}`);
  console.log(`Operations: ${operationCount}`);
  console.log(`Absences: ${absenceCount}`);
  console.log(`Working Days: ${workingDays.length}`);
  console.log(`Last day reports: NOT APPROVED (In attesa)`);
  console.log("═══════════════════════════════════════════════════════\n");

  return orgId;
}

createDemoData()
  .then((orgId) => {
    console.log(`\n✅ Done! Organization ID: ${orgId}`);
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  });
