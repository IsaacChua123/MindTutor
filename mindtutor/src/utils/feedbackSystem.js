// feedbackSystem.js - Intelligent feedback generation system

import { userModelManager } from './userModel.js';

export class FeedbackGenerator {
  constructor() {
    this.feedbackTemplates = {
      excellent: [
        "🎉 Outstanding work! You've mastered this concept completely.",
        "🌟 Excellent understanding! You're clearly grasping the key ideas.",
        '🏆 Perfect! Your knowledge of this topic is impressive.',
      ],
      good: [
        '👍 Great job! You have a solid understanding with minor areas to polish.',
        "👌 Well done! You're on the right track with this concept.",
        "💪 Good work! A few more practice sessions and you'll have this mastered.",
      ],
      needs_improvement: [
        '📚 Keep working on this! Focus on the core concepts and try again.',
        '🔄 This concept needs more attention. Review the key points and practice.',
        "💡 You're making progress! Spend some time reviewing the fundamentals.",
      ],
      poor: [
        "🎯 Let's focus on building a strong foundation. Start with the basics.",
        '📖 This topic needs more study time. Break it down into smaller parts.',
        '🔍 Take your time with this concept. Understanding takes practice.',
      ],
    };

    this.errorPatterns = {
      calculation: {
        message:
          'Check your calculation steps. Remember the order of operations and units.',
        remediation: 'Practice similar calculations with different numbers.',
      },
      concept_misunderstanding: {
        message: 'This reveals a gap in understanding the core concept.',
        remediation:
          'Review the definition and try to explain it in your own words.',
      },
      careless_mistake: {
        message: 'This appears to be a careless error. Double-checking is key!',
        remediation: 'Slow down and verify each step of your work.',
      },
      knowledge_gap: {
        message: 'This indicates a missing piece of prerequisite knowledge.',
        remediation: 'Review the foundational concepts before continuing.',
      },
      reading_comprehension: {
        message:
          'The issue seems to be with understanding the question or instructions.',
        remediation: 'Read questions carefully and underline key terms.',
      },
    };
  }

  async generateFeedback(userId, assessmentResult, context = {}) {
    const userModel = await userModelManager.getUserModel(userId);

    const feedback = {
      overall: await this.generateOverallFeedback(assessmentResult, userModel),
      questionByQuestion: await this.generateDetailedFeedback(
        assessmentResult,
        userModel
      ),
      recommendations: await this.generateRecommendations(
        assessmentResult,
        userModel,
        context
      ),
      nextSteps: await this.generateNextSteps(assessmentResult, userModel),
      progress: this.generateProgressUpdate(assessmentResult, userModel),
      encouragement: this.generateEncouragement(assessmentResult, userModel),
    };

    return this.personalizeFeedback(feedback, userModel);
  }

  async generateOverallFeedback(result, userModel) {
    const { score, timeSpent, topic } = result;

    let performanceLevel;
    if (score >= 0.9) performanceLevel = 'excellent';
    else if (score >= 0.8) performanceLevel = 'good';
    else if (score >= 0.6) performanceLevel = 'needs_improvement';
    else performanceLevel = 'poor';

    const templates = this.feedbackTemplates[performanceLevel];
    const message = templates[Math.floor(Math.random() * templates.length)];

    // Add contextual information
    let contextualInfo = '';

    // Time-based feedback
    const avgTime = this.calculateAverageTime(result.difficulty || 5);
    if (timeSpent < avgTime * 0.8) {
      contextualInfo +=
        ' You worked through this quickly, showing good intuition. ';
    } else if (timeSpent > avgTime * 1.5) {
      contextualInfo +=
        ' Taking time to think through problems is an excellent strategy. ';
    }

    // Progress-based feedback
    const topicHistory = userModel.learningHistory.filter(
      (h) => h.topic === topic
    );
    if (topicHistory.length > 1) {
      const previousScore = topicHistory[topicHistory.length - 2].performance;
      if (score > previousScore + 0.1) {
        contextualInfo += ' Great improvement from your last attempt! ';
      } else if (score < previousScore - 0.1) {
        contextualInfo += ' This is a temporary setback - keep practicing! ';
      }
    }

    // Learning velocity feedback
    if (userModel.learningVelocity > 0.05) {
      contextualInfo += ' Your learning speed is impressive! ';
    } else if (userModel.learningVelocity < -0.05) {
      contextualInfo += ' Consistent practice will help build momentum. ';
    }

    return {
      message: message + contextualInfo,
      score: Math.round(score * 100),
      performanceLevel,
      timeSpent: Math.round(timeSpent),
      topic,
    };
  }

  async generateDetailedFeedback(result, userModel) {
    const detailedFeedback = [];

    for (const question of result.questions) {
      const questionFeedback = {
        questionId: question.id,
        correct: question.userAnswer === question.correctAnswer,
        timeSpent: question.timeSpent,
        primaryFeedback: await this.generatePrimaryFeedback(
          question,
          userModel
        ),
        secondaryFeedback: await this.generateSecondaryFeedback(
          question,
          userModel
        ),
        hints: question.correct ? [] : await this.generateHints(question),
        similarProblems: question.correct
          ? []
          : await this.findSimilarProblems(question, userModel),
      };

      detailedFeedback.push(questionFeedback);
    }

    return detailedFeedback;
  }

