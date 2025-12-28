# 🔧 Quick Start: Update Your .env File

## ⚠️ Action Required

Update your `.env` file to use the new universal variable names.

## 📝 Simple Changes (2 minutes)

### Option 1: Automatic (Linux/Mac/Git Bash)

```bash
# Backup your current .env
cp .env .env.backup

# Update variable names
sed -i 's/DATABASE_URL_NEON=/DATABASE_URL=/g' .env
sed -i 's/DATABASE_URL_NEON_DIRECT=/DATABASE_DIRECT_URL=/g' .env

# Restart server
pnpm run wdev
```

### Option 2: Manual (Windows or any OS)

Open your `.env` file and change these lines:

**Before:**

```env
DATABASE_URL_NEON=postgresql://neondb_owner:npg_e15KNFmgdZlU@ep-curly-forest-a1seab1t-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
DATABASE_URL_NEON_DIRECT=postgresql://neondb_owner:npg_e15KNFmgdZlU@ep-curly-forest-a1seab1t.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**After:**

```env
DATABASE_URL=postgresql://neondb_owner:npg_e15KNFmgdZlU@ep-curly-forest-a1seab1t-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
DATABASE_DIRECT_URL=postgresql://neondb_owner:npg_e15KNFmgdZlU@ep-curly-forest-a1seab1t.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### Optional: Add Connection Tuning Parameters

For better performance with NeonDB, add these query parameters to your `DATABASE_URL`:

```env
DATABASE_URL=postgresql://neondb_owner:npg_e15KNFmgdZlU@ep-curly-forest-a1seab1t-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&connect_timeout=10&pool_timeout=10&keepalives=1&keepalives_idle=30&keepalives_interval=10&keepalives_count=5
```

**Parameters added:**

- `connect_timeout=10` - Connection timeout (10 seconds)
- `pool_timeout=10` - Pool acquisition timeout (10 seconds)
- `keepalives=1` - Enable TCP keepalive
- `keepalives_idle=30` - Send keepalive every 30 seconds
- `keepalives_interval=10` - Retry interval between keepalives
- `keepalives_count=5` - Max retry attempts

### Optional: Add Environment Variables for Fine-Tuning

Add these to your `.env` for more control:

```env
# Connection Pool Settings
DB_POOL_MAX=20
DB_POOL_MIN=2
DB_POOL_IDLE_TIMEOUT=30000
DB_POOL_CONNECTION_TIMEOUT=10000

# Keepalive Settings (important for NeonDB)
DB_KEEPALIVE=true
DB_KEEPALIVE_DELAY=10000

# SSL Settings
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false

# PGVector Settings
PGVECTOR_TABLE=embeddings
PGVECTOR_DISTANCE_STRATEGY=cosine
```

## 🧪 Test Your Changes

1. **Stop the running server** (Ctrl+C)

2. **Restart server:**

   ```bash
   pnpm run wdev
   ```

3. **Check logs for:**

   ```
   ✅ Database connected successfully
   ✅ Connected to PGVector successfully!
   ```

4. **Test an API call:**

   ```bash
   curl http://localhost:8000/api/v1/health
   ```

## ❌ Troubleshooting

### Error: "Environment variable not found: DATABASE_URL"

**Solution:** You forgot to rename `DATABASE_URL_NEON` to `DATABASE_URL`

### Error: "Connection terminated unexpectedly"

**Solution:** Add keepalive parameters to your connection string (see above)

### Warning about preview features

**Solution:** Already fixed in `schema.prisma` - just restart

## ✅ Verification Checklist

- [ ] Backed up `.env` file
- [ ] Renamed `DATABASE_URL_NEON` → `DATABASE_URL`
- [ ] Renamed `DATABASE_URL_NEON_DIRECT` → `DATABASE_DIRECT_URL`
- [ ] (Optional) Added keepalive parameters
- [ ] (Optional) Added connection pool settings
- [ ] Restarted server
- [ ] Verified "Database connected successfully" in logs
- [ ] Tested API endpoints

## 🎯 What This Achieves

After this change:

- ✅ Your app works with **ANY PostgreSQL provider** (Neon, Supabase, Docker, AWS RDS, etc.)
- ✅ Switch providers by changing **ONE line** in `.env`
- ✅ **Zero code changes** required
- ✅ Production-ready with connection pooling
- ✅ Better performance with keepalive

## 📚 Next Steps

1. Read [REFACTORING_SUMMARY.md](./REFACTORING_SUMMARY.md) for full overview
2. Check [.env.template](../.env.template) for configuration examples
3. See [DATABASE_PROVIDER_MIGRATION_GUIDE.md](./DATABASE_PROVIDER_MIGRATION_GUIDE.md) to learn how to switch providers

---

**Estimated time:** 2 minutes  
**Risk:** Very low (just variable rename)  
**Rollback:** Use `.env.backup` if needed

---

*Last updated: December 28, 2025*
