import { db } from "../server/db";
import { attendanceEntries, users } from "../shared/schema";
import { eq, and, ne } from "drizzle-orm";
import * as fs from "fs";

// Helper functions for strategic absences detection (same logic as server/storage.ts)
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
  const date = new Date(dateStr + 'T12:00:00');
  const year = date.getFullYear();
  const allHolidays = new Set<string>();
  
  [year - 1, year, year + 1].forEach(y => {
    getItalianHolidays(y).forEach(h => allHolidays.add(h));
  });
  
  return allHolidays;
}

function isNonWorkingDay(date: Date, holidays: Set<string>): boolean {
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) return true;
  const dateStr = formatDateToString(date);
  return holidays.has(dateStr);
}

function getAdjacentInfo(dateStr: string): { isStrategic: boolean; reason: string } {
  const date = new Date(dateStr + 'T12:00:00');
  const holidays = getAllHolidaysForDateRange(dateStr);
  
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

const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

const absenceTypeNames: Record<string, string> = {
  'A': 'Assenza',
  'P': 'Permesso',
  'M': 'Malattia',
  'CP': 'Cassa Integrazione/Permesso',
  'L104': 'Legge 104',
  'F': 'Ferie'
};

async function generateReport() {
  console.log('Caricamento assenze dal database...');
  
  // Get all attendance entries that are absences (not 'F' = Ferie)
  const allEntries = await db
    .select({
      id: attendanceEntries.id,
      userId: attendanceEntries.userId,
      date: attendanceEntries.date,
      absenceType: attendanceEntries.absenceType,
      userFullName: users.fullName
    })
    .from(attendanceEntries)
    .innerJoin(users, eq(attendanceEntries.userId, users.id))
    .where(
      ne(attendanceEntries.absenceType, 'F')  // Exclude Ferie
    );
  
  console.log(`Trovate ${allEntries.length} assenze (escluse Ferie e Presenze)`);
  
  const strategicAbsences: Array<{
    date: string;
    dayOfWeek: string;
    employee: string;
    type: string;
    typeName: string;
    reason: string;
  }> = [];
  
  for (const entry of allEntries) {
    const info = getAdjacentInfo(entry.date);
    if (info.isStrategic) {
      const date = new Date(entry.date + 'T12:00:00');
      strategicAbsences.push({
        date: entry.date,
        dayOfWeek: dayNames[date.getDay()],
        employee: entry.userFullName,
        type: entry.absenceType,
        typeName: absenceTypeNames[entry.absenceType] || entry.absenceType,
        reason: info.reason
      });
    }
  }
  
  // Sort by date descending
  strategicAbsences.sort((a, b) => b.date.localeCompare(a.date));
  
  console.log(`Trovate ${strategicAbsences.length} assenze strategiche`);
  
  // Generate report
  const lines: string[] = [];
  lines.push('='.repeat(80));
  lines.push('REPORT ASSENZE STRATEGICHE');
  lines.push('Assenze (escluse Ferie) registrate il giorno prima o dopo weekend/festività');
  lines.push('='.repeat(80));
  lines.push(`Generato il: ${new Date().toLocaleString('it-IT')}`);
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
  const sortedEmployees = [...byEmployee.entries()].sort((a, b) => b[1].length - a[1].length);
  
  lines.push('RIEPILOGO PER DIPENDENTE:');
  lines.push('');
  for (const [employee, absences] of sortedEmployees) {
    lines.push(`  ${employee}: ${absences.length} assenze strategiche`);
  }
  lines.push('');
  lines.push('-'.repeat(80));
  lines.push('');
  lines.push('DETTAGLIO ASSENZE STRATEGICHE:');
  lines.push('');
  
  for (const [employee, absences] of sortedEmployees) {
    lines.push(`\n${employee} (${absences.length} assenze):`);
    lines.push('-'.repeat(40));
    for (const absence of absences) {
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
  
  const reportContent = lines.join('\n');
  const filename = `report_assenze_strategiche_${new Date().toISOString().split('T')[0]}.txt`;
  
  fs.writeFileSync(filename, reportContent, 'utf-8');
  console.log(`\nReport salvato in: ${filename}`);
  console.log('\n' + reportContent);
}

generateReport()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Errore:', err);
    process.exit(1);
  });
