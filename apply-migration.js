import pg from 'pg';
import fs from 'fs';

const { Client } = pg;

const dbUrl = "postgresql://neondb_owner:npg_3HneIc0stbXv@ep-empty-dust-agik4hk2-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";

async function applyMigration() {
  const client = new Client({ connectionString: dbUrl });

  try {
    await client.connect();
    console.log('✅ Connected to Neon database');

    // Read migration SQL
    const migrationSQL = fs.readFileSync('migration-created-by.sql', 'utf-8');

    console.log('\n📝 Executing migration...\n');
    console.log(migrationSQL);
    console.log('\n');

    // Execute migration
    await client.query(migrationSQL);

    console.log('✅ Migration applied successfully!');

    // Verify schema
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

    console.log('\n📊 Current users table schema:');
    console.table(result.rows);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

applyMigration();
