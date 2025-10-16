#!/bin/bash

# CVERA PostgreSQL Database Backup Script
# Bu script database-dən avtomatik backup alır

# Rənglər
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Backup qovluğu
BACKUP_DIR="/home/musayev/Documents/cveralasted/cveranew/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Database məlumatları (.env.local-dan oxunur)
DB_HOST="cvera.postgres.database.azure.com"
DB_USER="admincvera"
DB_NAME="cvera"
DB_PASSWORD="ilqarilqar1M@"

echo -e "${BLUE}=== CVERA Database Backup ===${NC}"
echo -e "${YELLOW}📅 Tarix: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo ""

# Backup qovluğunu yarat
mkdir -p "$BACKUP_DIR"

# 1. Custom Format (compressed, binary) - Restore üçün daha yaxşı
echo -e "${GREEN}🔄 Custom format backup başladı...${NC}"
PGPASSWORD="$DB_PASSWORD" /usr/lib/postgresql/17/bin/pg_dump \
  -h "$DB_HOST" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -F c -b -v \
  -f "$BACKUP_DIR/cvera_backup_${TIMESTAMP}.backup" 2>&1 | tail -10

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Custom format backup uğurlu!${NC}"
else
    echo -e "${RED}❌ Custom format backup xətası!${NC}"
    exit 1
fi

# 2. SQL Format (text, oxunaqlı) - Manual edit üçün yaxşı
echo ""
echo -e "${GREEN}🔄 SQL format backup başladı...${NC}"
PGPASSWORD="$DB_PASSWORD" /usr/lib/postgresql/17/bin/pg_dump \
  -h "$DB_HOST" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --no-owner --no-acl \
  -f "$BACKUP_DIR/cvera_backup_${TIMESTAMP}.sql" 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ SQL format backup uğurlu!${NC}"
else
    echo -e "${RED}❌ SQL format backup xətası!${NC}"
    exit 1
fi

# Backup məlumatları
echo ""
echo -e "${BLUE}=== Backup Nəticəsi ===${NC}"
echo -e "${YELLOW}📁 Qovluq: $BACKUP_DIR${NC}"
echo ""
echo "📊 Yaradılmış fayllar:"
ls -lh "$BACKUP_DIR/cvera_backup_${TIMESTAMP}."*
echo ""
echo -e "${GREEN}💾 Ümumi həcm: $(du -sh $BACKUP_DIR | cut -f1)${NC}"

# Köhnə backup-ları təmizlə (30 gündən köhnə)
echo ""
echo -e "${YELLOW}🧹 30 gündən köhnə backup-lar təmizlənir...${NC}"
find "$BACKUP_DIR" -name "cvera_backup_*.backup" -mtime +30 -delete
find "$BACKUP_DIR" -name "cvera_backup_*.sql" -mtime +30 -delete
echo -e "${GREEN}✅ Təmizlik tamamlandı!${NC}"

echo ""
echo -e "${GREEN}🎉 Backup prosesi uğurla tamamlandı!${NC}"
