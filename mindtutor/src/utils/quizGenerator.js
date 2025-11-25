// quizGenerator.js - Quiz generation engine for MindTutor

import { tokenize } from './utils.js';

/**
 * Generate an adaptive quiz based on user performance and weaknesses
 * @param {Object} topic - Topic object
 * @param {Object} userModel - User model with performance data
 * @param {number} questionCount - Number of questions to generate
 * @returns {Array} - Array of adaptive question objects
 */
export function generateAdaptiveQuiz(topic, userModel, questionCount = 10) {
  if (!topic || !topic.concepts || topic.concepts.length === 0) {
    return [];
  }

  const { concepts, topic: topicName } = topic;

  // Analyze user performance to identify strengths and weaknesses
  const performanceAnalysis = analyzeUserPerformance(userModel, concepts);

  // Determine question distribution based on user needs
  const questionDistribution = calculateQuestionDistribution(
    performanceAnalysis,
    questionCount
  );

  const questions = [];

  // Generate questions for weak areas (higher priority)
  if (questionDistribution.weaknessQuestions > 0) {
    const weakQuestions = generateQuestionsForWeaknesses(
      concepts,
      performanceAnalysis.weaknesses,
      questionDistribution.weaknessQuestions,
      topicName
    );
    questions.push(...weakQuestions);
  }

  // Generate questions for review (medium priority)
  if (questionDistribution.reviewQuestions > 0) {
    const reviewQuestions = generateReviewQuestions(
      concepts,
      performanceAnalysis.needsReview,
      questionDistribution.reviewQuestions,
      topicName
    );
    questions.push(...reviewQuestions);
  }

  // Generate questions for advancement (lower priority)
  if (questionDistribution.advancementQuestions > 0) {
    const advancementQuestions = generateAdvancementQuestions(
      concepts,
      performanceAnalysis.strengths,
      questionDistribution.advancementQuestions,
      topicName
    );
    questions.push(...advancementQuestions);
  }

  // Shuffle questions to avoid predictable patterns
  shuffleArray(questions);

  // Add adaptive metadata to each question
  return questions.map((question, index) => ({
    ...question,
    id: `q_${index + 1}`,
    adaptive: true,
    targetDifficulty: calculateTargetDifficulty(question, performanceAnalysis),
    estimatedTime: estimateQuestionTime(question),
    remediationLevel: determineRemediationLevel(question, performanceAnalysis),
  }));
}

/**
 * Analyze user performance to identify patterns
 */
function analyzeUserPerformance(userModel, concepts) {
  const conceptPerformance = new Map();

  // Initialize with baseline performance
  concepts.forEach((concept) => {
    conceptPerformance.set(concept.concept, {
      attempts: 0,
      correct: 0,
      averageScore: 0.5,
      lastAttempt: null,
      difficulty: concept.difficulty || 3,
    });
  });

  // Analyze learning history
  if (userModel.learningHistory) {
    userModel.learningHistory.forEach((activity) => {
      if (activity.topic && activity.performance !== undefined) {
        concepts.forEach((concept) => {
          if (
            activity.topic
              .toLowerCase()
              .includes(concept.concept.toLowerCase()) ||
            concept.concept.toLowerCase().includes(activity.topic.toLowerCase())
          ) {
            const current = conceptPerformance.get(concept.concept);
            current.attempts += 1;
            current.correct += activity.performance >= 0.7 ? 1 : 0;
            current.averageScore =
              (current.averageScore + activity.performance) / 2;
            current.lastAttempt = activity.timestamp;
          }
        });
      }
    });
  }

  // Categorize concepts by performance
  const weaknesses = [];
  const needsReview = [];
  const strengths = [];

  conceptPerformance.forEach((performance, conceptName) => {
    const masteryLevel =
      performance.attempts > 0
        ? performance.correct / performance.attempts
        : 0.5;

    if (
      masteryLevel < 0.4 ||
      (performance.attempts > 3 && masteryLevel < 0.6)
    ) {
      weaknesses.push({ concept: conceptName, performance, masteryLevel });
    } else if (masteryLevel >= 0.8) {
      strengths.push({ concept: conceptName, performance, masteryLevel });
    } else {
      needsReview.push({ concept: conceptName, performance, masteryLevel });
    }
  });

  return {
    conceptPerformance,
    weaknesses: weaknesses.sort((a, b) => a.masteryLevel - b.masteryLevel),
    needsReview: needsReview.sort((a, b) => a.masteryLevel - b.masteryLevel),
    strengths: strengths.sort((a, b) => b.masteryLevel - a.masteryLevel),
    overallProficiency: calculateOverallProficiency(conceptPerformance),
  };
}

