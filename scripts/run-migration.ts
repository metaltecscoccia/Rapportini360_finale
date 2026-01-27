import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
  });

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'migrations', '002_add_teams.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('Running teams migration...');

    // Execute the migration
    await pool.query(migrationSQL);

    console.log('Migration completed successfully!');
    console.log('New tables created:');
    console.log('  - teams');
    console.log('  - team_members');
    console.log('  - team_submissions');
    console.log('New columns added to daily_reports:');
    console.log('  - team_submission_id');
    console.log('  - submitted_by_id');

  } catch (error: any) {
    // Check if error is due to existing constraints/tables
    if (error.code === '42P07') {
      console.log('Tables already exist, migration may have been run before.');
    } else if (error.code === '42710') {
      console.log('Constraints already exist, migration may have been run before.');
    } else {
      console.error('Migration failed:', error.message);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

runMigration();
