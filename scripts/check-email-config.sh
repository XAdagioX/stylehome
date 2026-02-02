#!/usr/bin/env bash
# Check where form submissions are sent (owner email) and that no test email remains.
# Run from repo root: ./scripts/check-email-config.sh

set -e
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

echo "=== 1. Test email (m.khrapa@icloud.com) — має бути 0 згадок ==="
COUNT=$(grep -r "m\.khrapa@icloud\|m\.khrapa" --include="*.ts" --include="*.js" --include="*.yml" --include="*.yaml" --include="*.html" --include="*.env*" . 2>/dev/null | grep -v "Binary" | wc -l)
if [ "$COUNT" -eq 0 ]; then
  echo "OK: згадок m.khrapa@icloud.com не знайдено."
else
  echo "УВАГА: знайдено $COUNT згадок тестової пошти:"
  grep -rn "m\.khrapa@icloud\|m\.khrapa" --include="*.ts" --include="*.js" --include="*.yml" --include="*.yaml" --include="*.html" . 2>/dev/null || true
fi

echo ""
echo "=== 2. Куди йде форма (recipient) ==="
echo "Одержувач листів задається тільки на бекенді:"
echo "  - змінна середовища: ADMIN_EMAIL"
echo "  - за замовчуванням у application-prod.yml: stylehomesusa@icloud.com"
grep -n "admin:" backend/src/main/resources/application-prod.yml 2>/dev/null || true
grep -n "adminEmail\|setTo(adminEmail)" backend/src/main/java/com/stylehomes/service/EmailService.java 2>/dev/null || true

echo ""
echo "=== 3. Frontend (JS) ==="
echo "JS лише відправляє POST на /api/consultations. Одержувача не задає — це робить сервер."
grep -n "api/consultations" src/modules/form.ts 2>/dev/null || true

echo ""
echo "=== 4. Поточна конфігурація на сервері (якщо скрипт запущено на VPS) ==="
if [ -f /opt/stylehomes/.env ]; then
  echo "ADMIN_EMAIL та MAIL_* з /opt/stylehomes/.env:"
  grep -E "ADMIN_EMAIL|MAIL_FROM|MAIL_USERNAME" /opt/stylehomes/.env 2>/dev/null || echo "(немає доступу)"
else
  echo "Файл /opt/stylehomes/.env не знайдено (скрипт не на сервері)."
  echo "На сервері перевір: grep ADMIN_EMAIL /opt/stylehomes/.env"
fi

echo ""
echo "=== Готово ==="
