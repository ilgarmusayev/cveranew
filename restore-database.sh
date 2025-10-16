#!/bin/bash

# CVERA PostgreSQL Database Restore Script
# Bu script backup-dan database-i restore edir

# Rənglər
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Backup qovluğu
BACKUP_DIR="/home/musayev/Documents/cveralasted/cveranew/backups"

# Database məlumatları
DB_HOST="cvera.postgres.database.azure.com"
DB_USER="admincvera"
DB_NAME="cvera"
DB_PASSWORD="ilqarilqar1M@"

echo -e "${BLUE}=== CVERA Database Restore ===${NC}"
echo ""

# Backup fayllarını göstər
echo -e "${YELLOW}📋 Mövcud backup faylları:${NC}"
echo ""
ls -lht "$BACKUP_DIR" | grep -E "\.(backup|sql)$" | nl
echo ""

# İstifadəçidən fayl seçməsini istə
echo -e "${YELLOW}❓ Hansı backup faylını restore etmək istəyirsiniz?${NC}"
echo -e "${YELLOW}Fayl adını daxil edin (məs: cvera_backup_20251016_232835.backup):${NC}"
read -p "Fayl adı: " BACKUP_FILE

BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"

# Faylın mövcudluğunu yoxla
if [ ! -f "$BACKUP_PATH" ]; then
    echo -e "${RED}❌ Xəta: Fayl tapılmadı: $BACKUP_PATH${NC}"
    exit 1
fi

# Fayl formatını təyin et
if [[ "$BACKUP_FILE" == *.backup ]]; then
    FORMAT="custom"
elif [[ "$BACKUP_FILE" == *.sql ]]; then
    FORMAT="sql"
else
    echo -e "${RED}❌ Xəta: Dəstəklənməyən fayl formatı!${NC}"
    exit 1
fi

# Təsdiq istə
echo ""
echo -e "${RED}⚠️  XƏBƏRDARLIQ: Bu əməliyyat mövcud database-i SİLƏCƏK!${NC}"
echo -e "${YELLOW}Database: $DB_NAME@$DB_HOST${NC}"
echo -e "${YELLOW}Backup fayl: $BACKUP_FILE${NC}"
echo ""
read -p "Davam etmək istəyirsiniz? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}🚫 Restore ləğv edildi.${NC}"
    exit 0
fi

echo ""
echo -e "${GREEN}🔄 Restore başladı...${NC}"

# Restore əməliyyatı
if [ "$FORMAT" == "custom" ]; then
    # Custom format restore
    echo -e "${BLUE}📥 Custom format backup restore edilir...${NC}"
    PGPASSWORD="$DB_PASSWORD" /usr/lib/postgresql/17/bin/pg_restore \
      -h "$DB_HOST" \
      -U "$DB_USER" \
      -d "$DB_NAME" \
      --clean --if-exists \
      -v "$BACKUP_PATH" 2>&1 | tail -20
    
    RESTORE_STATUS=$?
else
    # SQL format restore
    echo -e "${BLUE}📥 SQL backup restore edilir...${NC}"
    PGPASSWORD="$DB_PASSWORD" /usr/lib/postgresql/17/bin/psql \
      -h "$DB_HOST" \
      -U "$DB_USER" \
      -d "$DB_NAME" \
      -f "$BACKUP_PATH" 2>&1 | tail -20
    
    RESTORE_STATUS=$?
fi

echo ""
if [ $RESTORE_STATUS -eq 0 ]; then
    echo -e "${GREEN}✅ Restore uğurla tamamlandı!${NC}"
    echo -e "${GREEN}🎉 Database: $DB_NAME restore edildi!${NC}"
else
    echo -e "${RED}❌ Restore zamanı xəta baş verdi!${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}ℹ️  Database restore edildikdən sonra aşağıdakıları yoxlayın:${NC}"
echo -e "   1. Prisma migrate statusu: npx prisma migrate status"
echo -e "   2. Data integrity"
echo -e "   3. Application connection test"
