import { storage } from './storage';
import { DailyReport, Operation, User, Client, WorkOrder } from '@shared/schema';

export class TxtService {
  
  async generateDailyReportTxt(date: string, organizationId: string): Promise<string> {
    const reports = await storage.getDailyReportsByDate(date, organizationId);
    
    if (reports.length === 0) {
      // Format date in Italian format for user-friendly error message
      const [year, month, day] = date.split('-');
      const italianDate = `${day}/${month}/${year}`;
      throw new Error(`Nessun rapportino trovato per la data ${italianDate}. Verifica che ci siano rapportini approvati per questa data.`);
    }

    // Get all related data
    const clients = await storage.getAllClients(organizationId);
    const clientsMap = new Map(clients.map(c => [c.id, c]));
    
    // Get all work orders
    const allWorkOrders: WorkOrder[] = [];
    for (const client of clients) {
      const workOrders = await storage.getWorkOrdersByClient(client.id, organizationId);
      allWorkOrders.push(...workOrders);
    }
    const workOrdersMap = new Map(allWorkOrders.map(wo => [wo.id, wo]));

    // Get all hours adjustments for these reports
    const adjustmentsPromises = reports.map(r => storage.getHoursAdjustment(r.id, organizationId));
    const adjustments = await Promise.all(adjustmentsPromises);
    const adjustmentsMap = new Map(
      adjustments
        .filter((adj): adj is NonNullable<typeof adj> => adj !== undefined && adj !== null)
        .map(adj => [adj.dailyReportId, adj])
    );

    // Build text content
    let txtContent = '';
    
    // Document header
    txtContent += '='.repeat(80) + '\n';
    txtContent += ' '.repeat(20) + 'METALTEC Scoccia S.R.L.\n';
    txtContent += ' '.repeat(15) + `Rapportini Giornalieri - ${this.formatDate(date)}\n`;
    txtContent += '='.repeat(80) + '\n\n';
    
    // Build content for each employee
    for (let i = 0; i < reports.length; i++) {
      const report = reports[i];
      const user = await storage.getUser(report.employeeId);
      const operations = await storage.getOperationsByReportId(report.id);
      const adjustment = adjustmentsMap.get(report.id);
      
      if (user && operations.length > 0) {
        txtContent += this.createEmployeeSection(
          user,
          report,
          operations,
          clientsMap,
          workOrdersMap,
          adjustment
        );
        
        // Add separator between employees
        if (i < reports.length - 1) {
          txtContent += '\n' + '-'.repeat(80) + '\n\n';
        }
      }
    }

    txtContent += '\n' + '='.repeat(80) + '\n';
    txtContent += ' '.repeat(30) + 'Fine Rapportini\n';
    txtContent += '='.repeat(80) + '\n';

    return txtContent;
  }

  // Calculate hours from the hours field (which is already a string like "3.5")
  private parseHours(hoursStr: string): number {
    const hours = parseFloat(hoursStr);
    return isNaN(hours) ? 0 : hours;
  }

  private createEmployeeSection(
    user: User,
    report: DailyReport,
    operations: Operation[],
    clientsMap: Map<string, Client>,
    workOrdersMap: Map<string, WorkOrder>,
    adjustment?: any
  ): string {
    
    let totalHours = operations.reduce((sum, op) => sum + this.parseHours(op.hours), 0);
    const originalHours = totalHours;
    
    // Apply hours adjustment if exists
    if (adjustment) {
      const adjustmentValue = parseFloat(adjustment.adjustment);
      if (!isNaN(adjustmentValue)) {
        totalHours += adjustmentValue;
      }
    }

    let section = '';
    
    // Employee header
    section += `DIPENDENTE: ${user.fullName}\n`;
    section += `ORE TOTALI: ${totalHours.toFixed(2)}`;
    
    if (adjustment) {
      const adjustmentValue = parseFloat(adjustment.adjustment);
      section += ` (Originali: ${originalHours.toFixed(2)}, Aggiustamento: ${adjustmentValue >= 0 ? '+' : ''}${adjustmentValue.toFixed(2)})`;
    }
    section += '\n\n';

    // Group operations by client and work order
    const groupedOps = this.groupOperationsByClientAndWorkOrder(operations, clientsMap, workOrdersMap);
    
    for (const [clientName, workOrders] of Array.from(groupedOps)) {
      section += `Cliente: ${clientName}\n`;
      
      for (const [workOrderName, ops] of Array.from(workOrders)) {
        section += `  Commessa: ${workOrderName}\n`;
        
        for (let i = 0; i < ops.length; i++) {
          const op = ops[i];
          section += `    Operazione ${i + 1}:\n`;
          section += `      Ore: ${parseFloat(op.hours).toFixed(2)}\n`;
          
          if (op.workTypes && op.workTypes.length > 0) {
            section += `      Lavorazioni: ${op.workTypes.join(', ')}\n`;
          }
          
          if (op.materials && op.materials.length > 0) {
            section += `      Materiali: ${op.materials.join(', ')}\n`;
          }
          
          if (op.notes && op.notes.trim()) {
            section += `      Note: ${op.notes}\n`;
          }
          
          section += '\n';
        }
      }
    }

    // Add adjustment note if exists
    if (adjustment && adjustment.notes && adjustment.notes.trim()) {
      section += `NOTE AGGIUSTAMENTO ORE: ${adjustment.notes}\n\n`;
    }

    return section;
  }

  private groupOperationsByClientAndWorkOrder(
    operations: Operation[],
    clientsMap: Map<string, Client>,
    workOrdersMap: Map<string, WorkOrder>
  ): Map<string, Map<string, Operation[]>> {
    const grouped = new Map<string, Map<string, Operation[]>>();
    
    for (const op of operations) {
      const workOrder = workOrdersMap.get(op.workOrderId);
      const client = workOrder ? clientsMap.get(workOrder.clientId) : undefined;
      
      const clientName = client?.name || 'Cliente sconosciuto';
      const workOrderName = workOrder?.name || 'Commessa sconosciuta';
      
      if (!grouped.has(clientName)) {
        grouped.set(clientName, new Map());
      }
      
      const clientGroup = grouped.get(clientName)!;
      if (!clientGroup.has(workOrderName)) {
        clientGroup.set(workOrderName, []);
      }
      
      clientGroup.get(workOrderName)!.push(op);
    }
    
    return grouped;
  }

  private formatDate(date: string): string {
    const [year, month, day] = date.split('-');
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return dateObj.toLocaleDateString('it-IT', options);
  }
}

export const txtService = new TxtService();
