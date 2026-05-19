# Email Service Bundle Implementation Guide

## Overview

This document outlines the implementation of the Hybrid Email Service feature:
- **Free Tier:** 2 email accounts with every hosting plan
- **Paid Upgrade:** Additional accounts, storage, and premium features

---

## 1. WHMCS Configuration

### Step 1: Create Email Service Products in WHMCS

#### A. Free Email Tier (Included with Hosting)

```
Product Name: Email Basic (Free)
Product Type: Hosting Account
Product Group: Email Services

Pricing:
- Monthly: $0.00
- Annually: $0.00

Product Description:
- 2 Email Accounts
- 1GB Storage Each
- Webmail Access
- IMAP/POP3/SMTP

Custom Fields:
- domain: Domain name for email
- hosting_service_id: Linked hosting service ID
```

#### B. Paid Email Upgrades

```
Product Name: Email Pro
Product Type: Hosting Account
Product Group: Email Services

Pricing:
- Monthly: $4.99
- Annually: $49.99

Product Description:
- 10 Email Accounts
- 5GB Storage Each
- Webmail Access
- IMAP/POP3/SMTP
- Email Forwarding
- Auto-responders

---

Product Name: Email Business
Product Type: Hosting Account
Product Group: Email Services

Pricing:
- Monthly: $9.99
- Annually: $99.99

Product Description:
- Unlimited Email Accounts
- 10GB Storage Each
- All Pro Features
- Priority Support
- Email Aliases
- Mailing Lists
```

### Step 2: Create Product Addon for Email Upgrade

```
Addon Name: Email Upgrade
Addon Type: Hosting

Pricing:
- Email Pro: $4.99/month
- Email Business: $9.99/month

Apply To: All hosting products
```

### Step 3: Configure Product Bundles (Optional)

In WHMCS, create a product bundle:
1. Go to Setup > Products/Services > Product Bundles
2. Create bundle: "Hosting + Email"
3. Include hosting product + free email tier
4. Set discount if needed

---

## 2. Environment Variables

Add these to your `.env` file:

```env
# Email Service Configuration
NEXT_PUBLIC_EMAIL_SERVICE_GID=10        # WHMCS Product Group ID for Email Services
NEXT_PUBLIC_FREE_EMAIL_ACCOUNTS=2       # Free email accounts with hosting
NEXT_PUBLIC_FREE_EMAIL_QUOTA=1024       # Free tier quota in MB (1GB)

# QBoxMail Configuration (already exists)
QBOXMAIL_API_URL=https://api.qboxmail.com/api
QBOXMAIL_API_TOKEN=your_token_here
```

---

## 3. Database Schema Updates

### MongoDB Collection: `email_services`

```typescript
interface EmailService {
  _id: ObjectId;
  whmcsServiceId: number;           // WHMCS hosting service ID
  whmcsEmailServiceId?: number;     // WHMCS email service ID (if paid)
  clientId: number;                 // Client's WHMCS ID
  
  // Plan details
  plan: 'free' | 'pro' | 'business';
  maxAccounts: number;              // 2, 10, or unlimited (-1)
  quotaPerAccount: number;          // In MB
  
  // Domain
  domain: string;
  
  // Status
  status: 'pending' | 'active' | 'suspended' | 'cancelled';
  
  // QBoxMail integration
  qboxmailDomainCode?: string;      // QBoxMail domain code
  
  // Timestamps
  createdAt: Date;
  activatedAt?: Date;
  updatedAt: Date;
  
  // Upgrade tracking
  upgradeFromPlan?: 'free' | 'pro';
  upgradedAt?: Date;
}
```

---

## 4. Implementation Architecture

### A. Order Flow Integration

```
User selects Hosting Plan
        ↓
Order Page shows:
├── Hosting Configuration
├── Domain Selection
├── Email Service Section (NEW)
│   ├── Free: 2 email accounts (included)
│   ├── Upgrade to Pro: $4.99/mo (10 accounts, 5GB)
│   └── Upgrade to Business: $9.99/mo (unlimited, 10GB)
└── Addons
        ↓
User selects email option
        ↓
Order created in WHMCS
├── Hosting service created
└── Email service created (free or paid)
        ↓
Payment completed
        ↓
Email service activated
├── Domain added to QBoxMail
└── Email service record created in MongoDB
```

### B. Dashboard Integration

