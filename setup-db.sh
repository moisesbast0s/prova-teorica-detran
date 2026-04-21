#!/bin/bash
# Script de setup do banco PostgreSQL para o DETRAN Quiz
# Execute: sudo bash setup-db.sh

echo "🐘 Configurando PostgreSQL para DETRAN Quiz..."

# Criar role se não existir
sudo -u postgres psql -c "DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'moises') THEN
    CREATE ROLE moises WITH LOGIN SUPERUSER;
    RAISE NOTICE 'Role moises criado.';
  ELSE
    RAISE NOTICE 'Role moises já existe.';
  END IF;
END \$\$;"

# Criar banco se não existir
sudo -u postgres psql -c "SELECT 1 FROM pg_database WHERE datname='detran_quiz'" | grep -q 1 || \
  sudo -u postgres createdb detran_quiz -O moises

echo "✅ Banco de dados configurado!"
echo ""
echo "Agora execute:"
echo "  npx prisma migrate dev --name init"
echo "  npx prisma db seed"
