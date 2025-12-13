# Deployment & Hosting Guide

FinalCode now supports one-click deployment and instant preview sharing! This guide will help you set up and use these features.

## 🚀 Features

### 1. **One-Click Deployment to Cloudflare Pages**
Deploy your static sites and React apps to the internet with a single click. Your app gets:
- A unique subdomain (e.g., `my-app-abc123.finalcode.dev`)
- Free SSL/HTTPS
- Global CDN distribution
- Automatic build optimization

### 2. **Instant Preview Sharing**
Share your work instantly with temporary preview links:
- Generate shareable URLs in seconds
- No deployment needed
- Links expire after 24 hours
- Perfect for feedback and collaboration

### 3. **Live Preview Panel**
Real-time preview as you code:
- Automatic updates on code changes
- Responsive viewport testing (desktop, tablet, mobile)
- Support for HTML/CSS/JS and React/JSX
- Browser-based React compilation

---

## 📋 Prerequisites

### For Deployment (Optional)

To enable deployment features, you'll need:

1. **Cloudflare Account** (Free)
   - Sign up at [cloudflare.com](https://cloudflare.com)

2. **Cloudflare API Token**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
   - Click "Create Token"
   - Use the "Edit Cloudflare Pages" template
   - Copy the generated token

3. **Cloudflare Pages Project**
   - Go to [Cloudflare Pages](https://dash.cloudflare.com/pages)
   - Create a new project named `finalcode` (or your preferred name)
   - You don't need to connect a Git repository

### For Preview Sharing (No Setup Required!)

Preview sharing works out of the box - no additional configuration needed!

---

## ⚙️ Setup Instructions

### Step 1: Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Add your Cloudflare credentials to `.env.local`:

```env
# Cloudflare Pages Deployment
CLOUDFLARE_ACCOUNT_ID=your-account-id-here
CLOUDFLARE_API_TOKEN=your-api-token-here
CLOUDFLARE_PROJECT_NAME=finalcode
```

**How to find your Account ID:**
1. Log in to Cloudflare Dashboard
2. Select any website (or create one)
3. Look for "Account ID" in the right sidebar
4. Copy the ID

### Step 2: Run Database Migrations

The deployment feature needs database tables to track deployments and previews:

```bash
# If using Supabase CLI
supabase db push

# Or manually run the migration SQL in Supabase Dashboard:
# Go to SQL Editor and run: supabase/migrations/20251213_create_deployments.sql
```

### Step 3: Restart Your Development Server

```bash
npm run dev
```

---

## 🎯 How to Use

### Deploying Your App

1. **Create Your App**
   - Use the AI assistant or write code manually
   - Ensure you have an `index.html` file (required)

2. **Click Deploy Button**
   - Click the purple "Deploy" button in the top toolbar
   - Enter a project name when prompted (e.g., "my-todo-app")
   - Wait for deployment to complete (~5-15 seconds)

3. **Access Your Live Site**
   - Your deployment URL appears in the terminal
   - Format: `https://my-app-abc123.finalcode.dev`
   - Click "Copy Deploy URL" to copy the link
   - Share it with anyone!

**Deployment Process:**
```
> Deploying to Cloudflare Pages...
> Building project...
✓ Build completed
✓ Deploying assets to Cloudflare...
✓ Deployed successfully!
🔗 https://my-app-abc123.finalcode.dev
📦 Subdomain: my-app-abc123.finalcode.dev
```

### Sharing a Preview

1. **Write Some Code**
   - Create or edit your files

2. **Click Share Button**
   - Click the blue "Share" button in the top toolbar
   - Preview URL is automatically created and copied to clipboard
   - Link expires in 24 hours

3. **Share the Link**
   - Paste the URL anywhere (email, Slack, Discord, etc.)
   - Anyone can view your preview
   - No authentication required

**Preview Creation:**
```
> Creating shareable preview...
✓ Preview created successfully!
🔗 http://localhost:3000/preview/abc123xyz
📋 URL copied to clipboard
⏰ Expires: 12/14/2025, 3:45 PM
```

### Using Live Preview

The live preview panel updates automatically:

1. **Toggle Preview Panel**
   - Click the eye icon in the toolbar
   - Or use the keyboard shortcut (coming soon)

2. **Test Responsive Design**
   - Click the viewport icons (Desktop, Tablet, Mobile)
   - Preview resizes to standard screen sizes

3. **Open in New Tab**
   - Click the external link icon
   - Opens a full-browser preview

---

## 🛠️ Supported Project Types

### Static HTML/CSS/JS Sites ✅

**Files Required:**
- `index.html` (required)
- `style.css` (optional)
- `script.js` (optional)

**Example:**
```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
  <title>My App</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Hello World!</h1>
  <script src="script.js"></script>
</body>
</html>
```

### React/JSX Apps ✅

**Files Required:**
- `App.jsx` or `main.jsx` (at least one)
- `style.css` (optional)

**Example:**
```jsx
// App.jsx
function App() {
  const [count, setCount] = React.useState(0);

  return (
    <div>
      <h1>React Counter</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
```

**How it works:**
- React and ReactDOM loaded from CDN
- Babel standalone compiles JSX in-browser
- No build step required for preview
- Deployment bundles everything for production

---

## 📊 Managing Deployments

### View Deployment History

All your deployments are stored in the database:

```javascript
// Fetch your deployments
const response = await fetch('/api/deploy');
const { deployments } = await response.json();
```

### Check Deployment Status

```javascript
// Get specific deployment
const response = await fetch(`/api/deploy?id=${deploymentId}`);
const { deployment } = await response.json();

console.log(deployment.status); // 'success', 'failed', 'pending', etc.
```

### Deployment Statuses

- `pending` - Deployment created, waiting to build
- `building` - Code is being bundled
- `deploying` - Assets being uploaded to Cloudflare
- `success` - Live and accessible
- `failed` - Deployment failed (check error_message)

---

## 🔧 Troubleshooting

### Deployment Fails

**Error: "Cloudflare credentials not configured"**
- Solution: Add `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` to `.env.local`

**Error: "index.html is required for deployment"**
- Solution: Create an `index.html` file in your project

**Error: "Failed to create Cloudflare deployment"**
- Check your API token has "Cloudflare Pages - Edit" permissions
- Verify your Account ID is correct
- Ensure the Cloudflare project exists

### Preview Not Loading

**Error: "Preview has expired"**
- Previews expire after 24 hours
- Create a new preview or use deployment for permanent hosting

**Error: "Preview not found"**
- Preview may have been deleted
- Check the preview ID in the URL

### React Preview Not Working

**Error: "Define an App component to render"**
- Ensure you have a function called `App` in your JSX file
- Use this pattern:
  ```jsx
  function App() {
    return <div>Hello!</div>;
  }
  ```

**Blank React Preview**
- Check browser console for errors (F12)
- Verify JSX syntax is correct
- Make sure file is named `App.jsx` or `main.jsx`

---

## 🔒 Security & Privacy

### Deployment Security

- All deployments require authentication
- Users can only view/manage their own deployments
- SSL/HTTPS enabled by default
- Row Level Security (RLS) enabled on database

### Preview Security

- Previews are publicly accessible (no auth required)
- Preview URLs are unguessable (cryptographically random)
- Previews auto-expire after 24 hours
- Users can delete their previews anytime

### Best Practices

- ⚠️ Don't deploy apps with sensitive data
- ⚠️ Don't include API keys in client-side code
- ✅ Use environment variables for secrets (server-side only)
- ✅ Review code before sharing previews

---

## 🚀 Advanced Usage

### Custom Subdomain Pattern

Modify the subdomain generation in `/app/api/deploy/route.ts`:

```typescript
const subdomain = `${sanitizedProjectName}-${randomId}`;
// Change to:
const subdomain = `${username}-${projectName}-${timestamp}`;
```

### Extend Preview Expiration

Change expiration time (default: 24 hours):

```typescript
// In EditorPage.tsx
body: JSON.stringify({
  files,
  expiresInHours: 48, // 2 days
})
```

### Custom Deployment Domain

To use your own domain instead of `finalcode.dev`:

1. Add a custom domain in Cloudflare Pages settings
2. Update the deployment URL generation in `/app/api/deploy/route.ts`

---

## 📚 API Reference

### POST `/api/deploy`

Deploy a project to Cloudflare Pages.

**Request:**
```json
{
  "projectName": "my-app",
  "files": {
    "index.html": "<!DOCTYPE html>...",
    "style.css": "body { ... }",
    "script.js": "console.log('Hello');"
  }
}
```

**Response:**
```json
{
  "success": true,
  "deploymentUrl": "https://my-app-abc123.finalcode.dev",
  "subdomain": "my-app-abc123",
  "deploymentId": "uuid-here"
}
```

### POST `/api/preview`

Create a temporary preview URL.

**Request:**
```json
{
  "files": {
    "index.html": "<!DOCTYPE html>...",
    "style.css": "body { ... }"
  },
  "expiresInHours": 24
}
```

**Response:**
```json
{
  "success": true,
  "previewUrl": "http://localhost:3000/preview/abc123xyz",
  "previewId": "abc123xyz",
  "expiresAt": "2025-12-14T15:45:00Z"
}
```

### GET `/api/deploy`

Get deployment history or specific deployment.

**Get all deployments:**
```
GET /api/deploy
```

**Get specific deployment:**
```
GET /api/deploy?id=uuid-here
```

### GET `/api/preview?id={previewId}`

Retrieve a preview's files.

**Response:**
```json
{
  "success": true,
  "preview": {
    "id": "abc123xyz",
    "files": { "index.html": "..." },
    "expiresAt": "2025-12-14T15:45:00Z",
    "createdAt": "2025-12-13T15:45:00Z"
  }
}
```

---

## 🎉 What's Next?

Planned features for future releases:

- [ ] Custom domain support
- [ ] Deployment history UI
- [ ] Rollback to previous deployments
- [ ] Environment variables per deployment
- [ ] Build logs and analytics
- [ ] Collaborative previews with comments
- [ ] CI/CD integration
- [ ] Docker container deployments
- [ ] Database deployment (Supabase, Postgres)
- [ ] Serverless function support

---

## 💬 Need Help?

- 📖 [Main Documentation](../README.md)
- 🐛 [Report Issues](https://github.com/samirsenapati/FinalCode/issues)
- 💡 [Feature Requests](https://github.com/samirsenapati/FinalCode/discussions)

---

**Happy Deploying! 🚀**
