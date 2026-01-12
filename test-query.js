import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: "postgresql://neondb_owner:npg_3HneIc0stbXv@ep-empty-dust-agik4hk2-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
});

async function testQuery() {
  try {
    await client.connect();
    console.log('✅ Connected\n');

    // Simula una query getAllClients per Metaltec
    console.log('=== Test 1: getAllClients per Metaltec (ID: b578579d-c664-4382-8504-bd7740dbfd9b) ===');
    const metaltecClients = await client.query(`
      SELECT name, organization_id
      FROM clients
      WHERE organization_id = 'b578579d-c664-4382-8504-bd7740dbfd9b'
    `);
    console.log(`Clienti trovati: ${metaltecClients.rows.length}`);
    console.table(metaltecClients.rows);

    // Simula una query getAllClients per Esempio Srl
    console.log('\n=== Test 2: getAllClients per Esempio Srl (ID: c560eda3-eb9d-451e-b39b-03842602e36f) ===');
    const esempioClients = await client.query(`
      SELECT name, organization_id
      FROM clients
      WHERE organization_id = 'c560eda3-eb9d-451e-b39b-03842602e36f'
    `);
    console.log(`Clienti trovati: ${esempioClients.rows.length}`);
    console.table(esempioClients.rows);

    // Test senza WHERE (tutti i clienti - quello che vedi tu!)
    console.log('\n=== Test 3: Tutti i clienti SENZA filtro (BUG!) ===');
    const allClients = await client.query(`
      SELECT name, organization_id
      FROM clients
    `);
    console.log(`Clienti trovati: ${allClients.rows.length}`);
    console.table(allClients.rows.slice(0, 5));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

testQuery();
