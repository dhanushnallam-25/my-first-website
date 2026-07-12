# WealthFlow — Secure Personal Wealth Planner

WealthFlow is a robust, responsive, and secure personal finance tracker and budgeting application. Engineered as a high-fidelity React Single Page Application (SPA) compiled with Vite, it features a persistent offline-first layout backed by an isolated `localStorage` multi-user simulation layer.

---

## 🎨 Core Architectural Features

1. **Simulated Multi-User Session Authentication**:
   - Zero passwords required: users sign in/up securely using their email credentials.
   - Dynamic, isolated database buckets: transactions, custom budgets, savings goals, and alerts for `User A` are fully isolated from `User B` inside the browser's persistent state.
   - Intelligent first-time auto-seeding: new registrants are welcomed with rich, realistic transaction profiles, active budget targets, upcoming invoice reminders, and historical cash flow graphs so they immediately see the full power of WealthFlow's reporting engine.

2. **Ledger & Cash Flow Management**:
   - Sortable, searchable, and paginated transaction logs.
   - Quick Transaction Injector widget to log incomes or expenditures instantly on the fly.
   - Advanced filtering capabilities by flow type, custom date criteria, or category.

3. **Dynamic Budgeting Barriers & Goals**:
   - Visual progress bars reflecting actual monthly category spent-to-limit ratios.
   - Color-coded warnings (amber warnings for 80% capacity, pulsing crimson limits for budget overruns).
   - Milestones Savings Vault to set aside capital towards specific goals with custom color accents and rapid increments.

4. **Advanced Financial Analytics**:
   - High-performance visual metrics powered by `recharts` (10-Day area rolling trends & historical comparison comparisons).
   - Category spent distribution donut chart with center sum calculations.
   - Automated Financial Health Assessment scoring (0-100 pts) evaluating savings buffer, budget discipline, and settlement standings.

5. **Financial Timeline & Invoices**:
   - Interactive monthly calendar showing scheduled bills, salary deposits, and expenditures.
   - Inspector pane displaying specific transactions on any selected date.
   - Custom upcoming bill scheduling and quick-settle modules.

6. **Data Portability Hub**:
   - Export and import transaction histories as standard `.csv` spreadsheets.
   - Complete JSON backup database exporting and restoration to guarantee total control over personal datasets.

---

## 📁 Project Directory Structure

```text
├── assets/                  # Public resources and icons
├── src/
│   ├── components/
│   │   ├── Auth.tsx         # Unified Sign-in & Sign-up view
│   │   ├── Layout.tsx       # Responsive outer grid & top utilities
│   │   ├── Dashboard.tsx    # Summary analytics and quick inject widgets
│   │   ├── Transactions.tsx # Paginated ledger and CSV import/export manager
│   │   ├── Budgets.tsx      # Spend limit barrier widgets & target milestones
│   │   ├── Analytics.tsx    # Interactive recharts, category pies & health score
│   │   ├── Calendar.tsx     # 35-day financial timeline and bill scheduler
│   │   └── Settings.tsx     # Preference configurations & database backup
│   ├── context/
│   │   └── AuthContext.tsx  # Simulated Auth state & localized DB queries
│   ├── types.ts             # Strict global TypeScript interfaces
│   ├── index.css            # Google Font imports & Tailwind 4 styles
│   ├── main.tsx             # React SPA mounting root
│   └── App.tsx              # Dynamic tab navigation and session router
├── package.json             # Scripts & system dependencies
├── vite.config.ts           # Vite compilation schema
└── tsconfig.json            # Strict type safety configurations
```

---

## 🚀 Local Installation & Setup

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** or **yarn**

### 1. Install Dependencies
Initialize package dependencies:
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to establish local configurations:
```bash
cp .env.example .env
```
Configure your credentials in `.env`:
- `GEMINI_API_KEY`: Key for server-side smart advisors (if integrated).
- `APP_URL`: Base application routing hostname.

### 3. Launch Development Server
Boot the local development server on port `3000`:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the live app.

---

## 🧪 Automated Testing & CI/CD Pipeline

To ensure rigorous code quality and prevent runtime errors during code refactoring or deployments, WealthFlow includes pre-configured automated checking tools that integrate seamlessly into GitHub Actions or alternative CI/CD suites.

### Run Type Safety Analysis
Analyze the codebase for TypeScript compilation errors or unresolved imports:
```bash
npm run lint
```

### Dry-run Production Build
Test compiling the application under strict production guidelines to ensure compatibility:
```bash
npm run build
```

---

## 📦 Production Bundling & Deployment

### Build the Application
Compile the React SPA into static, hyper-optimized HTML/JS/CSS assets inside the `/dist` directory:
```bash
npm run build
```

### Web SPA Hosting
Since WealthFlow is a client-side offline-first powerhouse, the compiled `/dist` directory can be deployed directly to any static web host, including:
- **Google Cloud Run** (served via standard Nginx/Node proxies)
- **Vercel** or **Netlify**
- **GitHub Pages**
- **Firebase Hosting**
