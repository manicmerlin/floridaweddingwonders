# Domain Email Setup Guide - Florida Wedding Wonders

## 🎯 Goal: Use noreply@floridaweddingwonders.com for Professional Email Delivery

### Step 1: Add Domain to Resend (5 minutes)

1. **Login to Resend Dashboard**: https://resend.com/dashboard
2. **Navigate to Domains**: Click "Domains" in the left sidebar
3. **Add New Domain**: Click "Add Domain" button
4. **Enter Domain**: Type `floridaweddingwonders.com`
5. **Click "Add Domain"**

### Step 2: Add DNS Records to Your Domain (10 minutes)

Resend will provide you with DNS records to add. You'll need to add these to your domain registrar (where you bought floridaweddingwonders.com):

#### **Required DNS Records:**
```
Type: MX
Name: @
Value: feedback-smtp.us-east-1.amazonses.com
Priority: 10

Type: TXT  
Name: @
Value: "v=spf1 include:amazonses.com ~all"

Type: CNAME
Name: [unique-identifier]._domainkey
Value: [resend-provided-value].dkim.amazonses.com

Type: CNAME
Name: [unique-identifier2]._domainkey  
Value: [resend-provided-value2].dkim.amazonses.com

Type: CNAME
Name: [unique-identifier3]._domainkey
Value: [resend-provided-value3].dkim.amazonses.com
```

#### **Where to Add DNS Records:**

**If using Vercel Domains:**
1. Go to Vercel Dashboard → Domains
2. Click on floridaweddingwonders.com
3. Go to DNS Records tab
4. Add each record above

**If using Namecheap:**
1. Login to Namecheap
2. Manage → Domain List → floridaweddingwonders.com
3. Advanced DNS tab
4. Add each record

**If using GoDaddy:**
1. Login to GoDaddy
2. My Products → DNS
3. Add records

### Step 3: Verify Domain in Resend (1-24 hours)

1. **Wait for DNS Propagation**: Can take 1-24 hours
2. **Click "Verify" in Resend Dashboard**
3. **Check Status**: Should show "Verified" with green checkmark

### Step 4: Test Email Sending

Once verified, test with our script:

```bash
cd /Users/bennettbonta/SoFloWeddingVenues
node -e "
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

async function testDomain() {
  try {
    const result = await resend.emails.send({
      from: 'Florida Wedding Wonders <noreply@floridaweddingwonders.com>',
      to: ['bennett.boundless@gmail.com'],
      subject: 'Test Email from Verified Domain',
      html: '<h1>Success!</h1><p>Your domain is now verified and working!</p>'
    });
    console.log('✅ Email sent successfully:', result);
  } catch (error) {
    console.error('❌ Email failed:', error);
  }
}

testDomain();
"
```

### Step 5: Deploy Updated Code

Once domain is verified, deploy the changes:

```bash
git add .
git commit -m "Use verified floridaweddingwonders.com domain for emails"
git push origin staging
./deploy.sh staging
```

## 🔍 Troubleshooting

### Domain Not Verifying?
- **Check DNS Records**: Use https://dnschecker.org to verify records are propagated
- **Wait Longer**: DNS can take up to 48 hours in some cases
- **Contact Resend Support**: They're very responsive and helpful

### Emails Still Going to Spam?
- **Warm Up Domain**: Start with small volume, gradually increase
- **Monitor Reputation**: Check https://www.mail-tester.com
- **Add DMARC Policy**: Optional but recommended for enterprise

### Alternative Quick Fix (Temporary):
If domain verification takes too long, you can temporarily use:
```
from: 'Florida Wedding Wonders <team@floridaweddingwonders.com>'
```
And create a simple forwarding rule from team@ to your main email.

## 📊 Expected Results After Setup:

✅ **Professional Sender**: noreply@floridaweddingwonders.com  
✅ **No Phishing Flags**: Verified domain with proper SPF/DKIM  
✅ **Better Deliverability**: Higher inbox placement rates  
✅ **Brand Consistency**: All emails from your domain  
✅ **Analytics**: Full email tracking in Resend dashboard  

## 🚀 Long-term Email Strategy:

1. **noreply@floridaweddingwonders.com** - Automated notifications
2. **hello@floridaweddingwonders.com** - General inquiries  
3. **support@floridaweddingwonders.com** - Customer support
4. **venues@floridaweddingwonders.com** - Venue communications

---

**Status**: ⏳ Domain verification required - then emails will send from your branded domain!

**Next Action**: Add DNS records to floridaweddingwonders.com domain registrar
