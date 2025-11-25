import React, { useState, useEffect, useRef } from 'react';
import { findBestMatch, isGoodMatch } from '../utils/patternMatcher';
import {
  saveChatHistory,
  loadChatHistory,
  clearAllChatHistory,
} from '../utils/storage';

// Dynamically import aiCore with error handling
let generateExplanation = null;
try {
  import('../utils/aiCore.js').then(module => {
    generateExplanation = module.generateExplanation;
  }).catch(error => {
    console.error('Failed to load aiCore in ChatTab:', error);
  });
} catch (error) {
  console.error('Failed to import aiCore in ChatTab:', error);
}

export default function ChatTab({ topics }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lastTopic, setLastTopic] = useState(null); // Remember the last topic used
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Load chat history on component mount
    loadChatHistory().then(setMessages).catch(console.error);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    saveChatHistory(messages);
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking delay
    setTimeout(async () => {
      try {
        const response = await generateResponse(input.trim());

        const aiMessage = {
          role: 'assistant',
          content: response.content,
          topic: response.topicName,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, aiMessage]);
      } catch (error) {
        console.error('Error generating response:', error);
        const errorMessage = {
          role: 'assistant',
          content:
            'I encountered an error processing your question. Try asking again.',
          topic: null,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
      }
    }, 800);
  };

  const generateResponse = async (query) => {
    // Handle greetings first
    const lowerQuery = query.toLowerCase().trim();
    if (lowerQuery === 'yo' || lowerQuery === 'bro' || lowerQuery === 'sup') {
      return {
        content: 'hey! what topic do you want to learn?',
        topicName: null,
      };
    }

    if (lowerQuery === 'hi' || lowerQuery === 'hello') {
      return {
        content: 'hi! what do you want to study?',
        topicName: null,
      };
    }

    if (Object.keys(topics).length === 0) {
      return {
        content:
          "I don't have any study material loaded yet.\n\nTo get started:\n1. Go to the Import tab and add your study notes\n2. Paste or upload content about any topic\n3. Come back here and ask me anything\n\nI'll help you understand the material and explain concepts.",
        topicName: null,
      };
    }

    // Handle unclear queries
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 3) {
      return {
        content: 'What topic do you want to learn?',
        topicName: null,
      };
    }

    // Check if this is a follow-up query that should use the last topic
    const isFollowUpQuery = /(explain|tell me more|elaborate|expand|more about|what else|continue|go on|can you elaborate|give me examples|examples|quiz me|summarize|summary)/i.test(lowerQuery) && lastTopic;

    let match;
    if (isFollowUpQuery) {
      // Use the last topic for follow-up queries
      match = { topic: topics[lastTopic], score: 1.0, topicName: lastTopic };
      console.log('🤖 ChatTab: Using last topic for follow-up query:', lastTopic);
    } else {
      // Find the best match for new queries
      match = findBestMatch(trimmedQuery, topics);
    }

    if (!match.topic || !isGoodMatch(match.score)) {
      const availableTopics = Object.keys(topics);
      const topicList =
        availableTopics.length <= 5
          ? availableTopics.join(', ')
          : availableTopics.slice(0, 5).join(', ') +
            `, and ${availableTopics.length - 5} more`;

      return {
        content: `I'm not sure which topic you're asking about.\n\nThe closest match I found was "${match.topicName || 'none'}" (${Math.round(match.score * 100)}% confidence).\n\nTry being more specific with key terms from your study material.\n\nAvailable topics: ${topicList}\n\nWhat topic do you want to learn?`,
        topicName: null,
      };
    }

    try {
      if (!generateExplanation) {
        return {
          content: `I found information about "${match.topicName}" but my AI processing module isn't available right now. Please try refreshing the page or check the Diagnostics tab for more information.`,
          topicName: match.topicName,
        };
      }

      console.log('🤖 ChatTab: Calling generateExplanation with:', {
        topicName: match.topicName,
        query: trimmedQuery,
        hasTopic: !!match.topic,
        isFollowUp: isFollowUpQuery,
      });

      // Get recent concepts from the last few messages for context
      const recentMessages = messages.slice(-4); // Last 4 messages
      const recentConcepts = recentMessages
        .filter(msg => msg.topic && msg.role === 'assistant')
        .map(msg => msg.topic)
        .filter((topic, index, arr) => arr.indexOf(topic) === index); // Unique topics

      const context = { recentConcepts };

      const response = await generateExplanation(match.topic, trimmedQuery, context);

      console.log(
        '🤖 ChatTab: Got response:',
        response.substring(0, 100) + '...'
      );

      // Update last topic for future follow-ups
      setLastTopic(match.topicName);

      return {
        content: response,
        topicName: match.topicName,
      };
    } catch (error) {
      console.error('Error generating explanation:', error);
      return {
        content:
          'I encountered an error processing your question. Try asking again.',
        topicName: null,
      };
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all chat history?')) {
      clearAllChatHistory();
      setMessages([]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            MindTutor AI
          </h2>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Learn math, biology, chemistry, physics, english, and more
          </p>
        </div>
        {messages.length > 1 && (
          <button
            onClick={handleClearHistory}
            className="px-4 py-2 bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-800/40 hover:border-red-300 dark:hover:border-red-600 transition-all duration-300 text-sm font-semibold shadow-sm hover:shadow-md"
          >
            🗑️ Clear History
          </button>
        )}
      </div>

      {/* Messages Container */}
      <div
        className="flex-1 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6 overflow-y-auto scrollbar-thin"
        style={{
          backgroundColor: 'var(--surface-primary)',
          border: '1px solid var(--border-primary)',
        }}
      >
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center p-8">
            <div
              className="max-w-2xl rounded-2xl p-8 shadow-xl"
              style={{
                backgroundColor: 'var(--surface-primary)',
                border: '1px solid var(--border-primary)',
              }}
            >
              <div className="text-8xl mb-6">📚</div>
              <h3
                className="text-3xl font-bold mb-4"
                style={{ color: 'var(--text-primary)' }}
              >
                Welcome to MindTutor AI
              </h3>
              <p
                className="text-lg mb-8 leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                I teach math, biology, chemistry, physics, english, and other
                academic subjects. Ask me to explain concepts, give examples, or
                quiz you.
              </p>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/40 p-5 rounded-xl border-2 border-blue-100 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1"
                  style={{
                    backgroundColor: 'var(--surface-secondary)',
                  }}
                >
                  <div className="text-4xl mb-3">💡</div>
                  <h4
                    className="font-bold mb-2 text-lg"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Explain Concepts
                  </h4>
                  <p
                    className="text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Get clear explanations of academic topics
                  </p>
                </div>
                <div
                  className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/40 dark:to-pink-900/40 p-5 rounded-xl border-2 border-purple-100 dark:border-purple-700 hover:border-purple-300 dark:hover:border-purple-500 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1"
                  style={{
                    backgroundColor: 'var(--surface-secondary)',
                  }}
                >
                  <div className="text-4xl mb-3">📚</div>
                  <h4
                    className="font-bold mb-2 text-lg"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Study Help
                  </h4>
                  <p
                    className="text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Summaries, examples, and practice questions
                  </p>
                </div>
                <div
                  className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/40 dark:to-emerald-900/40 p-5 rounded-xl border-2 border-green-100 dark:border-green-700 hover:border-green-300 dark:hover:border-green-500 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1"
                  style={{
                    backgroundColor: 'var(--surface-secondary)',
                  }}
                >
                  <div className="text-4xl mb-3">🎯</div>
                  <h4
                    className="font-bold mb-2 text-lg"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Exam Prep
                  </h4>
                  <p
                    className="text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Key points and practice questions
                  </p>
                </div>
                <div
                  className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/40 dark:to-amber-900/40 p-5 rounded-xl border-2 border-orange-100 dark:border-orange-700 hover:border-orange-300 dark:hover:border-orange-500 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1"
                  style={{
                    backgroundColor: 'var(--surface-secondary)',
                  }}
                >
                  <div className="text-4xl mb-3">❓</div>
                  <h4
                    className="font-bold mb-2 text-lg"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Q&A
                  </h4>
                  <p
                    className="text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Answer questions about academic topics
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div
                  className="max-w-[80%] rounded-2xl px-5 py-4 shadow-md"
                  style={{
                    background:
                      msg.role === 'user'
                        ? 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)'
                        : 'var(--surface-secondary)',
                    border:
                      msg.role === 'user'
                        ? 'none'
                        : '1px solid var(--border-primary)',
                    color:
                      msg.role === 'user' ? 'white' : 'var(--text-primary)',
                    boxShadow:
                      msg.role === 'user'
                        ? 'var(--shadow-lg)'
                        : 'var(--shadow-md)',
                  }}
                >
                  {msg.topic && (
                    <div
                      className={`text-xs font-semibold mb-2 flex items-center gap-2 ${msg.role === 'user' ? 'text-white/80' : 'text-blue-600 dark:text-blue-400'}`}
                    >
                      <span>📚</span>
                      <span>Topic: {msg.topic}</span>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap text-base leading-relaxed">
                    {msg.content}
                  </div>
                  <div
                    className={`text-xs mt-3 ${msg.role === 'user' ? 'text-white/60' : 'text-gray-400'}`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start animate-fade-in">
                <div
                  className="rounded-2xl px-5 py-4 shadow-md"
                  style={{
                    backgroundColor: 'var(--surface-secondary)',
                    border: '1px solid var(--border-primary)',
                    boxShadow: 'var(--shadow-md)',
                  }}
                >
                  <div className="flex space-x-2">
                    <div
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{
                        backgroundColor: 'var(--accent-primary)',
                      }}
                    ></div>
                    <div
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{
                        backgroundColor: 'var(--accent-secondary)',
                        animationDelay: '0.1s',
                      }}
                    ></div>
                    <div
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{
                        backgroundColor: 'var(--accent-primary)',
                        animationDelay: '0.2s',
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div
        className="rounded-2xl shadow-xl p-4 backdrop-blur-sm"
        style={{
          backgroundColor: 'var(--surface-primary)',
          border: '1px solid var(--border-primary)',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        <div className="flex gap-3">
          <textarea
            id="chat-input"
            name="chatInput"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me to explain concepts, give examples, or quiz you... (Press Enter to send)"
            className="flex-1 px-4 py-3 border-2 rounded-xl resize-none focus:ring-2 transition-all duration-300 text-base"
            style={{
              borderColor: 'var(--border-secondary)',
              backgroundColor: 'var(--surface-primary)',
              color: 'var(--text-primary)',
              '--tw-ring-color': 'var(--accent-primary)',
            }}
            rows="2"
            disabled={isTyping}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="px-8 py-3 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap"
            style={{
              background:
                !input.trim() || isTyping
                  ? 'var(--surface-secondary)'
                  : 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
              color: !input.trim() || isTyping ? 'var(--text-muted)' : 'white',
              border:
                !input.trim() || isTyping
                  ? '1px solid var(--border-primary)'
                  : 'none',
              cursor: !input.trim() || isTyping ? 'not-allowed' : 'pointer',
            }}
          >
            {isTyping ? '...' : '📚 Ask'}
          </button>
        </div>
        <div className="mt-3 flex gap-2 flex-wrap">
          <button
            onClick={() => setInput('explain this topic')}
            className="text-sm px-4 py-2 rounded-full transition-all duration-300 hover:shadow-md"
            style={{
              backgroundColor: 'var(--surface-secondary)',
              border: '1px solid var(--border-primary)',
              color: 'var(--text-primary)',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--surface-tertiary)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'var(--surface-secondary)';
            }}
          >
            📖 Explain
          </button>
          <button
            onClick={() => setInput('give me examples')}
            className="text-sm px-4 py-2 rounded-full transition-all duration-300 hover:shadow-md"
            style={{
              backgroundColor: 'var(--surface-secondary)',
              border: '1px solid var(--border-primary)',
              color: 'var(--text-primary)',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--surface-tertiary)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'var(--surface-secondary)';
            }}
          >
            💡 Examples
          </button>
          <button
            onClick={() => setInput('quiz me')}
            className="text-sm px-4 py-2 rounded-full transition-all duration-300 hover:shadow-md"
            style={{
              backgroundColor: 'var(--surface-secondary)',
              border: '1px solid var(--border-primary)',
              color: 'var(--text-primary)',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--surface-tertiary)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'var(--surface-secondary)';
            }}
          >
            📝 Quiz
          </button>
        </div>
      </div>
    </div>
  );
}
