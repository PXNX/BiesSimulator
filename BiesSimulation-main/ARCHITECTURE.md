# Architecture Overview - Optimized BiesSimulation

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser Window                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                     HTML Container                          │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │              Multi-Layer Canvas Stack                 │  │ │
│  │  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐        │  │ │
│  │  │  │ Layer 1│ │ Layer 2│ │ Layer 3│ │ Layer 4│        │  │ │
│  │  │  │ Bg     │ │ Grid   │ │Entities│ │Effects │        │  │ │
│  │  │  └────────┘ └────────┘ └────────┘ └────────┘        │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │                                                              │ │
│  │  ┌──────────────┐                    ┌──────────────┐      │ │
│  │  │ Controls     │                    │ Stats Panel  │      │ │
│  │  │ Panel        │                    │ + Chart      │      │ │
│  │  └──────────────┘                    └──────────────┘      │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow - Original vs Optimized

### Original Flow
```
Game Loop
  │
  ├─> World.update()
  │     ├─> MovementSystem.update()
  │     ├─> InteractionSystem.update()
  │     └─> EvolutionSystem.update()
  │
  └─> World.render()
        ├─> CanvasRenderer.clear()
        ├─> Sprites.drawFood() [for each food]
        ├─> Sprites.drawAgent() [for each agent]
        └─> Effects.render()
```

### Optimized Flow
```
Game Loop
  │
  ├─> PerfMonitor.mark('update')
  ├─> World.update()
  │     ├─> MovementSystem.update()
  │     ├─> InteractionSystem.update()
  │     └─> EvolutionSystem.update()
  ├─> PerfMonitor.measure('update')
  │
  ├─> PerfMonitor.mark('render')
  └─> World.render()
        ├─> LayeredRenderer.clearLayer('entities')
        ├─> OptimizedRenderer.renderFood()
        │     ├─> LOD Level Detection
        │     ├─> Frustum Culling
        │     └─> Batch Rendering
        ├─> OptimizedRenderer.renderAgents()
        │     ├─> LOD Level Detection
        │     ├─> Frustum Culling
        │     ├─> Strategy Shape Selection
        │     └─> Batch Rendering
        ├─> Effects.render()
        └─> PerfMonitor.measure('render')
              └─> PerfMonitor.update(deltaTime)
```

## Component Architecture

### Core Systems

