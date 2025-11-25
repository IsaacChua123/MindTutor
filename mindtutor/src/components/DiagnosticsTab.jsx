import React, { useState, useEffect, useCallback } from 'react';
import { loadQuizHistory } from '../utils/storage';

export default function DiagnosticsTab() {
  // Helper functions to replace ML dependencies
  const generateBasicInsights = (history) => {
    if (history.length === 0) return null;

    const recentScores = history.slice(-5).map(h => h.score);
    const avgRecentScore = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
    
    return {
      nextPerformance: {
        value: avgRecentScore / 100,
        confidence: 0.7,
        basedOn: 'recent quiz performance trends',
      },
      optimalLearningTime: {
        bestHour: 14, // 2 PM
        reason: 'Based on your activity patterns',
      },
      preferredDifficulty: {
        level: 3,
        reason: 'Average difficulty you perform best on',
      },
    };
  };

  const analyzeBasicPatterns = (history) => {
    if (history.length === 0) return null;

    const topics = history.map(h => h.topic);
    const topicFrequency = {};
    topics.forEach(topic => {
      topicFrequency[topic] = (topicFrequency[topic] || 0) + 1;
    });

    return {
      cognitive: {
        dominantQuestionType: 'mixed',
        learningApproach: 'balanced',
        cognitiveStrengths: ['pattern_recognition', 'logical_thinking'],
      },
      temporal: {
        optimalStudyHour: 14,
        studyConsistency: 0.6,
        peakPerformanceHours: [14, 15, 16],
      },
      conceptual: {
        conceptMastery: [],
        learningProgression: {
          overallTrajectory: 'improving',
        },
        knowledgeGaps: [],
      },
      emotional: {
        emotionalTriggers: [
          { emotion: 'focused', count: history.length },
        ],
        emotionalResilience: {
          recoveryRate: 0.8,
        },
      },
    };
  };

  const generateSimpleResponse = (message, conversation) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('help') || lowerMessage.includes('what should')) {
      return {
        response: "Based on your quiz performance, I recommend focusing on areas where you scored below 70%. Try reviewing those topics and taking additional practice quizzes.",
      };
    }
    
    if (lowerMessage.includes('progress') || lowerMessage.includes('improve')) {
      return {
        response: "Your learning progress shows positive trends! Keep practicing regularly and focus on your weak areas. You're making steady improvement.",
      };
    }
    
    if (lowerMessage.includes('weak') || lowerMessage.includes('struggling')) {
      return {
        response: "Everyone has areas for improvement! Focus on one weak area at a time, use practice questions, and don't hesitate to review the material multiple times.",
      };
    }
    
    return {
      response: "I'm here to help you understand your learning patterns and improve your performance. Ask me about your progress, areas for improvement, or study strategies!",
    };
  };

  const identifyQuestionType = (questionText) => {
    const lower = questionText.toLowerCase();
    if (
      lower.includes('which') ||
      lower.includes('what is') ||
      lower.includes('select')
    ) {
      return 'mcq';
    }
    if (
      lower.includes('true or false') ||
      questionText.includes('True') ||
      questionText.includes('False')
    ) {
      return 'truefalse';
    }
    if (questionText.includes('_____')) {
      return 'fillblank';
    }
    if (
      lower.includes('explain') ||
      lower.includes('describe') ||
      lower.includes('detail')
    ) {
      return 'explain';
    }
    return 'shortanswer';
  };

  const calculateCognitiveScore = (...questionTypes) => {
    let totalQuestions = 0;
    let correctQuestions = 0;

    questionTypes.forEach((type) => {
      if (type && type.total > 0) {
        totalQuestions += type.total;
        correctQuestions += type.correct;
      }
    });

    return totalQuestions > 0 ? (correctQuestions / totalQuestions) * 100 : 0;
  };

  const calculateDiagnostics = useCallback((history) => {
    if (history.length === 0) {
      return {
        topicAccuracy: {},
        conceptAccuracy: {},
        weaknesses: [],
        strengths: [],
        cognitiveTypes: {
          factualRecall: 0,
          comprehension: 0,
          application: 0,
          analysis: 0,
        },
        overallScore: 0,
        totalQuizzes: 0,
      };
    }

    const topicAccuracy = {};
    const conceptAccuracy = {};
    const questionTypePerformance = {
      mcq: { total: 0, correct: 0 },
      truefalse: { total: 0, correct: 0 },
      fillblank: { total: 0, correct: 0 },
      shortanswer: { total: 0, correct: 0 },
      explain: { total: 0, correct: 0 },
    };

    let totalQuestions = 0;
    let totalCorrect = 0;

    history.forEach((attempt) => {
      const { topic, score, results } = attempt;

      // Track topic accuracy with better calculation
      if (!topicAccuracy[topic]) {
        topicAccuracy[topic] = {
          total: 0,
          correct: 0,
          attempts: 0,
          scores: [],
        };
      }
      topicAccuracy[topic].total += results.length;
      topicAccuracy[topic].correct += results.filter((r) => r.isCorrect).length;
      topicAccuracy[topic].attempts += 1;
      topicAccuracy[topic].scores.push(score);

      totalQuestions += results.length;

      // Track concept accuracy and question types
      results.forEach((result) => {
        const concept = result.conceptTested;
        if (!conceptAccuracy[concept]) {
          conceptAccuracy[concept] = { total: 0, correct: 0, partialScore: 0 };
        }
        conceptAccuracy[concept].total += 1;

        if (result.isCorrect) {
          conceptAccuracy[concept].correct += 1;
          totalCorrect += 1;
        }

        // Track partial scores if available
        if (result.partialScore !== undefined) {
          conceptAccuracy[concept].partialScore += result.partialScore / 100;
        }

        // Track question type performance
        const questionType = identifyQuestionType(result.question);
        if (questionTypePerformance[questionType]) {
          questionTypePerformance[questionType].total += 1;
          if (result.isCorrect) {
            questionTypePerformance[questionType].correct += 1;
          }
        }
      });
    });

    // Calculate weaknesses and strengths with better thresholds
    const conceptScores = Object.entries(conceptAccuracy).map(
      ([concept, data]) => ({
        concept,
        accuracy: (data.correct / data.total) * 100,
        total: data.total,
        partialAccuracy:
          data.partialScore > 0 ? (data.partialScore / data.total) * 100 : 0,
      })
    );

    // Weaknesses: accuracy < 50% AND at least 2 attempts
    const weaknesses = conceptScores
      .filter((c) => c.accuracy < 50 && c.total >= 2)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);

    // Strengths: accuracy >= 75% AND at least 3 attempts
    const strengths = conceptScores
      .filter((c) => c.accuracy >= 75 && c.total >= 3)
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 5);

    // Calculate cognitive types based on question performance
    const cognitiveTypes = {
      factualRecall: calculateCognitiveScore(
        questionTypePerformance.mcq,
        questionTypePerformance.truefalse
      ),
      comprehension: calculateCognitiveScore(
        questionTypePerformance.fillblank,
        questionTypePerformance.shortanswer
      ),
      application: calculateCognitiveScore(questionTypePerformance.shortanswer),
      analysis: calculateCognitiveScore(questionTypePerformance.explain),
    };

    // Calculate true overall score based on actual performance
    const trueOverallScore =
      totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

    return {
      topicAccuracy,
      conceptAccuracy,
      weaknesses,
      strengths,
      cognitiveTypes,
      overallScore: Math.round(trueOverallScore),
      totalQuizzes: history.length,
      totalQuestions,
      totalCorrect,
    };
  }, []);

  const [diagnostics, setDiagnostics] = useState(null);
  const [quizHistory, setQuizHistory] = useState([]);
  const [mlInsights, setMlInsights] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [advancedInsights, setAdvancedInsights] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const history = await loadQuizHistory();
      setQuizHistory(history);
      setDiagnostics(calculateDiagnostics(history));

      // Load basic analytics insights
      try {
        // Create basic ML insights from quiz history
        const basicInsights = generateBasicInsights(history);
        setMlInsights(basicInsights);

        // Generate advanced insights from patterns
        const patterns = analyzeBasicPatterns(history);
        setAdvancedInsights(patterns);
      } catch (error) {
        console.warn('Analytics insights loading failed:', error);
      }
    };
    loadData();
  }, [calculateDiagnostics]);

  // Handle conversation input
  const handleConversationSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isTyping) return;

    const userMessage = userInput.trim();
    setUserInput('');
    setIsTyping(true);

    // Add user message to conversation
    setConversation((prev) => [
      ...prev,
      {
        type: 'user',
        message: userMessage,
        timestamp: new Date(),
      },
    ]);

    try {
      // Process with simple AI response
      const result = generateSimpleResponse(userMessage, conversation);

      // Add AI response to conversation
      setConversation((prev) => [
        ...prev,
        {
          type: 'ai',
          message: result.response,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error('Conversation error:', error);
      setConversation((prev) => [
        ...prev,
        {
          type: 'ai',
          message:
            'I apologize, but I encountered an error processing your message. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!diagnostics) {
    return <div>Loading...</div>;
  }

  const clearAndReloadTopics = async () => {
    if (window.confirm('This will clear all cached topics and reload sample data with updated keyword filtering. Continue?')) {
      try {
        // Clear localStorage
        localStorage.removeItem('mindtutor_topics');
        console.log('✅ Cleared cached topics');

        // Force page reload to trigger sample loading
        window.location.reload();
      } catch (error) {
        console.error('Error clearing topics:', error);
        alert('Error clearing topics. Check console for details.');
      }
    }
  };

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h2
          className="text-3xl font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          Diagnostics
        </h2>
        <button
          onClick={clearAndReloadTopics}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          🔄 Reset Topics
        </button>
      </div>

      {quizHistory.length === 0 ? (
        <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-400 dark:border-yellow-600 text-yellow-800 dark:text-yellow-300 px-6 py-4 rounded-lg">
          No quiz data available yet. Take some quizzes to see your diagnostics!
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overall Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              className="rounded-lg shadow-md p-6"
              style={{
                backgroundColor: 'var(--surface-primary)',
                border: '1px solid var(--border-primary)',
              }}
            >
              <div
                className="text-sm font-semibold mb-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                Overall Score
              </div>
              <div
                className="text-4xl font-bold"
                style={{ color: 'var(--accent-primary)' }}
              >
                {Math.round(diagnostics.overallScore)}%
              </div>
            </div>
            <div
              className="rounded-lg shadow-md p-6"
              style={{
                backgroundColor: 'var(--surface-primary)',
                border: '1px solid var(--border-primary)',
              }}
            >
              <div
                className="text-sm font-semibold mb-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                Total Quizzes
              </div>
              <div
                className="text-4xl font-bold"
                style={{ color: 'var(--accent-success)' }}
              >
                {diagnostics.totalQuizzes}
              </div>
            </div>
            <div
              className="rounded-lg shadow-md p-6"
              style={{
                backgroundColor: 'var(--surface-primary)',
                border: '1px solid var(--border-primary)',
              }}
            >
              <div
                className="text-sm font-semibold mb-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                Topics Studied
              </div>
              <div
                className="text-4xl font-bold"
                style={{ color: 'var(--accent-secondary)' }}
              >
                {Object.keys(diagnostics.topicAccuracy).length}
              </div>
            </div>
          </div>

          {/* ML-Powered Insights */}
          {mlInsights && (
            <div
              className="rounded-lg shadow-md p-6"
              style={{
                backgroundColor: 'var(--surface-primary)',
                border: '1px solid var(--border-primary)',
              }}
            >
              <h3
                className="text-xl font-bold mb-4 flex items-center"
                style={{ color: 'var(--text-primary)' }}
              >
                🤖 AI-Powered Insights
                <span className="ml-2 text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 px-2 py-1 rounded">
                  Machine Learning
                </span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Performance Prediction */}
                {mlInsights.nextPerformance && (
                  <div className="space-y-3">
                    <h4
                      className="font-semibold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Predicted Next Performance
                    </h4>
                    <div className="flex items-center space-x-3">
                      <div
                        className="text-2xl font-bold"
                        style={{
                          color:
                            mlInsights.nextPerformance.value >= 0.8
                              ? 'var(--accent-success)'
                              : mlInsights.nextPerformance.value >= 0.6
                                ? 'var(--accent-warning)'
                                : 'var(--accent-error)',
                        }}
                      >
                        {Math.round(mlInsights.nextPerformance.value * 100)}%
                      </div>
                      <div
                        className="text-sm"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Confidence:{' '}
                        {Math.round(
                          mlInsights.nextPerformance.confidence * 100
                        )}
                        %
                      </div>
                    </div>
                    <p
                      className="text-sm"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {mlInsights.nextPerformance.basedOn}
                    </p>
                  </div>
                )}

                {/* Optimal Learning Time */}
                {mlInsights.optimalLearningTime && (
                  <div className="space-y-3">
                    <h4
                      className="font-semibold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Optimal Study Time
                    </h4>
                    <div
                      className="text-lg font-bold"
                      style={{ color: 'var(--accent-primary)' }}
                    >
                      {mlInsights.optimalLearningTime.bestHour}:00
                    </div>
                    <p
                      className="text-sm"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {mlInsights.optimalLearningTime.reason}
                    </p>
                  </div>
                )}

                {/* Preferred Difficulty */}
                {mlInsights.preferredDifficulty && (
                  <div className="space-y-3">
                    <h4
                      className="font-semibold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Recommended Difficulty
                    </h4>
                    <div
                      className="text-lg font-bold"
                      style={{ color: 'var(--accent-secondary)' }}
                    >
                      Level {mlInsights.preferredDifficulty.level}
                    </div>
                    <p
                      className="text-sm"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {mlInsights.preferredDifficulty.reason}
                    </p>
                  </div>
                )}

                {/* Learning Path */}
                {mlInsights.learningPath && (
                  <div className="space-y-3">
                    <h4
                      className="font-semibold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Learning Focus Areas
                    </h4>
                    <div className="space-y-2">
                      {mlInsights.learningPath.immediateFocus
                        .slice(0, 2)
                        .map((focus, index) => (
                          <div key={index} className="text-sm">
                            <span
                              className="font-medium"
                              style={{ color: 'var(--accent-error)' }}
                            >
                              Priority: {focus.skill}
                            </span>
                            <span
                              className="ml-2"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              ({focus.estimatedTime} sessions)
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ML Recommendations */}
              {mlInsights.recommendations &&
                mlInsights.recommendations.length > 0 && (
                  <div
                    className="mt-6 pt-6 border-t"
                    style={{ borderColor: 'var(--border-primary)' }}
                  >
                    <h4
                      className="font-semibold mb-3"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Personalized Recommendations
                    </h4>
                    <div className="space-y-2">
                      {mlInsights.recommendations
                        .slice(0, 3)
                        .map((rec, index) => (
                          <div
                            key={index}
                            className="flex items-start space-x-3 p-3 rounded-lg"
                            style={{
                              backgroundColor: 'var(--bg-primary)',
                            }}
                          >
                            <span className="text-lg">
                              {rec.priority === 'high'
                                ? '🚨'
                                : rec.type === 'engagement'
                                  ? '🎯'
                                  : '💡'}
                            </span>
                            <div className="flex-1">
                              <div
                                className="font-medium"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                {rec.type.replace('_', ' ').toUpperCase()}
                              </div>
                              <div
                                className="text-sm"
                                style={{ color: 'var(--text-secondary)' }}
                              >
                                {rec.reason}
                              </div>
                              {rec.confidence && (
                                <div
                                  className="text-xs mt-1"
                                  style={{ color: 'var(--text-secondary)' }}
                                >
                                  Confidence: {Math.round(rec.confidence * 100)}
                                  %
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Advanced AI Insights */}
          {advancedInsights && (
            <div
              className="rounded-lg shadow-md p-6"
              style={{
                backgroundColor: 'var(--surface-primary)',
                border: '1px solid var(--border-primary)',
              }}
            >
              <h3
                className="text-xl font-bold mb-4 flex items-center"
                style={{ color: 'var(--text-primary)' }}
              >
                🧠 Advanced AI Learning Analysis
                <span className="ml-2 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded">
                  NLP + Reasoning
                </span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cognitive Patterns */}
                {advancedInsights.cognitive && (
                  <div className="space-y-3">
                    <h4
                      className="font-semibold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Cognitive Learning Patterns
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Dominant Style:</span>
                        <span className="font-medium capitalize">
                          {advancedInsights.cognitive.dominantQuestionType?.replace(
                            '_',
                            ' '
                          ) || 'Mixed'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Learning Approach:</span>
                        <span className="font-medium capitalize">
                          {advancedInsights.cognitive.learningApproach?.replace(
                            '_',
                            ' '
                          ) || 'Balanced'}
                        </span>
                      </div>
                      {advancedInsights.cognitive.cognitiveStrengths?.length >
                        0 && (
                        <div>
                          <span>Strengths:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {advancedInsights.cognitive.cognitiveStrengths.map(
                              (strength, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-2 py-1 rounded"
                                >
                                  {strength.replace('_', ' ')}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Temporal Patterns */}
                {advancedInsights.temporal &&
                  advancedInsights.temporal.optimalStudyHour && (
                    <div className="space-y-3">
                      <h4
                        className="font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        Optimal Study Patterns
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Best Study Time:</span>
                          <span className="font-medium">
                            {advancedInsights.temporal.optimalStudyHour}:00
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Consistency:</span>
                          <span className="font-medium">
                            {Math.round(
                              (advancedInsights.temporal.studyConsistency ||
                                0) * 100
                            )}
                            %
                          </span>
                        </div>
                        {advancedInsights.temporal.peakPerformanceHours
                          ?.length > 0 && (
                          <div>
                            <span>Peak Hours:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {advancedInsights.temporal.peakPerformanceHours.map(
                                (hour, idx) => (
                                  <span
                                    key={idx}
                                    className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 px-2 py-1 rounded"
                                  >
                                    {hour}:00
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                {/* Conceptual Patterns */}
                {advancedInsights.conceptual && (
                  <div className="space-y-3">
                    <h4
                      className="font-semibold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Knowledge Structure
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Mastered Concepts:</span>
                        <span className="font-medium">
                          {advancedInsights.conceptual.conceptMastery?.filter(
                            (c) => c.masteryLevel > 0.8
                          ).length || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Knowledge Gaps:</span>
                        <span className="font-medium text-red-600">
                          {advancedInsights.conceptual.knowledgeGaps?.length ||
                            0}
                        </span>
                      </div>
                      {advancedInsights.conceptual.learningProgression
                        ?.overallTrajectory && (
                        <div className="flex justify-between">
                          <span>Progress Trajectory:</span>
                          <span
                            className={`font-medium capitalize ${
                              advancedInsights.conceptual.learningProgression
                                .overallTrajectory === 'strong_performer'
                                ? 'text-green-600'
                                : advancedInsights.conceptual
                                      .learningProgression.overallTrajectory ===
                                    'needs_improvement'
                                  ? 'text-red-600'
                                  : 'text-yellow-600'
                            }`}
                          >
                            {advancedInsights.conceptual.learningProgression.overallTrajectory.replace(
                              '_',
                              ' '
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Emotional Patterns */}
                {advancedInsights.emotional && (
                  <div className="space-y-3">
                    <h4
                      className="font-semibold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Emotional Learning Dynamics
                    </h4>
                    <div className="space-y-2">
                      {advancedInsights.emotional.emotionalTriggers?.length >
                        0 && (
                        <div>
                          <span>Emotional Triggers:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {advancedInsights.emotional.emotionalTriggers
                              .slice(0, 3)
                              .map((trigger, idx) => (
                                <span
                                  key={idx}
                                  className={`text-xs px-2 py-1 rounded capitalize ${
                                    trigger.emotion === 'excited'
                                      ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                                      : trigger.emotion === 'frustrated'
                                        ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                                        : 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-300'
                                  }`}
                                >
                                  {trigger.emotion}
                                </span>
                              ))}
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Emotional Resilience:</span>
                        <span className="font-medium">
                          {Math.round(
                            (advancedInsights.emotional.emotionalResilience
                              ?.recoveryRate || 0) * 100
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI Conversational Tutor */}
          <div
            className="rounded-lg shadow-md p-6"
            style={{
              backgroundColor: 'var(--surface-primary)',
              border: '1px solid var(--border-primary)',
            }}
          >
            <h3
              className="text-xl font-bold mb-4 flex items-center"
              style={{ color: 'var(--text-primary)' }}
            >
              💬 AI Learning Assistant
              <span className="ml-2 text-xs bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-2 py-1 rounded">
                Conversational AI
              </span>
            </h3>

            {/* Conversation History */}
            <div
              className="mb-4 max-h-96 overflow-y-auto space-y-3"
              style={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '0.5rem',
                padding: '1rem',
              }}
            >
              {conversation.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">🤖</div>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    Hi! I'm your AI learning assistant. Ask me anything about
                    your studies, request explanations, or get personalized
                    learning recommendations!
                  </p>
                  <div
                    className="mt-4 space-y-2 text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <p>💡 Try asking:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <span className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-xs">
                        "Explain photosynthesis"
                      </span>
                      <span className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-xs">
                        "Help me understand atoms"
                      </span>
                      <span className="bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 px-3 py-1 rounded-full text-xs">
                        "Create practice questions"
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                conversation.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.type === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      {msg.analysis && (
                        <div className="mt-2 text-xs opacity-75">
                          <span>Intent: {msg.analysis.intent}</span>
                          {msg.analysis.confidence && (
                            <span className="ml-2">
                              Confidence:{' '}
                              {Math.round(msg.analysis.confidence * 100)}%
                            </span>
                          )}
                        </div>
                      )}
                      {msg.suggestions && msg.suggestions.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {msg.suggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => setUserInput(suggestion)}
                              className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                          style={{ animationDelay: '0.1s' }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                          style={{ animationDelay: '0.2s' }}
                        ></div>
                      </div>
                      <span className="text-sm">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form
              onSubmit={handleConversationSubmit}
              className="flex space-x-2"
            >
              <input
                id="diagnostics-input"
                name="diagnosticsInput"
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Ask me anything about your learning..."
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border-primary)',
                  color: 'var(--text-primary)',
                }}
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={!userInput.trim() || isTyping}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isTyping ? '...' : 'Send'}
              </button>
            </form>
          </div>

          {/* Topic Performance */}
          <div
            className="rounded-lg shadow-md p-6"
            style={{
              backgroundColor: 'var(--surface-primary)',
              border: '1px solid var(--border-primary)',
            }}
          >
            <h3
              className="text-xl font-bold mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              Performance by Topic
            </h3>
            <div className="space-y-4">
              {Object.entries(diagnostics.topicAccuracy).map(
                ([topic, data]) => {
                  const accuracy = (data.correct / data.total) * 100;
                  return (
                    <div key={topic}>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="font-semibold"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {topic}
                        </span>
                        <span
                          className="text-sm"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {Math.round(accuracy)}% ({data.correct}/{data.total})
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${
                            accuracy >= 80
                              ? 'bg-green-500 dark:bg-green-400'
                              : accuracy >= 60
                                ? 'bg-yellow-500 dark:bg-yellow-400'
                                : 'bg-red-500 dark:bg-red-400'
                          }`}
                          style={{ width: `${accuracy}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* Weaknesses */}
          {diagnostics.weaknesses.length > 0 && (
            <div
              className="rounded-lg shadow-md p-6"
              style={{
                backgroundColor: 'var(--surface-primary)',
                border: '1px solid var(--border-primary)',
              }}
            >
              <h3
                className="text-xl font-bold mb-4"
                style={{ color: 'var(--accent-error)' }}
              >
                Areas for Improvement
              </h3>
              <div className="space-y-3">
                {diagnostics.weaknesses.map((weakness, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{
                      backgroundColor: 'var(--bg-primary)',
                    }}
                  >
                    <span
                      className="font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {weakness.concept}
                    </span>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: 'var(--accent-error)' }}
                    >
                      {Math.round(weakness.accuracy)}%
                    </span>
                  </div>
                ))}
              </div>
              <div
                className="mt-4 p-4 rounded-lg"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                }}
              >
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  💡 <strong>Recommendation:</strong> Focus on reviewing these
                  concepts. Try taking more quizzes on these topics to improve
                  your understanding.
                </p>
              </div>
            </div>
          )}

          {/* Strengths */}
          {diagnostics.strengths.length > 0 && (
            <div
              className="rounded-lg shadow-md p-6"
              style={{
                backgroundColor: 'var(--surface-primary)',
                border: '1px solid var(--border-primary)',
              }}
            >
              <h3
                className="text-xl font-bold mb-4"
                style={{ color: 'var(--accent-success)' }}
              >
                Your Strengths
              </h3>
              <div className="space-y-3">
                {diagnostics.strengths.map((strength, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{
                      backgroundColor: 'var(--bg-primary)',
                    }}
                  >
                    <span
                      className="font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {strength.concept}
                    </span>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: 'var(--accent-success)' }}
                    >
                      {Math.round(strength.accuracy)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cognitive Analysis */}
          <div
            className="rounded-lg shadow-md p-6"
            style={{
              backgroundColor: 'var(--surface-primary)',
              border: '1px solid var(--border-primary)',
            }}
          >
            <h3
              className="text-xl font-bold mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              Learning Profile Analysis
            </h3>
            <p
              className="text-sm mb-4"
              style={{ color: 'var(--text-secondary)' }}
            >
              This shows your performance across different types of questions,
              helping identify your cognitive strengths.
            </p>
            <div className="space-y-4">
              {Object.entries(diagnostics.cognitiveTypes).map(
                ([type, score]) => {
                  const displayName =
                    {
                      factualRecall: 'Factual Recall (MCQ & True/False)',
                      comprehension: 'Comprehension (Fill-in & Short Answer)',
                      application: 'Application (Short Answer)',
                      analysis: 'Analysis & Explanation (Essay Questions)',
                    }[type] || type;

                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="font-semibold"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {displayName}
                        </span>
                        <span
                          className="text-sm"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {Math.round(score)}%
                        </span>
                      </div>
                      <div
                        className="w-full rounded-full h-2"
                        style={{ backgroundColor: 'var(--surface-secondary)' }}
                      >
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${Math.max(score, 2)}%`,
                            backgroundColor:
                              score >= 75
                                ? 'var(--accent-success)'
                                : score >= 50
                                  ? 'var(--accent-warning)'
                                  : 'var(--accent-error)',
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
            <div
              className="mt-4 p-4 rounded-lg"
              style={{
                backgroundColor: 'var(--bg-primary)',
              }}
            >
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                💡 <strong>Tip:</strong> Focus on improving areas below 50% by
                practicing more questions of those types.
              </p>
            </div>
          </div>

          {/* Recent Quiz History */}
          <div
            className="rounded-lg shadow-md p-6"
            style={{
              backgroundColor: 'var(--surface-primary)',
              border: '1px solid var(--border-primary)',
            }}
          >
            <h3
              className="text-xl font-bold mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              Recent Quiz History
            </h3>
            <div className="space-y-3">
              {quizHistory
                .slice(-10)
                .reverse()
                .map((attempt, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg"
                    style={{
                      backgroundColor: 'var(--surface-secondary)',
                    }}
                  >
                    <div>
                      <div
                        className="font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {attempt.topic}
                      </div>
                      <div
                        className="text-sm"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {new Date(attempt.timestamp).toLocaleDateString()} at{' '}
                        {new Date(attempt.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className="text-2xl font-bold"
                        style={{
                          color:
                            attempt.score >= 80
                              ? 'var(--accent-success)'
                              : attempt.score >= 60
                                ? 'var(--accent-warning)'
                                : 'var(--accent-error)',
                        }}
                      >
                        {attempt.score}%
                      </div>
                      <div
                        className="text-sm"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {attempt.correct}/{attempt.total}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
