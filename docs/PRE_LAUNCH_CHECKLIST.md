# FinalCode Pre-Launch Checklist

Last Updated: December 13, 2025

This document provides a comprehensive checklist for launching FinalCode to production.

## ✅ Completed Items

### Core Features
- ✅ **Code Editor** - Working with CodeMirror and syntax highlighting
- ✅ **AI Integration** - Claude AI for code generation via `/api/chat`
- ✅ **Live Preview** - Real-time preview with React/JSX support
- ✅ **Deployment** - One-click deploy to Cloudflare Pages
- ✅ **Authentication** - Supabase auth with email/password and GitHub OAuth
- ✅ **Billing System** - Stripe integration with Free/Pro/Team plans

### Legal & Compliance
- ✅ **Terms of Service** - Available at `/terms`
- ✅ **Privacy Policy** - Available at `/privacy`
- ✅ **Contact/Support Page** - Available at `/contact`
- ✅ **Footer Links** - Added to login, pricing, and legal pages

### SEO & Discovery
- ✅ **robots.txt** - Configured to allow crawling
- ✅ **sitemap.xml** - Lists all public pages
- ✅ **Meta Tags** - OpenGraph and Twitter Card metadata
- ✅ **Favicon** - SVG favicon created (needs conversion to ICO/PNG)
- ✅ **PWA Manifest** - manifest.json for installable web app

### Analytics & Monitoring
- ✅ **Vercel Analytics** - Integrated (auto-enabled on Vercel)
- ✅ **Sentry Setup** - Error tracking configured (needs DSN)

---

## 🔴 Critical Tasks (Must Complete Before Launch)

### 1. Generate Proper Favicon Files

**Current Status:** Only SVG favicon exists
**Action Required:**

```bash
# Option 1: Use online tool
Visit https://realfavicongenerator.net/
Upload public/favicon.svg
Download and extract to public/

# Option 2: Use ImageMagick
convert public/favicon.svg -resize 32x32 public/favicon.ico
convert public/favicon.svg -resize 180x180 public/apple-touch-icon.png
```

**Files needed:**
- `public/favicon.ico` (32x32 or 16x16)
- `public/apple-touch-icon.png` (180x180)

### 2. Create OpenGraph Image

**Current Status:** Only SVG placeholder exists
**Action Required:**

```bash
# Option 1: Convert SVG to PNG
convert public/og-image.svg -resize 1200x630 public/og-image.png

# Option 2: Create custom design
Use Figma/Canva to create a 1200x630px image
Export as og-image.png
Place in public/ directory
```

**Requirements:**
- Dimensions: 1200x630 pixels
- Format: PNG or JPG
- File size: < 1MB
- Shows branding and key message

### 3. Configure Sentry (Error Tracking)

**Current Status:** Code integrated, needs DSN
**Action Required:**

1. Create Sentry account: https://sentry.io/signup/
2. Create a new Next.js project
3. Copy the DSN from project settings
4. Add to `.env.local`:
   ```bash
   NEXT_PUBLIC_SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project-id
   ```
5. Test error tracking:
   ```bash
   npm run dev
   # Trigger a test error in the app
   # Check Sentry dashboard for the error
   ```

### 4. Set Up Stripe Webhook

**Current Status:** Code ready, needs webhook configuration
**Action Required:**

1. Go to Stripe Dashboard > Developers > Webhooks
2. Click "Add endpoint"
3. Enter URL: `https://finalcode.dev/api/stripe/webhook`
4. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the webhook signing secret
6. Add to production environment variables:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
   ```

### 5. Configure Production Environment Variables

**Current Status:** .env.example updated, needs production setup
**Action Required:**

For Vercel deployment:
1. Go to Vercel Dashboard > Your Project > Settings > Environment Variables
2. Add all required variables from `.env.example`
3. Ensure these are set for Production:
   - `ANTHROPIC_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `STRIPE_SECRET_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_PRO_PRICE_ID`
   - `STRIPE_TEAM_PRICE_ID`
   - `NEXT_PUBLIC_SITE_URL=https://finalcode.dev`
   - `NEXT_PUBLIC_APP_URL=https://finalcode.dev`
   - `NEXT_PUBLIC_SENTRY_DSN` (from step 3)

