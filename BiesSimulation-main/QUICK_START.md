# Quick Start Guide - Optimized BiesSimulation

## 🚀 Getting Started in 5 Minutes

### 1. Install Dependencies

```bash
cd BiesSimulation-main
npm install
```

**New dependency installed**: `vite-plugin-compression`

### 2. Development

Run locally with hot reload:

```bash
npm run dev
```

Open http://localhost:3000

### 3. Build

Create production build:

```bash
npm run build
```

Output: `dist/` folder with optimized assets

### 4. Preview Build

Test production build locally:

```bash
npm run preview
```

Open http://localhost:3000

### 5. Deploy to Vercel

First time:

```bash
npm install -g vercel
vercel login
vercel
```

Subsequent deployments:

```bash
vercel --prod
```

## 📊 What Changed?

### New Files Created

1. **`vercel.json`** - Vercel deployment configuration
2. **`src/renderer/LayeredRenderer.ts`** - Multi-canvas rendering system
3. **`src/renderer/OptimizedRenderer.ts`** - LOD rendering implementation
4. **`src/ui/LightweightChart.ts`** - Chart.js replacement
5. **`src/utils/PerformanceMonitor.ts`** - Performance tracking
6. **`src/core/OptimizedSpatialGrid.ts`** - Enhanced spatial grid
7. **`src/main.optimized.ts`** - Optimized entry point
8. **`.vercelignore`** - Deployment exclusions

### Modified Files

1. **`package.json`** - Added compression plugin, vercel-build script
2. **`vite.config.ts`** - Build optimizations, compression, code splitting

### Documentation

1. **`OPTIMIZATION_GUIDE.md`** - Detailed optimization explanation
2. **`DEPLOYMENT.md`** - Step-by-step deployment guide
3. **`PERFORMANCE_COMPARISON.md`** - Before/after metrics
4. **`QUICK_START.md`** - This file

## 🎯 Using the Optimizations

### Option A: Full Optimized Version (Recommended for Production)

Edit `index.html` and change the script import:

```html
<!-- Replace this -->
<script type="module" src="/src/main.ts"></script>

<!-- With this -->
<script type="module" src="/src/main.optimized.ts"></script>
```

**Features**:
- ✅ LOD rendering
- ✅ Lightweight chart
- ✅ Performance monitoring
- ✅ FPS display color-coding
- ✅ Press "P" for performance report

### Option B: Selective Integration (Keep Existing Code)

You can adopt optimizations piece by piece:

#### 1. Use Lightweight Chart

Replace in your code:

```typescript
// Before
import { StatsChart } from './ui/StatsChart';
const chart = new StatsChart(world);

// After
import { LightweightChart } from './ui/LightweightChart';
const chart = new LightweightChart(world);
```

**Benefit**: -180KB bundle size, faster updates

#### 2. Enable LOD Rendering

```typescript
import { OptimizedRenderer } from './renderer/OptimizedRenderer';

const ctx = renderer.getContext();
const optimizedRenderer = new OptimizedRenderer(ctx, {
  enableLOD: true,    // Automatic quality adjustment
  batchSize: 100,     // Entities per batch
  culling: true,      // Skip off-screen entities
});

// In render loop
optimizedRenderer.update(deltaTime);
optimizedRenderer.renderFood(world.food);
optimizedRenderer.renderAgents(world.agents);
```

**Benefit**: 2x FPS improvement with 300 agents

#### 3. Add Performance Monitoring

```typescript
import { perfMonitor } from './utils/PerformanceMonitor';

// In update loop
perfMonitor.update(deltaTime);

// Display FPS
const fps = perfMonitor.getFPS();
console.log(`FPS: ${fps}`);

// Get detailed report
const report = perfMonitor.getReport();
console.log(report);

// Check for issues
if (perfMonitor.isPerformanceDegraded()) {
  const recommendations = perfMonitor.getRecommendations();
  console.warn('Performance tips:', recommendations);
}
```

**Benefit**: Real-time performance insights

## 🔧 Configuration

### Adjust LOD Thresholds

Edit `src/renderer/OptimizedRenderer.ts`:

```typescript
private getLODLevel(entityCount: number): number {
  if (!this.options.enableLOD) return 2;

  if (entityCount < 50) return 2;   // Adjust for high detail
  if (entityCount < 150) return 1;  // Adjust for medium detail
  return 0;                          // Low detail
}
```

