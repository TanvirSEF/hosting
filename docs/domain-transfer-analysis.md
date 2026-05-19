# Domain Transfer Page - Complete Analysis & Dashboard Implementation Guide

## Table of Contents

1. [Overview](#overview)
2. [Architecture & File Map](#architecture--file-map)
3. [Page Structure Breakdown](#page-structure-breakdown)
4. [Step-by-Step Transfer Flow](#step-by-step-transfer-flow)
5. [API Calls & Data Flow](#api-calls--data-flow)
6. [Server Actions Deep Dive](#server-actions-deep-dive)
7. [WHMCS API Mapping](#whmcs-api-mapping)
8. [Dashboard Implementation Plan](#dashboard-implementation-plan)
9. [Required Files to Create/Modify](#required-files-to-createmodify)
10. [Translation Keys Needed](#translation-keys-needed)

---

## Overview

The domain transfer page at `/{locale}/domain-transfer` is a **marketing/landing page** that allows users (both authenticated and guest) to check domain transfer eligibility and initiate a domain transfer order. It is NOT part of the authenticated dashboard.

The page uses a **demo/simulated** eligibility check (no real WHOIS API call for lock status) combined with **real WHMCS TLD pricing** for accurate transfer pricing. The actual order creation uses real WHMCS APIs.

### Key Characteristics

- **Public page** (no authentication required to check eligibility)
- **Auto-login detection** - if user is logged in, order is created immediately; if not, order is saved to `localStorage` and user is redirected to login
- **Real pricing** from WHMCS `GetTLDPricing` API
- **Simulated lock status** using a deterministic hash function (not real-time WHOIS)
- **EPP code validation** on client and server side (4-255 chars, visible ASCII)
- **Multi-currency** support via `useCurrency` context

---

## Architecture & File Map

### Page Route
```
app/[locale]/domain-transfer/page.tsx    → Server component, composes 4 sections
```

### Components
```
components/domain-transfer/
  ├── index.ts          → Barrel export for Hero, TransferSteps, FAQ, CTA
  ├── Hero.tsx          → Main transfer logic (search, eligibility, order creation)
  ├── TransferSteps.tsx → Scroll-driven stacking card animation (Framer Motion)
  ├── FAQ.tsx           → Accordion FAQ (8 questions, native <details> element)
  └── CTA.tsx           → Call-to-action with 5-column infinite scrolling images
```

### Shared Components Used
```
components/home/CTA.module.css      → CSS animations for CTA scroll columns (scrollDown, scrollUp, scrollDownFast, scrollUpFast)
components/contactSection.tsx       → Shared contact section component
components/order/DomainConfig.tsx   → Domain transfer in hosting order flow (register/transfer/existing)
```

### Server Actions (Business Logic)
```
actions/
  ├── domain-order-actions.ts  → createDomainOrderAction, checkUserLoginStatus, getTLDPricingAction, validateEppCode
  ├── domain-search-actions.ts → getTLDPricing (used by Hero for pricing)
  └── domain-actions.ts        → transferDomainAction, getEppCodeAction, getDomainLockStatusAction (dashboard use)
```

### API Layer
```
lib/domain-api.ts    → addDomainTransferToCart, validateDomainTransfer (WHMCS wrappers)
lib/whmcs.ts         → Core WHMCS API client (whmcsApi function)
```

### Translations
```
translations/domain-transfer/
  ├── en.json   → English translations (hero, modal, steps, faq, cta, contact)
  └── sv.json   → Swedish translations
```

### Processing Page (handles post-login orders)
```
app/(clientportal)/dashboard/processing/page.tsx → Reads pendingDomainOrder from localStorage
```

### Static Assets
```
public/images/domain-transfer/
  ├── cta-ecommerce.png, cta-saas.png, cta-restaurant.png, cta-portfolio.png
  ├── cta-blog.png, cta-fitness.png, cta-realestate.png, cta-agency.png
  ├── cta-photography.png, cta-law.png, cta-medical.png, cta-education.png
  ├── cta-travel.png, cta-music.png, cta-nonprofit.png, cta-beauty.png
  ├── cta-architecture.png, cta-gaming.png, cta-pet.png, cta-bakery.png
  └── (20 total CTA website preview images)

public/images/domain-transfer-unlock.png → Reference screenshot for unlock modal
```

---

## Page Structure Breakdown

### 1. Hero Component (`Hero.tsx` - 1135 lines)

This is the core of the entire transfer flow. It contains:

**UI Sections:**
- Search input with auto-typing placeholder animation
- Loading spinner during eligibility check
- Transfer result card (registrar info, lock status, pricing, EPP input)
- Unlock Modal (step-by-step unlock instructions)
- Feature cards (Free Year, WHOIS Privacy, DNS Management, 24/7 Support)

**State Variables:**
```typescript
const [searchTerm, setSearchTerm] = useState('')
const [result, setResult] = useState<TransferResult | null>(null)
const [isLoading, setIsLoading] = useState(false)
const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false)
const [error, setError] = useState<string | null>(null)
const [eppCode, setEppCode] = useState('')
const [showResults, setShowResults] = useState(false)
const [whmcsPricing, setWhmcsPricing] = useState<Record<string, any> | null>(null)
const [showUnlockModal, setShowUnlockModal] = useState(false)
```

**TransferResult Interface:**
```typescript
interface TransferResult {
  domain: string
  registrar: string
  locked: boolean
  expiry: string
  transferable: boolean    // = !locked
  price: number
  originalPrice: number
}
```

### 2. TransferSteps Component (`TransferSteps.tsx` - 323 lines)

Scroll-driven stacking card animation showing 4 steps. Not a static section — it uses Framer Motion scroll-linked animations.

**How it works:**
- Uses `useScroll()` with `scrollYProgress` mapped to a tall container (`(steps.length + 1) * 60vh`)
- A `sticky` container pins to viewport while user scrolls through the tall container
- Each `StackingCard` slides in from `y: 120%` → `y: 0%` using `useSpring` for buttery smoothness (stiffness: 400, damping: 40)
- Cards stack on top of each other with `zIndex: index + 1` and scale down slightly when covered (`1 - (totalSteps - index - 1) * 0.05`)
- `transformOrigin: "top center"` ensures top alignment when scaling

**4 Steps (from translations):**
1. Check domain eligibility
2. Unlock your domain
3. Get authorization code
4. Complete the transfer

**Scroll indicators:**
- Mobile-only and desktop-only scroll hints with animated arrow
- Arrow rotates 180deg when scrolling up
- Uses `scrollDirection` state to reactively change hint text

**Left side layout:** Heading + description + "Transfer Domain" CTA button (links to `#transfer-hero`)

### 3. FAQ Component (`FAQ.tsx` - 54 lines)

Simple accordion using native HTML `<details>`/`<summary>` elements (not a UI library accordion).

**Implementation:**
- Uses `useState<number>` to track open index (default: 0)
- `open={openIndex === index}` controls which `<details>` is expanded
- `onClick` handler calls `e.preventDefault()` and toggles open/close
- Plus icon rotates 45deg when open (`group-open:rotate-45`)
- FAQ answers render with `dangerouslySetInnerHTML` (supports HTML in translation strings)

**8 FAQ Questions:**
1. How long does a domain transfer take? → 5-7 days
2. Will my website go offline during the transfer? → No, DNS preserved
3. What is an EPP/Authorization code? → Unique password proving ownership
4. Do I get extra registration time? → Yes, free year added
5. Can I transfer a domain that expires soon? → Yes, but 15+ days recommended
6. What happens to my current DNS settings? → Preserved during transfer
7. Is WHOIS privacy included? → Yes, free
8. What if my transfer fails? → Notification with reason, 24/7 support

### 4. CTA Component (`CTA.tsx` - 185 lines)

Full-width section with 5 scrolling columns of website preview images and a dark overlay with CTA text.

**Scrolling Image Columns:**
- 20 unique website preview images from `/images/domain-transfer/`
- 5 columns: 3 always visible + 2 hidden on smaller screens (`hidden xl:block`)
- Each column uses CSS module animations from `CTA.module.css`:
  - Column 1: `scrollDown` (30s, down)
  - Column 2: `scrollUp` (25s, up)
  - Column 3: `scrollDownFast` (20s, down)
  - Column 4: `scrollUpFast` (25s, up)
  - Column 5: `scrollDown` (30s, down)
- Images are duplicated in each column for seamless infinite loop
- Each image is `h-[140px]` on mobile, `h-[454px]` on desktop

**CTA Overlay:**
- `bg-black/50` overlay covers all images
- `motion.div` fades in with `whileInView` animation (opacity 0→1, y 30→0)
- Heading: "Ready to Transfer Your Domain?"
- Subheading about benefits
- "Transfer Now" button links to `#transfer-hero`

---

## Unlock Modal Deep Dive

The `UnlockModal` sub-component inside `Hero.tsx` is a critical UX element that appears when a domain is locked. It provides step-by-step guidance:

**Modal Structure:**
1. **Header** - Purple unlock icon + "How to Unlock Your Domain" title + close button
2. **4 Unlock Steps** (from `translations/domain-transfer/en.json → hero.modal.unlockSteps`):
   - Step 1: Log in to your current registrar
   - Step 2: Locate your domain
   - Step 3: Remove the Transfer Lock
   - Step 4: Get the Authorization Code (EPP Code)
3. **Reference Image** - `/images/domain-transfer-unlock.png` showing what domain lock settings look like
4. **6 Registrar Guides** with external links:
   - GoDaddy, Namecheap, Google Domains, Cloudflare, Name.com, ENOM
5. **Help Text** - Purple info box: "Can't find your registrar? Contact support..."
6. **Footer** - "Got it, thanks!" button

**Animation:** `AnimatePresence` + `motion.div` with fade + scale (0.95 → 1) + slide (y: 20 → 0)

---

## Complete Translation Structure

The page uses a single namespace `domain-transfer` loaded via `i18n/request.ts`. Here's the full structure:

```
translations/domain-transfer/en.json
├── hero
│   ├── badge, title, subtitle
│   ├── searchPlaceholder, searchButton, checking
│   ├── errorEmpty, errorFailed, errorEppRequired, errorEppInvalid
│   ├── statusLocked, statusUnlocked
│   ├── currentRegistrar, registrarLock, unlockSteps, checkAgain
│   ├── eppCodeLabel, eppCodePlaceholder, eppCodeHelp
│   ├── unlockBeforeTransfer
│   ├── transferNow, transferring
│   ├── whyTransfer, whyTransferDesc
│   ├── lookingForNew, tryDomainChecker, domainSearchLink
│   ├── defaultRegistrar, defaultExpiry, defaultPrice, defaultOriginalPrice
│   ├── suggestions[] (4 items for auto-typing placeholder)
│   ├── demoRegistrars[] (5 demo domains with registrar/locked/expiry)
│   ├── features.{ freeYear, whoisPrivacy, easyManagement, support }
│   └── modal
│       ├── title, registrarGuides
│       ├── needHelp, needHelpDesc, gotIt
│       ├── unlockSteps[] (4 steps with step/title/description)
│       └── registrars[] (6 registrar guides with name/url)
├── steps
│   ├── heading, description, cta, ctaLink
│   ├── scrollHint, scrollHintUp
│   └── cards[] (4 step cards with heading/text)
├── faq
│   ├── heading
│   └── questions[] (8 FAQ items with question/answer HTML)
├── cta
│   ├── heading, subheading
│   └── button, buttonLink
├── contact
│   ├── heading, subheading
│   ├── description1, description2
│   ├── emailLabel, phoneLabel, email, phone
│   └── info.social.title
└── contactForm
    ├── nameLabel, firstNamePlaceholder, lastNamePlaceholder
    ├── emailLabel, emailPlaceholder
    ├── messageLabel, messagePlaceholder
    └── submitButton, sending
```

---

## DomainConfig in Order Flow (Hosting Context)

The `components/order/DomainConfig.tsx` component also handles domain transfer, but in the **hosting order flow** (when buying hosting + transferring a domain together). Key differences from the landing page:

| Aspect | Landing Page Hero | DomainConfig (Order Flow) |
|--------|-------------------|---------------------------|
| **Context** | Standalone transfer | Part of hosting order checkout |
| **Domain options** | Transfer only | Register / Transfer / Existing |
| **Availability check** | Simulated | Real `checkDomainAvailabilityAction` |
| **Transfer validation** | EPP code format only | EPP code + domain must be registered (`eligible_for_transfer` status) |
| **Order creation** | `createDomainOrderAction` | `addDomainTransferAction` (for standalone) or passes config to parent (for hosting flow) |
| **Cart** | Direct checkout | Part of hosting cart via `onDomainConfigured` callback |

**Transfer validation in DomainConfig:**
```typescript
// When domainType === 'transfer', checks that domain is NOT available
if (domainType === 'transfer') {
  const validationResult = await checkDomainAvailabilityAction(fullDomain)
  // Only allows transfer if domain is "unavailable" (registered)
  // Status "available" → shows error "Domain is available for registration, not transfer"
}
```

---

## Step-by-Step Transfer Flow

### Phase 1: Pricing Fetch (On Mount)
```
Hero mounts → useEffect fires → getTLDPricing(currency) → setWhmcsPricing()
```

1. When the Hero component mounts, it calls `getTLDPricing(currency)` from `actions/domain-search-actions.ts`
2. This calls WHMCS `GetTLDPricing` API with the current currency ID
3. Returns pricing map keyed by TLD (e.g., `{".com": {transfer: {...}, register: {...}, renew: {...}}}`)
4. Stored in `whmcsPricing` state for price lookups
5. Re-fetches whenever `currency` changes (from `useCurrency` context)

### Phase 1b: Auto-Typing Placeholder Animation
```
Hero mounts → useEffect starts typing loop → cycles through suggestions[]
```

The search input has an animated placeholder that types out domain suggestions:
- **Suggestion pool** (from translations): `["yourdomain.com", "mybusiness.io", "company.net", "mystore.org"]`
- Types at 150ms per character, deletes at 50ms per character
- Pauses 2000ms at full text, 500ms when fully deleted
- Uses `loopNum` state to cycle through suggestions infinitely

### Phase 2: Domain Search / Eligibility Check
```
User types domain → clicks "Check Transfer" → checkTransfer()
```

1. User enters a domain name (e.g., `example.com`)
2. If no TLD provided, `.com` is appended automatically
3. `checkTransfer()` simulates a 1.5-second API delay
4. Checks against **demo registrar data** from translations (`demoRegistrars` array in JSON)

**Demo Registrar Data (5 pre-configured domains):**

| Domain | Registrar | Locked | Expiry |
|--------|-----------|--------|--------|
| `example.com` | GoDaddy, LLC | LOCKED | 2025-06-15 |
| `test.com` | Namecheap, Inc. | UNLOCKED | 2024-12-20 |
| `demo.io` | Google Domains | LOCKED | 2025-03-10 |
| `mysite.net` | Cloudflare, Inc. | UNLOCKED | 2025-08-22 |
| `kayem.com` | ENOM, INC. | LOCKED | 2025-01-15 |

5. If domain is in demo data → uses that registrar info
6. If NOT in demo data → uses **deterministic hash** to generate lock status:
   ```typescript
   const getDeterministicLockStatus = (domain: string): boolean => {
     let hash = 0;
     for (let i = 0; i < domain.length; i++) {
       hash = (hash << 5) - hash + domain.charCodeAt(i);
       hash |= 0;
     }
     return Math.abs(hash) % 2 === 0;
   }
   ```
7. Pricing is resolved via `getDomainPricing()` which:
   - Extracts TLD from domain
   - Looks up `whmcsPricing[tld]`
   - Tries `transfer` price first, then `renew`, then `register`
   - Falls back to translation defaults (`9.99`)

8. Result stored in `TransferResult` state

**IMPORTANT:** The eligibility check is **simulated** - it does NOT call any real WHOIS API. The lock status is deterministic but not real.

### Phase 3: User Reviews Result

The result card shows:
- **Registrar info** (from demo data or default)
- **Lock status** (LOCKED/UNLOCKED badge)
  - If LOCKED → amber warning + "How to unlock" button → opens UnlockModal
  - If UNLOCKED → green success badge
- **Domain name + pricing** (original price struck through, transfer price highlighted)
- **EPP code input** field
- **"Transfer Now" button** (disabled if domain is locked or no EPP code)

### Phase 4: Transfer Submission
```
User enters EPP → clicks "Transfer Now" → handleTransferCheckout()
```

#### Step 4a: Client-Side Validation
1. Check `result.transferable` (domain must be unlocked)
2. Check EPP code is not empty
3. Validate EPP code format: 4-255 chars, visible ASCII only (`/^[!-~]+$/`)

#### Step 4b: Authentication Check
```typescript
const { checkUserLoginStatus, createDomainOrderAction } = await import('@/actions/domain-order-actions')
const loginStatus = await checkUserLoginStatus()
```

#### Step 4c: Branch Based on Login Status

**If NOT logged in:**
```typescript
const pendingDomainOrder = {
  domain: result.domain,
  regPeriod: 1,
  currency,
  domainType: 'transfer',
  eppCode: trimmedEpp,
}
localStorage.setItem('pendingDomainOrder', JSON.stringify(pendingDomainOrder))
router.push(`/${locale}/login?returnUrl=${encodeURIComponent('/dashboard/processing')}`)
```
- Saves pending order to `localStorage`
- Redirects to login page with return URL to `/dashboard/processing`
- After login, the **Processing page** reads `pendingDomainOrder` from localStorage and calls `createDomainOrderAction`

**If logged in:**
```typescript
const createResult = await createDomainOrderAction({
  domain: result.domain,
  years: 1,
  currency,
  domainType: 'transfer',
  eppCode: trimmedEpp,
})
```
- Directly calls `createDomainOrderAction`
- On success → redirects to `/dashboard/billing?invoice={invoiceId}&highlight=true`

---

## API Calls & Data Flow

### Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DOMAIN TRANSFER DATA FLOW                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. PRICING FETCH (on mount)                                        │
│     Hero.tsx → getTLDPricing(currency)                              │
│       → domain-search-actions.ts                                    │
│         → whmcsApi('GetTLDPricing', {currencyid})                   │
│           → WHMCS API                                              │
│     ← Returns: {pricing: {".com": {transfer: {...}, register: ...}}}│
│                                                                     │
│  2. ELIGIBILITY CHECK (simulated)                                   │
│     Hero.tsx → checkTransfer()                                      │
│       → 1.5s artificial delay                                       │
│       → Demo data lookup OR deterministic hash for lock status      │
│       → getDomainPricing() with whmcsPricing                        │
│     ← Returns: TransferResult {domain, registrar, locked, price}    │
│                                                                     │
│  3. TRANSFER ORDER CREATION                                         │
│     Hero.tsx → handleTransferCheckout()                             │
│       → checkUserLoginStatus()                                      │
│         → JWT session verification                                  │
│                                                                     │
│       IF LOGGED IN:                                                 │
│         → createDomainOrderAction({domainType: 'transfer', eppCode})│
│           → domain-order-actions.ts                                 │
│             → syncClientCurrency()                                  │
│               → whmcsApi('UpdateClient', {currency})                │
│             → validateEppCode()                                     │
│             → calculateDomainPrice()                                │
│               → getTLDPricingAction()                               │
│                 → whmcsApi('GetTLDPricing')                         │
│             → whmcsApi('AddOrder', {domaintype: 'transfer', ...})   │
│             → whmcsApi('DomainTransfer', {domainid, eppcode})       │
│             → Invoice resolution (multiple fallback strategies)     │
│             → syncInvoiceToMongoDB()                                │
│           ← Returns: {orderId, invoiceId}                           │
│         → router.push('/dashboard/billing?invoice={id}')            │
│                                                                     │
│       IF NOT LOGGED IN:                                             │
│         → localStorage.setItem('pendingDomainOrder', ...)           │
│         → router.push('/login?returnUrl=/dashboard/processing')     │
│         → [After login] Processing page reads localStorage          │
│         → createDomainOrderAction() (same flow as above)            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### WHMCS API Calls in Order

| # | WHMCS API Action | Purpose | When Called |
|---|------------------|---------|-------------|
| 1 | `GetTLDPricing` | Fetch transfer/register/renew pricing per TLD | On page load + during order creation |
| 2 | `GetCurrencies` | Resolve currency ID from currency code | During pricing fetch + order creation |
| 3 | `UpdateClient` | Sync client currency + location | During order creation |
| 4 | `AddOrder` | Create the transfer order in WHMCS | During order creation |
| 5 | `DomainTransfer` | Initiate actual transfer with EPP code at registrar | After AddOrder returns domain ID |
| 6 | `GetOrders` | Resolve invoice ID from order | Fallback invoice resolution |
| 7 | `GetInvoices` | Find invoice by order ID | Fallback invoice resolution |
| 8 | `CreateInvoice` | Manual invoice creation | Last resort if no auto-invoice |
| 9 | `DeleteOrder` | Cleanup on transfer failure | If DomainTransfer fails |
| 10 | `UpdateInvoice` | Fix tax settings | After invoice creation |

---

## Server Actions Deep Dive

### `createDomainOrderAction` (domain-order-actions.ts:942)

This is the **main function** that handles domain transfer order creation. Here's its detailed flow:

```
1. Get current user from JWT session (getCurrentUser)
   └── If no user → return {success: false, requiresLogin: true}

2. Validate EPP code if domainType === 'transfer'
   └── validateEppCode(eppCode) - checks 4-255 chars, visible ASCII

3. Sync client currency in WHMCS
   └── syncClientCurrency(clientId, currencyCode)
       ├── getCurrencies() → find currency ID
       └── whmcsApi('UpdateClient', {clientid, currency})

4. Sync client location (for tax calculation)
   └── syncClientLocation(clientId, country, state)
       └── whmcsApi('UpdateClient', {clientid, country, state})

5. Build WHMCS AddOrder parameters
   ├── domain[0] = domain name
   ├── domaintype[0] = 'transfer'
   ├── regperiod[0] = 1
   ├── eppcode[0] = EPP code (for transfers)
   ├── paymentmethod = 'stripe'
   ├── dnsmanagement[0], emailforwarding[0], idprotection[0] (if addons)
   └── domainprice[0] = calculated from WHMCS pricing

6. Fetch domain price from WHMCS
   └── calculateDomainPrice(domain, years, currency)
       → Uses WHMCS TLD pricing matrix

7. Call WHMCS AddOrder
   └── whmcsApi('AddOrder', whmcsOrderData)

8. IF transfer order: Validate with registrar
   ├── Extract domainId from response.domainids
   ├── whmcsApi('DomainTransfer', {domainid, eppcode})
   └── If fails → cleanup: whmcsApi('DeleteOrder', {orderid})

9. Resolve invoice ID (multi-strategy)
   ├── Strategy 1: response.invoiceid from AddOrder
   ├── Strategy 2: GetOrders API lookup (3 retries)
   ├── Strategy 3: GetInvoices API lookup by orderid
   └── Strategy 4: CreateInvoice API (manual creation)

10. Sync invoice to MongoDB
    └── syncInvoiceToMongoDB(invoiceId, userId, collection)

11. Lock user currency
    └── setUserDefaultCurrency(currency)

12. Return {success: true, orderId, invoiceId}
```

### `validateEppCode` (domain-order-actions.ts:719)

```typescript
function validateEppCode(eppCode: string): { valid: boolean; error?: string } {
  const code = String(eppCode || '').trim()
  if (!code) return { valid: false, error: 'EPP/Authorization code is required' }
  if (code.length < 4 || code.length > 255) return { valid: false, error: 'Invalid EPP code format' }
  if (!/^[!-~]+$/.test(code)) return { valid: false, error: 'Invalid EPP code format' }
  return { valid: true }
}
```

### Dashboard Transfer Actions (domain-actions.ts)

These are **separate** from the landing page flow and are used for managing existing domain transfers in the dashboard:

| Action | WHMCS API | Purpose |
|--------|-----------|---------|
| `transferDomainAction` | `DomainTransfer` | Initiate transfer for existing domain |
| `getEppCodeAction` | `DomainGetEppCode` | Get EPP code for a domain |
| `getDomainLockStatusAction` | `DomainGetLockingStatus` | Check domain lock status |
| `requestEppCodeAction` | `DomainRequestEPP` | Request EPP code via email |
| `resendTransferEmailAction` | `DomainResendTransferEmail` | Resend transfer confirmation |
| `synchroniseDomainAction` | `DomainSynchronise` | Sync domain with registrar |

---

## WHMCS API Mapping

### Transfer-Specific WHMCS Parameters

**AddOrder (for transfer):**
```typescript
{
  clientid: number,
  paymentmethod: 'stripe',
  noinvoice: false,
  noemail: false,
  'domain[0]': 'example.com',
  'domaintype[0]': 'transfer',        // KEY: marks as transfer
  'regperiod[0]': 1,
  'eppcode[0]': 'AUTH_CODE',          // KEY: EPP/auth code
  'domainprice[0]': '12.99',          // Fetched from WHMCS pricing
  // Optional addons:
  'dnsmanagement[0]': true,
  'emailforwarding[0]': true,
  'idprotection[0]': true,
}
```

**DomainTransfer (post-order validation):**
```typescript
{
  domainid: number,   // From AddOrder response.domainids
  eppcode: string,    // Same EPP code
}
```

### Pricing Structure from WHMCS

```typescript
// GetTLDPricing returns:
{
  ".com": {
    transfer: {
      "1": { price: "12.99" },     // 1-year transfer price
      "2": { price: "25.98" },     // 2-year transfer price
    },
    register: {
      "1": { price: "14.99" },
    },
    renew: {
      "1": { price: "14.99" },
    },
    addons: {
      dnsmanagement: "0.00",
      emailforwarding: "0.00",
      idprotection: "0.00",
    }
  }
}
```

---

## Dashboard Implementation Plan

### Where to Add It

The new "Transfer Domain" page should be added at:
```
app/(clientportal)/dashboard/domain-transfer/page.tsx
```

And linked from the sidebar navigation alongside "My Domains" and "Register New Domain".

### Architecture Pattern to Follow

Follow the existing `domain-register` page pattern:

```
app/(clientportal)/dashboard/domain-transfer/
  └── page.tsx                        → Server component (auth check + data fetch)

components/dashboard/
  └── DomainTransferClientWrapper.tsx  → Client component (main UI + logic)
```

### Implementation Steps

#### Step 1: Create Server Page

```typescript
// app/(clientportal)/dashboard/domain-transfer/page.tsx
// Follow same pattern as domain-register/page.tsx:
// 1. Verify JWT session
// 2. Fetch client details from WHMCS
// 3. Redirect to login if no session
// 4. Render DomainTransferClientWrapper with user data
```

**Key difference from landing page:** User is always authenticated in the dashboard, so no `localStorage` pending order flow is needed. Order can be created directly.

#### Step 2: Create Client Wrapper Component

```typescript
// components/dashboard/DomainTransferClientWrapper.tsx
// Should include:
// 1. Domain search input (same UI as Hero.tsx)
// 2. Real WHMCS WHOIS eligibility check (not simulated)
// 3. TLD pricing fetch from WHMCS
// 4. EPP code input + validation
// 5. Direct order creation (no login redirect needed)
// 6. Transfer add-ons (DNS management, email forwarding, ID protection)
// 7. Cart integration (optional, or direct checkout)
```

#### Step 3: Add Sidebar Navigation Entry

**IMPORTANT:** The active sidebar is defined in `components/app-sidebar.tsx` using an inline `navMain` array. The `NavDomains` component from `nav-domains.tsx` is NOT used by the sidebar. Both files must be updated.

**3a. Update `components/app-sidebar.tsx`** — add Transfer Domain to the domains `items` array:

```typescript
// In the navMain array, domains section (around line 90):
{
  title: t('sidebar.navigation.domains'),
  url: '/dashboard/domains',
  icon: IconGlobe,
  items: [
    {
      title: t('sidebar.navigation.myDomains'),
      url: '/dashboard/domains',
    },
    {
      title: t('sidebar.navigation.registerDomain'),
      url: '/dashboard/domain-register',
    },
    {
      title: t('sidebar.navigation.transferDomain'),
      url: '/dashboard/domain-transfer',
    },
  ],
},
```

Also add the sidebar translation key: `sidebar.navigation.transferDomain`

**3b. Update `components/nav-domains.tsx`** — add Transfer Domain sub-item + update active state detection:

```typescript
<SidebarMenuSubItem>
  <SidebarMenuSubButton asChild isActive={isTransferActive}>
    <a href="/dashboard/domain-transfer">
      <IconGlobe />
      <span>Transfer Domain</span>
    </a>
  </SidebarMenuSubButton>
</SidebarMenuSubItem>
```

Also update `isOpen` state to include the new path:
```typescript
pathname?.startsWith('/dashboard/domain-transfer')
```

#### Step 4: Add Translation Keys

Add `sidebar.navigation.transferDomain` and `domainTransfer.*` keys to both `translations/dashboard/en.json` and `translations/dashboard/sv.json`. See the [Translation Keys Needed](#translation-keys-needed) section below for the complete key set.

**Files modified:**
- `translations/dashboard/en.json` — added `domainTransfer.*` keys + `sidebar.navigation.transferDomain`
- `translations/dashboard/sv.json` — added Swedish `domainTransfer.*` keys + `sidebar.navigation.transferDomain`

#### Step 5: Real Eligibility Check (Improvement over Landing Page)

Since the dashboard is for authenticated users, implement a **real** eligibility check instead of the simulated one:

```typescript
// New server action or reuse existing:
async function checkDomainTransferEligibility(domain: string) {
  // 1. Check domain is registered (not available)
  const whois = await whmcsApi('DomainWhois', { domain })
  if (whois.status === 'available') {
    return { eligible: false, reason: 'Domain is not registered' }
  }

  // 2. Check domain is not already in user's account
  const userDomains = await whmcsApi('GetClientsDomains', { clientid: userId })
  // ... check if domain already exists

  return { eligible: true }
}
```

#### Step 6: Order Creation (Simplified for Dashboard)

Since the user is authenticated, the order flow is simpler:

```typescript
const handleTransferCheckout = async () => {
  // 1. Validate inputs
  // 2. Call createDomainOrderAction directly (no login check needed)
  const result = await createDomainOrderAction({
    domain: result.domain,
    years: 1,
    currency,
    domainType: 'transfer',
    eppCode: trimmedEpp,
  })

  // 3. Handle result
  if (result.success && result.invoiceId) {
    router.push(`/dashboard/billing?invoice=${result.invoiceId}&highlight=true`)
  }
}
```

---

## Required Files to Create/Modify

### New Files to Create

| File | Purpose |
|------|---------|
| `app/(clientportal)/dashboard/domain-transfer/page.tsx` | Server page with auth check |
| `components/dashboard/DomainTransferClientWrapper.tsx` | Main client component with transfer UI |

### Files to Modify

| File | Change |
|------|--------|
| `components/app-sidebar.tsx` | Add "Transfer Domain" sub-item to `navMain` domains section (the active sidebar uses inline `navMain`, NOT `NavDomains` component) |
| `components/nav-domains.tsx` | Add "Transfer Domain" nav item + update active state (sync with app-sidebar, even though this component is currently unused) |
| `translations/dashboard/en.json` | Add `domainTransfer.*` translation keys + `sidebar.navigation.transferDomain` key |
| `translations/dashboard/sv.json` | Add Swedish translations for `domainTransfer.*` + `sidebar.navigation.transferDomain` key |

> **Important:** `app-sidebar.tsx` defines domain navigation inline in its `navMain` array (lines 89-103). The `NavDomains` component from `nav-domains.tsx` is NOT imported or used by the sidebar. Both must be updated to stay in sync.

### Existing Files to Reuse (No Changes Needed)

| File | What to Reuse |
|------|---------------|
| `actions/domain-order-actions.ts` | `createDomainOrderAction`, `checkUserLoginStatus`, `validateEppCode`, `getTLDPricingAction` |
| `actions/domain-search-actions.ts` | `getTLDPricing` |
| `actions/domain-actions.ts` | `transferDomainAction`, `getEppCodeAction`, `getDomainLockStatusAction` |
| `lib/domain-api.ts` | `addDomainTransferToCart`, `validateDomainTransfer` |
| `lib/whmcs.ts` | `whmcsApi` core function |
| `contexts/CurrencyContext.tsx` | `useCurrency` hook for multi-currency pricing |
| `hooks/use-domain-cart.ts` | Cart management for domain items |

---

## Translation Keys Needed

### English (en.json)

Add these under the `domainTransfer` key in `translations/dashboard/en.json`:

```json
"domainTransfer": {
  "title": "Transfer Domain",
  "subtitle": "Transfer your domain to WebblyHosting and enjoy better service, lower prices, and a free year extension",
  "search": {
    "title": "Check Transfer Eligibility",
    "description": "Enter your domain name to check if it can be transferred to WebblyHosting",
    "placeholder": "Enter domain name (e.g., example.com)",
    "button": "Check Transfer",
    "searching": "Checking..."
  },
  "result": {
    "eligible": "This domain is eligible for transfer!",
    "notEligible": "This domain cannot be transferred",
    "available": "This domain is available for registration, not transfer",
    "transferPrice": "Transfer Price",
    "perYear": "/year",
    "checkAgain": "Check Again",
    "defaultRegistrar": "Unknown Registrar"
  },
  "epp": {
    "label": "EPP / Authorization Code",
    "placeholder": "Enter your EPP authorization code",
    "help": "Get this code from your current domain registrar",
    "required": "EPP authorization code is required",
    "invalid": "EPP code must be 4-255 characters (visible ASCII only)"
  },
  "addons": {
    "title": "Domain Add-ons",
    "dnsManagement": "DNS Management",
    "emailForwarding": "Email Forwarding",
    "idProtection": "ID Protection"
  },
  "order": {
    "summary": "Order Summary",
    "domain": "Domain Transfer",
    "period": "Period",
    "total": "Total",
    "button": "Complete Transfer",
    "processing": "Processing your transfer...",
    "success": "Transfer order created successfully!",
    "error": "Failed to create transfer order"
  },
  "features": {
    "freeYear": "Free 1-Year Extension",
    "whoisPrivacy": "WHOIS Privacy",
    "dnsManagement": "Easy DNS Management",
    "support": "24/7 Expert Support"
  },
  "unlockModal": {
    "title": "How to Unlock Your Domain",
    "registrars": "Popular Registrar Guides",
    "needHelpDesc": "Contact your current domain provider's support team for assistance with unlocking your domain and obtaining the EPP code.",
    "step1": "Log in to your current registrar",
    "step2": "Find domain lock/registrar lock settings",
    "step3": "Disable the domain lock",
    "step4": "Get your EPP authorization code",
    "step5": "Come back and complete the transfer"
  },
  "error": {
    "empty": "Please enter a domain name",
    "invalid": "Please enter a valid domain name",
    "failed": "Failed to check transfer eligibility"
  }
}
```

### Swedish (sv.json)

**Sidebar navigation key:**
```json
"sidebar.navigation.transferDomain": "Överför Domän"
```

**domainTransfer keys:**
```json
"domainTransfer": {
  "title": "Överför Domän",
  "subtitle": "Överför din domän till WebblyHosting och njut av bättre service, lägre priser och ett gratis års förlängning",
  "search": {
    "title": "Kontrollera Överföringsberättigande",
    "description": "Ange ditt domännamn för att kontrollera om det kan överföras till WebblyHosting",
    "placeholder": "Ange domännamn (t.ex., example.com)",
    "button": "Kontrollera Överföring",
    "searching": "Kontrollerar..."
  },
  "result": {
    "eligible": "Denna domän är berättigad för överföring!",
    "notEligible": "Denna domän kan inte överföras",
    "available": "Denna domän är tillgänglig för registrering, inte överföring",
    "transferPrice": "Överföringspris",
    "perYear": "/år",
    "checkAgain": "Kontrollera igen",
    "defaultRegistrar": "Okänd Registrator"
  },
  "epp": {
    "label": "EPP / Auktoriseringskod",
    "placeholder": "Ange din EPP-auktoriseringskod",
    "help": "Hämta denna kod från din nuvarande domänregistrator",
    "required": "EPP-auktoriseringskod krävs",
    "invalid": "EPP-koden måste vara 4-255 tecken (endast synliga ASCII-tecken)"
  },
  "addons": {
    "title": "Domäntillägg",
    "dnsManagement": "DNS-hantering",
    "emailForwarding": "E-postvidarebefordran",
    "idProtection": "ID-skydd"
  },
  "order": {
    "summary": "Ordersammanfattning",
    "domain": "Domänöverföring",
    "period": "Period",
    "total": "Totalt",
    "button": "Slutför Överföring",
    "processing": "Bearbetar din överföring...",
    "success": "Överföringsorder skapad!",
    "error": "Det gick inte att skapa överföringsorder"
  },
  "features": {
    "freeYear": "Gratis 1-års förlängning",
    "whoisPrivacy": "WHOIS-integritet",
    "dnsManagement": "Enkel DNS-hantering",
    "support": "Dygnet runt Expert Support"
  },
  "unlockModal": {
    "title": "Hur du låser upp din domän",
    "registrars": "Populära Registratorguider",
    "needHelpDesc": "Kontakta din nuvarande domänleverantörs supportteam för hjälp med att låsa upp din domän och erhålla EPP-koden.",
    "step1": "Logga in på din nuvarande registrator",
    "step2": "Hitta domänlås-/registratorlåsinställningar",
    "step3": "Inaktivera domänlåset",
    "step4": "Hämta din EPP-auktoriseringskod",
    "step5": "Kom tillbaka och slutför överföringen"
  },
  "error": {
    "empty": "Vänligen ange ett domännamn",
    "invalid": "Vänligen ange ett giltigt domännamn",
    "failed": "Det gick inte att kontrollera överföringsberättigande"
  }
}
```

### Sidebar Translation Keys

Both `en.json` and `sv.json` need an additional key under `sidebar.navigation`:

```json
// en.json
"sidebar.navigation.transferDomain": "Transfer Domain"

// sv.json
"sidebar.navigation.transferDomain": "Överför Domän"
```

---

## Key Differences: Landing Page vs Dashboard Implementation

| Aspect | Landing Page (`/domain-transfer`) | Dashboard (`/dashboard/domain-transfer`) |
|--------|-----------------------------------|------------------------------------------|
| **Auth Required** | No | Yes |
| **Eligibility Check** | Simulated (demo data + hash) | Should use real WHOIS |
| **Lock Status** | Deterministic hash | Should use real `DomainGetLockingStatus` |
| **Order Flow** | `localStorage` for guests → Processing page | Direct `createDomainOrderAction` |
| **Pricing** | WHMCS TLD pricing | Same WHMCS TLD pricing |
| **Add-ons** | Not offered in landing page | Should offer DNS, email forwarding, ID protection |
| **EPP Validation** | Client-side only | Client-side + server-side |
| **Invoice Handling** | Redirect to billing page | Same redirect to billing page |
| **Translation** | `translations/domain-transfer/en.json` | `translations/dashboard/en.json` |
| **Layout** | Dark hero, marketing layout | Dashboard layout with sidebar |

---

## Summary

The domain transfer landing page uses a **simplified, simulated** eligibility check combined with **real WHMCS pricing**. For the dashboard implementation:

1. **Reuse all server actions** from `domain-order-actions.ts` and `domain-actions.ts`
2. **Replace the simulated eligibility check** with real WHMCS `DomainWhois` API calls
3. **Skip the localStorage flow** since users are always authenticated
4. **Add domain add-ons** (DNS management, email forwarding, ID protection) since the dashboard has richer UI
5. **Follow the existing pattern** from `domain-register/page.tsx` for auth, layout, and translation structure
6. **Add sidebar navigation** in `app-sidebar.tsx` (primary) and `nav-domains.tsx` (secondary) for the new transfer page

---

## Implementation Status

All implementation steps have been completed and verified:

| Step | Description | Status |
|------|-------------|--------|
| 1 | Server page `app/(clientportal)/dashboard/domain-transfer/page.tsx` | Done |
| 2 | Client component `components/dashboard/DomainTransferClientWrapper.tsx` | Done |
| 3a | Sidebar entry in `components/app-sidebar.tsx` (active sidebar) | Done |
| 3b | Nav entry in `components/nav-domains.tsx` (secondary, currently unused) | Done |
| 4 | English translations in `translations/dashboard/en.json` | Done |
| 4 | Swedish translations in `translations/dashboard/sv.json` | Done |
| 5 | Real eligibility check via `checkDomainAvailabilityAction` | Done |
| 6 | Direct order creation via `createDomainOrderAction` | Done |
| - | TypeScript build check (zero errors) | Passed |
