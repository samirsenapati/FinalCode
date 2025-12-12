# 🚀 FinalCode

**The AI-Powered Vibe Coding Platform**

Build apps by simply describing what you want. FinalCode uses AI to generate clean, working code instantly.

![FinalCode Screenshot](https://via.placeholder.com/800x400/1e1e1e/ffffff?text=FinalCode+IDE)

## ✨ Features

- **🤖 AI Code Generation** - Describe what you want, get working code
- **📝 Professional Code Editor** - Syntax highlighting, autocomplete, VS Code theme
- **👁️ Live Preview** - See changes in real-time
- **📁 File Management** - Create, edit, delete project files
- **🎨 Modern UI** - Clean, professional interface
- **📱 Responsive Preview** - Test desktop, tablet, and mobile views
- **🚀 One-Click Deploy** - Deploy your apps instantly (coming soon)

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

```bash
npm install
```

### Step 3: Configure AI (Required)

1. **Get an API Key:**
   - Go to [console.anthropic.com](https://console.anthropic.com/)
   - Sign up or log in
   - Create a new API key

2. **Add the Key:**
   - Copy `.env.example` to `.env.local`:
     ```bash
     cp .env.example .env.local
     ```
   - Open `.env.local` and add your key:
     ```
     ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
     ```

### Step 4: Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) - You're ready to code! 🎉

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

---

## 📁 Project Structure

```
finalcode/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts      # AI chat endpoint
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Main IDE page
├── components/
│   └── editor/
│       ├── AIChat.tsx        # AI chat sidebar
│       ├── CodeEditor.tsx    # Code editor (CodeMirror)
│       ├── FileTree.tsx      # File explorer
│       ├── Preview.tsx       # Live preview
│       └── Terminal.tsx      # Output terminal
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
6. Click "Deploy"

Your app will be live at `https://your-project.vercel.app`!

### Environment Variables for Production

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Your Claude API key |
| `NEXT_PUBLIC_SITE_URL` | No | Your domain (for OAuth) |

---

## 💡 Troubleshooting

### "API Key Required" Error
- Make sure `.env.local` exists in the project root
- Check that your API key is correct (starts with `sk-ant-`)
- Restart the dev server after adding the key

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

- [ ] **User Authentication** - Save projects to your account
- [ ] **Database Integration** - Persist projects
- [ ] **Real Deployment** - Deploy user apps to custom URLs
- [ ] **Collaboration** - Work together in real-time
- [ ] **Templates** - Start from pre-built templates
- [ ] **More Languages** - Python, TypeScript, React
- [ ] **AI Improvements** - Smarter code generation

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
- [CodeMirror](https://codemirror.net/) - Code editor
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Claude AI](https://anthropic.com/) - AI assistance
- [Lucide Icons](https://lucide.dev/) - Icons

---

**Made with 💜 by the FinalCode team**

Questions? [Open an issue](https://github.com/YOUR_USERNAME/finalcode/issues) or reach out!
