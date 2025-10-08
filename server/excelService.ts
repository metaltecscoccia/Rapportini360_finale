import ExcelJS from 'exceljs';
import { storage } from './storage';
import { formatDateToItalian } from '../shared/dateUtils';
import { isItalianHoliday, isSaturday, isSunday, getDaysInMonth } from '../shared/holidays';

export async function generateAttendanceExcel(
  organizationId: string,
  year: string,
  month: string
): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Foglio Presenze');

  // Get attendance data
  const attendanceData = await storage.getMonthlyAttendance(organizationId, year, month);
  
  const yearNum = parseInt(year);
  const monthNum = parseInt(month);
  const daysInMonth = getDaysInMonth(yearNum, monthNum);

  // Set column widths (ultra-compact: 2 characters)
  worksheet.getColumn(1).width = 15; // Nome column
  worksheet.getColumn(2).width = 5;  // Tipo column (O/S)
  for (let i = 3; i <= daysInMonth + 2; i++) {
    worksheet.getColumn(i).width = 4; // Day columns (ultra-compact)
  }
  worksheet.getColumn(daysInMonth + 3).width = 6; // TOT column

  // Title row
  const titleRow = worksheet.addRow([`FOGLIO PRESENZE - ${getMonthName(monthNum)} ${year}`]);
  titleRow.font = { bold: true, size: 14 };
  worksheet.mergeCells(1, 1, 1, daysInMonth + 3);
  titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
  titleRow.height = 25;

  // Legend row
  const legendRow = worksheet.addRow(['Legenda: F=Ferie | P=Permessi | M=Malattia | CP=Cong.Parent. | L104=Legge104']);
  legendRow.font = { size: 9, italic: true };
  worksheet.mergeCells(2, 1, 2, daysInMonth + 3);
  legendRow.alignment = { horizontal: 'left', vertical: 'middle' };
  legendRow.height = 18;

  // Empty row
  worksheet.addRow([]);

  // Header row
  const headerRow = worksheet.addRow(['Nome', 'T', ...Array.from({ length: daysInMonth }, (_, i) => i + 1), 'TOT']);
  headerRow.font = { bold: true, size: 10 };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.height = 20;
  
  // Style header row
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9D9D9' }
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  // Color day columns based on day of week and holidays
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${month.padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const colIndex = day + 2; // +2 because first two columns are Nome and Tipo
    const cell = headerRow.getCell(colIndex);
    
    if (isItalianHoliday(dateStr)) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFD700' } // Gold for holidays
      };
    } else if (isSunday(dateStr)) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFC0CB' } // Light pink for Sundays
      };
    } else if (isSaturday(dateStr)) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFADD8E6' } // Light blue for Saturdays
      };
    }
  }

  // Add employee rows
  attendanceData.forEach((employee: any) => {
    // Row 1: Ordinarie
    const ordinaryValues: (string | number)[] = [employee.fullName, 'O'];
    let totalOrdinary = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${month.padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const dayData = employee.dailyData[dateStr];
      
      if (dayData && dayData.ordinary > 0) {
        ordinaryValues.push(dayData.ordinary === Math.floor(dayData.ordinary) 
          ? dayData.ordinary 
          : dayData.ordinary.toFixed(1));
        totalOrdinary += dayData.ordinary;
      } else {
        ordinaryValues.push('-');
      }
    }
    
    ordinaryValues.push(totalOrdinary === Math.floor(totalOrdinary) 
      ? totalOrdinary 
      : totalOrdinary.toFixed(1));
    
    const row1 = worksheet.addRow(ordinaryValues);
    row1.height = 16;
    row1.alignment = { horizontal: 'center', vertical: 'middle' };
    row1.font = { size: 9 };
    
    // Row 2: Straordinari/Assenze
    const overtimeValues: (string | number)[] = ['', 'S'];
    let totalOvertime = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${month.padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const dayData = employee.dailyData[dateStr];
      
      if (dayData) {
        if (dayData.absence) {
          overtimeValues.push(dayData.absence);
        } else if (dayData.overtime > 0) {
          overtimeValues.push(dayData.overtime === Math.floor(dayData.overtime) 
            ? dayData.overtime 
            : dayData.overtime.toFixed(1));
          totalOvertime += dayData.overtime;
        } else {
          overtimeValues.push('-');
        }
      } else {
        overtimeValues.push('-');
      }
    }
    
    overtimeValues.push(totalOvertime === Math.floor(totalOvertime) 
      ? totalOvertime 
      : totalOvertime.toFixed(1));
    
    const row2 = worksheet.addRow(overtimeValues);
    row2.height = 16;
    row2.alignment = { horizontal: 'center', vertical: 'middle' };
    row2.font = { size: 9 };

    // Apply borders and background colors to both rows
    [row1, row2].forEach(row => {
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        
        // Apply day colors to data cells
        if (colNumber > 2 && colNumber <= daysInMonth + 2) {
          const day = colNumber - 2;
          const dateStr = `${year}-${month.padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          
          if (isItalianHoliday(dateStr)) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFF4CC' } // Light gold for holidays
            };
          } else if (isSunday(dateStr)) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFE4E1' } // Light pink for Sundays
            };
          } else if (isSaturday(dateStr)) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFE0F2F7' } // Light blue for Saturdays
            };
          }
        }
      });
    });
    
    // Make second row slightly lighter
    row2.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF5F5F5' }
    };
    row2.getCell(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF5F5F5' }
    };
  });

  // Generate buffer
  return await workbook.xlsx.writeBuffer();
}

function getMonthName(month: number): string {
  const months = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];
  return months[month - 1];
}
