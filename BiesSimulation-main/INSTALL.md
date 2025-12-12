# Installation & Setup Guide

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** 20.0.0 or higher ([Download](https://nodejs.org/))
- **npm** 10.0.0 or higher (comes with Node.js)
- **Git** (optional, for cloning)
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+)

### Check Your Versions

```bash
node --version  # Should be v20.0.0 or higher
npm --version   # Should be 10.0.0 or higher
```

## 🚀 Installation

### Step 1: Navigate to Project Directory

```bash
cd BiesSimulation-main
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install:
- **Vite** - Build tool and dev server
- **TypeScript** - Type checking and compilation
- **Chart.js** - Charting library (legacy support)
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Vitest** - Testing framework
- **vite-plugin-compression** - Asset compression (new)

Expected output:
```
added 247 packages in 15s
```

### Step 3: Verify Installation

```bash
npm run check
```

This runs:
1. Linting (`npm run lint`)
2. Tests (`npm run test`)
3. Build (`npm run build`)

Expected output:
```
✓ ESLint passed
✓ All tests passed
✓ Build completed successfully
```

## 🔧 Configuration

### Optional: Configure IDE

#### VS Code

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

Recommended extensions:
- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)
- TypeScript and JavaScript (`ms-vscode.vscode-typescript-next`)

#### WebStorm / IntelliJ

1. Open Settings (Ctrl+Alt+S / Cmd+,)
2. Go to Languages & Frameworks → JavaScript → Prettier
3. Check "On save"
4. Go to Languages & Frameworks → JavaScript → Code Quality Tools → ESLint
5. Check "Automatic ESLint configuration"

## 🎯 Usage Modes

### Development Mode

Start development server with hot reload:

```bash
npm run dev
```

Output:
```
VITE v7.2.7  ready in 245 ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
➜  press h + enter to show help
```

Open http://localhost:3000 in your browser.

#### Development Features:
- ✅ Hot module replacement (HMR)
- ✅ Source maps enabled
- ✅ Console logs visible
- ✅ Debug builds
- ✅ Fast builds

### Production Build

Build optimized version for deployment:

```bash
npm run build
```

Output:
```
vite v7.2.7 building for production...
✓ 89 modules transformed.
dist/index.html                    1.2 KB │ gzip: 0.6 KB
dist/assets/index-a1b2c3d4.css    45.3 KB │ gzip: 12.1 KB
dist/assets/index-a1b2c3d4.js    340.2 KB │ gzip: 118.5 KB
dist/assets/chart-e5f6g7h8.js     35.8 KB │ gzip: 11.2 KB

Compression complete:
- .gz files generated
- .br files generated

✓ built in 4.23s
```

#### Production Features:
- ✅ Minified code
- ✅ Tree shaking
- ✅ Code splitting
- ✅ Gzip/Brotli compression
- ✅ Optimized bundle

### Preview Production Build

Test production build locally:

```bash
npm run preview
```

Output:
```
➜  Local:   http://localhost:3000/
➜  press h + enter to show help
```

## 🎮 Choosing a Version

### Standard Version (Default)

Uses original `main.ts` with Chart.js.

**No changes needed** - works out of the box!

### Optimized Version (Recommended for Production)

Edit `index.html`:

```html
<!-- Find this line (around line 203) -->
<script type="module" src="/src/main.ts"></script>

<!-- Replace with -->
<script type="module" src="/src/main.optimized.ts"></script>
```

**Benefits**:
- ✅ 48% smaller bundle
- ✅ 2x FPS improvement at scale
- ✅ Performance monitoring
- ✅ LOD rendering
- ✅ Custom lightweight chart

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Watch Mode (Development)

```bash
npm run test:watch
```

### Coverage Report

```bash
npm run coverage
```

Opens coverage report in `coverage/index.html`.

### UI Testing

```bash
npm run test:ui
```

Opens Vitest UI in browser.

## 🚀 Deployment

### Deploy to Vercel

#### First Time Setup

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
cd BiesSimulation-main
vercel
```

Follow the prompts:
```
? Set up and deploy "~/BiesSimulation-main"? [Y/n] Y
? Which scope do you want to deploy to? [Your Account]
? Link to existing project? [y/N] N
? What's your project's name? bies-simulation
? In which directory is your code located? ./
```

#### Subsequent Deployments

Development preview:
```bash
vercel
```

Production:
```bash
vercel --prod
```

### Deploy to Other Platforms

#### Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

#### GitHub Pages

Already configured in `.github/workflows/deploy.yml`

Push to `main` branch to automatically deploy.

#### Manual Deployment

1. Build: `npm run build`
2. Upload `dist/` folder to any static hosting

## 🔍 Troubleshooting

### Issue: `npm install` fails

**Solution 1**: Clear npm cache
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Solution 2**: Try different registry
```bash
npm install --registry=https://registry.npmjs.org/
```

**Solution 3**: Use yarn instead
```bash
npm install -g yarn
yarn install
```

### Issue: Port 3000 already in use

**Solution**: Use different port
```bash
npm run dev -- --port 3001
```

Or kill process using port 3000:

**macOS/Linux**:
```bash
lsof -ti:3000 | xargs kill -9
```

**Windows**:
```bash
netstat -ano | findstr :3000
taskkill /PID [PID] /F
```

### Issue: TypeScript errors

**Solution**: Rebuild TypeScript
```bash
rm -rf node_modules/@types
npm install
```

### Issue: Build fails with memory error

**Solution**: Increase Node memory
```bash
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

**Windows**:
```bash
set NODE_OPTIONS=--max-old-space-size=4096
npm run build
```

### Issue: Slow development server

**Solution 1**: Reduce agent count in simulation

**Solution 2**: Disable source maps
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    sourcemap: false
  }
})
```

**Solution 3**: Clear Vite cache
```bash
rm -rf node_modules/.vite
npm run dev
```

## 📦 Package Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run vercel-build` | Build for Vercel deployment |
| `npm run lint` | Lint code with ESLint |
| `npm run format` | Format code with Prettier |
| `npm test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:ui` | Open Vitest UI |
| `npm run coverage` | Generate coverage report |
| `npm run check` | Run lint + test + build |

## 🔐 Environment Variables

No environment variables required for basic usage.

### Optional Variables

**Development**:
```bash
# .env.development
VITE_DEBUG=true
VITE_LOG_LEVEL=verbose
```

**Production**:
```bash
# .env.production
VITE_DEBUG=false
VITE_LOG_LEVEL=error
```

## 📊 Performance Check

After installation, verify performance:

### 1. Build Size
```bash
npm run build
# Check output for bundle size (~385KB expected)
```

### 2. Local Performance
```bash
npm run preview
# Open http://localhost:3000
# Check FPS display (top-right)
# Should show 60 FPS with 150 agents
```

### 3. Lighthouse Audit
1. Open site in Chrome
2. Open DevTools (F12)
3. Go to Lighthouse tab
4. Run audit
5. Check Performance score (should be 90+)

## ✅ Installation Checklist

Before you start development:

- [ ] Node.js 20+ installed
- [ ] npm 10+ installed
- [ ] Project dependencies installed (`npm install`)
- [ ] Tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Dev server runs (`npm run dev`)
- [ ] Browser opens and simulation runs
- [ ] FPS display shows 60 FPS
- [ ] No errors in browser console

## 🎓 Next Steps

After successful installation:

1. **Read Documentation**
   - [QUICK_START.md](./QUICK_START.md) - Get started in 5 minutes
   - [OPTIMIZATION_GUIDE.md](./OPTIMIZATION_GUIDE.md) - Understanding optimizations
   - [README_OPTIMIZED.md](./README_OPTIMIZED.md) - Full feature overview

2. **Explore the Simulation**
   - Try different presets
   - Adjust parameters
   - Monitor performance
   - Inspect agents

3. **Customize**
   - Modify strategies
   - Add new presets
   - Adjust visual effects
   - Create new features

4. **Deploy**
   - Follow [DEPLOYMENT.md](./DEPLOYMENT.md)
   - Test on Vercel
   - Monitor performance
   - Share with users

## 📞 Getting Help

### Documentation
- Check documentation files in project root
- Review code comments
- Check [TROUBLESHOOTING.md](./DEPLOYMENT.md#troubleshooting)

### Common Resources
- [Node.js Documentation](https://nodejs.org/docs/)
- [Vite Documentation](https://vitejs.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vercel Documentation](https://vercel.com/docs)

### Issues
- Check browser console for errors (F12)
- Review build output for warnings
- Test with different browsers
- Try a clean install

---

**Installation Guide Version**: 1.0  
**Last Updated**: 2024  
**Project**: BiesSimulation Optimized

Happy coding! 🚀
