# Database Provider Migration Guide

## Overview

The application now supports **universal PostgreSQL configuration**, allowing you to switch between different database providers without code changes. Simply update your environment variables.

## Supported Database Providers

### ✅ Fully Tested & Supported

- **NeonDB** - Serverless PostgreSQL
- **Supabase** - PostgreSQL as a Service  
- **Docker PostgreSQL** - Self-hosted
- **AWS RDS** - Managed PostgreSQL
- **Google Cloud SQL** - Managed PostgreSQL
- **Azure Database for PostgreSQL**
- **Any PostgreSQL 14+** with pgvector extension

---

## Quick Start Migration Guides

### 1️⃣ **Currently using NeonDB → Stay on NeonDB**

**No changes needed!** Just update your `.env`:

```env
# From old format:
DATABASE_URL_NEON=postgresql://...

# To new universal format:
DATABASE_URL=postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require&connect_timeout=10&keepalives=1&keepalives_idle=30
DATABASE_DIRECT_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require

# Recommended settings:
DB_POOL_MAX=20
DB_POOL_MIN=2
DB_KEEPALIVE=true
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
```

---

### 2️⃣ **NeonDB → Supabase**

**Steps:**

1. **Create Supabase Project**
   - Go to <https://supabase.com/dashboard>
   - Create new project
   - Wait for provisioning (~2 minutes)

2. **Enable pgvector extension**

   ```sql
   -- Run in Supabase SQL Editor
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

3. **Update `.env`**

   ```env
   # Pooled connection (for app queries)
   DATABASE_URL=postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
   
   # Direct connection (for migrations)
   DATABASE_DIRECT_URL=postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres
   
   DB_POOL_MAX=10
   DB_POOL_MIN=2
   DB_KEEPALIVE=true
   DB_SSL=true
   DB_SSL_REJECT_UNAUTHORIZED=false
   ```

4. **Migrate data** (if needed)

   ```bash
   # Option A: Export from Neon, Import to Supabase
   pg_dump $OLD_DATABASE_URL > backup.sql
   psql $NEW_DATABASE_URL < backup.sql
   
   # Option B: Use Prisma
   pnpm prisma db push
   ```

5. **Run migrations**

   ```bash
   pnpm prisma migrate deploy
   ```

---

### 3️⃣ **NeonDB → Docker (Self-Hosted)**

**Steps:**

1. **Create `docker-compose.yml`** (if not exists)

   ```yaml
   version: '3.9'
   services:
     db:
       image: pgvector/pgvector:pg16
       container_name: chatnary-db
       environment:
         POSTGRES_DB: chatnary
         POSTGRES_USER: postgres
         POSTGRES_PASSWORD: your-secure-password
       ports:
         - "5432:5432"
       volumes:
         - postgres_data:/var/lib/postgresql/data
       healthcheck:
         test: ["CMD-SHELL", "pg_isready -U postgres"]
         interval: 5s
         timeout: 3s
         retries: 10
   
   volumes:
     postgres_data:
   ```

2. **Start Docker**

   ```bash
   docker-compose up -d
   ```

3. **Update `.env`**

   ```env
   DATABASE_URL=postgresql://postgres:your-secure-password@localhost:5432/chatnary
   
   # Optional: individual parameters (legacy support)
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_DB=chatnary
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=your-secure-password
   
   DB_POOL_MAX=20
   DB_POOL_MIN=5
   DB_KEEPALIVE=false  # Not needed for local
   ```

4. **Run migrations**

   ```bash
   pnpm prisma migrate deploy
   ```

---

### 4️⃣ **NeonDB → AWS RDS**

**Steps:**

1. **Create RDS Instance**
   - Engine: PostgreSQL 16+
   - Enable public access (or use VPC)
   - Security group: Allow port 5432

2. **Enable pgvector**

   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

3. **Update `.env`**

   ```env
   DATABASE_URL=postgresql://username:password@your-instance.region.rds.amazonaws.com:5432/dbname?sslmode=require
   DATABASE_DIRECT_URL=postgresql://username:password@your-instance.region.rds.amazonaws.com:5432/dbname?sslmode=require
   
   DB_SSL=true
   DB_SSL_REJECT_UNAUTHORIZED=true
   DB_POOL_MAX=25
   DB_KEEPALIVE=true
   ```

---

## Configuration Reference

### Environment Variables Explained

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | Primary connection string (pooled) | - | ✅ Yes |
| `DATABASE_DIRECT_URL` | Direct connection for migrations | - | Optional* |
| `DB_POOL_MAX` | Max connections in pool | 20 | No |
| `DB_POOL_MIN` | Min connections to maintain | 2 | No |
| `DB_POOL_IDLE_TIMEOUT` | Close idle connections after (ms) | 30000 | No |
| `DB_POOL_CONNECTION_TIMEOUT` | Connection timeout (ms) | 10000 | No |
| `DB_KEEPALIVE` | Enable TCP keepalive | false | No |
| `DB_KEEPALIVE_DELAY` | Initial keepalive delay (ms) | 10000 | No |
| `DB_SSL` | Enable SSL/TLS | auto-detect | No |
| `DB_SSL_REJECT_UNAUTHORIZED` | Reject self-signed certs | true | No |

**Required for Neon, Supabase (pooled connections)*

### Provider-Specific Recommendations

#### 🟢 NeonDB

```env
DB_POOL_MAX=20
DB_KEEPALIVE=true          # Prevent auto-suspend
DB_SSL=true
```

#### 🟢 Supabase

```env
DB_POOL_MAX=10             # Lower due to Supabase limits
DB_KEEPALIVE=true
DB_SSL=true
```

#### 🟢 Docker (Local)

```env
DB_POOL_MAX=20
DB_KEEPALIVE=false         # Not needed
DB_SSL=false              # Not needed locally
```

#### 🟢 AWS RDS / Cloud SQL

```env
DB_POOL_MAX=25
DB_KEEPALIVE=true
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
```

---

## Troubleshooting

### "Connection terminated unexpectedly"

**Solution:** Enable keepalive

```env
DB_KEEPALIVE=true
DB_KEEPALIVE_DELAY=10000
```

### "Too many connections"

**Solution:** Reduce pool size or use pooled connection

```env
DB_POOL_MAX=10
# Or use pooled connection string (-pooler)
```

### "SSL connection required"

**Solution:** Enable SSL in connection string

```env
DATABASE_URL=...?sslmode=require
DB_SSL=true
```

### "Timeout acquiring connection"

**Solution:** Increase timeout or pool size

```env
DB_POOL_CONNECTION_TIMEOUT=20000
DB_POOL_MAX=30
```

---

## Data Migration Strategies

### Strategy 1: Dump & Restore (Recommended)

```bash
# 1. Dump from source
pg_dump $SOURCE_DATABASE_URL > backup.sql