  async generatePrimaryFeedback(question, userModel) {
    if (question.correct) {
      const positiveFeedback = [
        '✅ Correct! Well done.',
        '✅ Right on target!',
        '✅ Perfect! You got this.',
        '✅ Excellent work!',
        '✅ Spot on!',
      ];

      // Add streak information
      if (userModel.statistics.currentStreak > 1) {
        return (
          positiveFeedback[
            Math.floor(Math.random() * positiveFeedback.length)
          ] + ` 🔥 ${userModel.statistics.currentStreak} streak!`
        );
      }

      return positiveFeedback[
        Math.floor(Math.random() * positiveFeedback.length)
      ];
    } else {
      const errorType = this.analyzeError(
        question.userAnswer,
        question.correctAnswer,
        question.type
      );
      return (
        this.errorPatterns[errorType]?.message ||
        "❌ Not quite right. Let's review this."
      );
    }
  }

  async generateSecondaryFeedback(question, userModel) {
    if (question.correct) {
      // Provide reinforcement or extension
      const reinforcements = [
        'This shows you understand the concept well.',
        'Great application of the principle!',
        'Your reasoning is sound.',
        'Excellent conceptual understanding.',
        'You clearly know your stuff!',
      ];

      // Add time-based feedback
      if (question.timeSpent < 30) {
        return (
          reinforcements[Math.floor(Math.random() * reinforcements.length)] +
          ' And you did it quickly too!'
        );
      }

      return reinforcements[Math.floor(Math.random() * reinforcements.length)];
    } else {
      const errorType = this.analyzeError(
        question.userAnswer,
        question.correctAnswer,
        question.type
      );
      const remediation =
        this.errorPatterns[errorType]?.remediation ||
        'Review the concept and try again.';

      // Add personalized remediation based on user history
      const similarErrors = userModel.learningHistory.filter(
        (h) => h.topic === question.topic && h.performance < 0.6
      );

      if (similarErrors.length > 2) {
        return (
          remediation +
          ' This seems to be a recurring challenge - consider reviewing prerequisite knowledge.'
        );
      }

      return remediation;
    }
  }

  analyzeError(userAnswer, correctAnswer, questionType) {
    if (questionType === 'calculation') {
      // Check for common calculation errors
      if (this.isOrderOfOperationsError(userAnswer, correctAnswer)) {
        return 'calculation';
      }
      if (this.isUnitError(userAnswer, correctAnswer)) {
        return 'careless_mistake';
      }
      return 'calculation';
    }

    if (questionType === 'multiple_choice') {
      // Analyze which distractor was chosen
      const distractorAnalysis = this.analyzeDistractor(
        userAnswer,
        correctAnswer
      );
      return distractorAnalysis || 'concept_misunderstanding';
    }

    if (questionType === 'short_answer' || questionType === 'explanation') {
      // Use NLP to analyze response quality
      return this.analyzeTextResponse(userAnswer, correctAnswer);
    }

    return 'general';
  }

  async generateHints(question) {
    const hints = [];

    // Generate progressive hints based on question type and difficulty
    if (question.type === 'calculation') {
      hints.push('Check your arithmetic operations.');
      hints.push('Verify units and significant figures.');
      hints.push('Double-check your formula application.');
    } else if (question.type === 'conceptual') {
      hints.push('Think about the definition of key terms.');
      hints.push('Consider the relationship between concepts.');
      hints.push("Recall similar examples you've seen.");
    }

    return hints;
  }

  async findSimilarProblems(question, userModel) {
    // Find problems with similar concepts that the user struggled with
    const similarProblems = [];

    const relatedHistory = userModel.learningHistory.filter(
      (h) => h.topic === question.topic && h.performance < 0.7
    );

    // Generate practice recommendations based on error patterns
    if (relatedHistory.length > 0) {
      similarProblems.push({
        type: 'practice',
        description: 'Practice similar problems to build confidence',
        count: Math.min(5, relatedHistory.length),
      });
    }

    return similarProblems;
  }

  async generateRecommendations(result, userModel, _context) {
    const recommendations = [];

    // Based on performance
    if (result.score < 0.7) {
      recommendations.push({
        type: 'review',
        priority: 'high',
        description: 'Review the fundamental concepts before continuing',
        action: 'Revisit basic definitions and examples',
      });
    }

    // Based on weaknesses
    if (userModel.weaknesses && userModel.weaknesses.length > 0) {
      recommendations.push({
        type: 'remediation',
        priority: 'high',
        description: `Focus on improving: ${userModel.weaknesses.slice(0, 2).join(', ')}`,
        action: 'Practice targeted exercises for weak areas',
      });
    }

    // Based on learning style
    const learningStyle = userModel.profile.learningStyle;
    if (learningStyle === 'visual') {
      recommendations.push({
        type: 'study_method',
        priority: 'medium',
        description: 'Try visual learning methods like diagrams and videos',
        action: 'Incorporate more visual aids in your study routine',
      });
    }

    // Based on engagement
    if (userModel.engagementScore < 0.4) {
      recommendations.push({
        type: 'engagement',
        priority: 'medium',
        description: 'Mix up your study routine to stay engaged',
        action: 'Try different question types and study methods',
      });
    }

    return recommendations;
  }

