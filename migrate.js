import pg from 'pg';

const { Client } = pg;

const sourceUrl = process.env.DATABASE_URL; // Replit database
const targetUrl = "postgresql://neondb_owner:npg_3HneIc0stbXv@ep-empty-dust-agik4hk2-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"; // Neon database

async function migrate() {
  console.log('🚀 Starting migration...');
  
  // Connect to source (Replit)
  const sourceClient = new Client({ connectionString: sourceUrl });
  await sourceClient.connect();
  console.log('✓ Connected to source database');
  
  // Connect to target (Neon)
  const targetClient = new Client({ connectionString: targetUrl });
  await targetClient.connect();
  console.log('✓ Connected to target database');
  
  try {
    // Get all tables
    const tables = await sourceClient.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    
    console.log(`📋 Found ${tables.rows.length} tables to migrate`);
    
    for (const { tablename } of tables.rows) {
      console.log(`\n📦 Migrating table: ${tablename}`);
      
      // Get all data from source
      const data = await sourceClient.query(`SELECT * FROM "${tablename}"`);
      console.log(`  Found ${data.rows.length} rows`);
      
      if (data.rows.length > 0) {
        // Get column names
        const columns = Object.keys(data.rows[0]);
        
        // Insert into target
        for (const row of data.rows) {
          const values = columns.map(col => row[col]);
          const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
          const columnNames = columns.map(c => `"${c}"`).join(', ');
          
          await targetClient.query(
            `INSERT INTO "${tablename}" (${columnNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
            values
          );
        }
        console.log(`  ✓ Migrated ${data.rows.length} rows`);
      }
    }
    
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await sourceClient.end();
    await targetClient.end();
  }
}

migrate();
