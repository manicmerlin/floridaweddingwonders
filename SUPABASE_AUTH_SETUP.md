# Set Up Supabase Authentication - Manual Steps

Since we can't execute SQL via the REST API, you'll need to run the SQL manually in the Supabase dashboard.

## Steps:

### 1. Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project: `aflrmpkolumpjhpaxblz`
3. Click on "SQL Editor" in the left sidebar

### 2. Copy and Execute the SQL

Copy the entire contents of `database/users-schema.sql` and paste it into the SQL Editor, then click "Run".

### 3. Verify Tables Were Created

After running the SQL, go to "Table Editor" and verify you see these new tables:
- `users`
- `user_profiles`
- `user_favorites`

### 4. Test the Functions

In the SQL Editor, you can test that the functions work:

```sql
-- Test registration function
SELECT * FROM register_user(
  'test@example.com'::TEXT,
  'testpassword123'::TEXT,
  'Test User'::TEXT,
  'guest'::TEXT
);

-- Test authentication function
SELECT * FROM authenticate_user(
  'test@example.com'::TEXT,
  'testpassword123'::TEXT
);
```

### 5. Quick Alternative - Use Supabase Auth (Recommended)

Instead of managing authentication ourselves, we can use Supabase's built-in authentication which is more secure and battle-tested:

**Benefits:**
- Email verification handled automatically
- Password reset flows built-in
- Social OAuth (Google, Facebook, etc.)
- JWT tokens managed securely
- No need to manually hash passwords

Would you like me to set up Supabase Auth instead? It's much simpler and more secure!

## Current Status

✅ SQL schema created in `/database/users-schema.sql`
✅ Authentication utility created in `/src/lib/supabaseAuth.ts`
⏳ Waiting for SQL to be executed in Supabase dashboard

OR

🔄 Ready to switch to Supabase Auth (recommended)
