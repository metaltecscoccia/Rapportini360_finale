const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function escapeValue(val) {
  if (val === null) return 'NULL';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') return val.toString();
  if (Array.isArray(val)) {
    const escaped = val.map(v => v.replace(/"/g, '\\"')).join('","');
    return `'{"${escaped}"}'`;
  }
  if (typeof val === 'string') {
    return "'" + val.replace(/'/g, "''").replace(/\\/g, '\\\\') + "'";
  }
  return "'" + String(val).replace(/'/g, "''") + "'";
}

async function exportTable(tableName, columns) {
  const result = await pool.query(`SELECT * FROM ${tableName}`);
  const inserts = [];
  
  for (const row of result.rows) {
    const values = await Promise.all(columns.map(col => escapeValue(row[col])));
    inserts.push(`INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});`);
  }
  
  return inserts.join('\n');
}

async function main() {
  const tables = [
    { name: 'organizations', cols: ['id', 'name', 'subdomain', 'logo', 'is_active', 'created_at'] },
    { name: 'clients', cols: ['id', 'name', 'description', 'organization_id'] },
    { name: 'users', cols: ['id', 'username', 'password', 'plain_password', 'role', 'full_name', 'is_active', 'organization_id'] },
    { name: 'work_types', cols: ['id', 'name', 'description', 'organization_id'] },
    { name: 'materials', cols: ['id', 'name', 'description', 'organization_id'] },
    { name: 'work_orders', cols: ['id', 'code', 'description', 'client_id', 'is_active', 'organization_id'] },
    { name: 'daily_reports', cols: ['id', 'employee_id', 'date', 'status', 'created_at', 'updated_at', 'organization_id'] },
    { name: 'operations', cols: ['id', 'daily_report_id', 'client_id', 'work_order_id', 'work_types', 'hours', 'notes', 'materials', 'photos'] }
  ];
  
  let output = '-- Metaltec Data Export - Generated with proper escaping\n\n';
  
  for (const table of tables) {
    console.error(`Exporting ${table.name}...`);
    const sql = await exportTable(table.name, table.cols);
    output += `-- ${table.name}\n${sql}\n\n`;
  }
  
  console.log(output);
  await pool.end();
}

main().catch(console.error);
