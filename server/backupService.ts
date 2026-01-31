import archiver from 'archiver';
import ExcelJS from 'exceljs';
import { Readable } from 'stream';
import { storage } from './storage';

interface BackupOptions {
  organizationId: string;
  includeReports?: boolean;
  includeAttendance?: boolean;
  includeEmployees?: boolean;
  includeClients?: boolean;
  includeWorkOrders?: boolean;
  includeVehicles?: boolean;
}

export async function generateFullBackup(options: BackupOptions): Promise<Readable> {
  const {
    organizationId,
    includeReports = true,
    includeAttendance = true,
    includeEmployees = true,
    includeClients = true,
    includeWorkOrders = true,
    includeVehicles = true,
  } = options;

  const archive = archiver('zip', { zlib: { level: 9 } });

  // Generate all data in parallel
  const promises: Promise<void>[] = [];

  if (includeEmployees) {
    promises.push(addEmployeesExcel(archive, organizationId));
  }

  if (includeClients) {
    promises.push(addClientsExcel(archive, organizationId));
  }

  if (includeWorkOrders) {
    promises.push(addWorkOrdersExcel(archive, organizationId));
  }

  if (includeReports) {
    promises.push(addReportsExcel(archive, organizationId));
  }

  if (includeAttendance) {
    promises.push(addAttendanceExcel(archive, organizationId));
  }

  if (includeVehicles) {
    promises.push(addVehiclesExcel(archive, organizationId));
  }

  // Add info file
  const infoContent = `BACKUP DATI RAPPORTINI360
========================

Data backup: ${new Date().toLocaleString('it-IT')}
Organizzazione ID: ${organizationId}

Contenuto:
${includeEmployees ? '- dipendenti.xlsx: Lista dipendenti\n' : ''}${includeClients ? '- clienti.xlsx: Lista clienti\n' : ''}${includeWorkOrders ? '- commesse.xlsx: Lista commesse\n' : ''}${includeReports ? '- rapportini.xlsx: Tutti i rapportini\n' : ''}${includeAttendance ? '- presenze.xlsx: Registro presenze\n' : ''}${includeVehicles ? '- veicoli.xlsx: Lista veicoli e rifornimenti\n' : ''}
Questo backup contiene tutti i dati della tua organizzazione.
Conservalo in un luogo sicuro.
`;

  archive.append(infoContent, { name: 'INFO_BACKUP.txt' });

  await Promise.all(promises);
  archive.finalize();

  return archive;
}