### 6. Configure Custom Domain

**Current Status:** Code references finalcode.dev
**Action Required:**

1. **DNS Configuration:**
   - Add A or CNAME records pointing to your hosting provider
   - For Vercel: Add domain in Vercel Dashboard
   - For Cloudflare: Use Cloudflare DNS

2. **SSL Certificate:**
   - Most providers (Vercel, Cloudflare) auto-provision SSL
   - Verify HTTPS is working

3. **Update Environment Variables:**
   ```bash
   NEXT_PUBLIC_SITE_URL=https://finalcode.dev
   NEXT_PUBLIC_APP_URL=https://finalcode.dev
   ```

4. **Update Supabase Auth URLs:**
   - Go to Supabase Dashboard > Authentication > URL Configuration
   - Add `https://finalcode.dev` to allowed redirect URLs
   - Update Site URL to `https://finalcode.dev`

5. **Update OAuth Apps:**
   - GitHub: Update callback URL to `https://finalcode.dev/auth/callback`

---

## 🟡 Important Tasks (Should Complete Before Launch)

### 7. Test All Features End-to-End

**Test Checklist:**

- [ ] **Authentication**
  - [ ] Email/password signup
  - [ ] Email/password login
  - [ ] GitHub OAuth login
  - [ ] Logout
  - [ ] Session persistence

- [ ] **Code Editor**
  - [ ] Create new files
  - [ ] Edit existing files
  - [ ] Delete files
  - [ ] Syntax highlighting works
  - [ ] Code persistence

- [ ] **AI Assistant**
  - [ ] Send chat messages
  - [ ] Receive AI responses
  - [ ] Code extraction works
  - [ ] Files update correctly
  - [ ] Usage limits enforced

- [ ] **Live Preview**
  - [ ] HTML preview works
  - [ ] CSS styles apply
  - [ ] JavaScript executes
  - [ ] Preview updates on code change

- [ ] **Deployment**
  - [ ] Create deployment to Cloudflare
  - [ ] Deployment succeeds
  - [ ] Deployed site is accessible
  - [ ] Copy deployment URL works

- [ ] **Preview Sharing**
  - [ ] Create preview link
  - [ ] Preview link works
  - [ ] Preview expires after 24 hours

- [ ] **Billing**
  - [ ] View pricing page
  - [ ] Subscribe to Pro plan
  - [ ] Subscribe to Team plan
  - [ ] Payment processing works
  - [ ] Subscription updates in database
  - [ ] Access to billing portal
  - [ ] Cancel subscription

### 8. Security Audit

**Review Checklist:**

- [ ] All API routes have proper authentication
- [ ] Database Row Level Security (RLS) policies are correct
- [ ] No sensitive data in client-side code
- [ ] Environment variables are secure
- [ ] CORS headers are properly configured
- [ ] Rate limiting on API endpoints (consider adding)
- [ ] Input validation on all user inputs
- [ ] SQL injection prevention (using Supabase ORM)
- [ ] XSS prevention (React auto-escapes)

### 9. Performance Optimization

**Optimization Checklist:**

- [ ] Run Lighthouse audit (target score: 90+)
- [ ] Optimize images (convert SVGs to PNG/ICO)
- [ ] Enable production build optimizations
- [ ] Test on slow 3G network
- [ ] Verify Core Web Vitals
- [ ] Check bundle size with `npm run build`
- [ ] Consider code splitting for large dependencies

### 10. Set Up Email Service

**Current Status:** Contact form uses mailto links
**Action Required (Optional):**

Consider setting up a proper email service:
- **SendGrid** - Free tier: 100 emails/day
- **Postmark** - Free tier: 100 emails/month
- **Resend** - Modern email API

Update contact form to send emails via API instead of mailto.

### 11. Analytics Verification

**Verification Steps:**

1. **Vercel Analytics:**
   - Deploy to Vercel
   - Visit your site
   - Check Vercel Dashboard > Analytics
   - Verify page views are tracked

2. **Sentry:**
   - After configuring DSN
   - Trigger a test error
   - Check Sentry dashboard
   - Verify error appears

### 12. Documentation Review

**Review Checklist:**

