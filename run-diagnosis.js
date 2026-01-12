import pg from 'pg';
import fs from 'fs';

const { Client } = pg;

const client = new Client({
  connectionString: "postgresql://neondb_owner:npg_3HneIc0stbXv@ep-empty-dust-agik4hk2-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
});

async function runDiagnosis() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Read SQL script
    const sql = fs.readFileSync('diagnose-orgs-fixed.sql', 'utf8');

    // Split by semicolon to execute each query separately
    const queries = sql.split(';').filter(q => q.trim().length > 0);

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i].trim();
      if (query) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`Query ${i + 1}:`);
        console.log(`${'='.repeat(80)}`);

        try {
          const result = await client.query(query);

          if (result.rows.length === 0) {
            console.log('No results');
          } else {
            console.table(result.rows);
          }
        } catch (err) {
          console.error(`Error in query ${i + 1}:`, err.message);
        }
      }
    }

  } catch (err) {
    console.error('Connection error:', err);
  } finally {
    await client.end();
    console.log('\n✅ Disconnected from database');
  }
}

runDiagnosis();
