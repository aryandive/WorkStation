# **Developer Guidelines & Project Documentation**

## **1\. Project Overview**

**Project Name:** Immersive Productivity Platform (Placeholder)

**Project Description:**

This application is a comprehensive productivity suite designed to help users maintain focus and track their mental well-being. It combines time management techniques with environmental customization. Key features include:

* **Focus Tools:** A customizable Pomodoro timer with visual progress indicators.  
* **Task Management:** A persistent Todo list to track daily objectives.  
* **Journaling:** A reflective journal with local and cloud storage capabilities, including activity rings and calendar views.  
* **Environment:** An audio mixer allowing users to play and mix ambient sounds (rain, forest, white noise) to create their ideal focus atmosphere.  
* **Subscription System:** A tiered access model (Free vs. Premium) integrated with PayPal for monthly/yearly subscriptions.

## **2\. Tech Stack**

### **Core Framework**

* **Frontend:** [Next.js 14+](https://nextjs.org/) (App Router architecture)  
* **Language:** JavaScript (ES6+)  
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) with clsx and tailwind-merge.  
* **UI Components:** Custom components built with Radix UI primitives (via components/ui folder).

### **Backend & Services**

* **Authentication & Database:** [Supabase](https://supabase.com/) (Auth, PostgreSQL).  
* **Payments:** [PayPal SDK](https://developer.paypal.com/home) (Subscriptions API & Webhooks).  
* **Tunneling:** [Ngrok](https://ngrok.com/) (Used for testing PayPal webhooks locally).

### **State Management**

* **React Context:**  
  * AuthContext: User session management.  
  * SubscriptionContext: Premium status handling.  
  * EnvironmentContext: Audio player and volume state.  
* **Custom Hooks:** usePomodoroTimer, useSessionLogger, useStats.

## **3\. Important Commands**

Ensure you are in the root directory before running these commands.

| Command | Description |
| :---- | :---- |
| npm install | Installs all dependencies listed in package.json. |
| npm run dev | Starts the local development server at http://localhost:3000. |
| npm run build | Compiles the application for production. |
| npm start | Runs the built production application. |
| npm run lint | Runs ESLint to check for code quality issues. |

## **4\. Development Workflow**

### **A. Initial Setup**

1. Clone the repository.  
2. Run npm install.  
3. **Environment Variables:** Create a .env.local file in the root. Refer to lib/environmentConfig.js for required keys. You will need:  
   * NEXT\_PUBLIC\_SUPABASE\_URL  
   * NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY  
   * NEXT\_PUBLIC\_PAYPAL\_CLIENT\_ID  
   * PAYPAL\_CLIENT\_SECRET (Server-side only)  
   * PAYPAL\_WEBHOOK\_ID

### **B. Working with Payments (PayPal)**

Since the app handles subscriptions via webhooks (app/api/paypal/webhook/route.js), testing requires the local server to be exposed to the internet.

1. Start your Next.js app: npm run dev.  
2. Start ngrok: ngrok http 3000 (Configuration found in ngrok.yml).  
3. Update the Webhook URL in your PayPal Developer Dashboard to the URL provided by ngrok (e.g., https://\<id\>.ngrok.io/api/paypal/webhook).

### **C. Directory Structure**

* **app/**: Contains all pages and API routes.  
  * app/api/: Backend logic (PayPal webhooks, debug routes).  
  * app/auth/: Supabase auth callback routes.  
  * app/journal/, app/login/, etc.: Application views.  
* **components/**:  
  * ui/: Reusable primitive components (buttons, sliders, cards).  
  * pomodoro/, journal/, environment/: Feature-specific components.  
* **lib/**: Utility functions, Supabase clients, and configuration constants.  
* **hooks/**: Custom React hooks for logic separation.

## **5\. Additional Helpful Information**

### **Authentication Flow**

The app uses Supabase Auth.

1. **Sign Up/Login:** Handled in app/login and app/signup.  
2. **Middleware:** middleware.js protects routes. It checks for a Supabase session and redirects unauthenticated users away from protected routes (like /journal).  
3. **Context:** AuthContext.js listens for auth state changes and makes the user object available globally.

### **Journaling Logic**

Journaling works in a hybrid mode (referenced in lib/localJournal.js):

* **Unauthenticated Users:** Data may be stored in localStorage (logic to be verified in hooks/).  
* **Authenticated Users:** Data is synced to the Supabase database.  
* **Components:** The editor supports rich text interaction via TextEditor.js.

### **Audio/Environment System**

The EnvironmentPanel.js and MasterPlayer.js control the audio.

* Audio files are typically lazy-loaded to prevent performance bottlenecks.  
* State is managed in EnvironmentContext.js to ensure audio persists as the user navigates between pages.

### **Deployment**

The project is configured for deployment on **Vercel**.

1. Push code to GitHub.  
2. Import project into Vercel.  
3. **Critical:** Add all Environment Variables from your .env.local to the Vercel Project Settings.