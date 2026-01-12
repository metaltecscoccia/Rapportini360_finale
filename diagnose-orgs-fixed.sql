-- DIAGNOSI COMPLETA ORGANIZZAZIONI (SNAKE_CASE)

-- 1. Lista completa organizzazioni con ID
SELECT
    'STEP 1 - ORGANIZZAZIONI' as step,
    id,
    name,
    created_at
FROM organizations
ORDER BY created_at;

-- 2. Utenti per organizzazione (mostra organization_id)
SELECT
    'STEP 2 - UTENTI' as step,
    u.username,
    u.role,
    u.organization_id as user_org_id,
    o.name as organizzazione
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id
ORDER BY u.created_at;

-- 3. Clienti per organizzazione
SELECT
    'STEP 3 - DISTRIBUZIONE CLIENTI' as step,
    o.name as organizzazione,
    COUNT(c.id) as num_clienti,
    STRING_AGG(c.name, ', ') as primi_clienti
FROM organizations o
LEFT JOIN clients c ON c.organization_id = o.id
GROUP BY o.id, o.name
ORDER BY num_clienti DESC;

-- 4. Rapportini per organizzazione
SELECT
    'STEP 4 - DISTRIBUZIONE RAPPORTINI' as step,
    o.name as organizzazione,
    COUNT(dr.id) as num_rapportini,
    MIN(dr.date) as primo_rapportino,
    MAX(dr.date) as ultimo_rapportino
FROM organizations o
LEFT JOIN daily_reports dr ON dr.organization_id = o.id
GROUP BY o.id, o.name
ORDER BY num_rapportini DESC;

-- 5. Verifica CRITICA: Ci sono dati senza organization_id? (NULL)
SELECT
    'STEP 5 - VERIFICA DATI ORFANI' as step,
    'clients' as tabella,
    COUNT(*) as num_records_senza_org
FROM clients
WHERE organization_id IS NULL
UNION ALL
SELECT
    'STEP 5 - VERIFICA DATI ORFANI',
    'users',
    COUNT(*)
FROM users
WHERE organization_id IS NULL
UNION ALL
SELECT
    'STEP 5 - VERIFICA DATI ORFANI',
    'daily_reports',
    COUNT(*)
FROM daily_reports
WHERE organization_id IS NULL;

-- 6. Mostra i primi 10 clienti (per debug)
SELECT
    'STEP 6 - SAMPLE CLIENTI' as step,
    o.name as organizzazione,
    c.name as cliente,
    c.organization_id
FROM clients c
JOIN organizations o ON c.organization_id = o.id
ORDER BY o.name, c.created_at
LIMIT 10;
