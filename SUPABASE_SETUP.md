# Supabase Setup Instructions for Florida Wedding Wonders

## 🎯 **Database Setup Required**

You need to run the database schema in your Supabase dashboard to create the tables.

### **Step 1: Access Supabase Dashboard**
1. Go to: https://supabase.com/dashboard/projects
2. Click on your "florida-wedding-wonders" project
3. Go to "SQL Editor" in the left sidebar

### **Step 2: Run Schema**
1. Click "New Query" 
2. Copy the entire contents of `database/schema.sql`
3. Paste it into the SQL editor
4. Click "Run" to create all tables and policies

### **Step 3: Set Up Storage**
1. Go to "Storage" in the left sidebar
2. Click "Create a new bucket"
3. Create bucket named: `venue-photos`
4. Make it **public** (for website display)
5. Create another bucket: `user-uploads` (private)

### **Step 4: Test the Setup**
1. Start your dev server: `npm run dev`
2. Go to: http://localhost:3000/coming-soon
3. Submit an email to test database connection
4. Check Supabase dashboard > "Table Editor" > "email_subscribers"

## 🔐 **Get Service Role Key (Optional)**

For admin operations, you may need the Service Role key:
1. Go to Settings > API in your Supabase dashboard
2. Copy the "service_role" key
3. Add to `.env.local`: `SUPABASE_SERVICE_ROLE_KEY=your-service-key`

## 📊 **Next Steps After Database Setup**

1. **Migrate Venue Data**: Import your 130 venues from JSON to Supabase
2. **Test Photo Uploads**: Set up venue photo management
3. **Deploy to Production**: Connect to your domain
4. **Set Up Authentication**: Enable venue owner logins

## ⚡ **Quick Test**

After running the schema, test the coming soon page:
- Visit: http://localhost:3000/coming-soon
- Submit an email as a venue owner
- Check if it appears in your Supabase dashboard

## 🚨 **Important**

Make sure to:
- Keep your database password secure: `A8cDXcAN@9m2xkt`
- Don't commit `.env.local` to git
- Run the schema SQL before testing the app

The database schema includes:
- ✅ venues table (for your 130 venues)
- ✅ venue_claims table (for ownership claims)
- ✅ email_subscribers table (for coming soon page)
- ✅ Proper indexes for performance
- ✅ Row-level security policies
- ✅ Automatic timestamp updates
