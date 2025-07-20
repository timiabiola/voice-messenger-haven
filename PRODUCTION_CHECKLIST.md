# Production Deployment Checklist

## 🚨 CRITICAL SECURITY ITEMS 🚨

### 1. Remove Database Password from .env
**⚠️ BEFORE DEPLOYING TO PRODUCTION ⚠️**

The following line MUST be removed from the `.env` file:
```
SUPABASE_DB_PASSWORD=...
```

This password is temporarily added for local development migrations only and should NEVER be committed to version control or deployed to production.

### 2. Environment Variables to Review

Before production deployment, ensure these are properly set:
- [ ] Remove `SUPABASE_DB_PASSWORD` from `.env`
- [ ] Verify `APP_BASE_URL` points to production URL
- [ ] Ensure all API keys are using production values
- [ ] Confirm Supabase Edge Function secrets are set via CLI

### 3. Security Checks

- [ ] Run `git status` to ensure .env is not staged
- [ ] Check `.gitignore` includes `.env`
- [ ] Verify no hardcoded credentials in code
- [ ] Ensure all debug logging is disabled

### 4. Database Migrations

All migrations should be applied via Supabase Dashboard or CLI before deployment:
- [ ] All RLS policies are properly configured
- [ ] No test data in production database
- [ ] All functions have proper security settings

## How to Remove the Password

1. Open `.env` file
2. Delete the entire line containing `SUPABASE_DB_PASSWORD`
3. Save the file
4. Run `git status` to ensure .env is not tracked

## Why This Matters

- Database passwords in code are a major security risk
- If committed to git, the password is permanently in history
- Production deployments should use secure secret management
- Supabase CLI can use environment variables without storing them

---

**Last Updated**: January 20, 2025
**Added By**: Migration process for recipient access fix
**Must Remove Before**: ANY production deployment or git commit