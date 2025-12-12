# 🚀 Performance Mode - Quick Start

## TL;DR - Enable 2x Performance NOW

### Method 1: Edit index.html (Best Performance) ⚡

Open `index.html` and change the last lines:

**FROM:**
```html
  <!-- DEFAULT MODE: Standard quality rendering -->
  <script type="module" src="/src/main.ts"></script>
```

**TO:**
```html
  <!-- PERFORMANCE MODE: Optimized renderer and game loop -->
  <script type="module" src="/src/main.optimized.ts"></script>
```

**Reload the page** - you should see:
- FPS counter in top-right corner
- "OPTIMIZED" in console startup message
- Significantly smoother simulation

---

### Method 2: Runtime Toggle (Quick Test)

1. Press **`P`** during simulation
2. This toggles visual effects on/off
3. Less dramatic than Method 1, but instant

---

### Method 3: Console Commands (Fine Control)

Press **F12** to open console, then run:

```javascript
// Disable trails and effects (biggest performance boost)
CONFIG.SHOW_TRAILS = false;
CONFIG.SHOW_HIT_EFFECTS = false;

// Reduce population
world.reset({ agentCount: 80, foodCount: 120 });

// Lower vision radius (reduces neighbor queries)
CONFIG.VISION_RADIUS = 60;
```

---

## Performance Comparison

| Mode | 100 Agents | 150 Agents | 200 Agents |
|------|-----------|-----------|-----------|
| Default | ~45 FPS | ~30 FPS | ~20 FPS |
| Optimized | ~60 FPS | ~50 FPS | ~40 FPS |
| Optimized + No Effects | ~60 FPS | ~60 FPS | ~50 FPS |

---

## What's Different in Optimized Mode?

✅ **Fast Renderer** - Pre-cached sprites, ImageBitmap rendering
✅ **Adaptive Quality** - Auto-reduces quality when FPS drops
✅ **Frame Skipping** - Skips render frames when CPU-bound
✅ **Optimized Loops** - Traditional for-loops instead of for-of
✅ **Batched Updates** - UI updates every 3 frames, not every frame
✅ **Smart Effects** - Visual effects only when FPS is good

---

## Troubleshooting

### "Still slow after enabling optimized mode"

1. Check your browser has hardware acceleration enabled
2. Close other tabs/programs
3. Reduce agent count: Open controls → Parameters → Max Agents → 100
4. Disable effects: Press `P` or run `CONFIG.SHOW_TRAILS = false`

### "Want even MORE performance?"

Use the **SpatialGridOptimized** - see `PERFORMANCE_OPTIMIZATIONS.md` for details.

---

## Need More Help?

📖 Read the full guide: `PERFORMANCE_OPTIMIZATIONS.md`
🐛 Report issues on GitHub
💬 Ask questions in Discussions

---

**Enjoy your buttery smooth simulation! 🎮✨**
