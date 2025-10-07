# Email Forwarding Setup - Florida Wedding Wonders
## Forward: hello@floridaweddingwonders.com → bennett.boundless@gmail.com

---

## ✅ Your Setup: Vercel DNS + ImprovMX (Free)

Since your domain uses Vercel DNS and you have no existing MX records, I recommend using **ImprovMX** for free email forwarding.

---

## 📋 Step-by-Step Instructions

### Step 1: Sign up for ImprovMX (2 minutes)

1. Go to https://improvmx.com
2. Click "Sign Up" (top right)
3. Use email: `bennett.boundless@gmail.com`
4. Create a password
5. Verify your email

### Step 2: Add Your Domain to ImprovMX (1 minute)

1. Once logged in, click **"Add Domain"**
2. Enter: `floridaweddingwonders.com`
3. Click **"Add Domain"**

### Step 3: Create Email Alias (1 minute)

1. In your ImprovMX dashboard, click on `floridaweddingwonders.com`
2. Click **"Add Alias"** or **"Create Forward"**
3. Fill in:
   - **Alias**: `hello` (or use `*` for catch-all)
   - **Forward to**: `bennett.boundless@gmail.com`
4. Click **"Save"** or **"Create"**

### Step 4: Add DNS Records to Vercel (5 minutes)

ImprovMX will show you the DNS records to add. Here they are:

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Click on your project or domains
   - Find `floridaweddingwonders.com`
   - Click **"DNS"** or **"DNS Records"** tab

2. **Add MX Record #1**
   - **Type**: MX
   - **Name**: @ (or leave blank)
   - **Value**: `mx1.improvmx.com`
   - **Priority**: 10
   - Click **"Add"** or **"Save"**

3. **Add MX Record #2**
   - **Type**: MX
   - **Name**: @ (or leave blank)
   - **Value**: `mx2.improvmx.com`
   - **Priority**: 20
   - Click **"Add"** or **"Save"**

4. **Add SPF Record (Recommended)**
   - **Type**: TXT
   - **Name**: @ (or leave blank)
   - **Value**: `v=spf1 include:spf.improvmx.com ~all`
   - Click **"Add"** or **"Save"**

### Step 5: Wait for DNS Propagation (5-30 minutes)

- DNS changes typically take 5-30 minutes
- Can take up to 24 hours in rare cases
- ImprovMX will show verification status

### Step 6: Test Email Forwarding (2 minutes)

1. **Send a test email**
   - From your phone or another email
   - To: `hello@floridaweddingwonders.com`
   - Subject: "Test forwarding"
   - Body: "Does this work?"

2. **Check your inbox**
   - Look in `bennett.boundless@gmail.com`
   - Check spam folder if not in inbox
   - Should arrive within seconds

---

## 🎯 What You'll Have After Setup

✅ **Email Forwarding**: hello@floridaweddingwonders.com → bennett.boundless@gmail.com  
✅ **Catch-All Option**: Can forward *@floridaweddingwonders.com if desired  
✅ **Reply-As**: Can reply from hello@ address (with Gmail SMTP setup)  
✅ **Unlimited Aliases**: Add support@, info@, venues@, etc. (all free)  
✅ **No Limits**: Free tier includes unlimited forwarding  

---

## 📧 Quick Access Links

- **ImprovMX Dashboard**: https://improvmx.com/dashboard
- **Vercel DNS Settings**: https://vercel.com/dashboard (→ Domains → floridaweddingwonders.com → DNS)
- **DNS Checker**: https://dnschecker.org (to verify records are live)

---

## 🔍 Troubleshooting

### Email not arriving?

1. **Check DNS propagation**
   ```bash
   dig MX floridaweddingwonders.com +short
   ```
   Should show:
   ```
   10 mx1.improvmx.com.
   20 mx2.improvmx.com.
   ```

2. **Check ImprovMX dashboard**
   - Should show "Domain verified" ✅
   - Check "Logs" section for incoming emails

3. **Check spam folder**
   - First emails may go to spam
   - Mark as "Not Spam" to train Gmail

4. **Wait longer**
   - DNS can take up to 24 hours
   - Try again in a few hours

### Want to reply AS hello@floridaweddingwonders.com?

ImprovMX provides SMTP settings for Gmail:

1. Gmail → Settings → Accounts
2. "Send mail as" → Add another email
3. Use ImprovMX SMTP credentials
4. Now you can send AND receive as hello@floridaweddingwonders.com

---

## 🚀 Optional: Add More Email Addresses

Once working, you can add more aliases (all forward to bennett.boundless@gmail.com):

- `info@floridaweddingwonders.com`
- `support@floridaweddingwonders.com`
- `venues@floridaweddingwonders.com`
- `*@floridaweddingwonders.com` (catch-all - receives ALL emails)

Just go to ImprovMX dashboard → Add Alias → Enter new alias

---

## ⚡ Quick Summary

1. Sign up at https://improvmx.com
2. Add domain: floridaweddingwonders.com
3. Create alias: hello → bennett.boundless@gmail.com
4. Add 2 MX records to Vercel DNS:
   - mx1.improvmx.com (priority 10)
   - mx2.improvmx.com (priority 20)
5. Wait 30 minutes
6. Test by emailing hello@floridaweddingwonders.com

---

**Need help?** Let me know which step you're on and I can guide you through it!
