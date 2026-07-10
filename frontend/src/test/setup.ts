import '@testing-library/jest-dom/vitest';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(globalThis, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: ResizeObserverMock
});

Object.assign(navigator, {
  clipboard: {
    writeText: () => Promise.resolve()
  }
});

Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 800 });
Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 400 });

const originalConsoleError = console.error.bind(console);
console.error = (...args: unknown[]) => {
  if (String(args[0]).includes('width(0) and height(0) of chart')) return;
  originalConsoleError(...args);
};

const originalConsoleWarn = console.warn.bind(console);
console.warn = (...args: unknown[]) => {
  if (String(args[0]).includes('width(0) and height(0) of chart')) return;
  originalConsoleWarn(...args);
};
