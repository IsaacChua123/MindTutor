/* global fetch */
import React, { useState, useEffect, Suspense, lazy } from 'react';
import AIKeyInput from './components/AIKeyInput.jsx';
import EnhancedErrorBoundary from './components/EnhancedErrorBoundary.jsx';
// ThemeProvider removed due to hook issues
import { performanceMonitor, startPerformanceMonitoring } from './utils/performanceMonitor';

// Lazy load heavy components for better performance
const ImportTab = lazy(() => import('./components/ImportTab.jsx'));
const ChatTab = lazy(() => import('./components/ChatTab.jsx'));
const QuizTab = lazy(() => import('./components/QuizTab.jsx'));
const LessonTab = lazy(() => import('./components/LessonTab.jsx'));
const ReadingTab = lazy(() => import('./components/ReadingTab.jsx'));
const DiagnosticsTab = lazy(() => import('./components/DiagnosticsTab.jsx'));
const FileUploadTab = lazy(() => import('./components/FileUploadTab.jsx'));

// Application tabs configuration
const TABS = [
  { id: 'Chat', label: '💬 Chat', icon: '💬', description: 'Ask me anything' },
  {
    id: 'Reading',
    label: '📖 Reading',
    icon: '📖',
    description: 'Study materials',
  },
  {
    id: 'Lessons',
    label: '📚 Lessons',
    icon: '📚',
    description: 'Interactive learning',
  },
  { id: 'Quiz', label: '🎯 Quiz', icon: '🎯', description: 'Test yourself' },
  { id: 'Upload', label: '📤 Upload', icon: '📤', description: 'OCR & PDF upload' },
  { id: 'Import', label: '📥 Import', icon: '📥', description: 'Add content' },
  {
    id: 'Diagnostics',
    label: '⚙️ Settings',
    icon: '⚙️',
    description: 'Diagnostics',
  },
];

