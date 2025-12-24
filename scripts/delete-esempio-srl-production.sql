-- ═══════════════════════════════════════════════════════
-- Script per cancellare i dati di "Esempio Srl" dal database di produzione
-- ATTENZIONE: Eseguire PRIMA di importare i nuovi dati demo
-- ═══════════════════════════════════════════════════════

-- Trova l'ID dell'organizzazione "Esempio Srl" nel database di produzione
-- Sostituisci 'ESEMPIO_SRL_ORG_ID' con l'ID reale dopo averlo verificato

-- Per trovare l'ID esegui:
-- SELECT id, name FROM organizations WHERE name = 'Esempio Srl';

BEGIN;

-- Cancella in ordine inverso rispetto alle foreign keys
-- 1. Operations (dipende da daily_reports)
DELETE FROM operations WHERE daily_report_id IN (
  SELECT id FROM daily_reports WHERE organization_id = (
    SELECT id FROM organizations WHERE name = 'Esempio Srl'
  )
);

-- 2. Hours adjustments (dipende da daily_reports)
DELETE FROM hours_adjustments WHERE organization_id = (
  SELECT id FROM organizations WHERE name = 'Esempio Srl'
);

-- 3. Fuel refills (dipende da vehicles)
DELETE FROM fuel_refills WHERE organization_id = (
  SELECT id FROM organizations WHERE name = 'Esempio Srl'
);

-- 4. Fuel tank loads
DELETE FROM fuel_tank_loads WHERE organization_id = (
  SELECT id FROM organizations WHERE name = 'Esempio Srl'
);

-- 5. Vehicles
DELETE FROM vehicles WHERE organization_id = (
  SELECT id FROM organizations WHERE name = 'Esempio Srl'
);

-- 6. Daily reports
DELETE FROM daily_reports WHERE organization_id = (
  SELECT id FROM organizations WHERE name = 'Esempio Srl'
);

-- 7. Attendance entries
DELETE FROM attendance_entries WHERE organization_id = (
  SELECT id FROM organizations WHERE name = 'Esempio Srl'
);

-- 8. Work orders (dipende da clients)
DELETE FROM work_orders WHERE organization_id = (
  SELECT id FROM organizations WHERE name = 'Esempio Srl'
);

-- 9. Clients
DELETE FROM clients WHERE organization_id = (
  SELECT id FROM organizations WHERE name = 'Esempio Srl'
);

-- 10. Work types
DELETE FROM work_types WHERE organization_id = (
  SELECT id FROM organizations WHERE name = 'Esempio Srl'
);

-- 11. Materials
DELETE FROM materials WHERE organization_id = (
  SELECT id FROM organizations WHERE name = 'Esempio Srl'
);

-- 12. Users
DELETE FROM users WHERE organization_id = (
  SELECT id FROM organizations WHERE name = 'Esempio Srl'
);

-- 13. Organization
DELETE FROM organizations WHERE name = 'Esempio Srl';

COMMIT;

-- ═══════════════════════════════════════════════════════
-- Cancellazione completata!
-- Ora puoi importare il file esempio_srl_export.sql
-- ═══════════════════════════════════════════════════════