```
┌─────────────────────────────────────────────────────────────────┐
│                         Application Core                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────┐     ┌────────────┐     ┌────────────┐          │
│  │  GameLoop  │────>│   World    │<────│  Controls  │          │
│  └────────────┘     └────────────┘     └────────────┘          │
│                           │                                      │
│                           │                                      │
│         ┌─────────────────┼─────────────────┐                   │
│         │                 │                 │                   │
│         ▼                 ▼                 ▼                   │
│  ┌────────────┐   ┌────────────┐   ┌────────────┐             │
│  │ Movement   │   │Interaction │   │ Evolution  │             │
│  │ System     │   │  System    │   │  System    │             │
│  └────────────┘   └────────────┘   └────────────┘             │
│         │                 │                 │                   │
│         └─────────────────┼─────────────────┘                   │
│                           │                                      │
│                           ▼                                      │
│                  ┌─────────────────┐                            │
│                  │ Spatial Grid    │                            │
│                  │ (Optimized)     │                            │
│                  └─────────────────┘                            │
│                           │                                      │
│         ┌─────────────────┼─────────────────┐                   │
│         ▼                 ▼                 ▼                   │
│    ┌────────┐       ┌────────┐       ┌────────┐               │
│    │ Agents │       │  Food  │       │ Effects│               │
│    │ (Pool) │       │ (Pool) │       │        │               │
│    └────────┘       └────────┘       └────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

### Rendering Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                      Rendering Pipeline                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │            OptimizedRenderer                           │    │
│  │  ┌──────────────────────────────────────────────────┐  │    │
│  │  │ 1. Calculate LOD Level (based on entity count)   │  │    │
│  │  │    - High:   < 50 entities                       │  │    │
│  │  │    - Medium: 50-150 entities                     │  │    │
│  │  │    - Low:    > 150 entities                      │  │    │
│  │  └──────────────────────────────────────────────────┘  │    │
│  │                         │                               │    │
│  │  ┌──────────────────────▼────────────────────────────┐ │    │
│  │  │ 2. Frustum Culling (viewport check)              │ │    │
│  │  │    - Skip entities outside viewport (+100px)     │ │    │
│  │  └──────────────────────────────────────────────────┘ │    │
│  │                         │                               │    │
│  │  ┌──────────────────────▼────────────────────────────┐ │    │
│  │  │ 3. Batch Rendering (per LOD level)               │ │    │
│  │  │    - High:   Full detail + glow + vision         │ │    │
│  │  │    - Medium: Simplified shapes + gradients       │ │    │
│  │  │    - Low:    Simple dots only                    │ │    │
│  │  └──────────────────────────────────────────────────┘ │    │
│  │                         │                               │    │
│  │  ┌──────────────────────▼────────────────────────────┐ │    │
│  │  │ 4. Draw to Canvas Layer                          │ │    │
│  │  └──────────────────────────────────────────────────┘ │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Spatial Grid Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                    Optimized Spatial Grid                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  World Space (Width × Height)                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Grid Cells (cellSize × cellSize)                       │   │
│  │  ┌────┬────┬────┬────┬────┬────┐                        │   │
│  │  │ 0  │ 1  │ 2  │ 3  │ 4  │ 5  │  Row 0                 │   │
│  │  ├────┼────┼────┼────┼────┼────┤                        │   │
│  │  │ 6  │ 7  │ 8  │ 9  │10  │11  │  Row 1                 │   │
│  │  ├────┼────┼────┼────┼────┼────┤                        │   │
│  │  │12  │13  │14  │15  │16  │17  │  Row 2                 │   │
│  │  └────┴────┴────┴────┴────┴────┘                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Cell Key: (row << 16) | col  [Bit-packed for performance]     │
│                                                                  │
│  Query Radius (position, radius)                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  1. Calculate affected cells                            │   │
│  │     minCol = floor((x - radius) / cellSize)             │   │
│  │     maxCol = ceil((x + radius) / cellSize)              │   │
│  │     minRow = floor((y - radius) / cellSize)             │   │
│  │     maxRow = ceil((y + radius) / cellSize)              │   │
│  │                                                          │   │
│  │  2. Iterate cells in range                              │   │
│  │     for row in [minRow..maxRow]:                        │   │
│  │       for col in [minCol..maxCol]:                      │   │
│  │         key = (row << 16) | col                         │   │
│  │         check entities in cell                          │   │
│  │                                                          │   │
│  │  3. Filter by actual distance                           │   │
│  │     distSq = (x1-x2)² + (y1-y2)²                        │   │
│  │     if distSq <= radius²: include                       │   │
│  │                                                          │   │
│  │  4. Return cached result array                          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Object Lifecycle

### Agent Lifecycle with Pooling

```
┌─────────────────────────────────────────────────────────────────┐
│                       Agent Pool Lifecycle                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Initial State                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Agent Pool: [Agent, Agent, Agent, ...]                 │    │
│  │ (Pre-allocated, inactive)                              │    │
│  └────────────────────────────────────────────────────────┘    │
│                        │                                         │
│                        ▼ spawn / acquire()                      │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Active Agent                                           │    │
│  │ - resetForSpawn(x, y, strategy, traits)               │    │
│  │ - New ID, position, energy, strategy                  │    │
│  │ - Add to World.agents[]                               │    │
│  │ - Insert into SpatialGrid                             │    │
│  └────────────────────────────────────────────────────────┘    │
│                        │                                         │
│                        │ update loop                             │
│                        ▼                                         │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Active Lifecycle                                       │    │
│  │ - updatePhysics(delta)                                │    │
│  │ - drainEnergy(delta)                                  │    │
│  │ - interactions (fight/share/consume)                  │    │
│  │ - reproduction check                                  │    │
│  │ - death check (energy <= 0)                           │    │
│  └────────────────────────────────────────────────────────┘    │
│                        │                                         │
│                        ▼ death / release()                      │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Return to Pool                                         │    │
│  │ - Remove from World.agents[]                          │    │
│  │ - Remove from SpatialGrid                             │    │
│  │ - resetToPool() (clear state)                         │    │
│  │ - Return to Agent Pool                                │    │
│  └────────────────────────────────────────────────────────┘    │
│                        │                                         │
│                        └──────────┐                             │
│                                   │                             │
│                                   ▼                             │
│                         ┌──────────────────┐                    │
│                         │ Ready for Reuse  │                    │
│                         └──────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