function AppContent() {
  // const { darkMode, toggleTheme } = useTheme();
  const darkMode = false;
  const toggleTheme = () => {};
  const [activeTab, setActiveTab] = useState('Chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [topics, setTopics] = useState({});
  const [apiKey, setApiKey] = useState('');

  // Initialize performance monitoring and service worker
  useEffect(() => {
    // Start performance monitoring
    startPerformanceMonitoring();

    // Register service worker only in production
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('🎉 Service Worker registered successfully:', registration.scope);

          // Handle service worker updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New version available
                  console.log('🔄 New app version available! Refresh to update.');
                  // Could show a toast notification here
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });
    } else if (import.meta.env.DEV) {
      console.log('🚫 Service Worker disabled in development mode');
    }

    // Performance monitoring subscription
    const unsubscribe = performanceMonitor.subscribe((metric, data) => {
      // Handle performance metrics (could send to analytics service)
      if (metric === 'memory' && parseFloat(data.usagePercent) > 85) {
        console.warn('⚠️ Critical memory usage detected!');
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Load topics on component mount - initialize with sample data if none exists
  useEffect(() => {
    const loadTopics = async () => {
      try {
        // Dynamically import utilities to reduce initial bundle size
        const [storageModule, demoModule] = await Promise.all([
          import('./utils/storage'),
          import('./utils/demoLesson')
        ]);

        // Try to import aiCore with error handling
        let aiCoreModule = null;
        try {
          aiCoreModule = await import('./utils/aiCore.js');
        } catch (error) {
          console.error('Failed to load aiCore module:', error);
          // Continue without aiCore - app will still work for basic functionality
        }

        const existingTopics = await storageModule.loadAllTopics();

        // If no topics exist, load sample data and demo lesson
        if (Object.keys(existingTopics).length === 0) {
          console.log('Loading sample data and demo lesson...');

          // Load sample data files
          const sampleTopics = {};

          if (aiCoreModule) {
            // Load biology sample data
            try {
              const biologyResponse = await fetch(
                '/sample-data/biology-cells-organization.txt'
              );
              if (biologyResponse.ok) {
                const biologyContent = await biologyResponse.text();
                const biologyTopic = await aiCoreModule.buildTopicObject(
                  'Biology - Cells and Organization (Sample)',
                  biologyContent
                );
                sampleTopics['Biology - Cells and Organization (Sample)'] = biologyTopic;
                await storageModule.saveTopic('Biology - Cells and Organization (Sample)', biologyTopic);
              }
            } catch (error) {
              console.warn('Failed to load biology sample data:', error);
            }

            // Load physics sample data
            try {
              const physicsResponse = await fetch(
                '/sample-data/physics-electricity-magnetism.txt'
              );
              if (physicsResponse.ok) {
                const physicsContent = await physicsResponse.text();
                const physicsTopic = await aiCoreModule.buildTopicObject(
                  'Physics - Electricity and Magnetism (Sample)',
                  physicsContent
                );
                sampleTopics['Physics - Electricity and Magnetism (Sample)'] = physicsTopic;
                await storageModule.saveTopic(
                  'Physics - Electricity and Magnetism (Sample)',
                  physicsTopic
                );
              }
            } catch (error) {
              console.warn('Failed to load physics sample data:', error);
            }

            // Load chemistry sample data
            try {
              const chemistryResponse = await fetch(
                '/sample-data/chemistry-atomic-structure.txt'
              );
              if (chemistryResponse.ok) {
                const chemistryContent = await chemistryResponse.text();
                const chemistryTopic = await aiCoreModule.buildTopicObject(
                  'Chemistry - Atomic Structure (Sample)',
                  chemistryContent
                );
                sampleTopics['Chemistry - Atomic Structure (Sample)'] = chemistryTopic;
                await storageModule.saveTopic('Chemistry - Atomic Structure (Sample)', chemistryTopic);
              }
            } catch (error) {
              console.warn('Failed to load chemistry sample data:', error);
            }
          } else {
            console.warn('aiCore not available - skipping sample data processing');
          }

          // Load demo lesson as additional content
          const demoTopics = demoModule.loadDemoLesson();
          Object.entries(demoTopics).forEach(([topicName, topicData]) => {
            storageModule.saveTopic(topicName, topicData);
          });

          const allTopics = {
            ...existingTopics,
            ...sampleTopics,
            ...demoTopics,
          };
          setTopics(allTopics);
          console.log(
            `Loaded ${Object.keys(allTopics).length} topics:`,
            Object.keys(allTopics)
          );
        } else {
          setTopics(existingTopics);
        }
      } catch (error) {
        console.error('Error loading topics:', error);
        // Set empty topics if everything fails
        setTopics({});
      }
    };

    loadTopics();
  }, []);

  // Handle topic creation from file uploads
  const handleTopicCreated = async (topic) => {
    try {
      const storageModule = await import('./utils/storage');
      await storageModule.saveTopic(topic.topic, topic);
      setTopics(prev => ({ ...prev, [topic.topic]: topic }));
      console.log('Topic created from file upload:', topic.topic);
    } catch (error) {
      console.error('Error saving uploaded topic:', error);
    }
  };

  // Loading component for lazy-loaded tabs
  const TabLoader = () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );

  // Render the active tab component based on current selection
  const renderTab = () => {
    const tabContent = (() => {
      switch (activeTab) {
        case 'Import':
          return (
            <ImportTab
              topics={topics}
              refresh={async () => {
                try {
                  const storageModule = await import('./utils/storage');
                  setTopics(await storageModule.loadAllTopics());
                } catch (error) {
                  console.error('Error refreshing topics:', error);
                }
              }}
            />
          );
        case 'Reading':
          return <ReadingTab topics={topics} />;
        case 'Lessons':
          return (
            <LessonTab
              topics={topics}
              refreshTopics={async () => {
                try {
                  const storageModule = await import('./utils/storage');
                  setTopics(await storageModule.loadAllTopics());
                } catch (error) {
                  console.error('Error refreshing topics:', error);
                }
              }}
            />
          );
        case 'Chat':
          return <ChatTab topics={topics} />;
        case 'Quiz':
          return <QuizTab topics={topics} />;
        case 'Upload':
          return (
            <FileUploadTab
              onTopicCreated={handleTopicCreated}
              onProcessingStart={() => console.log('File processing started')}
              onProcessingEnd={() => console.log('File processing completed')}
            />
          );
        case 'Diagnostics':
          return <DiagnosticsTab />;
        default:
          return <div>Tab not found</div>;
      }
    })();

    return (
      <Suspense fallback={<TabLoader />}>
        {tabContent}
      </Suspense>
    );
  };

  return (
    <div
      className="min-h-screen md:flex transition-colors duration-300 bg-gradient-to-br"
      style={{
        background: `linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 50%, var(--bg-accent) 100%)`,
        color: 'var(--text-primary)',
      }}
    >
      {/* Mobile Menu Button */}
      <button
        id="menu-button"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`fixed top-4 left-4 z-50 md:hidden p-3 rounded-xl shadow-lg transition-all duration-300 ${
          darkMode
            ? 'bg-gray-800/90 hover:bg-gray-700/90 text-white'
            : 'bg-white/90 hover:bg-gray-50/90 text-gray-700'
        } backdrop-blur-sm border border-gray-200 dark:border-gray-700`}
        aria-label="Toggle menu"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Dark Mode Toggle */}
      <button
        onClick={toggleTheme}
        className={`fixed top-4 right-4 z-50 p-3 rounded-xl shadow-lg transition-all duration-300 backdrop-blur-sm border ${
          darkMode
            ? 'bg-gray-800/90 hover:bg-gray-700/90 text-gray-200 border-gray-700'
            : 'bg-white/90 hover:bg-gray-50/90 text-gray-700 border-gray-200'
        }`}
        aria-label="Toggle dark mode"
      >
        {darkMode ? (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        ) : (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        )}
      </button>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Modern Sidebar */}
      <aside
        id="sidebar"
        className={`fixed md:static top-16 md:top-0 bottom-0 left-0 z-50 transition-all duration-300 transform flex flex-col shadow-2xl w-80 backdrop-blur-md ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${
          darkMode
            ? 'bg-gray-900/95 border-r border-gray-700'
            : 'bg-white/95 border-r border-gray-200'
        }`}
      >
        {/* Logo Section */}
        <div
          className="p-6 border-b"
          style={{ borderColor: 'var(--border-primary)' }}
        >
          <div className="text-center mb-4">
            <h1
              className="text-2xl md:text-3xl font-bold mb-2"
              style={{
                background:
                  'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              MindTutor
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Your AI Learning Companion
            </p>
          </div>
          <AIKeyInput apiKey={apiKey} setApiKey={setApiKey} />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-thin">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSidebarOpen(false); // Close sidebar on mobile after selection
              }}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-200 group ${
                activeTab === tab.id
                  ? 'text-white shadow-lg'
                  : 'hover:opacity-80'
              }`}
              style={{
                background:
                  activeTab === tab.id
                    ? 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)'
                    : 'transparent',
                color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.target.style.backgroundColor = 'var(--surface-secondary)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.target.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{tab.icon}</span>
                <div className="flex-1 min-w-0">
                  <div
                    className="font-semibold truncate"
                    style={{
                      color:
                        activeTab === tab.id ? 'white' : 'var(--text-primary)',
                    }}
                  >
                    {tab.label.replace(/[^\w\s]/gi, '').trim()}
                  </div>
                  <div
                    className="text-sm truncate"
                    style={{
                      color:
                        activeTab === tab.id
                          ? 'rgba(255, 255, 255, 0.8)'
                          : 'var(--text-muted)',
                    }}
                  >
                    {tab.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div
          className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
        >
          <div
            className={`p-3 text-center rounded-xl ${
              darkMode ? 'bg-gray-800/80' : 'bg-gray-50/80'
            } backdrop-blur-sm border ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}
          >
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {Object.keys(topics).length}
              </span>{' '}
              topics loaded
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="md:flex-1 h-screen overflow-hidden">
        <div className="w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 pt-16 md:pt-0 h-full overflow-hidden">
          <EnhancedErrorBoundary>
            {renderTab()}
          </EnhancedErrorBoundary>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
