import pg from 'pg';

const { Client } = pg;

const dbUrl = "postgresql://neondb_owner:npg_3HneIc0stbXv@ep-empty-dust-agik4hk2-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";

async function checkDatabaseUsage() {
  const client = new Client({ connectionString: dbUrl });

  try {
    await client.connect();
    console.log('✅ Connesso a Neon Database\n');

    // Get database size
    const sizeResult = await client.query(`
      SELECT
        pg_size_pretty(pg_database_size(current_database())) as size,
        pg_database_size(current_database()) as size_bytes
    `);

    console.log('📊 DIMENSIONE DATABASE TOTALE:');
    console.log(`   ${sizeResult.rows[0].size} (${(sizeResult.rows[0].size_bytes / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`   Limite Free Tier: 512 MB`);
    console.log(`   Percentuale usata: ${((sizeResult.rows[0].size_bytes / 1024 / 1024 / 512) * 100).toFixed(2)}%\n`);

    // Count records per table
    const tablesResult = await client.query(`
      SELECT
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
        pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
    `);

    console.log('📋 DIMENSIONE TABELLE:\n');
    for (const row of tablesResult.rows) {
      console.log(`   ${row.tablename.padEnd(25)} ${row.size.padStart(10)} (${(row.size_bytes / 1024).toFixed(2)} KB)`);
    }

    // Count rows in main tables
    console.log('\n📈 CONTEGGIO RIGHE:\n');

    const counts = await Promise.all([
      client.query('SELECT COUNT(*) FROM organizations'),
      client.query('SELECT COUNT(*) FROM users'),
      client.query('SELECT COUNT(*) FROM clients'),
      client.query('SELECT COUNT(*) FROM work_orders'),
      client.query('SELECT COUNT(*) FROM daily_reports'),
      client.query('SELECT COUNT(*) FROM operations'),
      client.query('SELECT COUNT(*) FROM attendance_entries'),
      client.query('SELECT COUNT(*) FROM vehicles'),
      client.query('SELECT COUNT(*) FROM fuel_refills'),
    ]);

    console.log(`   Organizations:      ${counts[0].rows[0].count.padStart(6)}`);
    console.log(`   Users (dipendenti): ${counts[1].rows[0].count.padStart(6)}`);
    console.log(`   Clients:            ${counts[2].rows[0].count.padStart(6)}`);
    console.log(`   Work Orders:        ${counts[3].rows[0].count.padStart(6)}`);
    console.log(`   Daily Reports:      ${counts[4].rows[0].count.padStart(6)}`);
    console.log(`   Operations:         ${counts[5].rows[0].count.padStart(6)}`);
    console.log(`   Attendance Entries: ${counts[6].rows[0].count.padStart(6)}`);
    console.log(`   Vehicles:           ${counts[7].rows[0].count.padStart(6)}`);
    console.log(`   Fuel Refills:       ${counts[8].rows[0].count.padStart(6)}`);

    // Calculate estimated capacity
    const currentSizeMB = sizeResult.rows[0].size_bytes / 1024 / 1024;
    const maxSizeMB = 512;
    const remainingMB = maxSizeMB - currentSizeMB;

    const orgs = parseInt(counts[0].rows[0].count);
    const users = parseInt(counts[1].rows[0].count);
    const reports = parseInt(counts[4].rows[0].count);

    console.log('\n🎯 STIMA CAPACITÀ RESIDUA:\n');

    if (orgs > 0 && users > 0) {
      const avgUsersPerOrg = users / orgs;
      const mbPerOrg = currentSizeMB / orgs;
      const additionalOrgs = Math.floor(remainingMB / mbPerOrg);
      const additionalUsers = Math.floor(additionalOrgs * avgUsersPerOrg);

      console.log(`   Media dipendenti/azienda: ${avgUsersPerOrg.toFixed(1)}`);
      console.log(`   MB per azienda: ${mbPerOrg.toFixed(2)} MB`);
      console.log(`   Aziende aggiungibili: ~${additionalOrgs}`);
      console.log(`   Dipendenti aggiungibili: ~${additionalUsers}`);
      console.log(`   \n   TOTALE MASSIMO: ${orgs + additionalOrgs} aziende, ${users + additionalUsers} dipendenti`);
    } else {
      console.log(`   Spazio disponibile: ${remainingMB.toFixed(2)} MB (${((remainingMB / maxSizeMB) * 100).toFixed(1)}%)`);
    }

    // Check oldest data
    const oldestReport = await client.query(`
      SELECT MIN(date) as oldest_date FROM daily_reports
    `);

    if (oldestReport.rows[0].oldest_date) {
      console.log(`\n📅 STORICO DATI:`);
      console.log(`   Rapportino più vecchio: ${oldestReport.rows[0].oldest_date}`);
    }

  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 Connessione chiusa');
  }
}

checkDatabaseUsage();
