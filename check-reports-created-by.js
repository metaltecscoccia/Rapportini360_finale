import pg from 'pg';

const { Client } = pg;

const dbUrl = "postgresql://neondb_owner:npg_3HneIc0stbXv@ep-empty-dust-agik4hk2-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";

async function checkReportsCreatedBy() {
  const client = new Client({ connectionString: dbUrl });

  try {
    await client.connect();
    console.log('✅ Connected to Neon database\n');

    // Check recent reports with their created_by value
    const result = await client.query(`
      SELECT
        dr.id,
        dr.date,
        dr.created_by,
        dr.created_at,
        u.full_name as employee_name
      FROM daily_reports dr
      JOIN users u ON dr.employee_id = u.id
      ORDER BY dr.created_at DESC
      LIMIT 10
    `);

    console.log('📊 Last 10 daily reports:\n');
    console.table(result.rows);

    // Count by created_by
    const countResult = await client.query(`
      SELECT
        created_by,
        COUNT(*) as count
      FROM daily_reports
      GROUP BY created_by
    `);

    console.log('\n📈 Reports count by origin:\n');
    console.table(countResult.rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 Connection closed');
  }
}

checkReportsCreatedBy();
