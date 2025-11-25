import React, { useState } from 'react';
import { saveTopic, deleteTopic } from '../utils/storage';
import { buildTopicObject } from '../utils/aiCore.js';

export default function ImportTab({ topics, refresh }) {
  const [topicName, setTopicName] = useState('');
  const [content, setContent] = useState('');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');

  const handleImport = async () => {
    const cleanName = topicName
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, ' ');

    if (!cleanName) {
      setMessage(
        '❌ Please enter a valid topic name (letters, numbers, spaces, and hyphens only)'
      );
      return;
    }

    if (!content.trim() || content.trim().length < 100) {
      setMessage('❌ Please enter at least 100 characters of content');
      return;
    }

    setProcessing(true);
    setMessage('⚡ Importing...');

    try {
      // Lightning-fast import - asynchronous processing
      const topicObject = await buildTopicObject(cleanName, content.trim());
      await saveTopic(cleanName, topicObject);

      setMessage(`✅ Successfully imported "${cleanName}"!`);
      setTopicName('');
      setContent('');

      if (refresh) refresh();
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = (name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteTopic(name);
      setMessage(`🗑️ Deleted "${name}"`);
      if (refresh) refresh();
    }
  };

  const handleLoadTopic = (name) => {
    const topic = topics[name];
    if (topic) {
      setTopicName(name);
      setContent(topic.raw);
      setMessage(`📝 Loaded "${name}" for editing`);
    }
  };

  return (
    <div className="max-w-6xl">
      <h2
        className="text-3xl font-bold mb-6"
        style={{ color: 'var(--text-primary)' }}
      >
        Import Content
      </h2>

      {message && (
        <div
          className="mb-4 p-4 rounded-lg"
          style={{
            backgroundColor: message.includes('✅')
              ? 'var(--accent-success)'
              : message.includes('❌')
                ? 'var(--accent-error)'
                : message.includes('⏳')
                  ? 'var(--accent-primary)'
                  : 'var(--surface-secondary)',
            color: 'var(--text-primary)',
          }}
        >
          {message}
        </div>
      )}

      <div
        className="rounded-lg shadow-md p-6 mb-6"
        style={{
          backgroundColor: 'var(--surface-primary)',
          border: '1px solid var(--border-primary)',
        }}
      >
        <div className="mb-4">
          <label
            className="block text-sm font-semibold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Topic Name
          </label>
          <input
            type="text"
            id="topic-name"
            name="topicName"
            value={topicName}
            onChange={(e) => setTopicName(e.target.value)}
            placeholder="e.g., Physics - Waves, Biology - Cell Structure"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 transition-all"
            style={{
              borderColor: 'var(--border-secondary)',
              backgroundColor: 'var(--surface-primary)',
              color: 'var(--text-primary)',
              '--tw-ring-color': 'var(--accent-primary)',
            }}
            disabled={processing}
          />
        </div>

        <div className="mb-4">
          <label
            className="block text-sm font-semibold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Content (1,000-20,000 words recommended)
          </label>
          <textarea
            id="topic-content"
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste your study notes, textbook content, lecture notes, or any learning material here...

The more detailed content you provide, the better I can help you learn! Include:
• Definitions and explanations
• Examples and applications
• Key concepts and principles
• Important facts and figures"
            rows={18}
            className="w-full px-5 py-4 border-2 rounded-xl focus:ring-2 transition-all duration-300 resize-none font-mono text-sm leading-relaxed scrollbar-thin"
            style={{
              borderColor: 'var(--border-secondary)',
              backgroundColor: 'var(--surface-primary)',
              color: 'var(--text-primary)',
              '--tw-ring-color': 'var(--accent-primary)',
            }}
            disabled={processing}
          />
          <div className="mt-3 flex justify-between items-center">
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
              <span className="font-semibold">
                {content.length.toLocaleString()}
              </span>{' '}
              characters
              {content.length >= 100 && (
                <span
                  className="ml-2"
                  style={{ color: 'var(--accent-success)' }}
                >
                  ✓ Good length
                </span>
              )}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Minimum: 100 characters
            </div>
          </div>
        </div>

        <button
          onClick={handleImport}
          disabled={processing}
          className="w-full py-4 px-8 rounded-xl font-bold text-white text-lg transition-all duration-300"
          style={{
            background: processing
              ? 'var(--text-muted)'
              : 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
            cursor: processing ? 'not-allowed' : 'pointer',
          }}
        >
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span>
              <span>Processing your content...</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>✨</span>
              <span>Import & Process Content</span>
            </span>
          )}
        </button>
      </div>

      <div
        className="backdrop-blur-sm rounded-2xl shadow-xl p-8"
        style={{
          backgroundColor: 'var(--surface-primary)',
          border: '1px solid var(--border-primary)',
        }}
      >
        <h3
          className="text-2xl font-bold mb-6 flex items-center gap-3"
          style={{ color: 'var(--text-primary)' }}
        >
          <span className="text-3xl">📚</span>
          <span>Imported Topics ({Object.keys(topics).length})</span>
        </h3>

        {Object.keys(topics).length === 0 ? (
          <p
            className="text-center py-8"
            style={{ color: 'var(--text-muted)' }}
          >
            No topics imported yet. Add your first topic above!
          </p>
        ) : (
          <div className="max-h-80 overflow-y-auto scrollbar-thin space-y-3">
            {Object.entries(topics).map(([name, topic]) => (
              <div
                key={name}
                className="flex items-center justify-between p-4 rounded-lg transition-colors"
                style={{
                  backgroundColor: 'var(--surface-secondary)',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'var(--surface-tertiary)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'var(--surface-secondary)';
                }}
              >
                <div className="flex-1">
                  <h4
                    className="font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {name}
                  </h4>
                  <div
                    className="text-sm mt-1"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {topic.concepts?.length || 0} concepts •{' '}
                    {topic.keywords?.length || 0} keywords
                  </div>
                  <div
                    className="text-xs mt-1"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Last updated:{' '}
                    {new Date(
                      topic.lastUpdated || topic.createdAt
                    ).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleLoadTopic(name)}
                    className="px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium"
                    style={{
                      backgroundColor: 'var(--accent-primary)',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = 'var(--accent-primary)';
                      e.target.style.opacity = '0.9';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'var(--accent-primary)';
                      e.target.style.opacity = '1';
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(name)}
                    className="px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium"
                    style={{
                      backgroundColor: 'var(--accent-error)',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = 'var(--accent-error)';
                      e.target.style.opacity = '0.9';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'var(--accent-error)';
                      e.target.style.opacity = '1';
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
