# Script di Migrazione Dati Metaltec

## Esportare i dati dal database corrente

```bash
# Esporta tutti i dati in un file SQL
npx tsx scripts/export-data.ts > backup_$(date +%Y%m%d).sql
```

## Importare i dati su un altro database

```bash
# Con psql diretto (consigliato)
psql "postgresql://user:password@host:5432/database?sslmode=require" < backup.sql

# Con variabile d'ambiente
psql $DATABASE_URL < backup.sql

# Per verificare errori durante l'import
psql --set=ON_ERROR_STOP=1 $DATABASE_URL < backup.sql
```

## Note importanti

1. **Ordine delle tabelle**: Lo script rispetta le foreign key constraints, esportando prima le tabelle indipendenti e poi quelle dipendenti.

2. **Caratteri speciali**: Lo script gestisce correttamente apostrofi, newline e altri caratteri speciali.

3. **Array PostgreSQL**: I campi array (workTypes, materials, photos, availableWorkTypes, availableMaterials) vengono esportati come `ARRAY[...]::text[]`.

4. **Tabelle esportate** (in ordine):
   - organizations
   - clients
   - users
   - work_types
   - materials
   - work_orders
   - vehicles
   - daily_reports
   - operations
   - attendance_entries
   - hours_adjustments
   - fuel_refills
   - fuel_tank_loads

5. **Prima dell'import**: Il file SQL cancella i dati esistenti nelle tabelle prima di inserire quelli nuovi.

6. **Transazione**: Tutto l'import è racchiuso in una transazione (BEGIN/COMMIT) per garantire consistenza.

## Workflow completo di migrazione

```bash
# 1. Esporta i dati
npx tsx scripts/export-data.ts > backup.sql

# 2. Verifica il file generato
head -50 backup.sql
tail -20 backup.sql

# 3. Importa sul database di destinazione
psql "postgresql://..." < backup.sql
```
