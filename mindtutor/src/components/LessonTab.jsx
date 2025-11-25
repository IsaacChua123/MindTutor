import React, { useState, useEffect } from 'react';
import { generateExplanation } from '../utils/aiCore.js';
import { suggestInteractiveGames } from '../utils/interactiveGames';
import { rewriteLesson, getAvailableStyles } from '../utils/lessonRewriter';
import { saveTopic, deleteTopic } from '../utils/storage';

// Quiz Card Component - Clear question and answer format
const QuizCard = ({ question, correctAnswer, onCorrect, onWrong }) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!userAnswer.trim() || hasSubmitted) return;

    const correct =
      userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim() ||
      correctAnswer.toLowerCase().includes(userAnswer.toLowerCase().trim());
    setIsCorrect(correct);
    setShowResult(true);
    setHasSubmitted(true);

    if (correct) {
      onCorrect();
    } else {
      onWrong();
    }

    // Reset after showing result
    setTimeout(() => {
      setShowResult(false);
      setUserAnswer('');
      setHasSubmitted(false);
    }, 3000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
      {/* Question */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
            ?
          </div>
          <span className="font-semibold text-blue-800 dark:text-blue-200">
            Question
          </span>
        </div>
        <p className="text-gray-700 dark:text-gray-200 font-medium">
          {question}
        </p>
      </div>

      {/* Answer Input */}
      {!hasSubmitted && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              ✓
            </div>
            <span className="font-semibold text-green-800 dark:text-green-200">
              Your Answer
            </span>
          </div>
          <input
            type="text"
            placeholder="Type your answer here..."
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            disabled={hasSubmitted}
          />
          <button
            onClick={handleSubmit}
            disabled={!userAnswer.trim() || hasSubmitted}
            className="w-full bg-blue-600 dark:bg-blue-700 text-white py-2 px-4 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-colors font-medium"
          >
            Submit Answer
          </button>
        </div>
      )}

      {/* Result */}
      {showResult && (
        <div
          className={`mt-4 p-3 rounded-lg text-center ${
            isCorrect
              ? 'bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700'
              : 'bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700'
          }`}
        >
          <div
            className={`text-2xl mb-2 ${isCorrect ? 'animate-bounce' : 'animate-pulse'}`}
          >
            {isCorrect ? '🎉' : '💪'}
          </div>
          <div
            className={`font-bold text-lg mb-1 ${
              isCorrect
                ? 'text-green-800 dark:text-green-200'
                : 'text-red-800 dark:text-red-200'
            }`}
          >
            {isCorrect ? 'Correct!' : 'Keep Trying!'}
          </div>
          {!isCorrect && (
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              <strong>Correct answer:</strong> {correctAnswer}
            </div>
          )}
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isCorrect ? '+10 points!' : 'Try the next question'}
          </div>
        </div>
      )}
    </div>
  );
};

