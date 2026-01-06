# Universal Database Configuration - Architecture & Best Practices

## 🎯 Design Philosophy

This configuration follows **12-Factor App methodology** and **Cloud Native best practices**:

1. ✅ **Store config in environment** - No hard-coded values
2. ✅ **Strict separation of config and code** - Switch providers without code changes
3. ✅ **Portable across environments** - Dev, staging, production use same codebase
4. ✅ **Provider-agnostic** - Works with any PostgreSQL provider
5. ✅ **Production-ready** - Connection pooling, error handling, graceful shutdown

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  (NestJS Controllers, Services, Repositories)                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Prisma Client Layer                        │
│  • Connection Pooling (Built-in)                            │
│  • Query Builder                                             │
│  • Type Safety                                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Configuration Layer (env.config.ts)             │
│  • Environment-driven                                        │
│  • Type-safe configuration                                   │
│  • Validation (optional)                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
       ┌─────────────┴─────────────┐
       ▼                           ▼
┌──────────────────┐    ┌──────────────────────┐
│  DATABASE_URL    │    │ PGVector Config      │
│  (Primary)       │    │ (pg.config.ts)       │
└────────┬─────────┘    └──────────┬───────────┘
         │                         │
         ▼                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  PostgreSQL Database                         │
│  Providers: Neon | Supabase | Docker | AWS | GCP | Azure    │
│  Extensions: pgvector                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 File Structure

```
backend-chatnary-nestjs/
├── src/
│   ├── config/
│   │   ├── env.config.ts       # 🔧 Central environment configuration
│   │   └── pg.config.ts        # 🔧 PGVector-specific configuration
│   │
│   ├── prisma/
│   │   └── prisma.service.ts   # 🔌 Prisma Client with lifecycle hooks
│   │
│   └── ...
│
├── prisma/
│   └── schema.prisma           # 📋 Database schema (provider-agnostic)
│
├── .env                        # 🔐 Environment variables (gitignored)
├── .env.template               # 📝 Template with all provider examples
│
└── _docs_BE/
    ├── DATABASE_PROVIDER_MIGRATION_GUIDE.md
    ├── NEON_DB_CONNECTION_GUIDE.md
    └── DATABASE_BEST_PRACTICES.md (this file)
```

---

## 🔧 Configuration Layers

### Layer 1: Environment Variables (.env)

**Purpose:** Store sensitive credentials and provider-specific settings

```env
# Minimal required configuration
DATABASE_URL=postgresql://user:pass@host:5432/db

# Advanced configuration (optional)
DB_POOL_MAX=20
DB_KEEPALIVE=true
```

**Best Practices:**

- ✅ Never commit `.env` to git
- ✅ Use `.env.template` as documentation
- ✅ Validate required variables on startup
- ✅ Use strong passwords (32+ characters)
- ✅ Rotate credentials regularly

### Layer 2: Configuration Files (src/config/)

**env.config.ts** - Central configuration hub

```typescript
export const envConfig = () => ({
  database: {
    url: process.env.DATABASE_URL,        // Required
    directUrl: process.env.DATABASE_DIRECT_URL,  // Optional
    pooling: {
      max: parseInt(process.env.DB_POOL_MAX || '20'),
      // ... other pool settings
    },
  },
  // ... other configs
});
```

**pg.config.ts** - PGVector-specific configuration

```typescript
const getDatabaseConfig = (): PoolConfig => {
  // Auto-detect from DATABASE_URL or fall back to individual params
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL, /* ... */ };
  }
  return { host: process.env.POSTGRES_HOST, /* ... */ };
};
```

**Benefits:**

- ✅ Type-safe configuration
- ✅ Default values
- ✅ Auto-detection of provider features
- ✅ Centralized configuration logic

### Layer 3: Prisma Client (src/prisma/prisma.service.ts)

**Purpose:** Database connection lifecycle management

```typescript
@Injectable()
export class PrismaService 
  extends PrismaClient 
  implements OnModuleInit, OnModuleDestroy {
  
  async onModuleInit() {
    await this.$connect();
    console.log('✅ Database connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('Database disconnected');
  }
}
```

**Benefits:**

- ✅ Graceful connection handling
- ✅ Automatic cleanup on shutdown
- ✅ Error logging
- ✅ Health check support

---

## 🎨 Design Patterns Used

### 1. **Configuration Pattern**

- Environment-driven configuration
- Separation of concerns
- Type-safe configuration objects

### 2. **Factory Pattern**

```typescript
const getDatabaseConfig = (): PoolConfig => {
  // Factory creates appropriate config based on environment
}
```

### 3. **Service Locator Pattern**

```typescript
constructor(private config: ConfigService) {
  // Service locator for configuration
}
```

### 4. **Lifecycle Hooks Pattern**

```typescript
class PrismaService implements OnModuleInit, OnModuleDestroy {
  // Proper resource lifecycle management
}
```

---

## ✅ Best Practices Implementation

### 1. **Connection Pooling**

**Why:** Reuse connections instead of creating new ones for each query

**Implementation:**

```typescript
// Automatic via Prisma Client
// Configurable via environment variables
DB_POOL_MAX=20
DB_POOL_MIN=2
```

**Benefits:**

- ⚡ Faster query execution
- 💰 Lower resource usage
- 📊 Better scalability

### 2. **Keepalive for Cloud Databases**

**Why:** Prevent idle connection termination (NeonDB, Supabase)

**Implementation:**

```typescript
keepAlive: process.env.DB_KEEPALIVE === 'true',
keepAliveInitialDelayMillis: parseInt(process.env.DB_KEEPALIVE_DELAY || '10000'),
```