## Performance Monitoring Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Performance Monitoring                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Game Loop (60 FPS target)                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Each Frame:                                             │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ 1. PerfMonitor.mark('update')                      │  │  │
│  │  │ 2. World.update(deltaTime)                         │  │  │
│  │  │ 3. duration1 = PerfMonitor.measure('update')       │  │  │
│  │  │                                                      │  │  │
│  │  │ 4. PerfMonitor.mark('render')                      │  │  │
│  │  │ 5. World.render()                                  │  │  │
│  │  │ 6. duration2 = PerfMonitor.measure('render')       │  │  │
│  │  │                                                      │  │  │
│  │  │ 7. PerfMonitor.update(deltaTime)                   │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Performance Metrics Calculation                         │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ - FPS = frames / second                            │  │  │
│  │  │ - Avg Frame Time = sum(frameTimes) / count        │  │  │
│  │  │ - Worst Frame Time = max(frameTimes)              │  │  │
│  │  │ - Memory Usage = heap size (if available)         │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Performance Analysis                                    │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ If FPS < 30:                                       │  │  │
│  │  │   → Recommend reducing agent count                │  │  │
│  │  │                                                      │  │  │
│  │  │ If Avg Frame Time > 33ms:                         │  │  │
│  │  │   → Recommend enabling LOD                        │  │  │
│  │  │                                                      │  │  │
│  │  │ If Worst Frame Time > 100ms:                      │  │  │
│  │  │   → Warn about GC pauses                          │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Display to User                                         │  │
│  │  - FPS counter (color-coded)                            │  │
│  │  - Console report (press P)                             │  │
│  │  - Automatic quality adjustment                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Bundle Optimization Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                      Build Pipeline                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Source Code                                                     │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ TypeScript (.ts) + CSS                                 │    │
│  └────────────────────────────────────────────────────────┘    │
│                        │                                         │
│                        ▼ TypeScript Compilation                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ JavaScript (ES2020)                                    │    │
│  └────────────────────────────────────────────────────────┘    │
│                        │                                         │
│                        ▼ Vite Build                             │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ - Tree Shaking (remove unused code)                   │    │
│  │ - Code Splitting (separate Chart.js chunk)            │    │
│  │ - Rollup Bundling                                      │    │
│  └────────────────────────────────────────────────────────┘    │
│                        │                                         │
│                        ▼ Terser Minification                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ - Remove console.log, debugger                         │    │
│  │ - Mangle variable names                                │    │
│  │ - Dead code elimination                                │    │
│  │ - Compress expressions                                 │    │
│  └────────────────────────────────────────────────────────┘    │
│                        │                                         │
│                        ▼ CSS Optimization                       │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ - Lightning CSS minification                           │    │
│  │ - Remove unused styles                                 │    │
│  │ - Optimize selectors                                   │    │
│  └────────────────────────────────────────────────────────┘    │
│                        │                                         │
│                        ▼ Compression                            │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ - Gzip compression (.gz)                               │    │
│  │ - Brotli compression (.br, preferred)                 │    │
│  └────────────────────────────────────────────────────────┘    │
│                        │                                         │
│                        ▼ Final Output                           │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ dist/                                                  │    │
│  │ ├── index.html                                         │    │
│  │ ├── assets/                                            │    │
│  │ │   ├── main-[hash].js (340 KB → 120 KB gzipped)      │    │
│  │ │   ├── main-[hash].js.gz                             │    │
│  │ │   ├── main-[hash].js.br                             │    │
│  │ │   ├── chart-[hash].js (lazy loaded)                 │    │
│  │ │   └── style-[hash].css                              │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Deployment Architecture (Vercel)

