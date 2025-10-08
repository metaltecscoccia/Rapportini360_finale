// Italian national holidays and utility functions

export function getEasterDate(year: number): Date {
  // Meeus/Jones/Butcher algorithm for calculating Easter
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

export function isItalianHoliday(date: string): boolean {
  // date is in YYYY-MM-DD format
  const [year, month, day] = date.split('-').map(Number);
  
  // Fixed holidays
  const fixedHolidays = [
    '01-01', // Capodanno
    '01-06', // Epifania
    '04-25', // Liberazione
    '05-01', // Festa del Lavoro
    '06-02', // Festa della Repubblica
    '08-15', // Ferragosto
    '11-01', // Tutti i Santi
    '12-08', // Immacolata
    '12-25', // Natale
    '12-26', // Santo Stefano
  ];
  
  const monthDay = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  if (fixedHolidays.includes(monthDay)) {
    return true;
  }
  
  // Easter Monday (Pasquetta)
  const easter = getEasterDate(year);
  const easterMonday = new Date(easter);
  easterMonday.setDate(easter.getDate() + 1);
  
  if (month === easterMonday.getMonth() + 1 && day === easterMonday.getDate()) {
    return true;
  }
  
  return false;
}

export function getDayOfWeek(date: string): number {
  // date is in YYYY-MM-DD format
  // Returns 0 (Sunday) to 6 (Saturday)
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day).getDay();
}

export function isSaturday(date: string): boolean {
  return getDayOfWeek(date) === 6;
}

export function isSunday(date: string): boolean {
  return getDayOfWeek(date) === 0;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}
