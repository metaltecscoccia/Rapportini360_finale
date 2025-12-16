const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

function escapeValue(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') return val.toString();
  if (Array.isArray(val)) {
    if (val.length === 0) return "'{}'";
    const escaped = val.map(v => String(v).replace(/"/g, '\\"')).join('","');
    return `'{"${escaped}"}'`;
  }
  if (val instanceof Date) {
    return "'" + val.toISOString().replace('T', ' ').replace('Z', '') + "'";
  }
  if (typeof val === 'string') {
    return "E'" + val.replace(/\\/g, '\\\\').replace(/'/g, "''").replace(/\n/g, '\\n').replace(/\r/g, '\\r') + "'";
  }
  return "'" + String(val).replace(/'/g, "''") + "'";
}

async function exportTable(tableName, columns) {
  const result = await pool.query(`SELECT * FROM ${tableName}`);
  const inserts = [];
  
  for (const row of result.rows) {
    const values = columns.map(col => escapeValue(row[col]));
    inserts.push(`INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});`);
  }
  
  return inserts.join('\n');
}

async function main() {
  const tables = [
    { name: 'vehicles', cols: ['id', 'organization_id', 'name', 'plate', 'type', 'fuel_type', 'tank_capacity', 'notes', 'is_active'] },
    { name: 'fuel_tank_loads', cols: ['id', 'organization_id', 'load_date', 'quantity', 'price_per_liter', 'total_cost', 'notes', 'created_at'] },
    { name: 'fuel_refills', cols: ['id', 'organization_id', 'vehicle_id', 'user_id', 'refill_date', 'quantity', 'odometer', 'is_full_tank', 'from_company_tank', 'price_per_liter', 'total_cost', 'notes', 'created_at'] },
    { name: 'attendance_entries', cols: ['id', 'organization_id', 'user_id', 'date', 'absence_type', 'notes', 'created_at'] }
  ];
  
  let output = '-- Metaltec Missing Tables Export\n\n';
  
  for (const table of tables) {
    console.error(`Exporting ${table.name}...`);
    const sql = await exportTable(table.name, table.cols);
    if (sql) {
      output += `-- Table: ${table.name}\n${sql}\n\n`;
    }
  }
  
  console.log(output);
  await pool.end();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