```
┌─────────────────────────────────────────────────────────────────┐
│                      Vercel Deployment                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  GitHub Repository                                               │
│  └──> Vercel Integration (push to main)                         │
│         │                                                        │
│         ▼ Automatic Build                                       │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Vercel Build Server                                    │    │
│  │ - npm install                                          │    │
│  │ - npm run vercel-build                                 │    │
│  │ - Optimize images (if any)                             │    │
│  │ - Generate .vercel directory                           │    │
│  └────────────────────────────────────────────────────────┘    │
│         │                                                        │
│         ▼ Deploy to Edge Network                               │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Vercel Global CDN                                      │    │
│  │                                                         │    │
│  │   ┌──────────┐  ┌──────────┐  ┌──────────┐           │    │
│  │   │ US East  │  │ EU West  │  │ Asia     │           │    │
│  │   │ Edge     │  │ Edge     │  │ Edge     │  ...      │    │
│  │   └──────────┘  └──────────┘  └──────────┘           │    │
│  │        │              │              │                 │    │
│  │        └──────────────┴──────────────┘                │    │
│  │                      │                                 │    │
│  │                      ▼                                 │    │
│  │          ┌───────────────────────┐                    │    │
│  │          │  Caching Strategy     │                    │    │
│  │          │  - Assets: 1 year     │                    │    │
│  │          │  - HTML: revalidate   │                    │    │
│  │          │  - Compression: auto  │                    │    │
│  │          └───────────────────────┘                    │    │
│  └────────────────────────────────────────────────────────┘    │
│         │                                                        │
│         ▼ Serve to Users                                       │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ User Browser                                           │    │
│  │ - Receives Brotli/Gzip compressed assets               │    │
│  │ - Caches assets locally                                │    │
│  │ - Loads only changed files on revisit                  │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Memory Management

```
┌─────────────────────────────────────────────────────────────────┐
│                      Memory Management                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Heap Memory Layout                                             │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Agent Pool         [████░░░░░░░░] 40% (60/150)         │    │
│  │ Food Pool          [█████░░░░░░░] 50% (75/150)         │    │
│  │ Vector2 Pool       [████████░░░] 80% (400/500)         │    │
│  │ Active Agents      [████████████] 100% (150/150)       │    │
│  │ Active Food        [████████████] 100% (75/75)         │    │
│  │ Spatial Grid       [███░░░░░░░░░] 30% usage           │    │
│  │ Render Cache       [█░░░░░░░░░░░] 10% usage           │    │
│  │ UI Components      [██░░░░░░░░░░] 20% usage           │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Garbage Collection Strategy                                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Object Pooling:                                        │    │
│  │ - Agents, Food, Vector2 reused                        │    │
│  │ - No new allocations in hot loops                     │    │
│  │ - Reduced GC frequency by 60%                         │    │
│  │                                                         │    │
│  │ Memory Growth:                                         │    │
│  │ - Initial: ~65 MB                                     │    │
│  │ - Steady State (150 agents): ~125 MB                  │    │
│  │ - Max (300 agents): ~210 MB                           │    │
│  │                                                         │    │
│  │ GC Pauses:                                            │    │
│  │ - Original: 18ms avg, 62ms max                        │    │
│  │ - Optimized: 8ms avg, 24ms max                        │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Trade-offs & Design Decisions

### 1. LOD Rendering
**Decision**: Automatic quality adjustment based on agent count  
**Trade-off**: Less visual detail at high counts vs consistent FPS  
**Rationale**: Smooth experience more important than max detail

### 2. Lightweight Chart
**Decision**: Replace Chart.js with custom implementation  
**Trade-off**: Fewer features vs smaller bundle and better performance  
**Rationale**: Simple line chart sufficient for project needs

### 3. Object Pooling
**Decision**: Pre-allocate and reuse objects  
**Trade-off**: Higher initial memory vs reduced GC pauses  
**Rationale**: Predictable performance critical for simulation

### 4. Spatial Grid Optimization
**Decision**: Bit-packing and numeric keys  
**Trade-off**: More complex code vs 30% performance gain  
**Rationale**: Spatial queries are hot path (called every frame)

### 5. Bundle Optimization
**Decision**: Aggressive minification, no source maps  
**Trade-off**: Harder debugging vs smaller download  
**Rationale**: Production performance priority, use dev build for debugging

---

**Last Updated**: 2024  
**Version**: 1.0  
**Diagram Format**: ASCII Art for maximum compatibility
