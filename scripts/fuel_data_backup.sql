-- Metaltec Fuel Data Backup
-- Generated: 2025-12-16
-- Organization ID: b578579d-c664-4382-8504-bd7740dbfd9b

BEGIN;

-- ==========================================
-- VEHICLES (10 records)
-- ==========================================
DELETE FROM vehicles WHERE organization_id = 'b578579d-c664-4382-8504-bd7740dbfd9b';

INSERT INTO vehicles (id, organization_id, name, license_plate, fuel_type, current_km, current_engine_hours, is_active, created_at) VALUES
('545b0d16-f125-470c-881e-17b0a71615e1', 'b578579d-c664-4382-8504-bd7740dbfd9b', 'Range Rover Evoque', 'FR740KT', 'diesel', NULL, NULL, TRUE, '2025-11-21 13:36:47.077315'),
('3ff88ab3-2d8d-4df8-bf91-4e1f137d4de9', 'b578579d-c664-4382-8504-bd7740dbfd9b', 'Alfa Romeo Stelvio', 'FX518RF', 'diesel', NULL, NULL, TRUE, '2025-11-21 13:37:04.343471'),
('9c8cb4c7-4bfb-4282-92f3-4087a4311ae3', 'b578579d-c664-4382-8504-bd7740dbfd9b', 'Fiat Doblò', 'CL837EX', 'diesel', NULL, NULL, TRUE, '2025-11-21 13:36:05.163512'),
('c3110c6d-1e1f-473c-92e6-02c655ae006d', 'b578579d-c664-4382-8504-bd7740dbfd9b', 'Fiat Ducato', 'FJ886BB', 'diesel', NULL, NULL, TRUE, '2025-11-21 13:37:23.519448'),
('a559fc01-e285-44a6-a64a-2f8dea32cae3', 'b578579d-c664-4382-8504-bd7740dbfd9b', 'Fiat qubo', 'EF518CA', 'diesel', NULL, NULL, TRUE, '2025-12-04 07:13:25.202466'),
('f404b7cf-b8a5-4f86-bd2e-d42f5eef9a84', 'b578579d-c664-4382-8504-bd7740dbfd9b', 'Iveco Eurocargo', 'BN872NN', 'diesel', NULL, NULL, TRUE, '2025-11-21 13:36:23.849546'),
('38d25404-9602-4f2d-b1f9-4557b3876e36', 'b578579d-c664-4382-8504-bd7740dbfd9b', 'Iveco Stralis', 'EP916FE', 'diesel', NULL, NULL, TRUE, '2025-11-21 13:37:38.184429'),
('0011861b-9b2d-4d9c-8925-a6291e621322', 'b578579d-c664-4382-8504-bd7740dbfd9b', 'Muletto OM30', 'XXXXXX', 'diesel', NULL, NULL, TRUE, '2025-11-21 13:38:46.473522'),
('bebac748-a885-4c7f-abb0-f0211e69d176', 'b578579d-c664-4382-8504-bd7740dbfd9b', 'Piattaforma Haulotte', 'XXXXXXX', 'diesel', NULL, NULL, TRUE, '2025-11-21 13:39:05.910554'),
('b4dc0f35-9758-48e6-a6ee-12c13634d753', 'b578579d-c664-4382-8504-bd7740dbfd9b', 'Piattaforma SkySjack', 'XXXXXXXX', 'diesel', NULL, NULL, TRUE, '2025-11-21 13:39:23.749515');

-- ==========================================
-- FUEL REFILLS (11 records)
-- ==========================================
DELETE FROM fuel_refills WHERE organization_id = 'b578579d-c664-4382-8504-bd7740dbfd9b';

