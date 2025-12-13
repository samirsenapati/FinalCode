# 🚀 FinalCode

**The AI-Powered Vibe Coding Platform**

Build apps by simply describing what you want. FinalCode uses AI to generate clean, working code instantly.

![FinalCode Screenshot](https://via.placeholder.com/800x400/1e1e1e/ffffff?text=FinalCode+IDE)

## ✨ Features

- **🔐 User Authentication** - Supabase auth (email/password + GitHub OAuth)
- **🤖 AI Code Generation**
  - **Managed AI (default):** server-side keys, per-user rate limits and daily caps
  - **BYOK (optional):** user-provided key stored only in browser localStorage
- **📝 Code Editor** - CodeMirror editor with syntax highlighting
- **👁️ Live Preview** - Real-time preview (static + React/JSX via Babel standalone)
- **📁 Projects (Save/Load)** - Create, list, open, delete projects and auto-save files to Supabase DB
- **⚡ Run JavaScript (in-browser)** - Execute JS with WebContainers (Node in the browser)

> Note: Deploy/Share are currently hidden in the UI for now.

---

## Production Deploy Path (Vercel)

Goal: **users only sign up and use FinalCode**. Supabase is backend infra owned by you.
Users never configure Supabase or any keys.

### 1) Supabase (owned by you)

In your Supabase project:
1. Run migrations in `supabase/migrations/` (recommended if you use Supabase CLI), or run SQL in Supabase SQL Editor.
2. Ensure Auth providers are enabled (Email/Password, and optionally GitHub).
3. Set redirect URLs (see below).

### 2) Vercel deploy

1. Push this repo to GitHub.
2. In Vercel: **New Project** → import the repo.
3. **Root Directory**: `frontend`
4. Build Command: `yarn build`
5. Output: (leave default)
6. Install Command: `yarn install`
7. Add the environment variables below.
8. Deploy.

### 3) Required Vercel Environment Variables

Supabase:
- `NEXT_PUBLIC_SUPABASE_URL` (required)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (required)
- `SUPABASE_SERVICE_ROLE_KEY` (required for Managed AI rate limits + usage caps)

Auth redirects:
- `NEXT_PUBLIC_SITE_URL` (required) → `https://YOUR_APP.vercel.app` (or your custom domain)

Managed AI (server keys):
- `OPENAI_API_KEY` (optional if you want OpenAI managed mode)
- `ANTHROPIC_API_KEY` (optional if you want Anthropic managed mode)

Optional:
- `STRIPE_SECRET_KEY` etc (only needed if you enable billing routes)

### 4) Supabase Auth Redirect URLs (local + prod)

In Supabase Dashboard → Authentication → URL Configuration:
- **Site URL**:
  - Local: `http://localhost:3000`
  - Prod: `https://YOUR_APP.vercel.app` (or custom domain)
- **Redirect URLs** (add both):
  - `http://localhost:3000/auth/callback`
  - `https://YOUR_APP.vercel.app/auth/callback`

This ensures Email confirm and GitHub OAuth redirects work in both environments.

---

## Local Development

```bash
cd frontend
yarn install
yarn dev
```

Open http://localhost:3000

### WebContainers note (important)

WebContainers require **cross-origin isolation**:
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`

This repo already sets these headers in `frontend/next.config.js`.
Some preview/proxy environments may strip headers; if WebContainers fails, test on a direct localhost/HTTPS origin that preserves headers.

### GitHub Codespaces

1. Create a Codespace
2. In the terminal:
   ```bash
   cd frontend
   yarn install
   yarn dev
   ```
3. Open the forwarded port **3000** using the Codespaces "Ports" tab.

If WebContainers doesn't work in the preview URL, it's almost always because COOP/COEP headers are missing/modified by the preview proxy.


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

## Notes

### WebContainers on Vercel (COOP/COEP)

WebContainers require cross-origin isolation. This repo sets:
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`

in `frontend/next.config.js`. Vercel should preserve these headers.
If you run behind an additional proxy/CDN, ensure it does not strip them.

### AI modes

- **Managed AI (default):** calls `/api/ai/chat` from the browser. Server uses your env keys and enforces per-user usage caps via Supabase.
- **BYOK (optional):** user stores their own key in localStorage and calls provider APIs directly.

### Production scripts

- `yarn build` creates the production build.
- `yarn start` starts **next start** when `NODE_ENV=production` and a build exists; otherwise it falls back to dev (useful for local dev + this environment).
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
