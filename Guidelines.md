# **WorkStation - Developer Guidelines & Project Documentation**

## **1. Project Overview**

**Project Name:** WorkStation
**Founder:** Aryan Dive
**Core Narrative:** An underdog, student-built productivity suite designed as a free/affordable alternative to expensive corporate SaaS products. 

**Project Description:**
WorkStation is a comprehensive productivity web application designed to help users maintain focus and track their mental well-being. It combines time management techniques with environmental customization. 

**Key Features:**
* **Focus Tools:** A customizable Pomodoro timer with visual progress indicators that runs in the background.
* **Task Management:** A persistent Todo list to track daily objectives.
* **Journaling:** A reflective journal with Local (browser) and Cloud (Supabase) storage capabilities.
* **Environment:** An audio mixer allowing users to play and mix ambient sounds (rain, forest, white noise, etc.) to create their ideal focus atmosphere.
* **Authentication:** Passwordless/Standard auth via Supabase.
* **Hybrid Storage:** Seamless transition from unauthenticated (local storage) to authenticated (cloud sync) states.

---

## **2. Pricing & Business Model (The "Server Fund" Strategy)**

WorkStation uses a specific psychological pricing model designed for immediate cash flow to fund infrastructure, utilizing the "Decoy Effect."

### **The Tiers:**
1. **Starter (Free):** * Local browser storage only, 30 journal entry limit, basic sounds. 
   * *Goal:* Lower the barrier to entry so users can experience the app immediately.
2. **The Renter (Monthly - $4.99/mo):** * Full cloud sync, unlimited entries, full ambiance library. 
   * *Goal:* Acts as the "Price Anchor." We display a $59.88/yr strikethrough to make the Lifetime deal look irresistible. Managed via PayPal Subscriptions.
3. **The Believer (Lifetime - $19.99 One-Time):** * "The Server Fund" project. Limited to 25 users. 
   * *Goal:* Generate immediate capital ($500) to pay for a Hetzner CX22 VPS and Apple Developer fees for the year. Managed via PayPal Checkout (One-Time Order).

### **Refund Policy (14-Day Manual):**
To build trust as a solo developer, we offer a 14-day performance-based guarantee for Lifetime buyers. Refunds are processed manually via email (`support@workstation.com`) to prevent automated exploitation.

---

## **3. Tech Stack**

### **Core Framework**
* **Frontend:** [Next.js 14+](https://nextjs.org/) (App Router architecture)
* **Language:** JavaScript (ES6+)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) with `clsx` and `tailwind-merge`.
* **UI Components:** Custom components built with Radix UI primitives (`components/ui` folder) and Shadcn-ui patterns.

### **Backend & Services**
* **Authentication & Database:** [Supabase](https://supabase.com/) (Auth, PostgreSQL).
* **Payments:** [PayPal SDK](https://developer.paypal.com/home) 
  * Uses `@paypal/react-paypal-js`.
  * Integrates both `intent="subscription"` (Monthly) and `intent="capture"` (Lifetime).
* **Hosting (Target):** Netlify / Cloudflare Pages (Frontend) + Hetzner CX22 VPS (Future Backend/Self-hosting).

---

## **4. Important Commands**

Ensure you are in the root directory before running these commands.

| Command | Description |
| :--- | :--- |
| `npm install` | Installs all dependencies listed in `package.json`. |
| `npm run dev` | Starts the local development server at `http://localhost:3000`. |
| `npm run build` | Compiles the application for production. |
| `npm start` | Runs the built production application. |
| `npm run lint` | Runs ESLint to check for code quality issues. |

---

## **5. Development Workflow & Architecture**

### **A. Initial Setup & Environment Variables**
1. Clone the repository and run `npm install`.
2. Create a `.env.local` file in the root. You will need:
   * `NEXT_PUBLIC_SUPABASE_URL`
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   * `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
   * `PAYPAL_CLIENT_SECRET` (Server-side only)
   * `PAYPAL_WEBHOOK_ID`
   * `NEXT_PUBLIC_PAYPAL_MONTHLY_PLAN_ID`

### **B. Working with Payments (PayPal)**
Because we have two different payment types, the integration is split:
* **Monthly:** Handled by `<PayPalSubscriptionButton />` invoking `actions.subscription.create`.
* **Lifetime:** Handled directly in `PricingCard` using `<PayPalButtons />` invoking `actions.order.create`.
* **Webhooks:** Local testing requires tunneling.
  1. Start Next.js: `npm run dev`
  2. Start ngrok: `ngrok http 3000`
  3. Update the Webhook URL in your PayPal Developer Dashboard to the ngrok URL (e.g., `https://<id>.ngrok.app/api/paypal/webhook`).

### **C. State Management**
* **AuthContext:** Manages Supabase user sessions globally.
* **SubscriptionContext:** Checks if a user has active Pro/Lifetime status and grants access to premium features.
* **EnvironmentContext:** Manages the global audio player (`MasterPlayer.js`). Ensures rain/lo-fi beats continue playing uninterrupted as the user navigates between the timer, journal, and pricing pages.

### **D. Directory Structure**
* `app/`: Next.js App Router (Pages, Layouts, API routes).
  * `api/paypal/`: Webhook processing and subscription creation.
  * `pricing/`, `help/`, `contact/`: Marketing and support pages.
* `components/`:
  * `ui/`: Reusable primitives (Buttons, Inputs, Textareas).
  * `environment/`: Audio mixer and visual background logic.
  * `journal/`: Rich text editor, calendar, and activity rings.
* `lib/`: 
  * `localJournal.js`: Handles IndexedDB/LocalStorage fallback for free users.
  * `supabaseClient.js`: Database connection.

---

## **6. Deployment Strategy**

**Phase 1 (Zero-Budget Launch):**
* **Frontend:** Deploy to **Netlify** (Starter Tier). 
  * *Why:* Vercel's Free Hobby Tier strictly prohibits commercial activity (payments). Netlify allows commercial use on their free tier, protecting the app from sudden TOS bans.
* **Database:** Supabase Free Tier (500MB is sufficient for ~100k+ text-based journal entries).

**Phase 2 (Post-Lifetime Sales):**
* **Infrastructure:** Migrate to a **Hetzner CX22 VPS** (Located in Germany/Helsinki for 20TB bandwidth to handle audio assets).
* **Setup:** Install Ubuntu 24.04 and use Docker/Coolify to manage the Next.js frontend and self-hosted databases securely.

---

## **7. Marketing & Content Strategy**
* **Core Identity:** Authentic, broke student developer. Avoid corporate jargon ("Glitch in the matrix"). Use radical honesty ("The Server Fund").
* **Content:** Short-form (Reels/Shorts/TikTok) focusing on the "Aesthetic" (rain + dark mode) and the "Student Struggle" (3 AM coding sessions).
* **Rule of Thumb:** Show, don't tell. Let the UI and the audio speak for themselves.