/**
 * Calculate optimal question distribution
 */
function calculateQuestionDistribution(performanceAnalysis, totalQuestions) {
  const { weaknesses, needsReview, strengths } = performanceAnalysis;

  let weaknessQuestions = 0;
  let reviewQuestions = 0;
  let advancementQuestions = 0;

  // Prioritize weaknesses
  if (weaknesses.length > 0) {
    weaknessQuestions = Math.min(
      Math.ceil(totalQuestions * 0.5),
      weaknesses.length * 2
    );
  }

  // Add review questions
  const remainingAfterWeakness = totalQuestions - weaknessQuestions;
  if (needsReview.length > 0 && remainingAfterWeakness > 0) {
    reviewQuestions = Math.min(
      Math.ceil(remainingAfterWeakness * 0.6),
      needsReview.length
    );
  }

  // Fill remaining with advancement questions
  advancementQuestions = totalQuestions - weaknessQuestions - reviewQuestions;

  return {
    weaknessQuestions,
    reviewQuestions,
    advancementQuestions,
  };
}

/**
 * Generate questions targeting user weaknesses
 */
function generateQuestionsForWeaknesses(
  concepts,
  weaknesses,
  count,
  topicName
) {
  const questions = [];
  const weakConcepts = weaknesses.map((w) => w.concept);

  for (let i = 0; i < count; i++) {
    const targetConcept = weakConcepts[i % weakConcepts.length];
    const concept = concepts.find((c) => c.concept === targetConcept);

    if (concept) {
      // Generate easier questions for weak areas to build confidence
      const questionType =
        i % 4 === 0
          ? 'mcq'
          : i % 4 === 1
            ? 'truefalse'
            : i % 4 === 2
              ? 'fillblank'
              : 'shortanswer';

      let question;
      switch (questionType) {
        case 'mcq':
          question = generateMCQ(concept, concepts, topicName);
          break;
        case 'truefalse':
          question = generateTrueFalse(concept, topicName);
          break;
        case 'fillblank':
          question = generateFillBlank(concept, topicName);
          break;
        case 'shortanswer':
          question = generateShortAnswer(concept, topicName);
          break;
      }

      if (question) {
        questions.push({
          ...question,
          focus: 'weakness_remediation',
          conceptDifficulty: 'basic',
          hints: generateRemediationHints(
            concept,
            weaknesses.find((w) => w.concept === targetConcept)
          ),
        });
      }
    }
  }

  return questions;
}

/**
 * Generate questions for concepts that need review
 */
function generateReviewQuestions(concepts, needsReview, count, topicName) {
  const questions = [];
  const reviewConcepts = needsReview.map((r) => r.concept);

  for (let i = 0; i < count; i++) {
    const targetConcept = reviewConcepts[i % reviewConcepts.length];
    const concept = concepts.find((c) => c.concept === targetConcept);

    if (concept) {
      // Mix of question types with moderate difficulty
      const questionTypes = [
        'mcq',
        'truefalse',
        'fillblank',
        'shortanswer',
        'explain',
      ];
      const questionType = questionTypes[i % questionTypes.length];

      let question;
      switch (questionType) {
        case 'mcq':
          question = generateMCQ(concept, concepts, topicName);
          break;
        case 'truefalse':
          question = generateTrueFalse(concept, topicName);
          break;
        case 'fillblank':
          question = generateFillBlank(concept, topicName);
          break;
        case 'shortanswer':
          question = generateShortAnswer(concept, topicName);
          break;
        case 'explain':
          question = generateExplainQuestion(concept, topicName);
          break;
      }

      if (question) {
        questions.push({
          ...question,
          focus: 'review',
          conceptDifficulty: 'intermediate',
        });
      }
    }
  }

  return questions;
}

