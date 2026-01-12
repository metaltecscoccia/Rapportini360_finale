-- Script per verificare la distribuzione dei dati tra le organizzazioni

-- 1. Elenco organizzazioni
SELECT 'ORGANIZZAZIONI:' as tipo, id, name, created_at
FROM organizations
ORDER BY created_at;

-- 2. Conteggio utenti per organizzazione
SELECT 'UTENTI PER ORG:' as tipo, o.name as organizzazione, COUNT(u.id) as num_utenti
FROM organizations o
LEFT JOIN users u ON u."organizationId" = o.id
GROUP BY o.id, o.name
ORDER BY o.created_at;

-- 3. Conteggio clienti per organizzazione
SELECT 'CLIENTI PER ORG:' as tipo, o.name as organizzazione, COUNT(c.id) as num_clienti
FROM organizations o
LEFT JOIN clients c ON c."organizationId" = o.id
GROUP BY o.id, o.name
ORDER BY o.created_at;

-- 4. Conteggio rapportini per organizzazione
SELECT 'RAPPORTINI PER ORG:' as tipo, o.name as organizzazione, COUNT(dr.id) as num_rapportini
FROM organizations o
LEFT JOIN daily_reports dr ON dr."organizationId" = o.id
GROUP BY o.id, o.name
ORDER BY o.created_at;

-- 5. Dettaglio primi 5 clienti (per vedere a quale org appartengono)
SELECT 'PRIMI 5 CLIENTI:' as tipo, c.name as cliente, o.name as organizzazione
FROM clients c
JOIN organizations o ON c."organizationId" = o.id
ORDER BY c.created_at
LIMIT 5;
