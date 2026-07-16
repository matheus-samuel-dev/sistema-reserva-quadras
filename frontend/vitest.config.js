import { defineConfig } from 'vitest/config';
export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
        css: true,
        // Lazy route modules are intentionally split; allow their first transform to
        // finish even on resource-constrained CI runners.
        testTimeout: 30000
    }
});
