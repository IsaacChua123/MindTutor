import React, { useState } from 'react';

export default function ReadingTab({ topics }) {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [lessonView, setLessonView] = useState('summary');
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [simplifiedLesson, setSimplifiedLesson] = useState('');

  const topicNames = Object.keys(topics);
  const currentTopic = selectedTopic ? topics[selectedTopic] : null;

  const simplifyLessonContent = async (type) => {
    if (!currentTopic) {
      console.error('❌ No current topic available for simplification');
      return;
    }

    console.log(`🤖 Starting ${type} generation for topic: ${selectedTopic}`);
    console.log('📊 Current topic data:', {
      hasRaw: !!currentTopic.raw,
      rawLength: currentTopic.raw?.length || 0,
      hasExplanation: !!currentTopic.explanation,
      explanationLength: currentTopic.explanation?.length || 0,
      conceptsCount: currentTopic.concepts?.length || 0,
      keywordsCount: currentTopic.keywords?.length || 0,
    });

    setIsSimplifying(true);
    try {
      // CRITICAL FIX: Set content FIRST
      const content = currentTopic.raw || currentTopic.explanation || '';

      console.log(
        `📝 Content source: ${currentTopic.raw ? 'raw' : 'explanation'}`
      );
      console.log(`📏 Content length: ${content.length} characters`);

      // Ensure we have enough content to work with
      if (!content || content.length < 100) {
        const errorMsg = `Not enough content available to generate a proper ${type}. The content is only ${content?.length || 0} characters. Please add more detailed content to this topic.`;
        console.error('❌', errorMsg);
        throw new Error(errorMsg);
      }

      console.log(
        `🔄 Calling generateReading${type.charAt(0).toUpperCase() + type.slice(1)} function`
      );

      // For ReadingTab AI features, use the specific reading generation functions
      const topicForAI = {
        topic: selectedTopic,
        raw: content,
        concepts: currentTopic.concepts || [],
        keywords: currentTopic.keywords || [],
      };

      console.log('🎯 Topic object for AI:', {
        topic: topicForAI.topic,
        rawLength: topicForAI.raw?.length || 0,
        conceptsCount: topicForAI.concepts?.length || 0,
        keywordsCount: topicForAI.keywords?.length || 0,
      });

      // Use the simplified reading generation function for both
      const { generateReadingSimplified } =
        await import('../utils/utils.js');
      const simplified = generateReadingSimplified(topicForAI);

      console.log(
        `✅ AI generation completed. Result length: ${simplified?.length || 0} characters`
      );
      console.log(
        `📄 Result preview:`,
        simplified?.substring(0, 200) + '...' || 'undefined'
      );

      if (!simplified || simplified.length < 200) {
        const errorMsg = `The generated ${type} is too short (${simplified?.length || 0} characters). The AI may not have had enough content to work with.`;
        console.error('❌', errorMsg);
        throw new Error(errorMsg);
      }

      console.log(
        `🎉 Successfully generated ${type} - setting lesson view to ${type}`
      );
      setSimplifiedLesson(simplified);
      setLessonView(type);
    } catch (error) {
      console.error('💥 Error in simplifyLessonContent:', error);
      console.error('🔍 Error details:', {
        message: error.message,
        stack: error.stack,
        type: type,
        topic: selectedTopic,
      });
      setSimplifiedLesson(
        `Sorry, I couldn't generate the ${type} right now. Error: ${error.message}. Please check the console for details and try again.`
      );
    } finally {
      setIsSimplifying(false);
    }
  };

  // Topic Selection UI
  if (!selectedTopic) {
    return (
      <div className="max-w-4xl">
        <h2
          className="text-3xl font-bold mb-6"
          style={{ color: 'var(--text-primary)' }}
        >
          📖 Reading & Study Materials
        </h2>

        {topicNames.length === 0 ? (
          <div
            className="px-6 py-4 rounded-lg"
            style={{
              backgroundColor: 'var(--accent-warning)',
              border: '1px solid var(--accent-warning)',
              color: 'var(--text-primary)',
            }}
          >
            No lessons available. Please import content first in the Import tab.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {topicNames.map((topicName) => {
              const topic = topics[topicName];
              const isDemo = topic?.isDemo;
              const conceptCount = topic?.concepts?.length || 0;
              const hasContent = topic?.raw || topic?.explanation;

              return (
                <div
                  key={topicName}
                  onClick={() => setSelectedTopic(topicName)}
                  className="rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border group cursor-pointer"
                  style={{
                    backgroundColor: 'var(--surface-primary)',
                    borderColor: 'var(--border-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = 'var(--accent-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = 'var(--border-secondary)';
                  }}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3
                          className="font-bold text-lg truncate mb-1"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {topicName}
                        </h3>
                        <div className="flex items-center gap-2">
                          {isDemo && (
                            <span
                              className="px-2 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: 'var(--accent-success)',
                                color: 'var(--text-primary)',
                              }}
                            >
                              🎯 Demo
                            </span>
                          )}
                          <span
                            className="text-sm"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {conceptCount} concepts
                          </span>
                        </div>
                      </div>
                    </div>

                    <p
                      className="text-sm mb-4 line-clamp-2"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {hasContent
                        ? 'Read and study the full lesson content'
                        : 'No reading content available'}
                    </p>

                    <div className="text-center">
                      <div className="text-blue-600 dark:text-blue-400 font-medium text-sm mb-2">
                        📖 Read & Study
                      </div>
                      <div className="w-full bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 hover:from-blue-600 hover:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 text-sm">
                        Start Reading →
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Reading Interface
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2
            className="text-3xl font-bold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            📖 {currentTopic?.topic || selectedTopic}
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Read, study, and understand your lesson content
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedTopic('');
            setSimplifiedLesson('');
            setLessonView('summary');
          }}
          className="px-4 py-2 text-white rounded-lg transition-colors"
          style={{
            backgroundColor: 'var(--text-muted)',
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'var(--text-secondary)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'var(--text-muted)';
          }}
        >
          ← Back to Topics
        </button>
      </div>

      {/* Lesson Content with View Controls */}
      {currentTopic?.raw || currentTopic?.explanation ? (
        <div
          className="rounded-lg shadow-md p-6 mb-6"
          style={{
            backgroundColor: 'var(--surface-primary)',
            border: '1px solid var(--border-primary)',
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3
              className="text-xl font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              📚 Lesson Content
            </h3>

            {/* View Controls */}
            <div className="flex items-center gap-2">
              <span
                className="text-sm mr-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                Reading Mode:
              </span>
              <div
                className="flex rounded-lg p-1"
                style={{ backgroundColor: 'var(--surface-secondary)' }}
              >
                <button
                  onClick={() => setLessonView('summary')}
                  className="px-3 py-1 text-sm rounded-md transition-colors"
                  style={{
                    backgroundColor:
                      lessonView === 'summary'
                        ? 'var(--accent-primary)'
                        : 'transparent',
                    color:
                      lessonView === 'summary'
                        ? 'white'
                        : 'var(--text-secondary)',
                  }}
                >
                  🤖 AI Summary
                </button>
                <button
                  onClick={() => setLessonView('simplified')}
                  className="px-3 py-1 text-sm rounded-md transition-colors"
                  style={{
                    backgroundColor:
                      lessonView === 'simplified'
                        ? 'var(--accent-success)'
                        : 'transparent',
                    color:
                      lessonView === 'simplified'
                        ? 'white'
                        : 'var(--text-secondary)',
                  }}
                >
                  🎈 Fun & Simple
                </button>
                <button
                  onClick={() => setLessonView('full')}
                  className="px-3 py-1 text-sm rounded-md transition-colors"
                  style={{
                    backgroundColor:
                      lessonView === 'full'
                        ? 'var(--accent-secondary)'
                        : 'transparent',
                    color:
                      lessonView === 'full' ? 'white' : 'var(--text-secondary)',
                  }}
                >
                  📖 Full Text
                </button>
              </div>
            </div>
          </div>

          {/* AI Controls */}
          <div
            className="flex flex-wrap gap-3 mb-6 p-4 rounded-lg border"
            style={{
              background:
                'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)',
              borderColor: 'var(--border-secondary)',
            }}
          >
            <button
              onClick={() => simplifyLessonContent('summary')}
              disabled={isSimplifying}
              className="px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
              style={{
                backgroundColor: isSimplifying
                  ? 'var(--text-muted)'
                  : 'var(--accent-primary)',
                cursor: isSimplifying ? 'not-allowed' : 'pointer',
              }}
            >
              {isSimplifying ? '⏳' : '🤖'}{' '}
              {isSimplifying ? 'Generating...' : 'Smart AI Summary'}
            </button>
            <button
              onClick={() => simplifyLessonContent('simplified')}
              disabled={isSimplifying}
              className="px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
              style={{
                backgroundColor: isSimplifying
                  ? 'var(--text-muted)'
                  : 'var(--accent-success)',
                cursor: isSimplifying ? 'not-allowed' : 'pointer',
              }}
            >
              {isSimplifying ? '⏳' : '🎈'}{' '}
              {isSimplifying ? 'Creating...' : 'Fun & Simple Version'}
            </button>
            <div
              className="flex-1 text-xs self-center"
              style={{ color: 'var(--text-secondary)' }}
            >
              💡 Use AI to transform long lessons into engaging, easy-to-read
              content perfect for studying
            </div>
          </div>

          {/* Content Display */}
          <div className="prose prose-gray max-w-none">
            {lessonView === 'summary' && simplifiedLesson && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-600 p-6 rounded-r-lg">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🤖</span>
                  <div>
                    <h4 className="font-bold text-blue-800 dark:text-blue-200 text-lg">
                      Smart AI Summary
                    </h4>
                    <p className="text-blue-600 dark:text-blue-300 text-sm">
                      Intelligent overview with key concepts and explanations
                    </p>
                  </div>
                </div>
                <div className="text-gray-800 dark:text-gray-100 leading-relaxed whitespace-pre-wrap text-base max-h-96 overflow-y-auto scrollbar-thin">
                  {simplifiedLesson}
                </div>
              </div>
            )}

            {lessonView === 'simplified' && simplifiedLesson && (
              <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 dark:border-green-600 p-6 rounded-r-lg">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🎈</span>
                  <div>
                    <h4 className="font-bold text-green-800 dark:text-green-200 text-lg">
                      Fun & Simple Version
                    </h4>
                    <p className="text-green-600 dark:text-green-300 text-sm">
                      Easy-to-read content with simple language and engaging style
                    </p>
                  </div>
                </div>
                <div className="text-gray-800 dark:text-gray-100 leading-relaxed whitespace-pre-wrap text-base max-h-96 overflow-y-auto scrollbar-thin">
                  {simplifiedLesson}
                </div>
              </div>
            )}

            {lessonView === 'full' && (
              <div className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 dark:border-purple-600 p-6 rounded-r-lg">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">📖</span>
                  <div>
                    <h4 className="font-bold text-purple-800 dark:text-purple-200 text-lg">
                      Original Full Content
                    </h4>
                    <p className="text-purple-600 dark:text-purple-300 text-sm">
                      Complete lesson text as imported
                    </p>
                  </div>
                </div>
                <div className="space-y-6">
                  {currentTopic.raw && (
                    <div className="bg-white dark:bg-gray-700 p-4 rounded border border-gray-200 dark:border-gray-600">
                      <h5 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">
                        Lesson Content
                      </h5>
                      <div className="text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto scrollbar-thin">
                        {currentTopic.raw}
                      </div>
                    </div>
                  )}

                  {currentTopic.explanation && (
                    <div className="bg-white dark:bg-gray-700 p-4 rounded border border-gray-200 dark:border-gray-600">
                      <h5 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">
                        Detailed Explanation
                      </h5>
                      <div className="text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto scrollbar-thin">
                        {currentTopic.explanation}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!simplifiedLesson && lessonView !== 'full' && (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-500">
                <div className="text-6xl mb-4">🤖</div>
                <h4 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Ready to Transform Your Lesson?
                </h4>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Click one of the AI buttons above to create an engaging,
                  easy-to-read version of this lesson!
                </p>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Perfect for studying • Saves time • Makes learning fun
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-600 rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">📭</div>
          <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            No Reading Content Available
          </h3>
          <p className="text-yellow-700 dark:text-yellow-300">
            This lesson doesn't have reading content. Try the Lessons tab for
            interactive learning activities.
          </p>
        </div>
      )}

      {/* Quick Actions */}
      {currentTopic && (
        <div
          className="rounded-lg shadow-md p-6"
          style={{
            backgroundColor: 'var(--surface-primary)',
            border: '1px solid var(--border-primary)',
          }}
        >
          <h3
            className="text-lg font-semibold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            🎯 Continue Learning
          </h3>
          <div className="space-y-3">
            <div
              className="text-sm mb-3"
              style={{ color: 'var(--text-secondary)' }}
            >
              Switch to these tabs to continue your learning journey:
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div
                className="border rounded-lg p-4 text-center"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border-secondary)',
                }}
              >
                <div className="text-2xl mb-2">🎮</div>
                <div
                  className="font-semibold mb-1"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  Interactive Games
                </div>
                <div
                  className="text-sm mb-3"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Practice concepts with fun games
                </div>
                <div
                  className="text-xs px-2 py-1 rounded"
                  style={{
                    backgroundColor: 'var(--surface-secondary)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Switch to "Lessons" tab
                </div>
              </div>
              <div
                className="border rounded-lg p-4 text-center"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border-secondary)',
                }}
              >
                <div className="text-2xl mb-2">🧠</div>
                <div
                  className="font-semibold mb-1"
                  style={{ color: 'var(--accent-success)' }}
                >
                  Knowledge Quiz
                </div>
                <div
                  className="text-sm mb-3"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Test what you've learned
                </div>
                <div
                  className="text-xs px-2 py-1 rounded"
                  style={{
                    backgroundColor: 'var(--surface-secondary)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Switch to "Quiz" tab
                </div>
              </div>
              <div
                className="border rounded-lg p-4 text-center"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border-secondary)',
                }}
              >
                <div className="text-2xl mb-2">💬</div>
                <div
                  className="font-semibold mb-1"
                  style={{ color: 'var(--accent-secondary)' }}
                >
                  AI Chat
                </div>
                <div
                  className="text-sm mb-3"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Ask questions and get explanations
                </div>
                <div
                  className="text-xs px-2 py-1 rounded"
                  style={{
                    backgroundColor: 'var(--surface-secondary)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Switch to "Chat" tab
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
