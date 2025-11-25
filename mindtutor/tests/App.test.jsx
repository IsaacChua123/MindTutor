import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';

// Mock the storage utilities
vi.mock('./utils/storage', () => ({
  loadAllTopics: vi.fn(() => Promise.resolve({})),
  saveTopic: vi.fn(),
  loadChatHistory: vi.fn(() => Promise.resolve([])),
  saveChatHistory: vi.fn(),
  loadQuizHistory: vi.fn(() => Promise.resolve([])),
  saveQuizAttempt: vi.fn(),
}));

describe('App', () => {
  it('renders the MindTutor title', () => {
    render(<App />);
    expect(screen.getByText('MindTutor')).toBeInTheDocument();
  });

  it('renders all navigation tabs', () => {
    render(<App />);
    expect(screen.getByText('Import')).toBeInTheDocument();
    expect(screen.getByText('Lessons')).toBeInTheDocument();
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Quiz')).toBeInTheDocument();
    expect(screen.getByText('Diagnostics')).toBeInTheDocument();
  });

  it('starts with Chat tab active', () => {
    render(<App />);
    const chatTab = screen.getByText('Chat').closest('button');
    expect(chatTab).toHaveClass('text-white');
  });

  it('can switch tabs', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      const importTab = screen.getByText('Import').closest('button');
      expect(importTab).toBeInTheDocument();
    });

    const importTab = screen.getByText('Import').closest('button');
    await user.click(importTab);

    // The Import tab should now be active
    expect(importTab).toHaveClass('text-white');
  });
});