### Toggle Features

In `src/main.optimized.ts`:

```typescript
const optimizedRenderer = new OptimizedRenderer(ctx, {
  enableLOD: true,      // Set false to disable LOD
  batchSize: 100,       // Increase for more batching
  culling: true,        // Set false to disable culling
});
```

### Adjust Chart Sample Rate

In `src/ui/LightweightChart.ts`:

```typescript
private sampleInterval: number = 500; // Change to 250 for more frequent updates
private maxDataPoints: number = 60;    // Change to 120 for more history
```

## 📱 Mobile Optimization

For better mobile performance:

```typescript
// Detect mobile
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

if (isMobile) {
  // Reduce agent count
  CONFIG.INITIAL_AGENT_COUNT = 100;
  
  // Force low LOD
  optimizedRenderer.options.enableLOD = true;
  
  // Disable effects
  CONFIG.SHOW_TRAILS = false;
  CONFIG.SHOW_HIT_EFFECTS = false;
}
```

## 🐛 Debugging

### View Performance Metrics

Press **P** key during simulation to see:
- Current FPS
- Average frame time
- Worst frame time
- Memory usage (if available)
- Performance recommendations

### Chrome DevTools

1. Open DevTools (F12)
2. Performance tab
3. Click Record
4. Run simulation for 10 seconds
5. Stop recording
6. Analyze flame graph

### Check Bundle Size

```bash
npm run build -- --analyze
```

Opens bundle analyzer in browser.

## 🚨 Common Issues

### Issue: FPS Still Low

**Solutions**:
1. Reduce max agent count in controls
2. Disable trails and effects
3. Ensure LOD is enabled
4. Check browser hardware acceleration

### Issue: Chart Not Updating

**Solution**:
```typescript
// Ensure chart.update() is called in render loop
statsChart.update();
```

### Issue: Build Fails

**Solution**:
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf dist

# Rebuild
npm run build
```

### Issue: Vercel Deployment Fails

**Solutions**:
1. Check `vercel.json` is present
2. Verify `npm run build` works locally
3. Check Vercel dashboard for error logs
4. Ensure `vite-plugin-compression` is installed

## 📊 Performance Targets

| Scenario | Target | How to Measure |
|----------|--------|----------------|
| Initial Load | < 2s | Lighthouse Performance |
| FPS (150 agents) | 60 FPS | FPS display in app |
| FPS (300 agents) | 45+ FPS | FPS display in app |
| Bundle Size | < 500KB | `npm run build` output |
| Memory Usage | < 200MB | Chrome DevTools Memory |

## 🎓 Learning More

### Documentation
- [`OPTIMIZATION_GUIDE.md`](./OPTIMIZATION_GUIDE.md) - How optimizations work
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) - Deployment checklist
- [`PERFORMANCE_COMPARISON.md`](./PERFORMANCE_COMPARISON.md) - Metrics and benchmarks

### External Resources
- [Vite Optimization Guide](https://vitejs.dev/guide/build.html)
- [Canvas Performance](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)
- [Vercel Deployment](https://vercel.com/docs)

## 🤝 Contributing

When adding features:
1. Profile performance impact
2. Test with 300 agents
3. Check bundle size change
4. Update documentation

## 📝 Next Steps

After setup:

1. ✅ Test locally: `npm run dev`
2. ✅ Build: `npm run build`
3. ✅ Preview: `npm run preview`
4. ✅ Deploy: `vercel --prod`
5. ✅ Monitor performance
6. ✅ Gather feedback
7. ✅ Iterate!

## 🎉 Success Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] Dev server runs (`npm run dev`)
- [ ] Build succeeds (`npm run build`)
- [ ] Preview works (`npm run preview`)
- [ ] Vercel deployed (`vercel --prod`)
- [ ] 60 FPS with 150 agents
- [ ] Lighthouse score 90+
- [ ] Mobile performance acceptable

## 💬 Support

- Check console for errors (F12)
- Review documentation files
- Test with different agent counts
- Monitor FPS display
- Use performance monitor ("P" key)

---

**Ready to go?** Run `npm run dev` and start optimizing! 🚀
