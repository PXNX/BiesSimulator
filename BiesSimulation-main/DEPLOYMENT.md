# Deployment Checklist

## Pre-Deployment

### 1. Install Dependencies
```bash
npm install
```

This will install the new dependency:
- `vite-plugin-compression` for asset compression

### 2. Run Tests
```bash
npm run test
```

Ensure all tests pass before deploying.

### 3. Lint Code
```bash
npm run lint
```

Fix any linting errors.

### 4. Build Locally
```bash
npm run build
```

Expected output:
- `dist/` directory created
- Assets compressed (`.gz` and `.br` files)
- Bundle size report showing ~380KB total

### 5. Preview Build
```bash
npm run preview
```

Test the production build locally at `http://localhost:3000`

## Vercel Deployment

### First Time Setup

1. **Install Vercel CLI** (if not already installed):
```bash
npm install -g vercel
```

2. **Login to Vercel**:
```bash
vercel login
```

3. **Link Project**:
```bash
cd BiesSimulation-main
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- What's your project's name? **bies-simulation** (or your choice)
- In which directory is your code located? **.**

### Subsequent Deployments

#### Deploy to Preview
```bash
vercel
```

This creates a preview deployment with a unique URL.

#### Deploy to Production
```bash
vercel --prod
```

This deploys to your production domain.

## Post-Deployment Verification

### 1. Check Lighthouse Score
- Open deployed site
- Run Lighthouse audit (Chrome DevTools)
- Target scores:
  - Performance: 90+
  - Accessibility: 90+
  - Best Practices: 90+
  - SEO: 90+

### 2. Test Core Features
- [ ] Simulation starts
- [ ] Agents spawn and move
- [ ] Food spawns
- [ ] Interactions work (agents fight/share)
- [ ] Chart updates
- [ ] Controls work
- [ ] Stats display updates
- [ ] Preset selection works
- [ ] Reset works

### 3. Test Performance
- [ ] Initial load < 2 seconds
- [ ] 60 FPS with 150 agents
- [ ] 45+ FPS with 300 agents
- [ ] No memory leaks (run for 5+ minutes)
- [ ] Mobile performance acceptable

### 4. Test Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### 5. Check Network Performance
Open DevTools Network tab:
- [ ] All assets load successfully
- [ ] Compressed assets served (check Content-Encoding: br or gzip)
- [ ] Total page size < 500KB
- [ ] No 404 errors

## Vercel Configuration

### Environment Variables
None required for this project.

### Custom Domain (Optional)
If you want to use a custom domain:

1. **In Vercel Dashboard**:
   - Go to your project
   - Settings → Domains
   - Add your domain

2. **Update DNS**:
   - Add CNAME record pointing to `cname.vercel-dns.com`
   - Or follow Vercel's specific instructions

### Performance Settings
Vercel automatically enables:
- ✅ Global CDN
- ✅ Automatic SSL/TLS
- ✅ HTTP/2
- ✅ Brotli compression
- ✅ Gzip compression
- ✅ Image optimization (if images are added)

## Rollback Procedure

If deployment has issues:

1. **Revert to Previous Deployment**:
   - Go to Vercel Dashboard
   - Select project
   - Deployments tab
   - Find last working deployment
   - Click "..." → "Promote to Production"

2. **Or via CLI**:
```bash
vercel rollback
```

## Monitoring

### Vercel Analytics (Optional)
Enable Vercel Analytics for visitor insights:

1. Go to Vercel Dashboard
2. Select project
3. Analytics tab
4. Enable Analytics

### Performance Monitoring
The app includes built-in performance monitoring:
- Press "P" key to see performance report in console
- Monitor FPS display in top-right corner
- Check browser DevTools Performance panel

## Troubleshooting

### Build Fails

**Error**: `Module not found`
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Error**: TypeScript errors
```bash
# Check TypeScript version
npm list typescript

# Rebuild
npm run build
```

### Deployment Fails

**Error**: `Authentication required`
```bash
vercel login
```

**Error**: `File size too large`
- Check bundle size
- Ensure compression plugins are working
- Remove unnecessary files

### Runtime Errors

**Error**: Canvas not found
- Check HTML file is correctly deployed
- Verify base path in vite.config.ts

**Error**: Performance issues
- Enable LOD rendering
- Reduce agent count
- Disable effects on mobile

## Continuous Deployment

### GitHub Integration (Recommended)

1. **Connect GitHub Repository**:
   - Go to Vercel Dashboard
   - Import Git Repository
   - Select your GitHub repo

2. **Automatic Deployments**:
   - Push to `main` branch → Production deployment
   - Push to other branches → Preview deployment
   - Pull requests → Automatic preview

3. **Branch Settings**:
   ```
   Production Branch: main
   Preview Branches: all branches
   ```

### Deployment Hooks
Add to `vercel.json` for advanced scenarios:
```json
{
  "github": {
    "autoAlias": true,
    "enabled": true,
    "silent": false
  }
}
```

## Performance Optimization Tips

### After Deployment

1. **Enable Compression**:
   - Vercel does this automatically
   - Verify with Network tab (Content-Encoding header)

2. **Cache Headers**:
   - Already configured in `vercel.json`
   - Assets cache for 1 year
   - HTML revalidates

3. **Monitor Bundle Size**:
```bash
# Analyze bundle
npm run build -- --analyze
```

4. **Lazy Load Components**:
   - Chart.js already code-split
   - Consider splitting more modules if bundle grows

## Security

### Headers
Already configured in `vercel.json`:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

### HTTPS
- Automatic via Vercel
- No configuration needed

### Content Security Policy (Future)
Consider adding CSP headers if you add external resources.

## Cost Considerations

### Vercel Free Tier Includes:
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Automatic SSL
- ✅ Global CDN
- ✅ Automatic scaling

This should be sufficient for most use cases.

### If You Need More:
- Upgrade to Vercel Pro ($20/month)
- 1TB bandwidth
- Advanced analytics
- Password protection

## Support

### Issues?
1. Check Vercel deployment logs
2. Check browser console for errors
3. Test locally with `npm run preview`
4. Review this checklist

### Resources:
- [Vercel Documentation](https://vercel.com/docs)
- [Vite Documentation](https://vitejs.dev/)
- Project Issues (GitHub)

## Success Metrics

After deployment, verify:
- ✅ Lighthouse Performance score: 90+
- ✅ Initial load time: < 2s
- ✅ Time to Interactive: < 3s
- ✅ FPS: 60 with 150 agents
- ✅ Bundle size: < 500KB
- ✅ Zero console errors
- ✅ Works on mobile

## Next Steps

After successful deployment:
1. Share the URL
2. Monitor performance
3. Gather user feedback
4. Iterate on optimizations

---

**Last Updated**: 2024
**Version**: 1.0