  async generateNextSteps(result, userModel) {
    const nextSteps = [];

    // Immediate next steps based on current performance
    if (result.score >= 0.8) {
      nextSteps.push({
        action: 'Advance to next topic',
        reason:
          'Strong performance indicates readiness for more advanced material',
        urgency: 'high',
      });
    } else if (result.score >= 0.6) {
      nextSteps.push({
        action: 'Practice similar problems',
        reason: 'More practice will solidify understanding',
        urgency: 'high',
      });
    } else {
      nextSteps.push({
        action: 'Review fundamentals',
        reason: 'Build stronger foundation before progressing',
        urgency: 'high',
      });
    }

    // Long-term recommendations
    if (userModel.learningVelocity < 0) {
      nextSteps.push({
        action: 'Adjust study strategy',
        reason: 'Current approach may not be optimal',
        urgency: 'medium',
      });
    }

    return nextSteps;
  }

  generateProgressUpdate(result, userModel) {
    const progress = {
      currentScore: Math.round(result.score * 100),
      averageScore: Math.round(userModel.statistics.averageScore * 100),
      currentStreak: userModel.statistics.currentStreak,
      longestStreak: userModel.statistics.longestStreak,
      skillsImproved: [],
      skillsNeedWork: [],
    };

    // Identify skill changes
    Object.entries(userModel.skillLevels).forEach(([skillId, skill]) => {
      if (skill.practiceHistory.length >= 2) {
        const recent = skill.practiceHistory.slice(-2);
        if (recent[1].performance > recent[0].performance + 0.1) {
          progress.skillsImproved.push(skillId);
        } else if (recent[1].performance < recent[0].performance - 0.1) {
          progress.skillsNeedWork.push(skillId);
        }
      }
    });

    return progress;
  }

  generateEncouragement(result, userModel) {
    let encouragement = '';

    // Base encouragement on performance trend
    if (userModel.learningVelocity > 0.02) {
      encouragement = "You're improving steadily - keep up the great work! 📈";
    } else if (userModel.learningVelocity < -0.02) {
      encouragement = 'Everyone has off days. Tomorrow will be better! 💪';
    } else {
      encouragement = 'Consistent effort leads to consistent improvement! 🎯';
    }

    // Add streak encouragement
    if (userModel.statistics.currentStreak >= 3) {
      encouragement += ` 🔥 ${userModel.statistics.currentStreak} day streak!`;
    }

    return encouragement;
  }

  personalizeFeedback(feedback, userModel) {
    // Adjust tone based on user preferences
    if (userModel.preferences.feedbackStyle === 'concise') {
      // Shorten feedback messages
      feedback.overall.message =
        feedback.overall.message.substring(0, 100) + '...';
    }

    // Adjust based on learning style
    if (userModel.profile.learningStyle === 'kinesthetic') {
      // Add action-oriented suggestions
      feedback.recommendations.forEach((rec) => {
        rec.action = 'Try hands-on practice: ' + rec.action;
      });
    }

    return feedback;
  }

  calculateAverageTime(difficulty) {
    // Base time in seconds per question
    const baseTime = 60; // 1 minute
    const difficultyMultiplier = difficulty / 5; // Scale with difficulty
    return baseTime * difficultyMultiplier;
  }

  isOrderOfOperationsError(userAnswer, correctAnswer) {
    // Simple heuristic - could be enhanced with actual parsing
    return (
      userAnswer !== correctAnswer &&
      (userAnswer.includes('+') || userAnswer.includes('-')) &&
      (userAnswer.includes('*') || userAnswer.includes('/'))
    );
  }

  isUnitError(userAnswer, correctAnswer) {
    // Check if only units differ
    const userNum = parseFloat(userAnswer.replace(/[^\d.-]/g, ''));
    const correctNum = parseFloat(correctAnswer.replace(/[^\d.-]/g, ''));
    return userNum === correctNum && userAnswer !== correctAnswer;
  }

  analyzeDistractor(userAnswer, correctAnswer) {
    // This would need actual distractor analysis based on question data
    // For now, return general error type
    return 'concept_misunderstanding';
  }

  analyzeTextResponse(userAnswer, correctAnswer) {
    // Simple text analysis - could be enhanced with NLP
    if (userAnswer.length < correctAnswer.length * 0.5) {
      return 'incomplete_answer';
    }
    if (
      !userAnswer
        .toLowerCase()
        .includes(correctAnswer.toLowerCase().split(' ')[0])
    ) {
      return 'missing_key_concept';
    }
    return 'partial_understanding';
  }
}

// Create singleton instance
export const feedbackGenerator = new FeedbackGenerator();