/**
 * Generate questions for advancement in strong areas
 */
function generateAdvancementQuestions(concepts, strengths, count, topicName) {
  const questions = [];
  const strongConcepts = strengths.map((s) => s.concept);

  for (let i = 0; i < count; i++) {
    const targetConcept = strongConcepts[i % strongConcepts.length];
    const concept = concepts.find((c) => c.concept === targetConcept);

    if (concept) {
      // Generate challenging questions for strong areas
      const questionType =
        i % 3 === 0 ? 'explain' : i % 3 === 1 ? 'mcq' : 'shortanswer';

      let question;
      switch (questionType) {
        case 'mcq':
          question = generateMCQ(concept, concepts, topicName);
          break;
        case 'shortanswer':
          question = generateShortAnswer(concept, topicName);
          break;
        case 'explain':
          question = generateExplainQuestion(concept, topicName);
          break;
      }

      if (question) {
        questions.push({
          ...question,
          focus: 'advancement',
          conceptDifficulty: 'advanced',
          challengeLevel: 'high',
        });
      }
    }
  }

  return questions;
}

/**
 * Generate remediation hints for weak areas
 */
function generateRemediationHints(concept, weaknessData) {
  const hints = [];

  if (weaknessData.masteryLevel < 0.3) {
    hints.push('Start with the basic definition and work up from there.');
    hints.push(`Remember: ${concept.definition.substring(0, 80)}...`);
  } else if (weaknessData.masteryLevel < 0.5) {
    hints.push(
      'Think about how this concept connects to what you already know.'
    );
    hints.push('Break it down into smaller, manageable parts.');
  }

  hints.push('Review the core characteristics and key examples.');
  hints.push('Consider how this concept applies in real-world situations.');

  return hints;
}

/**
 * Calculate target difficulty for a question
 */
function calculateTargetDifficulty(question, performanceAnalysis) {
  const { weaknesses, needsReview, strengths } = performanceAnalysis;

  if (question.focus === 'weakness_remediation') {
    return Math.max(1, weaknesses[0]?.performance.difficulty - 1 || 2);
  } else if (question.focus === 'review') {
    return needsReview[0]?.performance.difficulty || 3;
  } else {
    return Math.min(5, (strengths[0]?.performance.difficulty || 3) + 1);
  }
}

/**
 * Estimate time needed for a question
 */
function estimateQuestionTime(question) {
  const baseTime = 30; // 30 seconds base

  switch (question.type) {
    case 'mcq':
    case 'truefalse':
      return baseTime;
    case 'fillblank':
      return baseTime * 1.5;
    case 'shortanswer':
      return baseTime * 2;
    case 'explain':
      return baseTime * 3;
    default:
      return baseTime;
  }
}

/**
 * Determine remediation level needed
 */
function determineRemediationLevel(question, performanceAnalysis) {
  if (question.focus === 'weakness_remediation') {
    return 'high';
  } else if (question.focus === 'review') {
    return 'medium';
  }
  return 'low';
}

/**
 * Calculate overall proficiency
 */
function calculateOverallProficiency(conceptPerformance) {
  if (conceptPerformance.size === 0) return 0.5;

  let totalScore = 0;
  let count = 0;

  conceptPerformance.forEach((performance) => {
    if (performance.attempts > 0) {
      totalScore += performance.correct / performance.attempts;
      count++;
    } else {
      totalScore += 0.5; // Baseline for unattempted concepts
      count++;
    }
  });

  return count > 0 ? totalScore / count : 0.5;
}

/**
 * Grade an adaptive quiz with enhanced feedback
 * @param {Array} questions - Quiz questions
 * @param {Array} userAnswers - User's answers
 * @param {Object} userModel - User model for adaptive feedback
 * @returns {Object} - Enhanced grading results
 */
