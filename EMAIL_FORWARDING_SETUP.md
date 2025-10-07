# Email Forwarding Setup Guide

## 🎯 Goal: Forward hello@floridaweddingwonders.com → bennett.boundless@gmail.com

There are several methods to set up email forwarding. Choose the one that works best for your domain registrar:

---

## Method 1: Using Resend Email Forwarding (Recommended - Free)

Resend now offers email forwarding as part of their service. This is the easiest option if you're already using Resend for sending emails.

### Steps:

1. **Login to Resend Dashboard**
   - Go to https://resend.com/dashboard

2. **Navigate to Email Forwarding**
   - Click on your domain: `floridaweddingwonders.com`
   - Look for "Email Forwarding" or "Receiving" section

3. **Add Forward Rule**
   - From: `hello@floridaweddingwonders.com`
   - To: `bennett.boundless@gmail.com`
   - Save

4. **Add Required DNS Records**
   Resend will provide MX records for receiving emails. Add these to your DNS:
   ```
   Type: MX
   Name: @
   Value: mx1.resend.com
   Priority: 10
   
   Type: MX
   Name: @
   Value: mx2.resend.com
   Priority: 20
   ```

---

## Method 2: Using ImprovMX (Free Email Forwarding)

ImprovMX is a free email forwarding service that's simple and reliable.

### Steps:

1. **Sign up at ImprovMX**
   - Go to https://improvmx.com
   - Create free account

2. **Add Your Domain**
   - Add domain: `floridaweddingwonders.com`

3. **Create Alias**
   - Alias: `hello@floridaweddingwonders.com`
   - Forward to: `bennett.boundless@gmail.com`

4. **Add DNS Records**
   Add these MX records to your domain's DNS:
   ```
   Type: MX
   Name: @
   Value: mx1.improvmx.com
   Priority: 10
   
   Type: MX
   Name: @
   Value: mx2.improvmx.com
   Priority: 20
   ```

5. **Add SPF Record (Optional but Recommended)**
   ```
   Type: TXT
   Name: @
   Value: v=spf1 include:spf.improvmx.com ~all
   ```

---

## Method 3: Using Cloudflare Email Routing (Free)

If you're using Cloudflare for DNS (many Vercel domains do), this is built-in and free.

### Steps:

1. **Login to Cloudflare**
   - Go to https://dash.cloudflare.com
   - Select your domain

2. **Navigate to Email Routing**
   - Click "Email" in the left sidebar
   - Or go to the "Email" tab

3. **Enable Email Routing**
   - Click "Enable Email Routing"
   - Cloudflare will automatically add required DNS records

4. **Create Routing Rule**
   - Custom address: `hello`
   - Destination: `bennett.boundless@gmail.com`
   - Action: Forward
   - Save

5. **Verify Destination Email**
   - Check `bennett.boundless@gmail.com` inbox
   - Click verification link from Cloudflare

---

## Method 4: Using Your Domain Registrar

Most domain registrars offer email forwarding. Here's how for common providers:

### **If using Namecheap:**

1. Login to Namecheap
2. Domain List → Manage → Mail Settings
3. Email Forwarding → Add Forwarder
4. Mailbox: `hello`
5. Forward to: `bennett.boundless@gmail.com`
6. Save

### **If using GoDaddy:**

1. Login to GoDaddy
2. My Products → Email & Office → Manage
3. Email Forwarding → Create Forward
4. Forward emails from: `hello@floridaweddingwonders.com`
5. Forward to: `bennett.boundless@gmail.com`
6. Save

### **If using Google Domains:**

1. Login to Google Domains
2. Select domain → Email
3. Email forwarding → Add email alias
4. Alias: `hello`
5. Forward to: `bennett.boundless@gmail.com`

---

## Where to Add DNS Records

Your domain is likely managed by one of these:

### **Option A: Vercel DNS**
1. Go to https://vercel.com/dashboard
2. Domains → floridaweddingwonders.com
3. DNS Records tab
4. Add the MX records from whichever method you chose above

### **Option B: Domain Registrar**
Check where you purchased floridaweddingwonders.com:
- Namecheap: Advanced DNS tab
- GoDaddy: DNS Management
- Google Domains: DNS settings

---

## How to Check Your Current DNS Setup

Run this command to see where your domain's DNS is managed:

```bash
dig NS floridaweddingwonders.com +short
```

Or check online:
- https://dnschecker.org
- Search for: `floridaweddingwonders.com`
- Record type: `NS` (nameservers)

---

## Testing Email Forwarding

After setup (wait 5-30 minutes for DNS propagation):

1. **Send test email**
   - From any email account
   - To: hello@floridaweddingwonders.com
   - Subject: "Test forwarding"

2. **Check destination**
   - Look in bennett.boundless@gmail.com inbox
   - Also check spam folder just in case

3. **Troubleshoot if needed**
   - Verify DNS records are correct: https://dnschecker.org
   - Check SPF/DKIM records if emails go to spam
   - Wait longer (DNS can take up to 24 hours)

---

## Recommended Solution

**I recommend Method 3 (Cloudflare Email Routing) because:**
- ✅ Free forever
- ✅ No signup needed if already using Cloudflare
- ✅ Automatic DNS configuration
- ✅ Unlimited forwarding addresses
- ✅ Built-in spam protection
- ✅ Email routing rules and filters

**If not using Cloudflare, use Method 2 (ImprovMX):**
- ✅ Simple and reliable
- ✅ Free tier is generous
- ✅ Easy setup
- ✅ Good documentation

---

## Current DNS Setup Needed

To find out which method will work best for you, first check:

```bash
# Check your current nameservers
dig NS floridaweddingwonders.com +short

# Check if you have existing MX records
dig MX floridaweddingwonders.com +short
```

Share the results and I can tell you exactly which method to use!

---

## Next Steps

1. Choose a method (I recommend Cloudflare or ImprovMX)
2. Add the DNS records
3. Wait 5-30 minutes for propagation
4. Test by sending an email to hello@floridaweddingwonders.com
5. Confirm it arrives at bennett.boundless@gmail.com

---

## Important Notes

⚠️ **If you already have MX records** (for sending emails via Resend):
- You'll need to decide: forwarding OR sending, not both from the same service
- Best practice: Use Resend for *sending* (noreply@) and ImprovMX/Cloudflare for *receiving* (hello@)
- Keep separate MX records for each subdomain if needed

📧 **For a complete email solution**:
- **Sending** (automated emails): Use Resend with `noreply@floridaweddingwonders.com`
- **Receiving** (customer emails): Use ImprovMX/Cloudflare with `hello@floridaweddingwonders.com`
- This way you have both sending and receiving working properly!