- [ ] README.md is up to date
- [ ] DEPLOYMENT.md has correct instructions
- [ ] PHASE5_MONETIZATION.md matches implementation
- [ ] .env.example has all required variables
- [ ] Comments in code are helpful

---

## 🟢 Nice-to-Have (Post-Launch)

### 13. Additional Features

- [ ] User dashboard for managing projects
- [ ] Deployment history view
- [ ] Team collaboration features
- [ ] Custom domains for deployments
- [ ] Database integration support
- [ ] More templates in gallery
- [ ] Dark/light mode toggle
- [ ] Keyboard shortcuts documentation

### 14. Marketing & SEO

- [ ] Create blog/changelog
- [ ] Add structured data (Schema.org)
- [ ] Submit sitemap to Google Search Console
- [ ] Set up Google Analytics (if needed)
- [ ] Create social media accounts (@finalcode)
- [ ] Prepare launch announcement
- [ ] Create demo video
- [ ] Write blog post about launch

### 15. Community & Support

- [ ] Set up Discord/Slack community
- [ ] Create GitHub discussions for feedback
- [ ] Prepare FAQs based on testing
- [ ] Set up status page (e.g., status.finalcode.dev)
- [ ] Create feedback form
- [ ] Set up feature request board

---

## 📋 Launch Day Checklist

**Final Steps Before Going Live:**

1. [ ] All Critical Tasks completed
2. [ ] All Important Tasks completed
3. [ ] Production environment variables set
4. [ ] Domain DNS propagated (check with `dig finalcode.dev`)
5. [ ] SSL certificate active
6. [ ] Stripe webhook verified
7. [ ] Sentry receiving errors
8. [ ] Analytics tracking
9. [ ] All tests passed
10. [ ] Database backup created
11. [ ] Team notified
12. [ ] Announcement prepared
13. [ ] Support email monitored (support@finalcode.dev)
14. [ ] Monitor logs for first 24 hours
15. [ ] Celebrate! 🎉

---

## 🚨 Emergency Contacts

**Critical Services:**

- **Hosting:** Vercel Dashboard
- **Database:** Supabase Dashboard
- **Payments:** Stripe Dashboard
- **Domain:** Your domain registrar
- **Deployment:** Cloudflare Dashboard
- **Errors:** Sentry Dashboard

**Support Emails:**

- Vercel: support@vercel.com
- Supabase: support@supabase.io
- Stripe: support@stripe.com
- Cloudflare: support@cloudflare.com

---

## 📊 Monitoring After Launch

**What to Monitor:**

1. **Error Rates** (Sentry)
   - Server errors (5xx)
   - Client errors (4xx)
   - JavaScript errors

2. **Performance** (Vercel Analytics)
   - Page load times
   - API response times
   - Core Web Vitals

3. **Usage** (Database)
   - New signups per day
   - AI requests per day
   - Deployments per day
   - Active subscriptions

4. **Business Metrics** (Stripe)
   - Monthly Recurring Revenue (MRR)
   - Churn rate
   - Conversion rate (free to paid)

---

## 🔧 Troubleshooting Common Issues

### Issue: Stripe webhook not working

**Solution:**
1. Verify webhook URL is correct
2. Check webhook secret matches
3. Test webhook with Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

### Issue: OAuth redirect not working

**Solution:**
1. Check Supabase redirect URLs
2. Verify GitHub OAuth app callback URL
3. Ensure NEXT_PUBLIC_SITE_URL is correct

### Issue: Deployments failing

**Solution:**
1. Verify Cloudflare credentials
2. Check API token permissions
3. Review deployment logs in terminal

### Issue: Analytics not tracking

**Solution:**
1. Ensure app is deployed to Vercel
2. Check Vercel Dashboard > Analytics tab
3. Verify production build (not development)

---

## 📝 Notes

- This checklist was generated as part of the pre-launch preparation
- Keep this document updated as you complete tasks
- Share with your team for collaboration
- Use as a reference for future launches

---

## 🎯 Success Criteria

**Launch is successful when:**

- ✅ 100% uptime for first 24 hours
- ✅ No critical errors in Sentry
- ✅ At least 10 successful signups
- ✅ At least 1 successful payment
- ✅ All core features working smoothly
- ✅ Positive user feedback
- ✅ No security vulnerabilities

---

Good luck with your launch! 🚀