# 2. Restore to destination
psql $DESTINATION_DATABASE_URL < backup.sql

# 3. Verify
psql $DESTINATION_DATABASE_URL -c "SELECT COUNT(*) FROM embeddings;"
```

### Strategy 2: Prisma Migrate

```bash
# 1. Update .env with new DATABASE_URL
# 2. Push schema
pnpm prisma db push

# 3. Seed data (if needed)
pnpm prisma db seed
```

### Strategy 3: Live Replication (Zero Downtime)

Use PostgreSQL logical replication for production migrations.
[See Neon Migration Guide](https://neon.tech/docs/import/import-from-postgres)

---

## Best Practices

### ✅ DO

- Use connection pooling for serverless (Neon, Supabase)
- Enable keepalive for cloud databases
- Use SSL in production
- Monitor connection pool usage
- Set appropriate pool sizes based on workload
- Use `DATABASE_DIRECT_URL` for migrations

### ❌ DON'T

- Hard-code database credentials
- Use direct connections for app queries (use pooled)
- Disable SSL in production
- Set pool size too high (wastes resources)
- Forget to enable pgvector extension
- Run migrations over pooled connections (Neon only)

---

## Performance Tuning

### Connection Pool Sizing

**Formula:**

```
pool_size = (core_count * 2) + effective_spindle_count
```

**Examples:**

- **Serverless (Vercel, Lambda):** 5-10 connections
- **Container (Docker):** 20-50 connections
- **VM (4 cores):** 10-20 connections

### Query Optimization

```typescript
// Bad: N+1 queries
for (const doc of documents) {
  await prisma.embedding.findMany({ where: { documentId: doc.id } });
}

// Good: Single query with join
const docs = await prisma.document.findMany({
  include: { embeddings: true }
});
```

---

## Testing Different Providers

### Local Testing Matrix

```bash
# 1. Test with Docker (local)
DATABASE_URL=postgresql://postgres:password@localhost:5432/test pnpm test

# 2. Test with Neon (staging)
DATABASE_URL=$NEON_STAGING_URL pnpm test

# 3. Test with Supabase (production)
DATABASE_URL=$SUPABASE_PROD_URL pnpm test
```

---

## CI/CD Configuration

### GitHub Actions Example

```yaml
env:
  # Use secrets for production
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  DATABASE_DIRECT_URL: ${{ secrets.DATABASE_DIRECT_URL }}
  
  # Or use matrix for multi-provider testing
  matrix:
    db-provider: [neon, supabase, postgres]
```

---

## Support & Resources

- **Neon:** <https://neon.tech/docs>
- **Supabase:** <https://supabase.com/docs/guides/database>
- **Prisma:** <https://www.prisma.io/docs>
- **pgvector:** <https://github.com/pgvector/pgvector>

---

**Last updated:** December 28, 2025
