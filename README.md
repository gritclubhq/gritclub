# GritClub 🎙️

> LinkedIn meets Twitch for founders — Ticketed live business events with 50/50 revenue share

**Live at:** [gritclub.live](https://gritclub.live)

---

## 🏗️ Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 App Router + TypeScript |
| Styling | Tailwind CSS + Custom Design System |
| Database | Supabase Postgres (Realtime) |
| Auth | Supabase Auth (Google OAuth + Magic Link) |
| Payments | Stripe Checkout + Webhooks |
| Streaming | WebRTC (native browser APIs) |
| Deployment | Vercel |

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/gritclub.git
cd gritclub
npm install
```

### 2. Environment Setup

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

1. Create a new [Supabase project](https://supabase.com)
2. Go to SQL Editor and run `supabase/schema.sql`
3. Enable Google OAuth in Authentication > Providers
4. Add `http://localhost:3000/auth/callback` to redirect URLs

### 4. Stripe Setup

1. Create a [Stripe account](https://stripe.com)
2. Get test API keys from Dashboard > Developers
3. Set up webhook endpoint: `https://yourdomain.com/api/stripe/webhook`
4. Add event: `checkout.session.completed`

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 👥 User Roles

| Role | Access |
|------|--------|
| **Admin** | Full platform control, host approvals, revenue dashboard |
| **Host** | Create events, go live, earn 50% of tickets |
| **Audience** | Buy tickets, watch streams, network |

### Becoming a Host
1. Sign in as audience
2. Go to `/dashboard/become-host`  
3. Submit application
4. Admin approves → instantly get host dashboard

### Creating an Admin
Run this in Supabase SQL Editor:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

---

## 💰 Revenue Model

```
Ticket sold: $7
├── Host earns: $3.50 (50%)
└── Platform earns: $3.50 (50%)
```

- Basic tier: live + 7-day replay  
- VIP tier: 3x price, lifetime access + networking lounge

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── auth/
│   │   ├── login/page.tsx    # Login (Google + Magic Link)
│   │   └── callback/route.ts # Auth callback
│   ├── dashboard/
│   │   ├── page.tsx          # Audience dashboard
│   │   ├── tickets/page.tsx  # My tickets
│   │   ├── network/page.tsx  # Connections
│   │   └── become-host/page.tsx
│   ├── host/
│   │   ├── page.tsx          # Host dashboard
│   │   └── create/page.tsx   # Create event
│   ├── admin/
│   │   └── page.tsx          # Admin HQ
│   ├── events/[id]/page.tsx  # Event detail + checkout
│   ├── live/[id]/page.tsx    # Live room (WebRTC + chat)
│   └── api/
│       └── stripe/
│           ├── checkout/route.ts  # Create checkout session
│           └── webhook/route.ts   # Handle payment events
├── components/
│   └── DashboardLayout.tsx   # Shared sidebar layout
├── lib/
│   ├── supabase/client.ts
│   ├── supabase/server.ts
│   ├── stripe/config.ts
│   └── utils.ts
├── middleware.ts             # Auth + role-based routing
supabase/
└── schema.sql               # Full DB schema + RLS policies
```

---

## 🎨 Design System

```css
Colors:
  --grit-bg: #0F172A      /* Dark slate background */
  --grit-card: #1E293B    /* Navy cards */
  --grit-sky: #38BDF8     /* Sky blue accents */
  --grit-gold: #FFD700    /* Gold CTAs */

Fonts: Inter + Space Grotesk
```

---

## 🌟 Key Features

### LinkedIn-Inspired
- ✅ Professional profiles
- ✅ Mutual connections from shared events
- ✅ Post-event connection suggestions
- ✅ RSVP insights and attendee counts
- ✅ Tiered ticket access ($7 basic / $27 VIP)

### Twitch-Inspired
- ✅ AutoMod chat filtering (profanity detection)
- ✅ Host /mute /ban controls
- ✅ Slow mode (10s between messages)
- ✅ Live viewer count ticker (Supabase Presence)
- ✅ Host go-live controls

### Platform
- ✅ WebRTC native streaming (getUserMedia)
- ✅ Realtime dashboards (no page reloads)
- ✅ 50/50 revenue split via Stripe
- ✅ Role-based auth with middleware
- ✅ PWA-ready for mobile Chrome
- ✅ Full RLS security policies

---

## 🚀 Deploy to Vercel

```bash
npm run build
vercel --prod
```

Set environment variables in Vercel Dashboard → Settings → Environment Variables.

Add custom domain `gritclub.live` in Vercel Domains settings.

Update Stripe webhook URL to production endpoint.

---

## 🧪 Test Checklist

- [ ] Guest → `/auth/login` → dashboard (NOT landing)
- [ ] Audience → Apply Host → Admin sees instantly
- [ ] Admin approves → Host dashboard unlocks
- [ ] Host creates $7 event → appears in audience feed
- [ ] Buy ticket → earnings tick up
- [ ] Go Live → chat works
- [ ] Mobile Chrome Android — full navigation

**Test Card:** `4242 4242 4242 4242` · Any exp · Any CVC

---

## 📧 Support

Built with ❤️ for founders by founders.