export function gradeAdaptiveQuiz(questions, userAnswers, userModel) {
  const basicResults = gradeQuiz(questions, userAnswers);

  // Add adaptive analysis
  const adaptiveAnalysis = analyzeAdaptivePerformance(
    questions,
    userAnswers,
    userModel
  );

  return {
    ...basicResults,
    adaptiveInsights: adaptiveAnalysis,
    recommendedActions: generateAdaptiveRecommendations(
      adaptiveAnalysis,
      userModel
    ),
    skillProgress: calculateSkillProgress(questions, userAnswers, userModel),
  };
}

/**
 * Analyze performance for adaptive insights
 */
function analyzeAdaptivePerformance(questions, userAnswers, userModel) {
  const conceptPerformance = new Map();
  const questionTypePerformance = new Map();

  questions.forEach((question, index) => {
    const userAnswer = userAnswers[index];
    const isCorrect =
      userAnswer &&
      (question.type === 'mcq' || question.type === 'truefalse'
        ? userAnswer === question.answer
        : calculateAnswerSimilarity(userAnswer, question.answer) > 0.7);

    // Track concept performance
    const concept = question.conceptTested;
    if (!conceptPerformance.has(concept)) {
      conceptPerformance.set(concept, {
        correct: 0,
        total: 0,
        focus: question.focus,
      });
    }
    const conceptStats = conceptPerformance.get(concept);
    conceptStats.total++;
    if (isCorrect) conceptStats.correct++;

    // Track question type performance
    const type = question.type;
    if (!questionTypePerformance.has(type)) {
      questionTypePerformance.set(type, { correct: 0, total: 0 });
    }
    const typeStats = questionTypePerformance.get(type);
    typeStats.total++;
    if (isCorrect) typeStats.correct++;
  });

  return {
    conceptPerformance,
    questionTypePerformance,
    improvementAreas: identifyImprovementAreas(conceptPerformance),
    strengths: identifyStrengths(conceptPerformance),
  };
}

/**
 * Generate adaptive recommendations
 */
function generateAdaptiveRecommendations(adaptiveAnalysis, userModel) {
  const recommendations = [];

  // Recommend focus areas based on weaknesses
  adaptiveAnalysis.improvementAreas.forEach((area) => {
    recommendations.push({
      type: 'remediation',
      concept: area.concept,
      priority: 'high',
      reason: `Performance in ${area.concept} needs improvement`,
      action: 'Review fundamental concepts and practice similar questions',
    });
  });

  // Suggest advanced challenges for strengths
  adaptiveAnalysis.strengths.forEach((strength) => {
    recommendations.push({
      type: 'advancement',
      concept: strength.concept,
      priority: 'medium',
      reason: `Strong performance in ${strength.concept}`,
      action: 'Try more challenging questions in this area',
    });
  });

  return recommendations;
}

/**
 * Calculate skill progress
 */
function calculateSkillProgress(questions, userAnswers, userModel) {
  const skillUpdates = new Map();

  questions.forEach((question, index) => {
    const userAnswer = userAnswers[index];
    const performance = calculateQuestionPerformance(question, userAnswer);

    // Update relevant skills
    const skills = question.conceptTested
      ? [question.conceptTested.toLowerCase()]
      : [];
    skills.forEach((skill) => {
      if (!skillUpdates.has(skill)) {
        skillUpdates.set(skill, { performances: [], averageImprovement: 0 });
      }
      skillUpdates.get(skill).performances.push(performance);
    });
  });

  // Calculate average performance for each skill
  skillUpdates.forEach((data, skill) => {
    data.averagePerformance =
      data.performances.reduce((sum, p) => sum + p, 0) /
      data.performances.length;
  });

  return Object.fromEntries(skillUpdates);
}

/**
 * Helper functions
 */
