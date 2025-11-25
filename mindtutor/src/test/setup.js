import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Mock TensorFlow.js to prevent import issues in tests
vi.mock('@tensorflow/tfjs', () => ({
  setBackend: vi.fn(() => Promise.resolve()),
  getBackend: vi.fn(() => 'cpu'),
  ready: vi.fn(() => Promise.resolve()),
  sequential: vi.fn(() => ({
    add: vi.fn().mockReturnThis(),
    compile: vi.fn(),
    fit: vi.fn(() => Promise.resolve({})),
    predict: vi.fn(() => ({
      data: vi.fn(() => Promise.resolve(new Float32Array([0.5]))),
    })),
    dispose: vi.fn(),
  })),
  layers: {
    dense: vi.fn(() => ({})),
    dropout: vi.fn(() => ({})),
    lstm: vi.fn(() => ({})),
  },
  train: {
    adam: vi.fn(() => ({})),
  },
  tensor2d: vi.fn(() => ({
    dispose: vi.fn(),
  })),
  loadLayersModel: vi.fn(() => Promise.resolve({})),
  losses: {
    meanSquaredError: 'meanSquaredError',
    categoricalCrossentropy: 'categoricalCrossentropy',
  },
  metrics: {
    mse: 'mse',
    accuracy: 'accuracy',
  },
}));

vi.mock('@tensorflow/tfjs-vis', () => ({
  show: {
    valuesDistribution: vi.fn(),
    history: vi.fn(),
    modelSummary: vi.fn(),
  },
  render: {
    barchart: vi.fn(),
    linechart: vi.fn(),
  },
}));

// extends Vitest's expect method with methods from react-testing-library
expect.extend(matchers);

// runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});
