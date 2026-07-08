#!/usr/bin/env bash
set -e

echo "=== Pushing database schema ==="
npx prisma db push --skip-generate

echo "=== Checking if seed is needed ==="
ADMIN_COUNT=$(node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.user.count().then(c=>{console.log(c);process.exit()})" 2>/dev/null || echo "0")

if [ "$ADMIN_COUNT" = "0" ]; then
  echo "=== No users found. Running seed... ==="
  npx tsx prisma/seed.ts
else
  echo "=== Users exist. Skipping seed. ==="
fi

echo "=== Starting server ==="
exec node dist/server.js