async function addEmployeesExcel(archive: archiver.Archiver, organizationId: string): Promise<void> {
  const users = await storage.getAllUsers(organizationId);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Dipendenti');

  worksheet.columns = [
    { header: 'Nome Completo', key: 'fullName', width: 25 },
    { header: 'Username', key: 'username', width: 20 },
    { header: 'Ruolo', key: 'role', width: 15 },
    { header: 'Attivo', key: 'isActive', width: 10 },
    { header: 'Data Creazione', key: 'createdAt', width: 20 },
  ];

  // Style header
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  users.forEach(user => {
    worksheet.addRow({
      fullName: user.fullName,
      username: user.username,
      role: user.role === 'admin' ? 'Amministratore' : user.role === 'teamleader' ? 'Caposquadra' : 'Dipendente',
      isActive: user.isActive ? 'Si' : 'No',
      createdAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString('it-IT') : '',
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  archive.append(Buffer.from(buffer), { name: 'dipendenti.xlsx' });
}

async function addClientsExcel(archive: archiver.Archiver, organizationId: string): Promise<void> {
  const clients = await storage.getAllClients(organizationId);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Clienti');

  worksheet.columns = [
    { header: 'Nome Cliente', key: 'name', width: 30 },
    { header: 'Attivo', key: 'isActive', width: 10 },
  ];

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  clients.forEach(client => {
    worksheet.addRow({
      name: client.name,
      isActive: client.isActive ? 'Si' : 'No',
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  archive.append(Buffer.from(buffer), { name: 'clienti.xlsx' });
}

async function addWorkOrdersExcel(archive: archiver.Archiver, organizationId: string): Promise<void> {
  const workOrders = await storage.getAllWorkOrders(organizationId);
  const clients = await storage.getAllClients(organizationId);
  const clientMap = new Map(clients.map(c => [c.id, c.name]));

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Commesse');

  worksheet.columns = [
    { header: 'Nome Commessa', key: 'name', width: 30 },
    { header: 'Cliente', key: 'clientName', width: 25 },
    { header: 'Attiva', key: 'isActive', width: 10 },
  ];

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  workOrders.forEach(wo => {
    worksheet.addRow({
      name: wo.name,
      clientName: clientMap.get(wo.clientId) || 'N/A',
      isActive: wo.isActive ? 'Si' : 'No',
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  archive.append(Buffer.from(buffer), { name: 'commesse.xlsx' });
}

async function addReportsExcel(archive: archiver.Archiver, organizationId: string): Promise<void> {
  // Get all reports (no date filter for backup)
  const reports = await storage.getAllDailyReports(organizationId);
  const users = await storage.getAllUsers(organizationId);
  const clients = await storage.getAllClients(organizationId);
  const workOrders = await storage.getAllWorkOrders(organizationId);

  const userMap = new Map(users.map(u => [u.id, u.fullName]));
  const clientMap = new Map(clients.map(c => [c.id, c.name]));
  const workOrderMap = new Map(workOrders.map(wo => [wo.id, wo.name]));

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Rapportini');

  worksheet.columns = [
    { header: 'Data', key: 'date', width: 12 },
    { header: 'Dipendente', key: 'employee', width: 25 },
    { header: 'Cliente', key: 'client', width: 20 },
    { header: 'Commessa', key: 'workOrder', width: 20 },
    { header: 'Ore', key: 'hours', width: 8 },
    { header: 'Stato', key: 'status', width: 12 },
    { header: 'Creato Da', key: 'createdBy', width: 15 },
    { header: 'Note', key: 'notes', width: 40 },
  ];

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  for (const report of reports) {
    const operations = await storage.getOperationsByReportId(report.id, organizationId);

    for (const op of operations) {
      worksheet.addRow({
        date: report.date,
        employee: userMap.get(report.employeeId) || 'N/A',
        client: clientMap.get(op.clientId) || 'N/A',
        workOrder: workOrderMap.get(op.workOrderId) || 'N/A',
        hours: op.hours,
        status: report.status,
        createdBy: report.createdBy === 'utente' ? 'Dipendente' :
                   report.createdBy === 'ufficio' ? 'Ufficio' :
                   report.createdBy === 'caposquadra' ? 'Caposquadra' : report.createdBy,
        notes: op.notes || '',
      });
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  archive.append(Buffer.from(buffer), { name: 'rapportini.xlsx' });
}

async function addAttendanceExcel(archive: archiver.Archiver, organizationId: string): Promise<void> {
  // Get all attendance records
  const attendance = await storage.getAllAttendanceByOrganization(organizationId);
  const users = await storage.getAllUsers(organizationId);
  const userMap = new Map(users.map(u => [u.id, u.fullName]));

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Presenze');

  worksheet.columns = [
    { header: 'Data', key: 'date', width: 12 },
    { header: 'Dipendente', key: 'employee', width: 25 },
    { header: 'Tipo', key: 'status', width: 20 },
    { header: 'Note', key: 'notes', width: 40 },
  ];

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  const statusLabels: Record<string, string> = {
    'A': 'Assenza',
    'F': 'Ferie',
    'P': 'Permesso',
    'M': 'Malattia',
    'CP': 'Congedo Parentale',
    'L104': 'Legge 104',
  };

  attendance.forEach(record => {
    worksheet.addRow({
      date: record.date,
      employee: userMap.get(record.employeeId) || 'N/A',
      status: statusLabels[record.status] || record.status,
      notes: record.notes || '',
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  archive.append(Buffer.from(buffer), { name: 'presenze.xlsx' });
}

async function addVehiclesExcel(archive: archiver.Archiver, organizationId: string): Promise<void> {
  const vehicles = await storage.getAllVehicles(organizationId);
  const refills = await storage.getAllFuelRefills(organizationId);
  const users = await storage.getAllUsers(organizationId);

  const userMap = new Map(users.map(u => [u.id, u.fullName]));
  const vehicleMap = new Map(vehicles.map(v => [v.id, v.licensePlate]));

  const workbook = new ExcelJS.Workbook();

  // Sheet 1: Vehicles
  const vehicleSheet = workbook.addWorksheet('Veicoli');
  vehicleSheet.columns = [
    { header: 'Targa', key: 'licensePlate', width: 15 },
    { header: 'Tipo Carburante', key: 'fuelType', width: 15 },
    { header: 'Attivo', key: 'isActive', width: 10 },
  ];

  vehicleSheet.getRow(1).font = { bold: true };
  vehicleSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  vehicles.forEach(v => {
    vehicleSheet.addRow({
      licensePlate: v.licensePlate,
      fuelType: v.fuelType,
      isActive: v.isActive ? 'Si' : 'No',
    });
  });

  // Sheet 2: Refills
  const refillSheet = workbook.addWorksheet('Rifornimenti');
  refillSheet.columns = [
    { header: 'Data', key: 'date', width: 12 },
    { header: 'Veicolo', key: 'vehicle', width: 15 },
    { header: 'Dipendente', key: 'employee', width: 25 },
    { header: 'Litri', key: 'liters', width: 10 },
    { header: 'Importo', key: 'amount', width: 12 },
    { header: 'Km', key: 'mileage', width: 10 },
    { header: 'Note', key: 'notes', width: 30 },
  ];

  refillSheet.getRow(1).font = { bold: true };
  refillSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  refills.forEach(r => {
    refillSheet.addRow({
      date: r.date,
      vehicle: vehicleMap.get(r.vehicleId) || 'N/A',
      employee: userMap.get(r.userId) || 'N/A',
      liters: r.liters,
      amount: r.amount ? `€${r.amount}` : '',
      mileage: r.mileage || '',
      notes: r.notes || '',
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  archive.append(Buffer.from(buffer), { name: 'veicoli.xlsx' });
}