function calculateAnswerSimilarity(userAnswer, correctAnswer) {
  if (!userAnswer || !correctAnswer) return 0;

  const userTokens = tokenize(userAnswer.toLowerCase());
  const correctTokens = tokenize(correctAnswer.toLowerCase());

  const matchCount = userTokens.filter((token) =>
    correctTokens.includes(token)
  ).length;
  return matchCount / Math.max(correctTokens.length, 1);
}

function calculateQuestionPerformance(question, userAnswer) {
  if (!userAnswer) return 0;

  switch (question.type) {
    case 'mcq':
    case 'truefalse':
      return userAnswer === question.answer ? 1 : 0;
    case 'fillblank':
    case 'shortanswer':
    case 'explain':
      return calculateAnswerSimilarity(userAnswer, question.answer);
    default:
      return 0;
  }
}

function identifyImprovementAreas(conceptPerformance) {
  return Array.from(conceptPerformance.entries())
    .filter(([_, stats]) => stats.correct / stats.total < 0.7)
    .map(([concept, stats]) => ({
      concept,
      accuracy: stats.correct / stats.total,
      focus: stats.focus,
    }))
    .sort((a, b) => a.accuracy - b.accuracy);
}

function identifyStrengths(conceptPerformance) {
  return Array.from(conceptPerformance.entries())
    .filter(([_, stats]) => stats.correct / stats.total >= 0.8)
    .map(([concept, stats]) => ({
      concept,
      accuracy: stats.correct / stats.total,
      focus: stats.focus,
    }))
    .sort((a, b) => b.accuracy - a.accuracy);
}

/**
 * Generate a complete quiz from topic data
 * @param {Object} topic - Topic object
 * @param {number} questionCount - Number of questions to generate
 * @returns {Array} - Array of question objects
 */
export function generateQuiz(topic, questionCount = 10) {
  if (!topic || !topic.concepts || topic.concepts.length === 0) {
    return [];
  }

  const questions = [];
  const { concepts, topic: topicName } = topic;

  // Ensure we have enough variety
  const questionTypes = [
    'mcq',
    'truefalse',
    'fillblank',
    'shortanswer',
    'explain',
  ];

  for (let i = 0; i < questionCount; i++) {
    const questionType = questionTypes[i % questionTypes.length];
    const concept = concepts[i % concepts.length];

    let question;

    switch (questionType) {
      case 'mcq':
        question = generateMCQ(concept, concepts, topicName);
        break;
      case 'truefalse':
        question = generateTrueFalse(concept, topicName);
        break;
      case 'fillblank':
        question = generateFillBlank(concept, topicName);
        break;
      case 'shortanswer':
        question = generateShortAnswer(concept, topicName);
        break;
      case 'explain':
        question = generateExplainQuestion(concept, topicName);
        break;
      default:
        question = generateMCQ(concept, concepts, topicName);
    }

    if (question) {
      questions.push({
        ...question,
        id: `q_${i + 1}`,
        difficulty: concept.difficulty || 2,
        conceptTested: concept.concept,
      });
    }
  }

  return questions;
}

/**
 * Generate a multiple choice question
 */
function generateMCQ(concept, allConcepts, topicName) {
  const { concept: conceptName, definition } = concept;

  // Generate question stem
  const questionStems = [
    `Which statement best describes ${conceptName}?`,
    `What is the primary characteristic of ${conceptName}?`,
    `In the context of ${topicName}, ${conceptName} refers to:`,
    `Which of the following is true about ${conceptName}?`,
  ];

  const question =
    questionStems[Math.floor(Math.random() * questionStems.length)];

  // Correct answer
  const correctAnswer =
    definition.substring(0, 100) + (definition.length > 100 ? '...' : '');

  // Generate distractors
  const distractors = [];

  // Use other concepts as basis for distractors
  const otherConcepts = allConcepts.filter((c) => c.concept !== conceptName);

  if (otherConcepts.length >= 3) {
    for (let i = 0; i < 3; i++) {
      const distractor =
        otherConcepts[i].definition.substring(0, 100) +
        (otherConcepts[i].definition.length > 100 ? '...' : '');
      distractors.push(distractor);
    }
  } else {
    // Generate synthetic distractors
    distractors.push(`A process unrelated to ${conceptName}`);
    distractors.push(`The opposite of what ${conceptName} represents`);
    distractors.push(`A common misconception about ${conceptName}`);
  }

  // Shuffle options
  const options = [correctAnswer, ...distractors];
  shuffleArray(options);

  return {
    type: 'mcq',
    question,
    options,
    answer: correctAnswer,
  };
}