```
/dashboard/services/[id]
├── Service Details
├── Email Accounts (NEW Section)
│   ├── Current Plan: Free (2 accounts)
│   ├── Accounts Created: 1/2
│   ├── [Create Email Account] button
│   ├── [Upgrade Plan] button
│   └── List of existing accounts
└── Other service options
```

---

## 5. API Endpoints

### New Server Actions Required

| Action | Purpose |
|--------|---------|
| `getEmailServiceForHostingAction()` | Get email service linked to hosting |
| `createEmailServiceAction()` | Create email service on hosting order |
| `upgradeEmailServiceAction()` | Upgrade from free to paid plan |
| `getEmailAccountsUsageAction()` | Get account usage stats |
| `getAvailableEmailPlansAction()` | Get available upgrade plans |

---

## 6. File Structure

```
actions/
├── email-service-actions.ts       # Existing - update for bundle
├── email-bundle-actions.ts        # NEW - bundle-specific actions

components/
├── order/
│   └── EmailServiceSelector.tsx   # NEW - email plan selector in order
├── dashboard/
│   ├── EmailServiceCard.tsx       # NEW - email service overview
│   └── EmailUpgradeDialog.tsx     # NEW - upgrade dialog
├── emails/
│   └── EmailSetupWizard.tsx       # NEW - first-time setup wizard

lib/
├── email-bundle.ts                # NEW - bundle configuration
└── qboxmail.ts                    # Existing - QBoxMail API

app/
├── (clientportal)/dashboard/
│   └── services/[id]/
│       └── email/
│           └── page.tsx           # NEW - dedicated email page
```

---

## 7. Pricing Table

| Feature | Free (Included) | Pro ($4.99/mo) | Business ($9.99/mo) |
|---------|-----------------|----------------|---------------------|
| Email Accounts | 2 | 10 | Unlimited |
| Storage Each | 1 GB | 5 GB | 10 GB |
| Webmail | ✅ | ✅ | ✅ |
| IMAP/POP3/SMTP | ✅ | ✅ | ✅ |
| Email Forwarding | ❌ | ✅ | ✅ |
| Auto-responders | ❌ | ✅ | ✅ |
| Email Aliases | ❌ | ❌ | ✅ |
| Mailing Lists | ❌ | ❌ | ✅ |
| Priority Support | ❌ | ❌ | ✅ |

---

## 8. Implementation Checklist

### Phase 1: WHMCS Setup
- [ ] Create Free Email product
- [ ] Create Pro Email product
- [ ] Create Business Email product
- [ ] Configure product addons
- [ ] Test product ordering

### Phase 2: Backend Implementation
- [ ] Create `email-bundle-actions.ts`
- [ ] Update `email-service-actions.ts`
- [ ] Create `lib/email-bundle.ts`
- [ ] Update MongoDB schema
- [ ] Add environment variables

### Phase 3: Frontend Implementation
- [ ] Create `EmailServiceSelector.tsx`
- [ ] Create `EmailServiceCard.tsx`
- [ ] Create `EmailUpgradeDialog.tsx`
- [ ] Create `EmailSetupWizard.tsx`
- [ ] Update order flow
- [ ] Update dashboard

### Phase 4: Integration
- [ ] Integrate with hosting order flow
- [ ] Auto-provision on payment success
- [ ] QBoxMail domain auto-setup
- [ ] Email account creation flow

### Phase 5: Testing
- [ ] Test free tier provisioning
- [ ] Test paid upgrade flow
- [ ] Test email account creation
- [ ] Test QBoxMail integration
- [ ] Test dashboard display

---

## 9. Security Considerations

1. **Rate Limiting:** Limit email account creation requests
2. **Validation:** Strict email username validation
3. **Authorization:** Verify user owns the hosting service
4. **QBoxMail Token:** Secure storage of API token
5. **Password Requirements:** Enforce strong passwords

---

## 10. Support Documentation

### User-Facing FAQ

**Q: How many free email accounts do I get?**
A: Every hosting plan includes 2 free email accounts with 1GB storage each.

**Q: Can I upgrade my email plan later?**
A: Yes! You can upgrade to Pro or Business anytime from your dashboard.

**Q: How do I access my email?**
A: You can access your email via webmail at `https://webmail.yourdomain.com`

**Q: Can I use Outlook or other email clients?**
A: Yes, all plans support IMAP, POP3, and SMTP for third-party clients.

---

## Next Steps

1. Complete WHMCS product configuration
2. Implement backend actions
3. Create frontend components
4. Test end-to-end flow
5. Deploy to production