export default function LessonTab({ topics, refreshTopics }) {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [userProgress, setUserProgress] = useState({});
  const [aiExplanation, setAiExplanation] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [interactiveState, setInteractiveState] = useState({});
  const [suggestedGames, setSuggestedGames] = useState([]);
  const [rewrittenLesson, setRewrittenLesson] = useState('');
  const [lessonStyle, setLessonStyle] = useState('academic');
  const [isRewriting, setIsRewriting] = useState(false);
  const [availableStyles] = useState(getAvailableStyles());
  const [gameScore, setGameScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    try {
      if (selectedTopic && !userProgress[selectedTopic]) {
        setUserProgress((prev) => ({
          ...prev,
          [selectedTopic]: {
            completedConcepts: [],
            score: 0,
            totalInteractions: 0,
            badges: [],
          },
        }));
      }
    } catch (error) {
      console.error('Error in useEffect:', error);
    }
  }, [selectedTopic, userProgress]);

  // Check for corrupted topics data
  if (!topics || typeof topics !== 'object') {
    return (
      <div className="max-w-7xl mx-auto relative p-8 bg-pink-500 dark:bg-pink-600 border-8 border-pink-800 dark:border-pink-700">
        <div className="bg-red-100 dark:bg-red-900/20 border-4 border-red-500 dark:border-red-600 p-6 rounded-lg text-center">
          <h2 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-4">
            DATA CORRUPTION DETECTED
          </h2>
          <p className="text-red-700 dark:text-red-300 mb-4">
            The lesson data appears to be corrupted. This can happen when
            importing content with special characters or very large files.
          </p>
          <p className="text-red-600 dark:text-red-400 mb-4">
            Try clearing your browser data and re-importing your lessons.
          </p>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="bg-red-600 dark:bg-red-700 text-white px-6 py-3 rounded-lg hover:bg-red-700 dark:hover:bg-red-600 font-bold"
          >
            Clear Data & Reload
          </button>
        </div>
      </div>
    );
  }

  // Additional checks
  if (typeof selectedTopic !== 'string' && selectedTopic !== '') {
    return (
      <div className="max-w-7xl mx-auto relative p-8 bg-pink-500 dark:bg-pink-600 border-8 border-pink-800 dark:border-pink-700">
        <div className="bg-orange-100 dark:bg-orange-900/20 border-4 border-orange-500 dark:border-orange-600 p-6 rounded-lg text-center">
          <h2 className="text-2xl font-bold text-orange-800 dark:text-orange-200 mb-4">
            INVALID TOPIC SELECTION
          </h2>
          <p className="text-orange-700 dark:text-orange-300 mb-4">
            selectedTopic is not a valid string: {JSON.stringify(selectedTopic)}
          </p>
        </div>
      </div>
    );
  }

  // Sound effects
  const playSound = (type) => {
    try {
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      switch (type) {
        case 'correct':
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(
            1200,
            audioContext.currentTime + 0.1
          );
          break;
        case 'wrong':
          oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(
            200,
            audioContext.currentTime + 0.2
          );
          break;
        case 'celebration':
          oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C5
          oscillator.frequency.setValueAtTime(
            659,
            audioContext.currentTime + 0.1
          ); // E5
          oscillator.frequency.setValueAtTime(
            784,
            audioContext.currentTime + 0.2
          ); // G5
          break;
      }

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.3
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch {
      // Fallback for browsers without AudioContext support
      console.log('Sound effect:', type);
    }
  };

  const triggerCelebration = () => {
    setShowCelebration(true);
    playSound('celebration');
    setTimeout(() => setShowCelebration(false), 2000);
  };

  const addScore = (points, correct = true) => {
    if (correct) {
      setGameScore((prev) => prev + points);
      setStreak((prev) => prev + 1);
      playSound('correct');
    } else {
      setStreak(0);
      playSound('wrong');
    }
  };

  // Timeline Drag-and-Drop Component
  const TimelineGame = ({ events, onComplete, onScore }) => {
    const [draggedEvents, setDraggedEvents] = useState(
      [...events].sort(() => Math.random() - 0.5)
    );
    const [droppedEvents, setDroppedEvents] = useState([]);
    const [isCorrect, setIsCorrect] = useState(null);

    const handleDragStart = (e, event) => {
      e.dataTransfer.setData('text/plain', event.year);
    };

    const handleDrop = (e) => {
      e.preventDefault();
      const year = e.dataTransfer.getData('text/plain');
      const event = draggedEvents.find((ev) => ev.year === parseInt(year));

      if (event) {
        setDraggedEvents((prev) =>
          prev.filter((ev) => ev.year !== parseInt(year))
        );
        setDroppedEvents((prev) =>
          [...prev, event].sort((a, b) => a.year - b.year)
        );
      }
    };

    const handleDragOver = (e) => {
      e.preventDefault();
    };

    const checkOrder = () => {
      const correct = droppedEvents.every((event, index) => {
        const correctIndex = events.findIndex((ev) => ev.year === event.year);
        return index === correctIndex;
      });

      setIsCorrect(correct);
      onScore(correct ? 25 : -15, correct);

      if (correct) {
        setTimeout(() => onComplete(droppedEvents), 1500);
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          {/* Available events */}
          <div className="flex-1">
            <h5 className="font-semibold text-indigo-800 dark:text-indigo-200 mb-2">
              📋 Events to Place:
            </h5>
            <div className="space-y-2 min-h-32">
              {draggedEvents.map((event) => (
                <div
                  key={event.year}
                  draggable
                  onDragStart={(e) => handleDragStart(e, event)}
                  className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded cursor-move hover:bg-indigo-200 dark:hover:bg-indigo-800/40 transition-colors"
                >
                  <div className="font-medium text-indigo-800 dark:text-indigo-200">
                    {event.event}
                  </div>
                  <div className="text-sm text-indigo-600 dark:text-indigo-300">
                    {event.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline drop zone */}
          <div className="flex-1">
            <h5 className="font-semibold text-indigo-800 dark:text-indigo-200 mb-2">
              ⏰ Timeline (Drag here):
            </h5>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-indigo-300 dark:border-indigo-600 rounded-lg p-4 min-h-32 bg-indigo-50 dark:bg-indigo-900/20"
            >
              {droppedEvents.length === 0 ? (
                <div className="text-center text-indigo-400 dark:text-indigo-500 text-sm">
                  Drop events here in chronological order
                </div>
              ) : (
                <div className="space-y-2">
                  {droppedEvents.map((event) => (
                    <div
                      key={event.year}
                      className="flex items-center gap-3 bg-white dark:bg-gray-700 p-2 rounded shadow-sm"
                    >
                      <div className="text-indigo-600 dark:text-indigo-300 font-mono text-sm bg-indigo-100 dark:bg-indigo-800 px-2 py-1 rounded">
                        {event.year}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                          {event.event}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {droppedEvents.length === events.length && (
          <div className="text-center">
            <button
              onClick={checkOrder}
              className="bg-indigo-600 dark:bg-indigo-700 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all hover:scale-105"
            >
              Check Timeline Order
            </button>
          </div>
        )}

        {isCorrect !== null && (
          <div
            className={`text-center p-3 rounded-lg ${isCorrect ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'}`}
          >
            <div className="text-lg font-bold">
              {isCorrect ? '🎉 Perfect Timeline!' : '❌ Order needs work'}
            </div>
            <div className="text-sm mt-1">
              {isCorrect
                ? 'You mastered chronological thinking!'
                : 'Try rearranging the events'}
            </div>
          </div>
        )}
      </div>
    );
  };

  const addSuggestedGame = async (game, conceptIndex = 0) => {
    if (
      !currentTopic ||
      !currentTopic.concepts ||
      !currentTopic.concepts[conceptIndex]
    ) {
      alert('❌ Cannot add game: No valid concept found.');
      return;
    }

    try {
      // Create updated topic with the new game
      const updatedTopic = { ...currentTopic };
      updatedTopic.concepts = [...currentTopic.concepts];

      // Add the game to the specified concept
      updatedTopic.concepts[conceptIndex] = {
        ...updatedTopic.concepts[conceptIndex],
        interactiveElements: {
          type: game.type,
          content: game.content,
        },
      };

      // Save to storage
      saveTopic(selectedTopic, updatedTopic);

      // Update local state to show the game is now available
      setInteractiveState((prev) => ({
        ...prev,
        [game.type]: { completed: false, data: null },
      }));

      // Refresh the topics to show the updated lesson
      if (refreshTopics) {
        refreshTopics();
      }

      // Show success message
      alert(
        `✅ "${game.title}" has been added to your lesson! You can now play it below.`
      );
    } catch (error) {
      console.error('Error adding game:', error);
      alert('❌ Sorry, there was an error adding the game. Please try again.');
    }
  };

  const topicNames = Object.keys(topics);
  const currentTopic = selectedTopic ? topics[selectedTopic] : null;
  const isDemoLesson = currentTopic?.isDemo;
  const validConcepts = Array.isArray(currentTopic?.concepts)
    ? currentTopic.concepts.filter(
        (concept) => concept && concept.concept && concept.definition
      )
    : [];

  const handleTopicSelect = (topicName) => {
    setSelectedTopic(topicName);
    setAiExplanation('');
    setRewrittenLesson('');

    // Generate AI-powered game suggestions for user-imported topics
    const topic = topics[topicName];
    if (topic && !topic.isDemo) {
      // For user-imported topics, generate AI-powered game suggestions
      const games = suggestInteractiveGames(topic);
      setSuggestedGames(games);
    } else if (topic && topic.isDemo) {
      // For demo topics, don't show AI suggestions since they have hardcoded games
      setSuggestedGames([]);
    } else {
      setSuggestedGames([]);
    }
  };

  const handleDeleteTopic = (topicName, isDemo) => {
    if (isDemo) {
      alert('❌ Demo lessons cannot be deleted.');
      return;
    }

    if (
      confirm(
        `Are you sure you want to delete "${topicName}"? This action cannot be undone.`
      )
    ) {
      try {
        deleteTopic(topicName);
        // Refresh topics
        if (refreshTopics) {
          refreshTopics();
        }
        // If the deleted topic was currently selected, go back to topic selection
        if (selectedTopic === topicName) {
          setSelectedTopic('');
        }
        alert(`✅ "${topicName}" has been deleted.`);
      } catch (error) {
        console.error('Error deleting topic:', error);
        alert('❌ Failed to delete the topic. Please try again.');
      }
    }
  };

  const handleInteractiveAction = (actionType, data) => {
    const progress = userProgress[selectedTopic] || {
      score: 0,
      totalInteractions: 0,
    };

    setUserProgress((prev) => ({
      ...prev,
      [selectedTopic]: {
        ...progress,
        score: progress.score + 10,
        totalInteractions: progress.totalInteractions + 1,
      },
    }));

    setInteractiveState((prev) => ({
      ...prev,
      [actionType]: { completed: true, data },
    }));
  };

  const requestAIExplanation = async (query) => {
    if (!currentTopic) return;

    setIsLoadingAI(true);
    try {
      const explanation = generateExplanation(currentTopic, query);
      setAiExplanation(explanation);
    } catch {
      setAiExplanation(
        "Sorry, I couldn't generate an explanation right now. Please try again."
      );
    } finally {
      setIsLoadingAI(false);
    }
  };

  const rewriteLessonContent = async (style) => {
    if (!currentTopic) return;

    setIsRewriting(true);
    try {
      const rewritten = rewriteLesson(currentTopic, style, {
        audience: 'student',
        length: 'medium',
        includeExamples: true,
      });
      setRewrittenLesson(rewritten);
      setLessonStyle(style);
    } catch {
      setRewrittenLesson(
        "Sorry, I couldn't rewrite the lesson right now. Please try again."
      );
    } finally {
      setIsRewriting(false);
    }
  };

  const renderInteractiveElement = (concept) => {
    if (!concept.interactiveElements || !concept.interactiveElements.content)
      return null;

    const { type, content } = concept.interactiveElements;

    // Additional safety check for content
    if (!content) return null;

    switch (type) {
      case 'flashcards':
        return (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200">
                🧠 Quiz Challenge
              </h4>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-yellow-600 dark:text-yellow-400">
                  ⭐ {gameScore}
                </span>
                <span className="text-red-600 dark:text-red-400">
                  🔥 {streak}
                </span>
              </div>
            </div>

            <div className="space-y-4 mb-4">
              {content.map((card, index) => (
                <QuizCard
                  key={index}
                  question={card.front}
                  correctAnswer={card.back}
                  onCorrect={() => addScore(10)}
                  onWrong={() => addScore(-5, false)}
                />
              ))}
            </div>

            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Answer each question to test your knowledge and build your
                streak!
              </div>
              <button
                onClick={() => {
                  handleInteractiveAction('flashcards', content);
                  if (streak >= 3) triggerCelebration();
                }}
                className="bg-blue-600 dark:bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all hover:scale-105 font-medium"
              >
                🎯 Complete Quiz Challenge
              </button>
            </div>
          </div>
        );

      case 'simulation':
        return (
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-green-800 dark:text-green-200">
                🔬 Cell Gatekeeper Challenge
              </h4>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-yellow-600 dark:text-yellow-400">
                  ⭐ {gameScore}
                </span>
                <span className="text-red-600 dark:text-red-400">
                  🔥 {streak}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-700 dark:text-gray-200 mb-2 font-medium">
                {content.scenario}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <strong>How to play:</strong> Decide whether each substance
                should be allowed or blocked entry into the cell.
              </p>
            </div>

            <div className="space-y-3">
              {content.questions ? (
                // Demo format: questions with substances
                content.questions.map((q, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-700 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                          {index + 1}
                        </div>
                        <div className="font-medium text-gray-800 dark:text-gray-100">
                          {q.substance}
                        </div>
                      </div>
                      {interactiveState.simulation?.data?.[index] !==
                        undefined && (
                        <div
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            q.shouldAllow ===
                            interactiveState.simulation.data[index]
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                          }`}
                        >
                          {q.shouldAllow ===
                          interactiveState.simulation.data[index]
                            ? '✅ Correct'
                            : '❌ Wrong'}
                        </div>
                      )}
                    </div>

                    {interactiveState.simulation?.data?.[index] ===
                    undefined ? (
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            const isCorrect = q.shouldAllow === true;
                            addScore(isCorrect ? 10 : -5, isCorrect);
                            const newData = {
                              ...interactiveState.simulation?.data,
                              [index]: true,
                            };
                            handleInteractiveAction('simulation', newData);
                          }}
                          className="flex-1 bg-green-500 dark:bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-600 dark:hover:bg-green-500 transition-all hover:scale-105 font-medium"
                        >
                          🚪 Allow Entry
                        </button>
                        <button
                          onClick={() => {
                            const isCorrect = q.shouldAllow === false;
                            addScore(isCorrect ? 10 : -5, isCorrect);
                            const newData = {
                              ...interactiveState.simulation?.data,
                              [index]: false,
                            };
                            handleInteractiveAction('simulation', newData);
                          }}
                          className="flex-1 bg-red-500 dark:bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-600 dark:hover:bg-red-500 transition-all hover:scale-105 font-medium"
                        >
                          🚫 Block Entry
                        </button>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded">
                        <strong>Decision:</strong>{' '}
                        {interactiveState.simulation.data[index]
                          ? 'Allowed'
                          : 'Blocked'}
                        <br />
                        <strong>Result:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                ))
              ) : content.steps ? (
                // Generated format: steps with choices
                content.steps.map((step, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-700 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-600"
                  >
                    <div className="font-medium text-gray-800 dark:text-gray-100 mb-3">
                      {step.description}
                    </div>

                    {interactiveState.simulation?.data?.[index] ===
                    undefined ? (
                      <div className="grid grid-cols-1 gap-2">
                        {step.choices.map((choice, choiceIndex) => (
                          <button
                            key={choiceIndex}
                            onClick={() => {
                              const isCorrect =
                                choiceIndex === step.correctChoice;
                              addScore(isCorrect ? 15 : -8, isCorrect);
                              const newData = {
                                ...interactiveState.simulation?.data,
                                [index]: choiceIndex,
                              };
                              handleInteractiveAction('simulation', newData);
                            }}
                            className="bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-600 dark:to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-purple-600 dark:hover:from-blue-700 dark:hover:to-purple-700 transition-all hover:scale-105 font-medium text-left"
                          >
                            {choice}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div
                        className={`p-3 rounded text-sm ${
                          interactiveState.simulation.data[index] ===
                          step.correctChoice
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                        }`}
                      >
                        <strong>Your choice:</strong>{' '}
                        {step.choices[interactiveState.simulation.data[index]]}
                        <br />
                        <strong>Correct:</strong>{' '}
                        {step.choices[step.correctChoice]}
                        <br />
                        <strong>Explanation:</strong> {step.explanation}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-600 dark:text-gray-300 text-center py-8">
                  No simulation content available
                </div>
              )}
            </div>

            <div className="mt-4 text-center">
              <div className="text-xs text-gray-600 dark:text-gray-300">
                Be the cell membrane! Make smart decisions to keep the cell
                healthy.
              </div>
            </div>
          </div>
        );

      case 'analogy':
        return (
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-purple-800 dark:text-purple-200">
                🏙️ Analogy Master Challenge
              </h4>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-yellow-600 dark:text-yellow-400">
                  ⭐ {gameScore}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-gray-700 dark:text-gray-200 mb-2 font-medium">
                {content.question}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                <strong>How to play:</strong> Choose the best analogy that
                represents the concept above.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {content.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => {
                    const isCorrect = option.correct;
                    addScore(isCorrect ? 15 : -10, isCorrect);
                    handleInteractiveAction('analogy', isCorrect);

                    if (isCorrect) {
                      setTimeout(() => triggerCelebration(), 500);
                    }
                  }}
                  className={`p-3 rounded-lg text-sm font-medium transition-all transform hover:scale-105 ${
                    interactiveState.analogy?.completed
                      ? option.correct
                        ? 'bg-green-500 dark:bg-green-600 text-white animate-pulse'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                      : 'bg-gradient-to-r from-purple-400 to-pink-400 dark:from-purple-500 dark:to-pink-500 text-white hover:from-purple-500 hover:to-pink-500 dark:hover:from-purple-600 dark:hover:to-pink-600 shadow-md'
                  }`}
                  disabled={interactiveState.analogy?.completed}
                >
                  {option.text}
                </button>
              ))}
            </div>

            {interactiveState.analogy?.completed && (
              <div className="text-center p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <div className="text-2xl mb-1">🎉</div>
                <div className="text-sm font-bold text-green-800 dark:text-green-200">
                  Perfect Match!
                </div>
                <div className="text-xs text-green-600 dark:text-green-300 mt-1">
                  {content.explanation}
                </div>
              </div>
            )}

            {!interactiveState.analogy?.completed && (
              <div className="text-xs text-gray-600 dark:text-gray-300 text-center">
                Think creatively! Which option best represents the concept?
              </div>
            )}
          </div>
        );

      case 'matching':
        if (!content || !content.pairs) return null;
        return (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-3">
              🔗 Matching Challenge
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-200 mb-3">
              {content.title || 'Match the items below'}
            </p>
            <div className="space-y-2">
              {content.pairs.map((pair, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 bg-white dark:bg-gray-700 p-2 rounded"
                >
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {pair.reactant}
                  </span>
                  <span className="text-gray-400 dark:text-gray-500">→</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {pair.product}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => handleInteractiveAction('matching', content.pairs)}
              className="mt-3 bg-yellow-600 dark:bg-yellow-700 text-white px-4 py-2 rounded hover:bg-yellow-700 dark:hover:bg-yellow-600"
            >
              ✅ Completed Matching
            </button>
          </div>
        );

      case 'timeline':
        if (!content || !content.events) return null;
        return (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-indigo-800 dark:text-indigo-200">
                ⏰ Timeline Master Challenge
              </h4>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-yellow-600 dark:text-yellow-400">
                  ⭐ {gameScore}
                </span>
                <span className="text-blue-600 dark:text-blue-400">
                  🎯 Drag & Drop
                </span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-700 dark:text-gray-200 mb-2">
                <strong>How to play:</strong> Drag historical events from the
                left panel and drop them in the timeline area in chronological
                order (earliest to latest).
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-200 mb-4">
                {content.title || 'Arrange the events in chronological order'}
              </p>
            </div>

            <TimelineGame
              events={content.events}
              onComplete={(orderedEvents) => {
                handleInteractiveAction('timeline', orderedEvents);
                triggerCelebration();
              }}
              onScore={addScore}
            />
          </div>
        );

      case 'association':
        if (!content || !content.associations) return null;
        return (
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
            <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-3">
              🔗 Association Challenge
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-200 mb-3">
              {content.title || 'Connect related concepts'}
            </p>
            <div className="space-y-2">
              {content.associations.map((assoc, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600"
                >
                  <div className="font-medium text-orange-600 dark:text-orange-400">
                    {assoc.item}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Category: {assoc.category}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {assoc.explanation}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() =>
                handleInteractiveAction('association', content.associations)
              }
              className="mt-3 bg-orange-600 dark:bg-orange-700 text-white px-4 py-2 rounded hover:bg-orange-700 dark:hover:bg-orange-600"
            >
              ✅ Completed Associations
            </button>
          </div>
        );

      case 'problem_solving':
        if (!content || !content.steps) return null;
        return (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <h4 className="font-semibold text-red-800 dark:text-red-200 mb-3">
              🧩 Problem-Solving Challenge
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-200 mb-3">
              {content.scenario || 'Solve this problem step by step'}
            </p>
            <div className="bg-white dark:bg-gray-700 p-3 rounded mb-3">
              <div className="font-medium text-red-600 dark:text-red-400 mb-2">
                Problem:
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-200">
                {content.problem ||
                  'Apply the concepts to solve this challenge'}
              </div>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-sm text-red-700 dark:text-red-300">
                Solution Steps:
              </div>
              {content.steps.map((step, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <span className="bg-red-200 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-2 py-1 rounded text-xs">
                    {index + 1}
                  </span>
                  <span className="text-gray-700 dark:text-gray-200">
                    {step}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/30 rounded text-sm text-red-800 dark:text-red-200">
              <strong>Final Answer:</strong>{' '}
              {content.solution || 'Complete the steps above'}
            </div>
            <button
              onClick={() =>
                handleInteractiveAction('problem_solving', content)
              }
              className="mt-3 bg-red-600 dark:bg-red-700 text-white px-4 py-2 rounded hover:bg-red-700 dark:hover:bg-red-600"
            >
              ✅ Completed Challenge
            </button>
          </div>
        );

      case 'equation_matching':
        if (!content || !content.equations) return null;
        return (
          <div className="bg-cyan-50 dark:bg-cyan-900/20 p-4 rounded-lg">
            <h4 className="font-semibold text-cyan-800 dark:text-cyan-200 mb-3">
              🔢 Equation Builder
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-200 mb-3">
              {content.title || 'Match equations with their descriptions'}
            </p>
            <div className="space-y-3">
              {content.equations.map((eq, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600"
                >
                  <div className="font-medium text-cyan-600 dark:text-cyan-400 mb-1">
                    {eq.equation}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {eq.description}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() =>
                handleInteractiveAction('equation_matching', content.equations)
              }
              className="mt-3 bg-cyan-600 dark:bg-cyan-700 text-white px-4 py-2 rounded hover:bg-cyan-700 dark:hover:bg-cyan-600"
            >
              ✅ Completed Equations
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  const progress = userProgress[selectedTopic];
  const completionPercentage = progress
    ? Math.round(
        ((progress.completedConcepts?.length || 0) /
          (validConcepts.length || 1)) *
          100
      )
    : 0;

  // Topic Selection UI
  if (!selectedTopic) {
    return (
      <div className="max-w-4xl">
        <h2
          className="text-3xl font-bold mb-6"
          style={{ color: 'var(--text-primary)' }}
        >
          Interactive Lessons
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
              const lastUpdated = topic?.lastUpdated
                ? new Date(topic.lastUpdated).toLocaleDateString()
                : null;

              return (
                <div
                  key={topicName}
                  className="rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border group"
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
                  {/* Card Header */}
                  <div className="p-6 pb-4">
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
                            {conceptCount} concept
                            {conceptCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTopic(topicName, isDemo);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg"
                        style={{
                          color: 'var(--accent-error)',
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor =
                            'var(--surface-secondary)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                        }}
                        title={`Delete ${topicName}`}
                      >
                        🗑️
                      </button>
                    </div>

                    {/* Description */}
                    <p
                      className="text-sm mb-4 line-clamp-2"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Interactive learning experience with games and AI-powered
                      explanations
                    </p>

                    {/* Metadata */}
                    {lastUpdated && (
                      <div
                        className="text-xs mb-4"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Updated {lastUpdated}
                      </div>
                    )}

                    {/* Action Button */}
                    <button
                      onClick={() => handleTopicSelect(topicName)}
                      className="w-full text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
                      style={{
                        background:
                          'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                      }}
                    >
                      🚀 Start Learning
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Lesson Display UI
  if (!currentTopic) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-600 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            Topic Not Found
          </h3>
          <p className="text-red-700 dark:text-red-300 mb-4">
            The selected topic "{selectedTopic}" could not be loaded. This might
            happen if the topic was deleted or corrupted.
          </p>
          <button
            onClick={() => setSelectedTopic('')}
            className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600"
          >
            ← Back to Topics
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2
            className="text-3xl font-bold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            {currentTopic.topic || selectedTopic}
          </h2>
          <div
            className="flex items-center gap-4 text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span>📚 {validConcepts.length} concepts</span>
            <span>⭐ {gameScore} points</span>
            <span>🔥 {streak} streak</span>
            {completionPercentage > 0 && (
              <span>📊 {completionPercentage}% complete</span>
            )}
          </div>
        </div>
        <button
          onClick={() => setSelectedTopic('')}
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

      {/* Progress Bar */}
      {completionPercentage > 0 && (
        <div
          className="rounded-lg shadow-md p-4 mb-6"
          style={{
            backgroundColor: 'var(--surface-primary)',
            border: '1px solid var(--border-primary)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className="font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              Lesson Progress
            </span>
            <span
              className="text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              {completionPercentage}%
            </span>
          </div>
          <div
            className="w-full rounded-full h-3"
            style={{ backgroundColor: 'var(--surface-secondary)' }}
          >
            <div
              className="h-3 rounded-full transition-all duration-500"
              style={{
                width: `${completionPercentage}%`,
                backgroundColor: 'var(--accent-primary)',
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Lesson Content */}
      <div
        className="max-h-96 overflow-y-auto scrollbar-thin space-y-6 rounded-lg"
        style={{
          backgroundColor: 'var(--surface-secondary)',
          border: '1px solid var(--border-primary)',
        }}
      >
        {validConcepts.length === 0 ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-600 rounded-lg p-6 text-center m-4">
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              No Concepts Found
            </h3>
            <p className="text-yellow-700 dark:text-yellow-300 mb-4">
              We couldn't automatically extract concepts from this lesson. This
              might happen with certain text formats.
            </p>
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              Try importing content with clear definitions, or use the AI
              features below to get explanations.
            </p>
          </div>
        ) : (
          validConcepts.map((concept, index) => (
            <div
              key={index}
              className="rounded-lg shadow-md p-6 mx-4 mb-4"
              style={{
                backgroundColor: 'var(--surface-primary)',
                border: '1px solid var(--border-primary)',
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3
                    className="text-xl font-bold mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {concept.concept}
                  </h3>
                  <p
                    className="leading-relaxed"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {concept.definition}
                  </p>
                </div>
                {concept.difficulty && (
                  <div
                    className="text-sm ml-4"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Difficulty: {'⭐'.repeat(concept.difficulty)}
                  </div>
                )}
              </div>

              {/* Interactive Element */}
              {renderInteractiveElement(concept)}
            </div>
          ))
        )}
      </div>

      {/* AI Features */}
      {!isDemoLesson && (
        <div
          className="mt-8 rounded-lg shadow-md p-6"
          style={{
            backgroundColor: 'var(--surface-primary)',
            border: '1px solid var(--border-primary)',
          }}
        >
          <h3
            className="text-xl font-bold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            🤖 AI Learning Tools
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            {/* AI Explanation */}
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Ask AI for Explanation
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="What would you like explained?"
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 transition-all"
                  style={{
                    borderColor: 'var(--border-secondary)',
                    backgroundColor: 'var(--surface-primary)',
                    color: 'var(--text-primary)',
                    '--tw-ring-color': 'var(--accent-primary)',
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      requestAIExplanation(e.target.value);
                      e.target.value = '';
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.querySelector(
                      'input[placeholder="What would you like explained?"]'
                    );
                    if (input.value.trim()) {
                      requestAIExplanation(input.value);
                      input.value = '';
                    }
                  }}
                  disabled={isLoadingAI}
                  className="px-4 py-2 text-white rounded-lg transition-colors"
                  style={{
                    backgroundColor: isLoadingAI
                      ? 'var(--text-muted)'
                      : 'var(--accent-primary)',
                    cursor: isLoadingAI ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isLoadingAI ? '...' : 'Ask'}
                </button>
              </div>
              {aiExplanation && (
                <div
                  className="mt-3 p-3 rounded-lg max-h-96 overflow-y-auto scrollbar-thin"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <div className="text-sm whitespace-pre-wrap">
                    {aiExplanation}
                  </div>
                </div>
              )}
            </div>

            {/* Lesson Rewriting */}
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Rewrite Lesson Style
              </label>
              <div className="flex gap-2">
                <select
                  value={lessonStyle}
                  onChange={(e) => setLessonStyle(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 transition-all"
                  style={{
                    borderColor: 'var(--border-secondary)',
                    backgroundColor: 'var(--surface-primary)',
                    color: 'var(--text-primary)',
                    '--tw-ring-color': 'var(--accent-primary)',
                  }}
                >
                  {availableStyles.map((style) => (
                    <option key={style.id} value={style.id}>
                      {style.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => rewriteLessonContent(lessonStyle)}
                  disabled={isRewriting}
                  className="px-4 py-2 text-white rounded-lg transition-colors"
                  style={{
                    backgroundColor: isRewriting
                      ? 'var(--text-muted)'
                      : 'var(--accent-success)',
                    cursor: isRewriting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isRewriting ? '...' : 'Rewrite'}
                </button>
              </div>
              {rewrittenLesson && (
                <div
                  className="mt-3 p-3 rounded-lg max-h-96 overflow-y-auto scrollbar-thin"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <div className="text-sm whitespace-pre-wrap">
                    {rewrittenLesson}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Suggested Games for User-Imported Topics */}
      {!isDemoLesson && suggestedGames.length > 0 && (
        <div
          className="mt-8 rounded-lg shadow-md p-6"
          style={{
            backgroundColor: 'var(--surface-primary)',
            border: '1px solid var(--border-primary)',
          }}
        >
          <h3
            className="text-xl font-bold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            🎮 Suggested Interactive Games
          </h3>
          <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
            AI has analyzed your lesson and suggests these games to make
            learning more engaging:
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {suggestedGames
              .filter((game) => game && game.title)
              .map((game, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 transition-colors"
                  style={{
                    borderColor: 'var(--border-secondary)',
                    backgroundColor: 'var(--surface-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = 'var(--accent-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = 'var(--border-secondary)';
                  }}
                >
                  <h4
                    className="font-semibold mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {game.title}
                  </h4>
                  <p
                    className="text-sm mb-3"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {game.description}
                  </p>
                  <button
                    onClick={() => addSuggestedGame(game)}
                    className="w-full py-2 px-4 text-white rounded-lg transition-colors"
                    style={{
                      backgroundColor: 'var(--accent-secondary)',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor =
                        'var(--accent-secondary)';
                      e.target.style.opacity = '0.9';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor =
                        'var(--accent-secondary)';
                      e.target.style.opacity = '1';
                    }}
                  >
                    Add to Lesson
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Celebration */}
      {showCelebration && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center animate-bounce">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              Amazing Work!
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              You're mastering this topic!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