/**
 * Generate a true/false question
 */
function generateTrueFalse(concept, topicName) {
  const { concept: conceptName, definition } = concept;

  const isTrue = Math.random() > 0.5;

  let statement;

  if (isTrue) {
    // Generate true statement
    const trueStatements = [
      `${conceptName} is an important concept in ${topicName}`,
      `The definition of ${conceptName} includes: ${definition.substring(0, 80)}`,
      `Understanding ${conceptName} is essential for mastering ${topicName}`,
    ];
    statement =
      trueStatements[Math.floor(Math.random() * trueStatements.length)];
  } else {
    // Generate false statement
    const falseStatements = [
      `${conceptName} is completely unrelated to ${topicName}`,
      `${conceptName} has no practical applications`,
      `The concept of ${conceptName} is outdated and no longer relevant`,
    ];
    statement =
      falseStatements[Math.floor(Math.random() * falseStatements.length)];
  }

  return {
    type: 'truefalse',
    question: statement,
    answer: isTrue,
  };
}

/**
 * Generate a fill-in-the-blank question
 */
function generateFillBlank(concept, topicName) {
  const { concept: conceptName, definition } = concept;

  // Create a sentence with a blank
  const templates = [
    `_____ is defined as ${definition.substring(0, 60)}...`,
    `In ${topicName}, the term _____ refers to ${definition.substring(0, 60)}...`,
    `The concept of _____ is important because ${definition.substring(0, 60)}...`,
  ];

  const template = templates[Math.floor(Math.random() * templates.length)];

  return {
    type: 'fillblank',
    question: template,
    answer: conceptName,
  };
}

/**
 * Generate a short answer question
 */
function generateShortAnswer(concept, topicName) {
  const { concept: conceptName } = concept;

  const questions = [
    `Define ${conceptName} in your own words.`,
    `Explain the significance of ${conceptName} in ${topicName}.`,
    `What are the key characteristics of ${conceptName}?`,
    `How does ${conceptName} relate to other concepts in ${topicName}?`,
  ];

  const question = questions[Math.floor(Math.random() * questions.length)];

  return {
    type: 'shortanswer',
    question,
    answer: concept.definition,
    guidance: 'Your answer should include the main definition and key points.',
  };
}

/**
 * Generate an explanation question
 */
function generateExplainQuestion(concept, topicName) {
  const { concept: conceptName } = concept;

  const questions = [
    `Explain in detail how ${conceptName} works and why it is important in ${topicName}.`,
    `Describe the relationship between ${conceptName} and other key concepts in ${topicName}.`,
    `Provide a comprehensive explanation of ${conceptName}, including examples and applications.`,
  ];

  const question = questions[Math.floor(Math.random() * questions.length)];

  return {
    type: 'explain',
    question,
    answer: concept.definition,
    guidance:
      'Your answer should be detailed and include examples, applications, and connections to other concepts.',
  };
}

/**
 * Shuffle array in place
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * Grade a quiz attempt with improved accuracy
 * @param {Array} questions - Quiz questions
 * @param {Array} userAnswers - User's answers
 * @returns {Object} - Grading results
 */
