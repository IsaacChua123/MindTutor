import React, { useState } from 'react';
import { generateQuiz, gradeQuiz } from '../utils/quizGenerator';
import { saveQuizAttempt } from '../utils/storage';
import { getSampleTopics, getSampleQuiz } from '../utils/sampleQuestions';

export default function QuizTab({ topics }) {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [quiz, setQuiz] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [questionCount, setQuestionCount] = useState(10);
  const [quizMode, setQuizMode] = useState('imported'); // "imported" or "sample"

  const handleGenerateQuiz = () => {
    if (!selectedTopic) {
      alert('Please select a topic first');
      return;
    }

    let questions;

    if (quizMode === 'sample') {
      const sampleQuiz = getSampleQuiz(selectedTopic);
      if (sampleQuiz) {
        questions = sampleQuiz.questions.slice(0, questionCount);
      } else {
        alert('Sample quiz not found');
        return;
      }
    } else {
      const topic = topics[selectedTopic];
      questions = generateQuiz(topic, questionCount);
    }

    setQuiz(questions);
    setUserAnswers({});
    setResults(null);
  };

  const handleAnswerChange = (questionId, answer) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmit = () => {
    if (!quiz) return;

    const answers = quiz.map((q) => userAnswers[q.id] || '');
    const gradingResults = gradeQuiz(quiz, answers);

    setResults(gradingResults);

    // Save attempt
    saveQuizAttempt({
      topic: selectedTopic,
      score: gradingResults.score,
      correct: gradingResults.correct,
      total: gradingResults.total,
      results: gradingResults.results,
    });
  };

  const handleReset = () => {
    setQuiz(null);
    setUserAnswers({});
    setResults(null);
  };

  if (!quiz) {
    const sampleTopics = getSampleTopics();
    const hasImportedTopics = Object.keys(topics).length > 0;
    const hasSampleTopics = sampleTopics.length > 0;

    return (
      <div className="max-w-4xl">
        <h2
          className="text-3xl font-bold mb-6"
          style={{ color: 'var(--text-primary)' }}
        >
          Quiz Generator
        </h2>

        {!hasImportedTopics && !hasSampleTopics ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-400 dark:border-yellow-600 text-yellow-800 dark:text-yellow-200 px-6 py-4 rounded-lg">
            No topics available. Please import content first in the Import tab
            or use sample quizzes.
          </div>
        ) : (
          <div
            className="rounded-lg shadow-lg p-6"
            style={{
              backgroundColor: 'var(--surface-primary)',
              border: '1px solid var(--border-primary)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            {/* Quiz Mode Selection */}
            <div className="mb-6">
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Quiz Mode
              </label>
              <div className="flex gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    value="imported"
                    checked={quizMode === 'imported'}
                    onChange={(e) => {
                      setQuizMode(e.target.value);
                      setSelectedTopic('');
                    }}
                    disabled={!hasImportedTopics}
                    className="w-4 h-4"
                  />
                  <span
                    style={{
                      color: !hasImportedTopics
                        ? 'var(--text-muted)'
                        : 'var(--text-primary)',
                    }}
                  >
                    My Imported Topics{' '}
                    {!hasImportedTopics && '(None available)'}
                  </span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    value="sample"
                    checked={quizMode === 'sample'}
                    onChange={(e) => {
                      setQuizMode(e.target.value);
                      setSelectedTopic('');
                    }}
                    className="w-4 h-4"
                  />
                  <span style={{ color: 'var(--text-primary)' }}>
                    📚 Pre-installed Sample Quizzes
                  </span>
                </label>
              </div>
            </div>

            <div className="mb-6">
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Select Topic
              </label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="" className="text-gray-500 dark:text-gray-400">
                  -- Choose a topic --
                </option>
                {quizMode === 'imported'
                  ? Object.keys(topics).map((topicName) => (
                      <option key={topicName} value={topicName}>
                        {topicName}
                      </option>
                    ))
                  : sampleTopics.map((topicName) => (
                      <option key={topicName} value={topicName}>
                        {topicName}
                      </option>
                    ))}
              </select>
            </div>

            <div className="mb-6">
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Number of Questions
              </label>
              <input
                type="number"
                min="5"
                max="50"
                value={questionCount}
                onChange={(e) =>
                  setQuestionCount(parseInt(e.target.value) || 10)
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            <button
              onClick={handleGenerateQuiz}
              disabled={!selectedTopic}
              className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${
                !selectedTopic
                  ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600'
              }`}
            >
              {quizMode === 'sample' ? 'Start Sample Quiz' : 'Generate Quiz'}
            </button>

            {quizMode === 'sample' && (
              <div
                className="mt-4 p-4 rounded-lg"
                style={{
                  backgroundColor: 'var(--surface-secondary)',
                  border: '1px solid var(--border-primary)',
                }}
              >
                <p
                  className="text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  💡 <strong>Sample Quizzes:</strong> These are pre-made quizzes
                  with verified answers that you can take immediately without
                  importing any content!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h2
          className="text-3xl font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          Quiz: {selectedTopic}
        </h2>
        <button
          onClick={handleReset}
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
          New Quiz
        </button>
      </div>

      {results ? (
        <div
          className="rounded-lg shadow-lg p-6 mb-6"
          style={{
            backgroundColor: 'var(--surface-primary)',
            border: '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <h3
            className="text-2xl font-bold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            Results: {results.score}%
          </h3>
          <p
            className="text-lg mb-4"
            style={{ color: 'var(--text-secondary)' }}
          >
            You got {results.correct} out of {results.total} questions correct!
          </p>

          <div className="max-h-96 overflow-y-auto scrollbar-thin space-y-4">
            {results.results.map((result, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border-2"
                style={{
                  backgroundColor: result.isCorrect
                    ? 'var(--accent-success)'
                    : 'var(--accent-error)',
                  borderColor: result.isCorrect
                    ? 'var(--accent-success)'
                    : 'var(--accent-error)',
                  color: 'var(--text-primary)',
                  opacity: 0.9,
                }}
              >
                <div className="font-semibold mb-2">
                  {index + 1}. {result.question}
                </div>
                <div className="text-sm">
                  <div>
                    <strong>Your answer:</strong> {String(result.userAnswer)}
                  </div>
                  {!result.isCorrect && (
                    <div className="mt-1">
                      <strong>Correct answer:</strong>{' '}
                      {String(result.correctAnswer)}
                    </div>
                  )}
                  {result.partialScore !== undefined &&
                    result.partialScore < 100 &&
                    result.partialScore > 0 && (
                      <div
                        className="mt-1"
                        style={{ color: 'var(--accent-warning)' }}
                      >
                        <strong>Partial credit:</strong> {result.partialScore}%
                      </div>
                    )}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleReset}
            className="w-full mt-6 py-3 px-6 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg transition-colors font-semibold"
          >
            Take Another Quiz
          </button>
        </div>
      ) : (
        <div
          className="rounded-lg shadow-lg p-6"
          style={{
            backgroundColor: 'var(--surface-primary)',
            border: '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div className="max-h-96 overflow-y-auto scrollbar-thin space-y-6">
            {quiz.map((question, index) => (
              <div
                key={question.id}
                className={`pb-6 last:border-b-0 ${index < quiz.length - 1 ? 'border-b' : ''}`}
                style={{
                  borderColor: 'var(--border-secondary)',
                }}
              >
                <div
                  className="font-semibold text-lg mb-3"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {index + 1}. {question.question}
                </div>

                {question.type === 'mcq' && (
                  <div className="space-y-2">
                    {question.options.map((option, optIndex) => (
                      <label
                        key={optIndex}
                        className="flex items-center space-x-3 p-3 rounded-lg cursor-pointer"
                        style={{
                          color: 'var(--text-primary)',
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor =
                            'var(--surface-secondary)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                        }}
                      >
                        <input
                          type="radio"
                          name={question.id}
                          value={option}
                          checked={userAnswers[question.id] === option}
                          onChange={(e) =>
                            handleAnswerChange(question.id, e.target.value)
                          }
                          className="w-4 h-4"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === 'truefalse' && (
                  <div className="space-y-2">
                    <label
                      className="flex items-center space-x-3 p-3 rounded-lg cursor-pointer"
                      style={{
                        color: 'var(--text-primary)',
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor =
                          'var(--surface-secondary)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                      }}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value="true"
                        checked={userAnswers[question.id] === "true"}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        className="w-4 h-4"
                      />
                      <span>True</span>
                    </label>
                    <label
                      className="flex items-center space-x-3 p-3 rounded-lg cursor-pointer"
                      style={{
                        color: 'var(--text-primary)',
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor =
                          'var(--surface-secondary)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                      }}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value="false"
                        checked={userAnswers[question.id] === "false"}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        className="w-4 h-4"
                      />
                      <span>False</span>
                    </label>
                  </div>
                )}

                {(question.type === 'fillblank' ||
                  question.type === 'shortanswer') && (
                  <input
                    type="text"
                    value={userAnswers[question.id] || ''}
                    onChange={(e) =>
                      handleAnswerChange(question.id, e.target.value)
                    }
                    placeholder="Type your answer..."
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent"
                    style={{
                      borderColor: 'var(--border-secondary)',
                      backgroundColor: 'var(--surface-primary)',
                      color: 'var(--text-primary)',
                      '--tw-ring-color': 'var(--accent-primary)',
                    }}
                  />
                )}

                {question.type === 'explain' && (
                  <div>
                    <textarea
                      value={userAnswers[question.id] || ''}
                      onChange={(e) =>
                        handleAnswerChange(question.id, e.target.value)
                      }
                      placeholder="Write your detailed explanation..."
                      rows={5}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent"
                      style={{
                        borderColor: 'var(--border-secondary)',
                        backgroundColor: 'var(--surface-primary)',
                        color: 'var(--text-primary)',
                        '--tw-ring-color': 'var(--accent-primary)',
                      }}
                    />
                    {question.guidance && (
                      <div
                        className="text-sm mt-2"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        💡 {question.guidance}
                      </div>
                    )}
                  </div>
                )}

                <div
                  className="text-xs mt-2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Difficulty: {'⭐'.repeat(question.difficulty)} | Testing:{' '}
                  {question.conceptTested}
                </div>
                {question.explanation && quizMode === 'sample' && (
                  <div
                    className="text-xs mt-1"
                    style={{ color: 'var(--accent-primary)' }}
                  >
                    ℹ️ Explanation available after submission
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            className="w-full mt-6 py-3 px-6 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white rounded-lg transition-colors font-semibold"
          >
            Submit Quiz
          </button>
        </div>
      )}
    </div>
  );
}