INSERT INTO fuel_refills (id, organization_id, vehicle_id, refill_date, operator_id, liters_before, liters_after, liters_refilled, km_reading, engine_hours_reading, total_cost, notes, created_at) VALUES
('3470ca10-07d5-4f83-a2f5-4c4d35509964', 'b578579d-c664-4382-8504-bd7740dbfd9b', '38d25404-9602-4f2d-b1f9-4557b3876e36', '2025-11-24 19:43:00', '212a75a7-14eb-4c29-8c9c-69aaa946a475', 0, 100, 100, NULL, NULL, NULL, NULL, '2025-11-24 18:43:28.967735'),
('bc40e2dc-0c0e-4781-8cbb-b7008e96ca72', 'b578579d-c664-4382-8504-bd7740dbfd9b', 'b4dc0f35-9758-48e6-a6ee-12c13634d753', '2025-11-26 09:35:00', '212a75a7-14eb-4c29-8c9c-69aaa946a475', 100, 125, 25, NULL, 1809, NULL, 'Cantiere Alberto di Pietro', '2025-11-26 07:36:21.091938'),
('64b25dd8-b6e5-475d-9783-eed022850824', 'b578579d-c664-4382-8504-bd7740dbfd9b', '3ff88ab3-2d8d-4df8-bf91-4e1f137d4de9', '2025-11-27 13:07:00', '212a75a7-14eb-4c29-8c9c-69aaa946a475', 125, 170, 45, 139258, NULL, NULL, NULL, '2025-11-27 12:07:35.414653'),
('cb58eb66-1695-4a9e-b44c-cd8aeb7ff822', 'b578579d-c664-4382-8504-bd7740dbfd9b', '9c8cb4c7-4bfb-4282-92f3-4087a4311ae3', '2025-11-27 17:12:00', '212a75a7-14eb-4c29-8c9c-69aaa946a475', 170, 223, 53, 369475, NULL, NULL, NULL, '2025-11-27 16:13:05.523803'),
('bf5e4632-7f1b-469d-b3a5-9e6c3185f8e5', 'b578579d-c664-4382-8504-bd7740dbfd9b', '545b0d16-f125-470c-881e-17b0a71615e1', '2025-12-02 09:00:00', '212a75a7-14eb-4c29-8c9c-69aaa946a475', 223, 268, 45, 105890, NULL, NULL, NULL, '2025-12-02 08:00:47.609568'),
('83a61776-8ddb-4f70-9360-7271d166d842', 'b578579d-c664-4382-8504-bd7740dbfd9b', 'c3110c6d-1e1f-473c-92e6-02c655ae006d', '2025-12-02 16:12:00', '212a75a7-14eb-4c29-8c9c-69aaa946a475', 268, 347, 79, 77428, NULL, NULL, NULL, '2025-12-02 15:12:31.903258'),
('8fdde5f9-1a3b-4a9f-8236-2880cbfe3350', 'b578579d-c664-4382-8504-bd7740dbfd9b', 'a559fc01-e285-44a6-a64a-2f8dea32cae3', '2025-12-04 08:13:00', '212a75a7-14eb-4c29-8c9c-69aaa946a475', 347, 383, 36, 205737, NULL, NULL, NULL, '2025-12-04 07:14:01.869526'),
('628ee132-65f9-40e4-afbe-a1e0936945b5', 'b578579d-c664-4382-8504-bd7740dbfd9b', '3ff88ab3-2d8d-4df8-bf91-4e1f137d4de9', '2025-12-05 16:53:00', '212a75a7-14eb-4c29-8c9c-69aaa946a475', 383, 438, 55, 139863, NULL, NULL, NULL, '2025-12-05 15:54:22.701659'),
('7da71273-adb4-4404-8915-1824d8b6982c', 'b578579d-c664-4382-8504-bd7740dbfd9b', 'f404b7cf-b8a5-4f86-bd2e-d42f5eef9a84', '2025-12-11 14:43:00', '212a75a7-14eb-4c29-8c9c-69aaa946a475', 438, 504, 66, 63594, NULL, NULL, NULL, '2025-12-11 13:44:29.402143'),
('ca76ba4e-e3ee-4544-9b8b-2bfd464cd526', 'b578579d-c664-4382-8504-bd7740dbfd9b', '9c8cb4c7-4bfb-4282-92f3-4087a4311ae3', '2025-12-12 10:01:00', '212a75a7-14eb-4c29-8c9c-69aaa946a475', 504, 555, 51, 370343, NULL, NULL, NULL, '2025-12-12 09:02:45.678831'),
('5fdaa8d7-2723-4143-97c1-83801cbdd5f1', 'b578579d-c664-4382-8504-bd7740dbfd9b', '545b0d16-f125-470c-881e-17b0a71615e1', '2025-12-12 12:24:00', '212a75a7-14eb-4c29-8c9c-69aaa946a475', 555, 600, 45, 106368, NULL, NULL, NULL, '2025-12-12 11:25:28.071175');

-- ==========================================
-- FUEL TANK LOADS (1 record)
-- ==========================================
DELETE FROM fuel_tank_loads WHERE organization_id = 'b578579d-c664-4382-8504-bd7740dbfd9b';

INSERT INTO fuel_tank_loads (id, organization_id, load_date, liters, total_cost, supplier, notes, created_at) VALUES
('33477cd4-79fd-4da2-bc9d-3f4859eefe70', 'b578579d-c664-4382-8504-bd7740dbfd9b', '2025-11-21 14:13:00', 2000, NULL, 'MEROLLI Srl', NULL, '2025-11-21 13:14:02.362468');

COMMIT;

-- Summary:
-- - 10 vehicles
-- - 11 fuel refills
-- - 1 fuel tank load