**When to use:**

- ✅ NeonDB (prevent auto-suspend)
- ✅ Supabase
- ✅ AWS RDS (with idle timeout)
- ❌ Docker (local development)

### 3. **SSL/TLS Configuration**

**Implementation:**

```typescript
ssl: databaseUrl.includes('sslmode=require') || process.env.DB_SSL === 'true'
  ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
  : undefined
```

**Best Practices:**

- ✅ Always use SSL in production
- ✅ Verify certificates in production (`rejectUnauthorized: true`)
- ⚠️ Allow self-signed certs only in development

### 4. **Graceful Shutdown**

**Implementation:**

```typescript
async onModuleDestroy() {
  await this.$disconnect();
  console.log('Database disconnected');
}
```

**Benefits:**

- ✅ Complete in-flight queries
- ✅ Proper connection cleanup
- ✅ No connection leaks
- ✅ Clean restart

### 5. **Error Handling**

**Implementation:**

```typescript
try {
  await prisma.user.create({ data });
} catch (error) {
  if (error.code === 'P2024') {
    // Connection timeout - implement retry logic
  }
  throw error;
}
```

### 6. **Health Checks**

**Implementation:**

```typescript
@Get('health')
async healthCheck() {
  try {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', database: 'connected' };
  } catch (error) {
    return { status: 'unhealthy', database: 'disconnected' };
  }
}
```

---

## 🔒 Security Best Practices

### 1. **Credential Management**

```bash
# ❌ Bad
DATABASE_URL=postgresql://admin:123456@...

# ✅ Good
DATABASE_URL=postgresql://admin:$(openssl rand -base64 32)@...
```

### 2. **Environment Isolation**

```bash
# Development
DATABASE_URL=postgresql://localhost:5432/dev

# Staging
DATABASE_URL=${STAGING_DATABASE_URL}

# Production
DATABASE_URL=${PROD_DATABASE_URL}
```

### 3. **Least Privilege**

```sql
-- Create app-specific user with limited permissions
CREATE USER app_user WITH PASSWORD 'secure_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
-- Don't grant DROP, TRUNCATE, or superuser privileges
```

### 4. **Connection String Security**

```typescript
// ❌ Never log connection strings
console.log(process.env.DATABASE_URL);

// ✅ Redact sensitive info
console.log('Connected to:', url.replace(/:\/\/.*@/, '://***:***@'));
```

---

## 📊 Performance Optimization

### 1. **Query Optimization**

```typescript
// ❌ Bad: N+1 query problem
const users = await prisma.user.findMany();
for (const user of users) {
  const posts = await prisma.post.findMany({ where: { userId: user.id } });
}

// ✅ Good: Single query with include
const users = await prisma.user.findMany({
  include: { posts: true }
});
```

### 2. **Connection Pool Sizing**

```
Recommended formula:
pool_size = (number_of_cpu_cores * 2) + effective_spindle_count

Examples:
- Serverless (Lambda, Vercel): 5-10
- Container (1 CPU): 4-8
- VM (4 CPUs): 10-20
```

### 3. **Index Optimization**

```prisma
model Document {
  id        String   @id @default(uuid())
  userId    String   
  createdAt DateTime @default(now())
  
  @@index([userId])           // Index for queries by user
  @@index([userId, createdAt]) // Composite index for sorting
}
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
describe('PrismaService', () => {
  it('should connect on module init', async () => {
    const service = new PrismaService(configService);
    await expect(service.onModuleInit()).resolves.not.toThrow();
  });
});
```

### Integration Tests

```typescript
describe('Database Integration', () => {
  beforeAll(async () => {
    // Use test database
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
  });
  
  it('should perform CRUD operations', async () => {
    const user = await prisma.user.create({ data: { email: 'test@test.com' } });
    expect(user.id).toBeDefined();
  });
});
```

---

## 📈 Monitoring & Observability

### Metrics to Track

- Connection pool utilization
- Query duration (p50, p95, p99)
- Error rate
- Connection errors
- Slow queries (> 1s)

### Logging Best Practices

```typescript
// Prisma logging configuration
new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
});

// Custom query logging
prisma.$on('query', (e) => {
  if (e.duration > 1000) {
    console.warn('Slow query detected:', e.query);
  }
});
```

---

## 🚀 Deployment Checklist

### Pre-deployment

- [ ] Environment variables configured
- [ ] SSL enabled in production
- [ ] Connection pooling optimized
- [ ] Migrations tested
- [ ] Health check endpoint working
- [ ] Error handling implemented
- [ ] Logging configured

### Post-deployment

- [ ] Monitor connection pool usage
- [ ] Check error logs
- [ ] Verify query performance
- [ ] Test failover scenarios
- [ ] Validate backup strategy

---

## 🔄 Migration Checklist

When switching database providers:

1. [ ] Backup current database
2. [ ] Update `.env` with new credentials
3. [ ] Test connection locally
4. [ ] Run migrations
5. [ ] Verify data integrity
6. [ ] Update monitoring/alerts
7. [ ] Test application end-to-end
8. [ ] Deploy to staging
9. [ ] Deploy to production
10. [ ] Monitor for 24 hours

---

## 📚 Additional Resources

- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [PostgreSQL Connection Pooling](https://www.postgresql.org/docs/current/runtime-config-connection.html)
- [12-Factor App Methodology](https://12factor.net/)
- [NestJS Configuration](https://docs.nestjs.com/techniques/configuration)

---

**Last updated:** December 28, 2025
