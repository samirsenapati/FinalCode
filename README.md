# 🚀 FinalCode

**The AI-Powered Vibe Coding Platform**

Build apps by simply describing what you want. FinalCode uses AI to generate clean, working code instantly.

![FinalCode Screenshot](https://via.placeholder.com/800x400/1e1e1e/ffffff?text=FinalCode+IDE)

## ✨ Features

- **🔐 User Authentication** - Supabase auth (email/password + GitHub OAuth)
- **🤖 AI Code Generation (BYOK)** - Use your own OpenAI/Anthropic key (stored only in browser localStorage)
- **📝 Code Editor** - CodeMirror editor with syntax highlighting
- **👁️ Live Preview** - Real-time preview (static + React/JSX via Babel standalone)
- **📁 Projects (Save/Load)** - Create, list, open, delete projects and auto-save files to Supabase DB
- **⚡ Run JavaScript (in-browser)** - Execute JS with WebContainers (Node in the browser)

> Note: Deploy/Share are currently hidden in the UI for Scope B.

---

## 🛠️ Quick Setup (5 minutes)

### Step 1: Download the Project

If you have Git installed:
```bash
git clone https://github.com/YOUR_USERNAME/finalcode.git
cd finalcode
```

Or download as ZIP from GitHub and extract it.

### Step 2: Install Dependencies

This repo uses **Yarn**:

```bash
cd frontend
yarn install
```

### Step 3: Configure AI (BYOK)

FinalCode uses **BYOK (Bring Your Own Key)**:
- You paste your OpenAI or Anthropic API key in the app (AI Settings)
- The key is stored **only in your browser localStorage**
- The key is **never stored in Supabase**

⚠️ Because this MVP calls provider APIs directly from the browser, do not use highly privileged keys.

### Step 4: Configure Supabase Auth + Database (Required)

1. **Create a Supabase Project:**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project or select an existing one
   - Navigate to **Settings** → **API** to find your credentials

2. **Enable Email Auth:**
   - Go to **Authentication** → **Providers**
   - Enable **Email** provider
   - Configure email templates if desired

3. **Run Database Migrations:**
   - Go to **SQL Editor** in your Supabase dashboard
   - Run the migration file: `supabase/migrations/20251213_create_deployments.sql`
   - This creates tables for deployments and preview URLs

4. **Enable GitHub OAuth (Optional):**
   - Go to **Authentication** → **Providers**
   - Enable **GitHub** provider
   - Follow [Supabase's GitHub OAuth guide](https://supabase.com/docs/guides/auth/social-login/auth-github) to create a GitHub OAuth App
   - Add the callback URL: `https://your-project.supabase.co/auth/v1/callback`
   - Copy your GitHub Client ID and Client Secret into Supabase

5. **Add Environment Variables:**
   - Copy `.env.example` to `.env.local`:
     ```bash
     cp .env.example .env.local
     ```
   - Add your Supabase credentials to `.env.local` (⚠️ **do not commit this file**):
     ```
     NEXT_PUBLIC_SUPABASE_URL=your-project-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     # Optional: only set if deployed somewhere other than localhost
     NEXT_PUBLIC_SITE_URL=https://your-deployment-url
     ```

### Step 5: Run the App

```bash
npm run dev
```

The dev server binds to `0.0.0.0:3000` so it is reachable from host machines, Codespaces previews, or forwarded ports. Confirm it’s up with:

```bash
curl -I http://localhost:3000
```

Then open [http://localhost:3000](http://localhost:3000) in your browser — you're ready to code! 🎉

---

## 📖 How to Use FinalCode

### Basic Usage

1. **Open the AI Chat** (right sidebar with ✨ icon)
2. **Describe what you want to build:**
   - "Create a beautiful todo app"
   - "Build a calculator with a modern design"
   - "Make a landing page for a coffee shop"
3. **Watch the magic** - AI generates the code
4. **Click Run** to see it work
5. **Customize** - Edit the code directly in the editor

### Tips for Better Results

- Be specific: "Create a todo app with dark mode and animations"
- Mention design preferences: "Use a minimalist blue and white color scheme"
- Ask for features: "Add a button that shows a random quote"
- Iterate: "Now add a feature to mark tasks as complete"

### Deployment & Sharing

1. **Share Preview** (Blue Button) - Create a temporary shareable link (expires in 24 hours)
   - Perfect for getting feedback or showing work-in-progress
   - No deployment needed, instant URL generation
   - Anyone can view without authentication

2. **Deploy** (Purple Button) - Deploy to Cloudflare Pages for permanent hosting
   - Creates a live, public URL (e.g., `https://my-app-abc123.finalcode.dev`)
   - Free SSL/HTTPS and global CDN
   - Requires [Cloudflare setup](docs/DEPLOYMENT.md) (optional)

📚 **[Full Deployment Guide →](docs/DEPLOYMENT.md)**

---

## 📁 Project Structure

```
finalcode/
├── app/
│   ├── api/
│   │   ├── chat/route.ts     # AI chat endpoint
│   │   ├── deploy/route.ts   # Cloudflare Pages deployment
│   │   └── preview/route.ts  # Temporary preview URLs
│   ├── preview/[id]/page.tsx # Public preview viewer
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   ├── login/page.tsx        # Supabase auth page
│   ├── auth/callback/route.ts# Supabase OAuth callback handler
│   ├── actions/              # Server actions (auth)
│   └── page.tsx              # Main IDE page (protected)
├── components/
│   ├── auth/
│   │   └── AuthForm.tsx      # Sign in / sign up UI
│   └── editor/
│       ├── AIChat.tsx        # AI chat sidebar
│       ├── CodeEditor.tsx    # Code editor (CodeMirror)
│       ├── EditorPage.tsx    # Main IDE container
│       ├── FileTree.tsx      # File explorer
│       ├── Preview.tsx       # Live preview (supports React)
│       └── Terminal.tsx      # Output terminal
├── lib/supabase/             # Supabase client helpers
│   ├── client.ts             # Browser client for Supabase
│   └── server.ts             # Server client with auth cookies
├── supabase/migrations/      # Database migrations
│   └── 20251213_create_deployments.sql
├── docs/
│   └── DEPLOYMENT.md         # Deployment guide
├── .env.example              # Environment template
├── package.json              # Dependencies
└── README.md                 # This file
```

---

## 🚀 Deploy to Production

### Deploy to Vercel (Recommended - Free)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Add environment variables:
   - `ANTHROPIC_API_KEY` = your API key
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
   - `NEXT_PUBLIC_SITE_URL` = your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
6. Click "Deploy"

Your app will be live at `https://your-project.vercel.app`!

### Environment Variables for Production

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Your Claude API key |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous client key |
| `NEXT_PUBLIC_SITE_URL` | No | Public site URL for OAuth redirects |
| `NEXT_PUBLIC_APP_URL` | No | App URL for preview URLs |
| `CLOUDFLARE_ACCOUNT_ID` | No* | Cloudflare account ID (for deployments) |
| `CLOUDFLARE_API_TOKEN` | No* | Cloudflare API token (for deployments) |
| `CLOUDFLARE_PROJECT_NAME` | No | Cloudflare Pages project name (default: finalcode) |

\* Required only if you want to enable the deployment feature

---

## 💡 Troubleshooting

### "API Key Required" Error
- Make sure `.env.local` exists in the project root
- Check that your API key is correct (starts with `sk-ant-`)
- Restart the dev server after adding the key

### "Connection Refused" on http://localhost:3000
- Start the dev server with `npm run dev` (it listens on 0.0.0.0:3000)
- If you’re on a remote/dev container, open the forwarded port 3000 or the preview link
- Re-run `curl -I http://localhost:3000` to confirm a 200/307 response

### Preview Not Updating
- Click the Refresh button in the preview panel
- Check the Terminal for errors
- Make sure your HTML is valid

### Code Not Saving
- Files are saved in memory during the session
- Use Ctrl+S / Cmd+S to save (future feature)
- Your code will reset when you refresh the page

---

## 🛣️ Roadmap

- [x] **User Authentication** - Secure login with Supabase ✅
- [x] **Real Deployment** - Deploy to Cloudflare Pages ✅
- [x] **Preview Sharing** - Temporary shareable URLs ✅
- [x] **React Support** - Browser-based JSX compilation ✅
- [ ] **Database Integration** - Persist projects to your account
- [ ] **Deployment History** - View and manage all deployments
- [ ] **Collaboration** - Work together in real-time
- [ ] **Templates** - Start from pre-built templates
- [ ] **More Frameworks** - Vue, Svelte, Angular
- [ ] **AI Improvements** - Smarter code generation
- [ ] **Custom Domains** - Use your own domain for deployments

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

---

## 📄 License

MIT License - feel free to use this for your own projects!

---

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Authentication & database
- [CodeMirror](https://codemirror.net/) - Code editor
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Claude AI](https://anthropic.com/) - AI assistance
- [Lucide Icons](https://lucide.dev/) - Icons

---

**Made with 💜 by the FinalCode team**

Questions? [Open an issue](https://github.com/YOUR_USERNAME/finalcode/issues) or reach out!
