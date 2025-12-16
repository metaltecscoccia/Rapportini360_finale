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
    { name: 'organizations', cols: ['id', 'name', 'subdomain', 'logo', 'is_active', 'created_at'] },
    { name: 'clients', cols: ['id', 'name', 'description', 'organization_id'] },
    { name: 'users', cols: ['id', 'username', 'password', 'plain_password', 'role', 'full_name', 'is_active', 'organization_id'] },
    { name: 'work_types', cols: ['id', 'name', 'description', 'is_active', 'organization_id'] },
    { name: 'materials', cols: ['id', 'name', 'description', 'is_active', 'organization_id'] },
    { name: 'work_orders', cols: ['id', 'name', 'description', 'client_id', 'is_active', 'organization_id', 'available_work_types', 'available_materials'] },
    { name: 'daily_reports', cols: ['id', 'employee_id', 'date', 'status', 'created_at', 'updated_at', 'organization_id'] },
    { name: 'operations', cols: ['id', 'daily_report_id', 'client_id', 'work_order_id', 'work_types', 'hours', 'notes', 'materials', 'photos'] }
  ];
  
  let output = '-- Metaltec Data Export v4 - Complete schema mapping\n-- Use: First DELETE all data, then run this file\n\n';
  
  for (const table of tables) {
    console.error(`Exporting ${table.name}...`);
    const sql = await exportTable(table.name, table.cols);
    output += `-- Table: ${table.name}\n${sql}\n\n`;
  }
  
  console.log(output);
  await pool.end();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
