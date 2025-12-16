-- METALTEC DATA EXPORT
-- Esegui questo script nel SQL Editor di Neon (branch production)

-- 1. ORGANIZATION
INSERT INTO organizations (id, name, subdomain, logo, is_active, created_at) VALUES
('b578579d-c664-4382-8504-bd7740dbfd9b', 'Metaltec', 'default', NULL, true, '2025-10-07 21:34:38.365274')
ON CONFLICT (id) DO NOTHING;

-- 2. WORK TYPES
INSERT INTO work_types (id, name, description, is_active, organization_id) VALUES
('ed3efa5d-d90f-46d9-8b47-7a4f1b1cd66b', 'Taglio', NULL, true, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('72c791ba-d927-4365-a5b1-79a5f5676793', 'Saldatura mig', NULL, true, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('40595e1f-9e2f-40e8-a4f9-ce8519158852', 'Saldatura tig', NULL, true, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('6e51af9a-5f6a-41f5-913e-8e69383de196', 'Satinatura', NULL, true, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('94d4a9d9-af6e-4605-a238-bb19721937e5', 'Saldatura laser', NULL, true, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('1c01f3d6-b78f-4c8b-8103-7a7cb06ed956', 'Montaggio', NULL, true, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('ae57791f-cdf5-4b6e-8835-0c29d5d813fb', 'Molatura', NULL, true, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('b1b5c3ff-5a86-4a3d-baf7-524e9eeec3ff', 'Foratura', NULL, true, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('062672c3-83ef-42b3-ae82-f2a1f92a5bb6', 'Lavaggio', NULL, true, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('cfddd274-bca1-4ffc-891a-de2b9d770fa6', 'Pulizia', NULL, true, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('04ccbf3b-f446-41ed-ab0c-7c2d7fe29003', 'Manutenzione', NULL, true, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('9bf4b392-8901-4baa-a0ca-8909c7302938', 'Verniciatura', NULL, true, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('0c449f61-5185-40ae-ade6-191502ece0a6', 'Piegatura', NULL, true, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('3e8d9a40-c40a-461e-951f-bc650ac82a1b', 'Saldatura', NULL, true, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('139bbed1-b2a3-4910-9085-eb2112816676', 'Contabilità', NULL, true, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('0d54de5f-ffa4-4489-8575-18fa009b92d4', 'Gestione amministrativa', NULL, true, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('1db7a093-0300-463e-ae67-73a01b6f1405', 'Lavorazione in cantiere', NULL, true, 'b578579d-c664-4382-8504-bd7740dbfd9b')
ON CONFLICT (id) DO NOTHING;

-- 3. MATERIALS
INSERT INTO materials (id, name, description, is_active, organization_id) VALUES
('66236342-6d23-4555-a092-0e7240fd982c', 'Pannelli', NULL, true, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('ddd61ab4-137a-4b45-85e3-c8fdaf507ee1', 'Porta inox', NULL, true, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('b78f3f5d-b86a-45e5-8cc1-48dd4e68367c', 'Porta zincata', NULL, true, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('623071c0-e950-4da4-84bd-641db1caafca', 'Base lettino', NULL, true, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('ff8d40f0-3095-438d-9965-cbbaaa875612', 'Kit ingresso', NULL, true, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('87dbb67a-7272-4db4-a8c5-104b7893e1be', 'Travi', NULL, true, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('4bf60691-0167-4f27-b8ac-db72bc75eac4', 'Pilastri', NULL, true, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('95dc1eed-9a38-488f-ba6b-cb699d4f3a88', 'Tubolare', NULL, true, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('1692d86a-fd9d-4481-ae7f-010c2115e192', 'Tondi', NULL, true, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('89461c74-4bd5-4960-9556-06f956d2dc57', 'Gronda', NULL, true, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('174aac31-3f39-4bac-a231-2bc985f2a52c', 'Scossaline', NULL, true, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('e9d861b6-b975-4cc5-be51-807b91a84665', 'Staffe', NULL, true, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('c43b2790-5f87-4cdb-b382-977d1d5504a0', 'Piastre', NULL, true, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('14cada46-c561-443e-9b41-46554b151da9', 'Porta/finestre', NULL, true, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('819113b7-585c-479d-932e-9ff1c08a77b2', 'Pavimento', NULL, true, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('aa574ec8-052f-4bac-ae6f-66086c67053e', 'Struttura', NULL, true, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('3bfddf7b-65f3-42e3-97e2-5324ca8a4a0f', 'Assemblaggio accessori', NULL, true, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('e26a4a5d-155c-4edf-b6ac-cc4c432e8f0d', 'Flange', NULL, true, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('68652c73-185d-4165-8685-b0c2bc6f69d7', 'Lamiere', NULL, true, 'b578579d-c664-4382-8504-bd7740dbfd9b')
ON CONFLICT (id) DO NOTHING;

-- 4. CLIENTS
INSERT INTO clients (id, name, description, organization_id) VALUES
('e64ea857-722a-43d1-8a5e-d5fd8a337bfa', 'Morviducci', NULL, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('6be84589-2913-4dff-aeca-812343059160', 'Oskura', NULL, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('fa84755f-b126-406b-9ea4-4198278f7fab', 'Elio d''Ascenzo', NULL, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('b094cb00-1b5f-4582-9d5c-44c857507d24', 'Di Genova', NULL, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('808f24e9-b6ab-4983-b92c-bda172894a49', 'Metaltec', NULL, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('f2d483fb-cbac-4d44-9f9f-b626c061a42a', 'Kromoss', NULL, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('36bcc1a4-e8d8-4aaf-9ae1-a74f82b0b5a8', 'Unirest', NULL, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('c9b96d6e-e47b-4453-add1-85dcb6d9cc6e', 'De Michelis', NULL, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('9da093f2-353b-4304-a2e4-648b60e7494c', 'Alberto di Pietro', NULL, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('5cd1c2c6-6778-4a36-9a54-431b23961587', 'Edil3000 RDC', NULL, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('462f3f99-144c-4775-8ec8-c2083315c671', 'CEN Rocca di Mezzo', NULL, 'b578579d-c664-4382-8504-bd7740dbfd9b'),
('1d3e8ff0-3823-48ad-8d93-d69101227a46', 'Cimino TIGRE AQ', NULL, 'b578579d-c664-4382-8504-bd7740dbfd9b')
ON CONFLICT (id) DO NOTHING;


-- 5. USERS (password già hashate)
INSERT INTO users (id, username, password, role, full_name, is_active, organization_id, plain_password) VALUES
('212a75a7-14eb-4c29-8c9c-69aaa946a475', 'admin', '$2b$12$XtRc4b.5hA2irV3p6HVWyOZbtMmpD2wc4J4tMR0huR1KjV/yagqES', 'admin', 'Amministratore', true, 'b578579d-c664-4382-8504-bd7740dbfd9b', NULL),
('c29ff218-600f-4cab-a602-28dba100fa04', 'Cristian', '$2b$12$bXSK5jnqfqWCm.Rs4e.aROJ1FC4/h19wl/7ZhJ1RUI3J1jA1CPCGG', 'employee', 'Persia Cristian', false, 'b578579d-c664-4382-8504-bd7740dbfd9b', '1234'),
('cf51a175-162d-4f72-9642-87ad967dfc89', 'Alessandra', '$2b$12$OO5WqiPu.it1YFVYpVRT..XGgwNRbX0OaHt6.g3TGYaFMxbFvov6.', 'employee', 'Taccone Alessandra', true, 'b578579d-c664-4382-8504-bd7740dbfd9b', '270972'),
('f1729aee-45bf-466d-891d-5d32f98d0dfe', 'Diego', '$2b$12$JoPscah2dY4Cb5EA6unN9.2rWeQXWSkWcoy1i8uMU1JJmnduEnHIi', 'employee', 'Scognamiglio Diego', true, 'b578579d-c664-4382-8504-bd7740dbfd9b', '1234'),
('5323deb6-b68a-41fc-84a6-a3998d93fd80', 'Aurel', '$2b$12$8ULoQaaAGazTg8D6zcGlR.2euq0PFkgyGE/8eYIxPZhsvSvnNHTUq', 'employee', 'Mailat Aurel', true, 'b578579d-c664-4382-8504-bd7740dbfd9b', '1234'),
('199c4a0a-8f4c-4d0b-a0f6-4efbefc15b78', 'Roberto', '$2b$12$5sKLl5W6TzB5EJ/T4YRdvuSEh4SqK6cTxUtJnqjeF/IQv6A6GapJy', 'employee', 'Mailat Roberto', true, 'b578579d-c664-4382-8504-bd7740dbfd9b', '1234'),
('7231ddd7-5d45-4716-b4a8-f5fc1c549310', 'Giovanni', '$2b$12$I8yIyExK.yJyX/.EXyU6ZeaSDHObpKKSmVPUG7XimpPB6b.vjhqDi', 'employee', 'Sidor Joan', true, 'b578579d-c664-4382-8504-bd7740dbfd9b', '1234'),
('925f152f-4441-42c1-bef9-3a732df546dd', 'Celestino', '$2b$12$HDpZ.g8o0hFDsdoGyevrr.r/.ezigv8RePjzV92P6GOj7MdFpCK86', 'employee', 'Nucci Celestino', true, 'b578579d-c664-4382-8504-bd7740dbfd9b', '1234'),
('423cedbc-ada3-44c4-95a8-80a96b461884', 'Antonio', '$2b$12$Lqmj2Cmg1LKnGHyJSpOMKuXkoe4aQBVK4CQf3ijZ4C0TbaxxYU5fO', 'employee', 'Di Stefano Antonio', true, 'b578579d-c664-4382-8504-bd7740dbfd9b', '1234'),
('afd14f3c-f5fa-4a8b-94a7-be34ddc0dc84', 'Henry', '$2b$12$OX5KPt9Otxlh/cymHYJvZOkwlchSjswzgO8F94ySjy2lLtJc7pq/m', 'employee', 'Mora Bravo Henry', true, 'b578579d-c664-4382-8504-bd7740dbfd9b', '1234'),
('ddc9f140-9e0f-4843-bd65-f26afb6c252d', 'Francesco', '$2b$12$I0BoiSB0FUkLM4GsL7Ovre3zKNBitWDrIhdP1Lm.R5cD/cD/GVsZS', 'employee', 'Paris Francesco', true, 'b578579d-c664-4382-8504-bd7740dbfd9b', '1234'),
('e7e2236b-809b-4fe2-8a3b-bf050d4fae07', 'Gino', '$2b$12$g23o9Zp1dZzIit0PtE8z4e2FB9q0LgbW40RWl/il5ZoYC80XxjYe2', 'employee', 'Tommasini Gino', true, 'b578579d-c664-4382-8504-bd7740dbfd9b', '1234'),
('94052e97-cc2a-473f-8f7a-a3ce2429e0f1', 'Florin', '$2b$12$nnNQU/zG6zCB6VkDSZCm2.gjpXpe8XPx9zDJEXx2PQxWz4FO.3RZS', 'employee', 'Joita Florin', true, 'b578579d-c664-4382-8504-bd7740dbfd9b', '1234'),
('4adbba9c-964f-47d0-8863-159f49ffd796', 'Gianni', '$2b$12$x5ha4wNQoVriVJCT10g9vuBF3ASptO.T1THeYmb4LMwPJBV4531PW', 'employee', 'Scoccia Gianni', true, 'b578579d-c664-4382-8504-bd7740dbfd9b', '1234'),
('5bd6eaa7-86ce-4504-8322-d81ea340487a', 'Antonello', '$2b$12$3o8dvpfvl/QieAlDLXc2k.Ulx/PY0B08B2HeDBfxVjgOW6oASF3ti', 'employee', 'De Benedictis Antonello', false, 'b578579d-c664-4382-8504-bd7740dbfd9b', '1234'),
('47ebaaf0-bae4-4256-a4f6-cf3f03c67099', 'superadmin', '$2b$10$E3iBuUwouUK9L5EvJ/fkAOUPFuu0e3ohbK4XCbwa4bC9NcEUmDlwm', 'superadmin', 'Super Amministratore', true, 'b578579d-c664-4382-8504-bd7740dbfd9b', NULL)
ON CONFLICT (id) DO UPDATE SET 
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name,
  is_active = EXCLUDED.is_active,
  plain_password = EXCLUDED.plain_password;

