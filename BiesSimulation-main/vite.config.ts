import { defineConfig } from 'vite';

// Optimized configuration for Vercel deployment
export default defineConfig({
    base: './',
    build: {
        target: 'es2020',
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
                pure_funcs: ['console.log', 'console.info', 'console.debug'],
            },
            mangle: {
                safari10: true,
            },
        },
        cssMinify: 'lightningcss',
        rollupOptions: {
            output: {
                manualChunks: {
                    'chart': ['chart.js'],
                },
            },
        },
        chunkSizeWarningLimit: 1000,
        sourcemap: false,
    },
    plugins: [],
    server: {
        port: 3000,
    },
    preview: {
        port: 3000,
    },
    optimizeDeps: {
        include: ['chart.js'],
    },
});