export function gradeQuiz(questions, userAnswers) {
  let correct = 0;
  let partialCredit = 0;
  const total = questions.length;
  const results = [];

  questions.forEach((question, index) => {
    const userAnswer = userAnswers[index];
    let isCorrect = false;
    let partialScore = 0;

    // Check if answer was provided
    const isAnswered =
      userAnswer !== undefined && userAnswer !== null && userAnswer !== '';

    if (!isAnswered) {
      // No answer provided
      results.push({
        questionId: question.id,
        question: question.question,
        userAnswer: '(No answer provided)',
        correctAnswer: question.answer,
        isCorrect: false,
        conceptTested: question.conceptTested,
        partialScore: 0,
      });
      return;
    }

    switch (question.type) {
      case 'mcq': {
        isCorrect = userAnswer === question.answer;
        partialScore = isCorrect ? 1 : 0;
        break;
      }

      case 'truefalse': {
        // Handle both string and boolean answers for compatibility
        const normalizedUserAnswer = typeof userAnswer === 'string' ?
          userAnswer.toLowerCase() === 'true' : userAnswer;
        isCorrect = normalizedUserAnswer === question.answer;
        partialScore = isCorrect ? 1 : 0;
        break;
      }

      case 'fillblank': {
        // More lenient comparison for fill-in-the-blank
        const userAnswerClean = userAnswer
          .toLowerCase()
          .trim()
          .replace(/[^\w\s]/g, '');
        const correctAnswerClean = question.answer
          .toLowerCase()
          .trim()
          .replace(/[^\w\s]/g, '');

        // Exact match
        if (userAnswerClean === correctAnswerClean) {
          isCorrect = true;
          partialScore = 1;
        }
        // Partial match (contains the answer or very similar)
        else if (
          userAnswerClean.includes(correctAnswerClean) ||
          correctAnswerClean.includes(userAnswerClean)
        ) {
          const similarity = calculateStringSimilarity(
            userAnswerClean,
            correctAnswerClean
          );
          if (similarity > 0.7) {
            isCorrect = true;
            partialScore = 1;
          } else if (similarity > 0.4) {
            partialScore = 0.5;
          }
        }
        break;
      }

      case 'shortanswer': {
        // Improved grading for short answers
        const answerTokens = tokenize(question.answer);
        const userTokens = tokenize(userAnswer || '');

        if (userTokens.length === 0) {
          partialScore = 0;
          break;
        }

        // Calculate overlap
        const matchCount = userTokens.filter((token) =>
          answerTokens.includes(token)
        ).length;
        const matchRatio = matchCount / Math.max(answerTokens.length, 1);

        // Stricter grading for short answers
        if (matchRatio >= 0.7) {
          isCorrect = true;
          partialScore = 1;
        } else if (matchRatio >= 0.5) {
          partialScore = 0.7;
        } else if (matchRatio >= 0.3) {
          partialScore = 0.4;
        } else {
          partialScore = 0;
        }
        break;
      }

      case 'explain': {
        // Comprehensive grading for explanation questions
        const explainTokens = tokenize(question.answer);
        const userExplainTokens = tokenize(userAnswer || '');

        if (userExplainTokens.length < 5) {
          // Answer too short
          partialScore = 0;
          break;
        }

        const explainMatchCount = userExplainTokens.filter((token) =>
          explainTokens.includes(token)
        ).length;
        const explainMatchRatio =
          explainMatchCount / Math.max(explainTokens.length, 1);
        const lengthRatio = Math.min(
          userExplainTokens.length / explainTokens.length,
          1
        );

        // Combined score based on content match and length
        const contentScore = explainMatchRatio * 0.7;
        const lengthScore = lengthRatio * 0.3;
        partialScore = contentScore + lengthScore;

        if (partialScore >= 0.6) {
          isCorrect = true;
        }
        break;
      }
    }

    if (isCorrect) {
      correct++;
    }
    partialCredit += partialScore;

    results.push({
      questionId: question.id,
      question: question.question,
      userAnswer,
      correctAnswer: question.answer,
      isCorrect,
      conceptTested: question.conceptTested,
      partialScore: Math.round(partialScore * 100),
    });
  });

  // Calculate final score with partial credit
  const rawScore = (partialCredit / total) * 100;
  const score = Math.round(rawScore);

  return {
    score,
    correct,
    total,
    results,
    partialCredit: Math.round(partialCredit * 10) / 10,
  };
}

/**
 * Calculate string similarity (Levenshtein distance based)
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Similarity score (0-1)
 */
function calculateStringSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Edit distance
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}
