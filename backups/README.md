# 🗄️ CVERA Database Backup & Restore

PostgreSQL database üçün tam backup və restore həlli.

## 📋 Məzmun

- **Backup Script**: Avtomatik database backup
- **Restore Script**: Backup-dan database restore
- **İki Format**: Custom (binary) və SQL (text)

## 🚀 İstifadə

### 1️⃣ Backup Almaq

```bash
./backup-database.sh
```

Bu script:
- ✅ Custom format backup yaradır (8.3 MB - compressed, binary)
- ✅ SQL format backup yaradır (12 MB - text, oxunaqlı)
- ✅ 30 gündən köhnə backup-ları avtomatik silir
- ✅ Backup statusu haqqında məlumat verir

**Nəticə:**
```
backups/
├── cvera_backup_20251016_232835.backup  (Custom format - restore üçün)
└── cvera_backup_20251016_232921.sql     (SQL format - manual edit üçün)
```

### 2️⃣ Database Restore Etmək

```bash
./restore-database.sh
```

Bu script:
- ✅ Mövcud backup fayllarını göstərir
- ✅ Hansı fayla restore etmək istədiyinizi soruşur
- ✅ Təsdiq istəyir (təhlükəsizlik üçün)
- ✅ Database-i restore edir

**⚠️ XƏBƏRDARLIQ:** Restore mövcud datanı SİLƏCƏK!

### 3️⃣ Manuel Backup (Əmrlər)

#### Custom Format (Tövsiyə edilir):
```bash
PGPASSWORD='ilqarilqar1M@' /usr/lib/postgresql/17/bin/pg_dump \
  -h cvera.postgres.database.azure.com \
  -U admincvera \
  -d cvera \
  -F c -b -v \
  -f backups/manual_backup_$(date +%Y%m%d_%H%M%S).backup
```

#### SQL Format:
```bash
PGPASSWORD='ilqarilqar1M@' /usr/lib/postgresql/17/bin/pg_dump \
  -h cvera.postgres.database.azure.com \
  -U admincvera \
  -d cvera \
  --no-owner --no-acl \
  -f backups/manual_backup_$(date +%Y%m%d_%H%M%S).sql
```

### 4️⃣ Manuel Restore

#### Custom Format-dan:
```bash
PGPASSWORD='ilqarilqar1M@' /usr/lib/postgresql/17/bin/pg_restore \
  -h cvera.postgres.database.azure.com \
  -U admincvera \
  -d cvera \
  --clean --if-exists \
  -v backups/cvera_backup_20251016_232835.backup
```

#### SQL Format-dan:
```bash
PGPASSWORD='ilqarilqar1M@' /usr/lib/postgresql/17/bin/psql \
  -h cvera.postgres.database.azure.com \
  -U admincvera \
  -d cvera \
  -f backups/cvera_backup_20251016_232921.sql
```

## 📊 Backup Məlumatları

### Hazırki Backup Statusu
```
Tarix: 2025-10-16 23:29
Həcm: 21 MB
Fayllar: 2
  - cvera_backup_20251016_232835.backup (8.3 MB)
  - cvera_backup_20251016_232921.sql (12 MB)
```

### Database Strukturu
```
Cədvəllər:
  - Admin
  - ApiKey
  - CV (98 CV mövcuddur)
  - CoverLetter
  - DailyUsage
  - FileGenerationJob
  - ImportSession
  - Payment
  - PromoCode
  - PromoCodeUsage
  - Subscription
  - Template
  - TokenBlacklist
  - User
  - _prisma_migrations
```

## 🛠️ Texniki Tələblər

### Quraşdırılmış Proqramlar:
- PostgreSQL 17 Client
- Bash Shell

### Quraşdırma:
```bash
# PostgreSQL repository əlavə et
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'

# GPG key əlavə et
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Update və quraşdır
sudo apt update
sudo apt install -y postgresql-client-17
```

## 📝 Format Müqayisəsi

| Format | Həcm | Oxunaqlı | Restore Sürəti | İstifadə Sahəsi |
|--------|------|----------|----------------|-----------------|
| Custom (.backup) | 8.3 MB | ❌ | ⚡ Sürətli | Production restore |
| SQL (.sql) | 12 MB | ✅ | 🐢 Yavaş | Manual edit, debug |

## 🔐 Təhlükəsizlik

- ⚠️ Backup faylları şifrə məlumatları ehtiva edir!
- ⚠️ `.gitignore` faylına `backups/` əlavə olunmalıdır!
- ⚠️ Script-lərdə şifrələr hardcoded-dir (production üçün environment variable istifadə edin)

## 🔄 Avtomatik Backup (Cron)

Gündəlik avtomatik backup üçün:

```bash
# Crontab aç
crontab -e

# Hər gün gecə saat 3-də backup al
0 3 * * * /home/musayev/Documents/cveralasted/cveranew/backup-database.sh >> /home/musayev/Documents/cveralasted/cveranew/backups/backup.log 2>&1
```

## 📞 Dəstək

Sual və problemlər üçün: [GitHub Issues](https://github.com/nihadvaliyevvv/cveranew/issues)

---

**Son yeniləmə:** 16 Oktyabr 2025  
**Versiya:** 1.0.0  
**Database Versiyası:** PostgreSQL 17.6
