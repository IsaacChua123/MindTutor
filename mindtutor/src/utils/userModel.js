// userModel.js - Advanced user modeling for adaptive learning with ML integration

import { mlManager } from './machineLearning.js';
import {
  advancedAISystem,
  NLPEngine,
  LearningPlanner,
  KnowledgeReasoner,
  ConversationEngine,
} from './advancedAI.js';

export class UserModelManager {
  constructor() {
    this.models = new Map();
    this.skillCategories = {
      math: ['arithmetic', 'algebra', 'geometry', 'calculus', 'logic'],
      science: ['physics', 'chemistry', 'biology', 'experimental_design'],
      language: ['grammar', 'vocabulary', 'reading_comprehension', 'writing'],
      logic: ['deductive', 'inductive', 'analogical', 'causal'],
      spatial: ['visualization', 'rotation', 'patterns', 'maps'],
      memory: ['short_term', 'long_term', 'working_memory', 'recall'],
      reading: ['phonics', 'fluency', 'comprehension', 'vocabulary'],
    };
    this.mlInitialized = false;
    this.advancedAIInitialized = false;
    this.nlpEngine = new NLPEngine();
    this.learningPlanner = new LearningPlanner();
    this.knowledgeReasoner = new KnowledgeReasoner();
    this.conversationEngine = new ConversationEngine();
  }

  // Initialize or load user model
  async getUserModel(userId) {
    if (!this.models.has(userId)) {
      const model = this.createDefaultModel(userId);
      this.models.set(userId, model);
    }
    return this.models.get(userId);
  }

  // Initialize ML components
  async initializeML() {
    if (this.mlInitialized) return;

    try {
      await mlManager.initialize();
      // Try to load existing models
      await mlManager.loadModel('performancePrediction');
      await mlManager.loadModel('difficultyClassification');
      this.mlInitialized = true;
      console.log('ML components initialized successfully');
    } catch (error) {
      console.warn('ML initialization failed:', error);
    }
  }

  // Initialize Advanced AI components
  async initializeAdvancedAI() {
    if (this.advancedAIInitialized) return;

    try {
      await advancedAISystem.initialize();
      this.advancedAIInitialized = true;
      console.log('Advanced AI components initialized successfully');
    } catch (error) {
      console.warn('Advanced AI initialization failed:', error);
    }
  }

  createDefaultModel(userId) {
    return {
      userId,
      profile: {
        age: null,
        grade: null,
        learningStyle: 'visual', // visual, auditory, kinesthetic, reading
        preferredDifficulty: 5,
        timeAvailable: 30, // minutes per session
        goals: [],
        createdAt: new Date().toISOString(),
      },
      cognitiveProfile: {
        workingMemory: 50, // 0-100 scale
        longTermMemory: 50,
        processingSpeed: 50,
        attentionSpan: 50,
        spatialReasoning: 50,
        logicalReasoning: 50,
        verbalReasoning: 50,
      },
      skillLevels: this.initializeSkillLevels(),
      learningHistory: [],
      preferences: {
        questionTypes: ['multiple_choice', 'short_answer'],
        feedbackStyle: 'detailed', // concise, detailed, encouraging
        pacing: 'moderate', // slow, moderate, fast
        rewards: ['points', 'badges', 'streaks'],
      },
      statistics: {
        totalSessions: 0,
        totalTimeSpent: 0,
        averageScore: 0,
        currentStreak: 0,
        longestStreak: 0,
        topicsMastered: [],
        weakAreas: [],
      },
    };
  }

  initializeSkillLevels() {
    const skillLevels = {};

    // Initialize all skills to baseline level
    Object.entries(this.skillCategories).forEach(([category, skills]) => {
      skills.forEach((skill) => {
        const skillId = `${category}.${skill}`;
        skillLevels[skillId] = {
          current: 0.5, // 0-1 scale (50% baseline)
          target: 0.8, // 80% mastery target
          lastAssessed: new Date().toISOString(),
          confidence: 0.5,
          practiceHistory: [],
        };
      });
    });

    return skillLevels;
  }

  // Update user model based on activity with enhanced tracking
  async updateFromActivity(userId, activityData) {
    const model = await this.getUserModel(userId);

    // Create detailed activity record
    const detailedActivity = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      activity: activityData.type,
      topic: activityData.topic,
      performance: activityData.score,
      timeSpent: activityData.timeSpent,
      difficulty: activityData.difficulty,
      skills: activityData.skills || [],
      questionTypes: activityData.questionTypes || [],
      errors: activityData.errors || [],
      hints: activityData.hints || [],
      cognitiveLoad: activityData.cognitiveLoad,
      engagement: activityData.engagement,
      confidence: activityData.confidence,
    };

    // Record the activity
    model.learningHistory.push(detailedActivity);

    // Keep only recent history to prevent memory issues
    if (model.learningHistory.length > 1000) {
      model.learningHistory = model.learningHistory.slice(-500);
    }

    // Update skill levels with enhanced tracking
    if (activityData.skills) {
      activityData.skills.forEach((skillId) => {
        this.updateSkillLevel(
          model,
          skillId,
          activityData.score,
          activityData.difficulty,
          detailedActivity
        );
      });
    }

    // Update concept mastery tracking
    if (activityData.conceptsTested) {
      this.updateConceptMastery(
        model,
        activityData.conceptsTested,
        activityData.score,
        activityData.errors
      );
    }

    // Update error pattern analysis
    if (activityData.errors) {
      this.updateErrorPatterns(model, activityData.errors, activityData.topic);
    }

    // Update statistics with enhanced metrics
    this.updateStatistics(model, activityData);

    // Update cognitive profile if applicable
    if (activityData.cognitiveMetrics) {
      this.updateCognitiveProfile(model, activityData.cognitiveMetrics);
    }

    // Update learning style preferences based on performance
    this.updateLearningStylePreferences(model, detailedActivity);

    // Calculate derived metrics
    this.calculateDerivedMetrics(model);

    // Generate ML predictions if available
    if (this.mlInitialized) {
      try {
        model.mlPredictions = await this.generateMLPredictions(model);
      } catch (error) {
        console.warn('ML prediction failed:', error);
        model.mlPredictions = null;
      }
    }

    // Save to persistent storage
    await this.persistUserModel(userId, model);

    return model;
  }

  updateSkillLevel(model, skillId, performance, difficulty, activityData) {
    const skill = model.skillLevels[skillId];
    if (!skill) return;

    // Enhanced Bayesian Knowledge Tracing-like update
    const learningRate = this.calculateAdaptiveLearningRate(
      skill,
      activityData
    );
    const difficultyFactor = difficulty / 5; // Normalize difficulty
    const timeFactor = this.calculateTimeEfficiencyFactor(
      activityData.timeSpent,
      difficulty
    );

    // Performance closer to 1 increases skill, closer to 0 decreases
    const performanceImpact =
      (performance - 0.5) * learningRate * difficultyFactor * timeFactor;

    // Update skill level with bounds
    skill.current = Math.max(0, Math.min(1, skill.current + performanceImpact));

    // Update confidence based on recency and consistency
    skill.lastAssessed = new Date().toISOString();
    skill.practiceHistory.push({
      date: new Date().toISOString(),
      performance,
      difficulty,
      timeSpent: activityData.timeSpent,
      hintsUsed: activityData.hints?.length || 0,
    });

    // Keep only recent history (last 20 attempts)
    if (skill.practiceHistory.length > 20) {
      skill.practiceHistory = skill.practiceHistory.slice(-20);
    }

    // Calculate confidence based on consistency and recency
    const recentPerformances = skill.practiceHistory.slice(-5);
    if (recentPerformances.length >= 3) {
      const variance = this.calculateVariance(
        recentPerformances.map((p) => p.performance)
      );
      const recencyWeight = this.calculateRecencyWeight(recentPerformances);
      skill.confidence = Math.max(0.1, (1 - variance) * recencyWeight);
    }

    // Update skill mastery trajectory
    this.updateSkillTrajectory(skill);
  }

  calculateAdaptiveLearningRate(skill, activityData) {
    // Base learning rate
    let rate = 0.1;

    // Adjust based on current skill level (easier to improve when skill is low)
    if (skill.current < 0.3)
      rate *= 1.5; // Faster learning for beginners
    else if (skill.current > 0.8) rate *= 0.7; // Slower learning for advanced

    // Adjust based on time spent (efficient learning)
    if (activityData.timeSpent) {
      const optimalTime = activityData.difficulty * 60; // 1 minute per difficulty level
      const timeRatio = activityData.timeSpent / optimalTime;
      if (timeRatio > 0.5 && timeRatio < 1.5) rate *= 1.2; // Bonus for optimal time
    }

    // Adjust based on hints used (independent learning)
    if (activityData.hints && activityData.hints.length === 0) rate *= 1.1;

    return rate;
  }

  calculateTimeEfficiencyFactor(timeSpent, difficulty) {
    if (!timeSpent) return 1;

    const optimalTime = difficulty * 60; // 1 minute per difficulty level
    const ratio = timeSpent / optimalTime;

    // Sweet spot: 0.7-1.3 times optimal time
    if (ratio >= 0.7 && ratio <= 1.3) return 1.1;
    if (ratio >= 0.5 && ratio <= 1.5) return 1.0;
    if (ratio < 0.3 || ratio > 2.0) return 0.8; // Too fast or too slow

    return 0.9;
  }

  calculateRecencyWeight(performances) {
    // More recent performances have higher weight
    let totalWeight = 0;
    let weightedSum = 0;

    performances.forEach((perf, index) => {
      const weight = Math.pow(1.2, index); // Exponential weighting
      weightedSum += perf.performance * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? weightedSum / totalWeight : 0.5;
  }

  updateSkillTrajectory(skill) {
    // Calculate learning velocity for this skill
    if (skill.practiceHistory.length >= 3) {
      const recent = skill.practiceHistory.slice(-5);
      const improvements = [];

      for (let i = 1; i < recent.length; i++) {
        improvements.push(recent[i].performance - recent[i - 1].performance);
      }

      skill.learningVelocity =
        improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length;
      skill.trajectory =
        skill.learningVelocity > 0.05
          ? 'improving'
          : skill.learningVelocity < -0.05
            ? 'declining'
            : 'stable';
    }
  }

  updateConceptMastery(model, conceptsTested, overallScore, errors) {
    if (!model.conceptMastery) {
      model.conceptMastery = new Map();
    }

    conceptsTested.forEach((concept) => {
      if (!model.conceptMastery.has(concept)) {
        model.conceptMastery.set(concept, {
          attempts: 0,
          correct: 0,
          averageScore: 0,
          lastAttempt: null,
          commonErrors: [],
          masteryLevel: 0,
        });
      }

      const mastery = model.conceptMastery.get(concept);
      mastery.attempts += 1;
      mastery.correct += overallScore >= 0.7 ? 1 : 0;
      mastery.averageScore = (mastery.averageScore + overallScore) / 2;
      mastery.lastAttempt = new Date().toISOString();

      // Track common errors
      if (errors && errors.length > 0) {
        errors.forEach((error) => {
          const existingError = mastery.commonErrors.find(
            (e) => e.type === error.type
          );
          if (existingError) {
            existingError.count += 1;
          } else {
            mastery.commonErrors.push({
              type: error.type,
              count: 1,
              description: error.description,
            });
          }
        });
      }

      // Calculate mastery level
      mastery.masteryLevel = mastery.correct / mastery.attempts;
    });
  }

  updateErrorPatterns(model, errors, topic) {
    if (!model.errorPatterns) {
      model.errorPatterns = {
        byType: new Map(),
        byTopic: new Map(),
        bySkill: new Map(),
        temporalTrends: [],
      };
    }

    errors.forEach((error) => {
      // Track by error type
      const typeKey = error.type || 'unknown';
      if (!model.errorPatterns.byType.has(typeKey)) {
        model.errorPatterns.byType.set(typeKey, {
          count: 0,
          topics: new Set(),
          recent: [],
        });
      }
      const typeData = model.errorPatterns.byType.get(typeKey);
      typeData.count += 1;
      typeData.topics.add(topic);
      typeData.recent.push({ timestamp: new Date().toISOString(), topic });

      // Keep only recent errors (last 10)
      if (typeData.recent.length > 10) {
        typeData.recent = typeData.recent.slice(-10);
      }

      // Track by topic
      if (!model.errorPatterns.byTopic.has(topic)) {
        model.errorPatterns.byTopic.set(topic, { total: 0, types: new Map() });
      }
      const topicData = model.errorPatterns.byTopic.get(topic);
      topicData.total += 1;
      topicData.types.set(typeKey, (topicData.types.get(typeKey) || 0) + 1);
    });

    // Update temporal trends
    model.errorPatterns.temporalTrends.push({
      timestamp: new Date().toISOString(),
      errorCount: errors.length,
      topic,
    });

    // Keep only recent trends (last 50)
    if (model.errorPatterns.temporalTrends.length > 50) {
      model.errorPatterns.temporalTrends =
        model.errorPatterns.temporalTrends.slice(-50);
    }
  }

  updateLearningStylePreferences(model, activity) {
    if (!model.learningStyleAnalysis) {
      model.learningStyleAnalysis = {
        visual: { score: 0, activities: 0 },
        auditory: { score: 0, activities: 0 },
        kinesthetic: { score: 0, activities: 0 },
        reading: { score: 0, activities: 0 },
      };
    }

    // Infer learning style from activity patterns
    const styleIndicators = {
      visual:
        activity.activity?.includes('diagram') ||
        activity.activity?.includes('visual'),
      auditory:
        activity.activity?.includes('audio') ||
        activity.activity?.includes('explain'),
      kinesthetic:
        activity.activity?.includes('interactive') ||
        activity.activity?.includes('game'),
      reading:
        activity.activity?.includes('text') ||
        activity.activity?.includes('read'),
    };

    Object.entries(styleIndicators).forEach(([style, indicator]) => {
      if (indicator) {
        model.learningStyleAnalysis[style].activities += 1;
        model.learningStyleAnalysis[style].score += activity.performance;
      }
    });

    // Update preferred learning style
    const styles = Object.entries(model.learningStyleAnalysis);
    const bestStyle = styles.reduce(
      (best, [style, data]) => {
        const avgScore = data.activities > 0 ? data.score / data.activities : 0;
        return avgScore > best.score ? { style, score: avgScore } : best;
      },
      { style: 'visual', score: 0 }
    );

    model.profile.learningStyle = bestStyle.style;
  }

  async persistUserModel(userId, model) {
    // Import storage functions dynamically to avoid circular dependencies
    const { saveUserModel } = await import('./storage.js');
    await saveUserModel(userId, model);
  }

  updateStatistics(model, activityData) {
    model.statistics.totalSessions += 1;
    model.statistics.totalTimeSpent += activityData.timeSpent || 0;

    // Update average score (weighted moving average)
    const weight = 0.1; // Recent activities have more weight
    model.statistics.averageScore =
      model.statistics.averageScore * (1 - weight) +
      activityData.score * weight;

    // Update streaks
    if (activityData.score >= 0.7) {
      // Consider 70%+ as success
      model.statistics.currentStreak += 1;
      model.statistics.longestStreak = Math.max(
        model.statistics.longestStreak,
        model.statistics.currentStreak
      );
    } else {
      model.statistics.currentStreak = 0;
    }
  }

  updateCognitiveProfile(model, metrics) {
    // Update cognitive metrics based on performance patterns
    Object.entries(metrics).forEach(([metric, value]) => {
      if (model.cognitiveProfile[metric] !== undefined) {
        // Smooth update
        const alpha = 0.2; // Learning rate
        model.cognitiveProfile[metric] =
          model.cognitiveProfile[metric] * (1 - alpha) + value * alpha;
      }
    });
  }

  calculateDerivedMetrics(model) {
    // Calculate overall ability
    const skillLevels = Object.values(model.skillLevels);
    model.overallAbility =
      skillLevels.reduce((sum, skill) => sum + skill.current, 0) /
      skillLevels.length;

    // Calculate learning velocity (recent improvement rate)
    model.learningVelocity = this.calculateLearningVelocity(
      model.learningHistory
    );

    // Identify strengths and weaknesses with enhanced analysis
    model.strengths = this.identifyStrengths(model.skillLevels);
    model.weaknesses = this.identifyWeaknesses(model.skillLevels);
    model.skillGaps = this.identifySkillGaps(model);
    model.conceptWeaknesses = this.identifyConceptWeaknesses(model);

    // Calculate engagement score
    model.engagementScore = this.calculateEngagement(model.learningHistory);

    // Predict future performance
    model.predictedPerformance = this.predictPerformance(model);

    // Calculate cognitive load preferences
    model.cognitiveLoadProfile = this.calculateCognitiveLoadProfile(model);

    // Identify learning patterns
    model.learningPatterns = this.identifyLearningPatterns(model);

    // Calculate mastery levels
    model.masteryLevels = this.calculateMasteryLevels(model);
  }

  identifySkillGaps(model) {
    const gaps = [];

    Object.entries(model.skillLevels).forEach(([skillId, skill]) => {
      const gap = skill.target - skill.current;
      if (gap > 0.2) {
        // Gap larger than 20%
        gaps.push({
          skillId,
          currentLevel: skill.current,
          targetLevel: skill.target,
          gap: gap,
          priority: this.calculateGapPriority(skill, model),
          estimatedTimeToClose: this.estimateTimeToCloseGap(skill, gap),
        });
      }
    });

    return gaps.sort((a, b) => b.priority - a.priority);
  }

  calculateGapPriority(skill, model) {
    let priority = 0;

    // Higher priority for skills that block other learning
    const dependents = this.findSkillDependents(skill.skillId, model);
    priority += dependents.length * 10;

    // Higher priority for recently declining skills
    if (skill.trajectory === 'declining') priority += 20;

    // Higher priority for skills with low confidence
    priority += (1 - skill.confidence) * 15;

    return priority;
  }

  findSkillDependents(skillId, model) {
    // Find skills that depend on this skill
    const dependents = [];
    Object.keys(model.skillLevels).forEach((otherSkillId) => {
      if (
        otherSkillId !== skillId &&
        this.skillsAreRelated(skillId, otherSkillId)
      ) {
        dependents.push(otherSkillId);
      }
    });
    return dependents;
  }

  skillsAreRelated(skill1, skill2) {
    // Simple relatedness check based on category
    const category1 = skill1.split('.')[0];
    const category2 = skill2.split('.')[0];
    return category1 === category2;
  }

  estimateTimeToCloseGap(skill, gap) {
    // Estimate based on learning velocity and current level
    const baseTime = gap * 10; // 10 sessions per 0.1 gap
    const velocityFactor =
      skill.learningVelocity > 0 ? 1 / (1 + skill.learningVelocity) : 1.5;
    const levelFactor = skill.current < 0.3 ? 1.5 : 1; // Harder for beginners

    return Math.ceil(baseTime * velocityFactor * levelFactor);
  }

  identifyConceptWeaknesses(model) {
    if (!model.conceptMastery) return [];

    const weaknesses = [];

    model.conceptMastery.forEach((mastery, concept) => {
      if (mastery.masteryLevel < 0.6) {
        weaknesses.push({
          concept,
          masteryLevel: mastery.masteryLevel,
          attempts: mastery.attempts,
          commonErrors: mastery.commonErrors.slice(0, 3),
          lastAttempt: mastery.lastAttempt,
          priority: this.calculateConceptPriority(mastery, concept),
        });
      }
    });

    return weaknesses.sort((a, b) => b.priority - a.priority);
  }

  calculateConceptPriority(mastery, concept) {
    let priority = 0;

    // Higher priority for frequently encountered concepts with low mastery
    priority += mastery.attempts * (1 - mastery.masteryLevel) * 10;

    // Higher priority for concepts with many errors
    priority +=
      mastery.commonErrors.reduce((sum, error) => sum + error.count, 0) * 5;

    // Recency bonus
    const daysSinceLastAttempt =
      (Date.now() - new Date(mastery.lastAttempt)) / (1000 * 60 * 60 * 24);
    if (daysSinceLastAttempt < 7) priority += 15;

    return priority;
  }

  calculateCognitiveLoadProfile(model) {
    const recentActivities = model.learningHistory.slice(-20);
    if (recentActivities.length < 5)
      return { optimalLoad: 'medium', pattern: 'insufficient_data' };

    const loadData = recentActivities
      .filter((activity) => activity.cognitiveLoad)
      .map((activity) => ({
        load: activity.cognitiveLoad,
        performance: activity.performance,
        timeSpent: activity.timeSpent,
      }));

    if (loadData.length < 3)
      return { optimalLoad: 'medium', pattern: 'unknown' };

    // Analyze performance vs load relationship
    const highLoadPerformance = loadData
      .filter((d) => d.load > 0.7)
      .map((d) => d.performance);
    const lowLoadPerformance = loadData
      .filter((d) => d.load < 0.4)
      .map((d) => d.performance);

    const avgHighLoadPerf =
      highLoadPerformance.reduce((sum, p) => sum + p, 0) /
      highLoadPerformance.length;
    const avgLowLoadPerf =
      lowLoadPerformance.reduce((sum, p) => sum + p, 0) /
      lowLoadPerformance.length;

    if (avgHighLoadPerf > avgLowLoadPerf + 0.1) {
      return { optimalLoad: 'high', pattern: 'thrives_under_pressure' };
    } else if (avgLowLoadPerf > avgHighLoadPerf + 0.1) {
      return { optimalLoad: 'low', pattern: 'needs_structured_learning' };
    } else {
      return { optimalLoad: 'medium', pattern: 'balanced_learner' };
    }
  }

  identifyLearningPatterns(model) {
    const patterns = {
      timeOfDay: this.analyzeTimeOfDayPatterns(model),
      sessionLength: this.analyzeSessionLengthPatterns(model),
      questionType: this.analyzeQuestionTypePreferences(model),
      errorRecovery: this.analyzeErrorRecoveryPatterns(model),
    };

    return patterns;
  }

  analyzeTimeOfDayPatterns(model) {
    const activities = model.learningHistory.slice(-30);
    const hourPerformance = new Map();

    activities.forEach((activity) => {
      const hour = new Date(activity.timestamp).getHours();
      if (!hourPerformance.has(hour)) {
        hourPerformance.set(hour, { performances: [], avgPerformance: 0 });
      }
      hourPerformance.get(hour).performances.push(activity.performance);
    });

    // Calculate average performance by hour
    hourPerformance.forEach((data, hour) => {
      data.avgPerformance =
        data.performances.reduce((sum, p) => sum + p, 0) /
        data.performances.length;
    });

    // Find best and worst hours
    let bestHour = null;
    let worstHour = null;
    let bestPerformance = -1;
    let worstPerformance = 2;

    hourPerformance.forEach((data, hour) => {
      if (data.avgPerformance > bestPerformance) {
        bestPerformance = data.avgPerformance;
        bestHour = hour;
      }
      if (data.avgPerformance < worstPerformance) {
        worstPerformance = data.avgPerformance;
        worstHour = hour;
      }
    });

    return {
      bestHour,
      worstHour,
      performanceDifference: bestPerformance - worstPerformance,
      recommendation: bestHour ? `Best learning time: ${bestHour}:00` : null,
    };
  }

  analyzeSessionLengthPatterns(model) {
    const activities = model.learningHistory.slice(-20);
    const lengthPerformance = activities.map((activity) => ({
      length: activity.timeSpent,
      performance: activity.performance,
    }));

    if (lengthPerformance.length < 5)
      return { optimalLength: 30, pattern: 'insufficient_data' };

    // Group by length ranges
    const ranges = [
      { min: 0, max: 15, performances: [] },
      { min: 15, max: 30, performances: [] },
      { min: 30, max: 45, performances: [] },
      { min: 45, max: 60, performances: [] },
      { min: 60, max: 120, performances: [] },
    ];

    lengthPerformance.forEach((item) => {
      const range = ranges.find(
        (r) => item.length >= r.min && item.length < r.max
      );
      if (range) range.performances.push(item.performance);
    });

    // Find range with highest average performance
    let bestRange = null;
    let bestAvgPerformance = -1;

    ranges.forEach((range) => {
      if (range.performances.length >= 2) {
        const avgPerf =
          range.performances.reduce((sum, p) => sum + p, 0) /
          range.performances.length;
        if (avgPerf > bestAvgPerformance) {
          bestAvgPerformance = avgPerf;
          bestRange = range;
        }
      }
    });

    return {
      optimalLength: bestRange ? (bestRange.min + bestRange.max) / 2 : 30,
      pattern: bestRange ? 'identified' : 'no_clear_pattern',
    };
  }

  analyzeQuestionTypePreferences(model) {
    const activities = model.learningHistory.slice(-30);
    const typePerformance = new Map();

    activities.forEach((activity) => {
      if (activity.questionTypes) {
        activity.questionTypes.forEach((type) => {
          if (!typePerformance.has(type)) {
            typePerformance.set(type, { performances: [], avgPerformance: 0 });
          }
          typePerformance.get(type).performances.push(activity.performance);
        });
      }
    });

    // Calculate averages
    typePerformance.forEach((data, type) => {
      if (data.performances.length > 0) {
        data.avgPerformance =
          data.performances.reduce((sum, p) => sum + p, 0) /
          data.performances.length;
      }
    });

    // Find preferred and challenging types
    const sorted = Array.from(typePerformance.entries()).sort(
      (a, b) => b[1].avgPerformance - a[1].avgPerformance
    );

    return {
      preferred: sorted[0]?.[0] || null,
      challenging: sorted[sorted.length - 1]?.[0] || null,
      preferences: Object.fromEntries(typePerformance),
    };
  }

  analyzeErrorRecoveryPatterns(model) {
    const activities = model.learningHistory.slice(-20);
    const recoveryPatterns = [];

    for (let i = 1; i < activities.length; i++) {
      const prev = activities[i - 1];
      const current = activities[i];

      if (prev.performance < 0.6 && current.performance >= 0.7) {
        recoveryPatterns.push({
          fromScore: prev.performance,
          toScore: current.performance,
          timeBetween: new Date(current.timestamp) - new Date(prev.timestamp),
          activities: [prev.activity, current.activity],
        });
      }
    }

    const avgImprovement =
      recoveryPatterns.length > 0
        ? recoveryPatterns.reduce(
            (sum, p) => sum + (p.toScore - p.fromScore),
            0
          ) / recoveryPatterns.length
        : 0;

    return {
      recoveryRate:
        recoveryPatterns.length / Math.max(1, activities.length - 1),
      avgImprovement,
      patterns: recoveryPatterns.slice(0, 5),
    };
  }

  calculateMasteryLevels(model) {
    const mastery = {
      novice: 0,
      developing: 0,
      proficient: 0,
      master: 0,
    };

    Object.values(model.skillLevels).forEach((skill) => {
      if (skill.current < 0.4) mastery.novice++;
      else if (skill.current < 0.6) mastery.developing++;
      else if (skill.current < 0.8) mastery.proficient++;
      else mastery.master++;
    });

    return mastery;
  }

  calculateLearningVelocity(history) {
    if (history.length < 5) return 0;

    const recentHistory = history.slice(-10); // Last 10 activities
    const improvements = [];

    for (let i = 1; i < recentHistory.length; i++) {
      improvements.push(
        recentHistory[i].performance - recentHistory[i - 1].performance
      );
    }

    return (
      improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length
    );
  }

  identifyStrengths(skillLevels) {
    return Object.entries(skillLevels)
      .filter(([_, skill]) => skill.current >= 0.8)
      .map(([skillId, _]) => skillId);
  }

  identifyWeaknesses(skillLevels) {
    return Object.entries(skillLevels)
      .filter(([_, skill]) => skill.current < 0.6)
      .map(([skillId, _]) => skillId);
  }

  calculateEngagement(history) {
    if (history.length < 3) return 0.5;

    const recentHistory = history.slice(-7); // Last 7 days
    const avgTimeSpent =
      recentHistory.reduce((sum, h) => sum + h.timeSpent, 0) /
      recentHistory.length;
    const consistency =
      1 - this.calculateVariance(recentHistory.map((h) => h.timeSpent));

    return Math.min(1, (avgTimeSpent / 30) * consistency); // Normalize to 0-1
  }

  predictPerformance(model) {
    // Simple prediction based on current ability and learning velocity
    const basePrediction = model.overallAbility;
    const velocityAdjustment = model.learningVelocity * 0.1; // Small adjustment for trend

    return Math.max(0, Math.min(1, basePrediction + velocityAdjustment));
  }

  calculateVariance(values) {
    if (values.length < 2) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, sq) => sum + sq, 0) / squaredDiffs.length;
  }

  // Generate ML-powered predictions for user model
  async generateMLPredictions(model) {
    if (!this.mlInitialized || model.learningHistory.length < 10) {
      return null;
    }

    try {
      const predictions = {};

      // Predict next performance
      const performancePrediction = await mlManager.predictPerformance(
        model.learningHistory
      );
      if (performancePrediction !== null) {
        predictions.nextPerformance = {
          value: performancePrediction,
          confidence: this.calculatePredictionConfidence(
            model.learningHistory,
            performancePrediction
          ),
          basedOn: 'recent learning patterns and skill progression',
        };
      }

      // Predict optimal learning time
      predictions.optimalLearningTime = this.predictOptimalLearningTime(model);

      // Predict content difficulty preferences
      predictions.preferredDifficulty = this.predictPreferredDifficulty(model);

      // Generate learning path recommendations
      predictions.learningPath = this.generateMLLearningPath(model);

      return predictions;
    } catch (error) {
      console.warn('ML prediction generation failed:', error);
      return null;
    }
  }

  // Calculate confidence in performance prediction
  calculatePredictionConfidence(history, prediction) {
    if (history.length < 5) return 0.5;

    const recentPerformances = history.slice(-10).map((h) => h.performance);
    const mean =
      recentPerformances.reduce((sum, p) => sum + p, 0) /
      recentPerformances.length;
    const variance =
      recentPerformances.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) /
      recentPerformances.length;
    const stdDev = Math.sqrt(variance);

    // Higher confidence if prediction is close to recent mean and variance is low
    const distanceFromMean = Math.abs(prediction - mean);
    const confidence = Math.max(0.1, 1 - distanceFromMean / (stdDev + 0.1));

    return Math.min(1, confidence);
  }

  // Predict optimal learning time based on patterns
  predictOptimalLearningTime(model) {
    const timePatterns = model.learningPatterns?.timeOfDay;
    if (!timePatterns) return null;

    return {
      bestHour: timePatterns.bestHour,
      confidence: timePatterns.performanceDifference > 0.1 ? 0.8 : 0.6,
      reason:
        timePatterns.recommendation ||
        'Based on your historical performance patterns',
    };
  }

  // Predict preferred difficulty level
  predictPreferredDifficulty(model) {
    const recentActivities = model.learningHistory.slice(-20);
    if (recentActivities.length < 5) return null;

    const difficulties = recentActivities.map((a) => a.difficulty || 3);
    const performances = recentActivities.map((a) => a.performance);

    // Find difficulty level with highest average performance
    const difficultyPerformance = {};
    difficulties.forEach((diff, i) => {
      if (!difficultyPerformance[diff]) {
        difficultyPerformance[diff] = [];
      }
      difficultyPerformance[diff].push(performances[i]);
    });

    let bestDifficulty = 3;
    let bestAvgPerformance = 0;

    Object.entries(difficultyPerformance).forEach(([diff, perfs]) => {
      const avgPerf = perfs.reduce((sum, p) => sum + p, 0) / perfs.length;
      if (avgPerf > bestAvgPerformance) {
        bestAvgPerformance = avgPerf;
        bestDifficulty = parseInt(diff);
      }
    });

    return {
      level: bestDifficulty,
      confidence: difficultyPerformance[bestDifficulty]?.length > 3 ? 0.7 : 0.5,
      reason: `You perform best with difficulty level ${bestDifficulty}`,
    };
  }

  // Generate ML-enhanced learning path
  generateMLLearningPath(model) {
    const path = {
      immediateFocus: [],
      shortTerm: [],
      longTerm: [],
      reasoning: [],
    };

    // Immediate focus: critical weaknesses
    if (model.skillGaps) {
      const criticalGaps = model.skillGaps.filter((gap) => gap.priority > 15);
      path.immediateFocus = criticalGaps.slice(0, 3).map((gap) => ({
        skill: gap.skillId,
        priority: gap.priority,
        estimatedTime: gap.estimatedTimeToClose,
      }));
    }

    // Short-term: building on strengths
    if (model.strengths) {
      path.shortTerm = model.strengths.slice(0, 2).map((strength) => ({
        skill: strength,
        action: 'advance',
        reason: 'Build on existing strengths',
      }));
    }

    // Long-term: comprehensive development
    path.longTerm = [
      {
        goal: 'Improve overall ability',
        currentLevel: model.overallAbility,
        targetLevel: Math.min(1, model.overallAbility + 0.2),
        timeline: '3-6 months',
      },
    ];

    path.reasoning = [
      'Based on your learning velocity and skill gaps',
      'Optimized for your learning style and preferences',
      'Considers your cognitive profile and engagement patterns',
    ];

    return path;
  }

  // Get personalized recommendations with ML enhancement
  getRecommendations(userId, context = {}) {
    const model = this.models.get(userId);
    if (!model) return [];

    const recommendations = [];

    // ML-enhanced recommendations
    if (model.mlPredictions) {
      // Performance-based recommendations
      if (model.mlPredictions.nextPerformance) {
        const predictedPerf = model.mlPredictions.nextPerformance;
        if (predictedPerf.value < 0.6) {
          recommendations.push({
            type: 'performance_boost',
            priority: 'high',
            reason: `ML predicts ${Math.round(predictedPerf.value * 100)}% performance - focus on fundamentals`,
            confidence: predictedPerf.confidence,
          });
        }
      }

      // Time-based recommendations
      if (model.mlPredictions.optimalLearningTime) {
        const optimalTime = model.mlPredictions.optimalLearningTime;
        if (optimalTime.bestHour) {
          recommendations.push({
            type: 'optimal_timing',
            suggestion: `Study at ${optimalTime.bestHour}:00`,
            reason: optimalTime.reason,
            confidence: optimalTime.confidence,
          });
        }
      }

      // Difficulty-based recommendations
      if (model.mlPredictions.preferredDifficulty) {
        const prefDiff = model.mlPredictions.preferredDifficulty;
        recommendations.push({
          type: 'difficulty_adjustment',
          suggestion: `Focus on difficulty level ${prefDiff.level}`,
          reason: prefDiff.reason,
          confidence: prefDiff.confidence,
        });
      }
    }

    // Traditional recommendations (fallback/enhancement)
    // Recommend based on weaknesses
    if (model.weaknesses.length > 0) {
      recommendations.push({
        type: 'remediation',
        skills: model.weaknesses.slice(0, 2),
        reason: 'Focus on improving weak areas',
      });
    }

    // Recommend based on learning velocity
    if (model.learningVelocity < -0.05) {
      // Declining performance
      recommendations.push({
        type: 'review',
        reason: 'Recent performance suggests need for review',
      });
    }

    // Recommend based on engagement
    if (model.engagementScore < 0.3) {
      recommendations.push({
        type: 'engagement',
        reason: 'Try different activity types to increase engagement',
      });
    }

    // Recommend based on cognitive profile
    if (model.cognitiveProfile.attentionSpan < 40) {
      recommendations.push({
        type: 'pacing',
        suggestion: 'shorter_sessions',
        reason: 'Shorter sessions may improve focus',
      });
    }

    return recommendations;
  }

  // Train ML models with accumulated data
  async trainMLModels(contentData = []) {
    if (!this.mlInitialized) {
      await this.initializeML();
    }

    try {
      // Collect training data from all users
      const allUserHistories = [];
      this.models.forEach((model) => {
        if (model.learningHistory && model.learningHistory.length > 10) {
          allUserHistories.push(...model.learningHistory);
        }
      });

      if (allUserHistories.length >= 50) {
        console.log(
          `Training performance model with ${allUserHistories.length} data points`
        );
        await mlManager.trainPerformanceModel(allUserHistories);
        await mlManager.saveModel('performancePrediction');
      }

      if (contentData.length >= 20) {
        console.log(
          `Training difficulty model with ${contentData.length} content items`
        );
        await mlManager.trainDifficultyModel(contentData);
        await mlManager.saveModel('difficultyClassification');
      }

      return {
        success: true,
        performanceDataPoints: allUserHistories.length,
        contentItems: contentData.length,
      };
    } catch (error) {
      console.error('ML training failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Get ML model status
  getMLStatus() {
    return {
      initialized: this.mlInitialized,
      models: mlManager.getModelStatus(),
      trainingDataAvailable: this.models.size > 0,
    };
  }

  // Advanced AI Methods

  // Process conversational input with advanced NLP
  async processConversation(userId, message, context = {}) {
    await this.initializeAdvancedAI();

    const userModel = await this.getUserModel(userId);
    const conversationContext = {
      userModel: userModel,
      sessionHistory: context.sessionHistory || [],
      currentTopic: context.currentTopic,
      learningGoals: context.learningGoals,
    };

    try {
      const result = await this.conversationEngine.processMessage(
        message,
        conversationContext
      );

      // Update user model based on conversation
      await this.updateFromConversation(userId, message, result);

      return result;
    } catch (error) {
      console.error('Conversation processing failed:', error);
      return {
        response: {
          text: "I'm having trouble processing that right now. Could you try rephrasing your question?",
          type: 'error',
        },
        analysis: { intent: 'error' },
      };
    }
  }

  // Generate intelligent questions using advanced NLP
  async generateIntelligentQuestions(userId, topic, count = 5) {
    await this.initializeAdvancedAI();

    const userModel = await this.getUserModel(userId);
    const userContext = {
      skillLevel: this.getUserSkillLevel(userModel),
      learningGoal: userModel.profile?.learningGoal || 'concept_mastery',
      weaknesses: userModel.weaknesses || [],
      learningStyle: userModel.profile?.learningStyle || 'visual',
    };

    try {
      const questions = this.nlpEngine.generateQuestions([topic], userContext);
      return questions;
    } catch (error) {
      console.error('Question generation failed:', error);
      return [];
    }
  }

  // Create optimized learning plan using advanced planning
  async createOptimizedLearningPlan(
    userId,
    availableContent,
    constraints = {}
  ) {
    await this.initializeAdvancedAI();

    const userModel = await this.getUserModel(userId);

    try {
      const plan = await this.learningPlanner.generateOptimalLearningPath(
        userModel,
        availableContent,
        constraints
      );

      // Generate detailed schedule
      const schedule = this.learningPlanner.generateStudySchedule(
        plan,
        constraints
      );

      return {
        plan: plan,
        schedule: schedule,
        reasoning:
          'Optimized using constraint satisfaction and shortest path algorithms',
      };
    } catch (error) {
      console.error('Learning plan generation failed:', error);
      return null;
    }
  }

  // Perform logical reasoning on educational queries
  async performEducationalReasoning(userId, query, content = []) {
    await this.initializeAdvancedAI();

    const userModel = await this.getUserModel(userId);

    try {
      // Build knowledge base from content and user data
      const knowledgeBase = this.knowledgeReasoner.buildKnowledgeBase(
        content,
        userModel
      );

      // Perform reasoning
      const reasoning = this.knowledgeReasoner.performLogicalReasoning(
        query,
        knowledgeBase
      );

      return reasoning;
    } catch (error) {
      console.error('Educational reasoning failed:', error);
      return null;
    }
  }

  // Analyze learning patterns with advanced AI
  async analyzeLearningPatterns(userId) {
    await this.initializeAdvancedAI();

    const userModel = await this.getUserModel(userId);

    try {
      const patterns = {
        cognitive: this.analyzeCognitivePatterns(userModel),
        temporal: this.analyzeTemporalPatterns(userModel),
        conceptual: this.analyzeConceptualPatterns(userModel),
        emotional: this.analyzeEmotionalPatterns(userModel),
      };

      return patterns;
    } catch (error) {
      console.error('Pattern analysis failed:', error);
      return {};
    }
  }

  // Helper methods for advanced AI features

  // Update user model from conversation
  async updateFromConversation(userId, message, conversationResult) {
    const userModel = await this.getUserModel(userId);

    // Add conversation to learning history
    const conversationActivity = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      activity: 'conversation',
      topic: conversationResult.analysis?.topics?.[0] || 'general',
      performance: conversationResult.analysis?.confidence || 0.5,
      timeSpent: 1, // Assume 1 minute conversations
      cognitiveLoad: 0.3, // Conversations are typically lower cognitive load
      engagement:
        conversationResult.analysis?.emotion === 'excited' ? 0.8 : 0.5,
      confidence: conversationResult.analysis?.confidence || 0.5,
      conversationData: {
        intent: conversationResult.analysis?.intent,
        emotion: conversationResult.analysis?.emotion,
        complexity: conversationResult.analysis?.complexity,
      },
    };

    userModel.learningHistory.push(conversationActivity);

    // Keep history manageable
    if (userModel.learningHistory.length > 1000) {
      userModel.learningHistory = userModel.learningHistory.slice(-500);
    }

    // Update learning style based on conversation patterns
    this.updateLearningStyleFromConversation(userModel, conversationResult);

    await this.persistUserModel(userId, userModel);
  }

  // Update learning style from conversation analysis
  updateLearningStyleFromConversation(userModel, conversationResult) {
    const analysis = conversationResult.analysis;

    if (analysis?.intent === 'learning' && analysis?.emotion === 'excited') {
      // User responds well to conversational learning
      userModel.profile.learningStyle = 'auditory';
    } else if (
      analysis?.complexity === 'complex' &&
      analysis?.confidence > 0.7
    ) {
      // User handles complex topics well
      userModel.profile.learningStyle = 'reading';
    }
  }

  // Get user's overall skill level
  getUserSkillLevel(userModel) {
    const skillLevels = Object.values(userModel.skillLevels || {});
    if (skillLevels.length === 0) return 'intermediate';

    const avgSkill =
      skillLevels.reduce((sum, skill) => sum + skill.current, 0) /
      skillLevels.length;

    if (avgSkill < 0.4) return 'beginner';
    if (avgSkill < 0.7) return 'intermediate';
    return 'advanced';
  }

  // Analyze cognitive patterns
  analyzeCognitivePatterns(userModel) {
    const history = userModel.learningHistory || [];
    if (history.length < 5) return { pattern: 'insufficient_data' };

    const questionTypes = history
      .filter((h) => h.conversationData?.intent)
      .map((h) => h.conversationData.intent);

    const typeCounts = {};
    questionTypes.forEach((type) => {
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const dominantType =
      Object.entries(typeCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      'mixed';

    return {
      dominantQuestionType: dominantType,
      cognitiveStrengths: this.inferCognitiveStrengths(typeCounts),
      learningApproach: this.inferLearningApproach(dominantType),
    };
  }

  // Analyze temporal patterns
  analyzeTemporalPatterns(userModel) {
    const history = userModel.learningHistory || [];
    if (history.length < 10) return { pattern: 'insufficient_data' };

    const hourPerformance = {};
    history.forEach((activity) => {
      const hour = new Date(activity.timestamp).getHours();
      if (!hourPerformance[hour]) {
        hourPerformance[hour] = { performances: [], avgPerformance: 0 };
      }
      hourPerformance[hour].performances.push(activity.performance);
    });

    // Calculate averages
    Object.keys(hourPerformance).forEach((hour) => {
      const data = hourPerformance[hour];
      data.avgPerformance =
        data.performances.reduce((sum, p) => sum + p, 0) /
        data.performances.length;
    });

    const bestHour = Object.entries(hourPerformance).sort(
      ([, a], [, b]) => b.avgPerformance - a.avgPerformance
    )[0]?.[0];

    return {
      optimalStudyHour: bestHour ? parseInt(bestHour) : null,
      studyConsistency: this.calculateConsistency(hourPerformance),
      peakPerformanceHours: Object.entries(hourPerformance)
        .filter(([, data]) => data.avgPerformance > 0.7)
        .map(([hour]) => parseInt(hour)),
    };
  }

  // Analyze conceptual patterns
  analyzeConceptualPatterns(userModel) {
    const history = userModel.learningHistory || [];
    const conceptInteractions = {};

    history.forEach((activity) => {
      const concept = activity.topic || activity.concept;
      if (concept) {
        if (!conceptInteractions[concept]) {
          conceptInteractions[concept] = { count: 0, performances: [] };
        }
        conceptInteractions[concept].count++;
        conceptInteractions[concept].performances.push(activity.performance);
      }
    });

    const conceptMastery = Object.entries(conceptInteractions).map(
      ([concept, data]) => ({
        concept,
        interactions: data.count,
        avgPerformance:
          data.performances.reduce((sum, p) => sum + p, 0) /
          data.performances.length,
        masteryLevel: this.calculateConceptMastery(data.performances),
      })
    );

    return {
      conceptMastery: conceptMastery.sort(
        (a, b) => b.avgPerformance - a.avgPerformance
      ),
      learningProgression: this.analyzeProgression(conceptMastery),
      knowledgeGaps: conceptMastery.filter((c) => c.avgPerformance < 0.6),
    };
  }

  // Analyze emotional patterns
  analyzeEmotionalPatterns(userModel) {
    const history = userModel.learningHistory || [];
    const emotionalData = history
      .filter((h) => h.conversationData?.emotion)
      .map((h) => ({
        emotion: h.conversationData.emotion,
        performance: h.performance,
        timestamp: h.timestamp,
      }));

    if (emotionalData.length < 3) return { pattern: 'insufficient_data' };

    const emotionPerformance = {};
    emotionalData.forEach((data) => {
      if (!emotionPerformance[data.emotion]) {
        emotionPerformance[data.emotion] = [];
      }
      emotionPerformance[data.emotion].push(data.performance);
    });

    const emotionAverages = Object.entries(emotionPerformance).map(
      ([emotion, performances]) => ({
        emotion,
        avgPerformance:
          performances.reduce((sum, p) => sum + p, 0) / performances.length,
        frequency: performances.length,
      })
    );

    return {
      emotionalTriggers: emotionAverages.sort(
        (a, b) => b.avgPerformance - a.avgPerformance
      ),
      motivationalFactors: this.identifyMotivationalFactors(emotionAverages),
      emotionalResilience: this.calculateEmotionalResilience(emotionalData),
    };
  }

  // Helper methods for pattern analysis
  inferCognitiveStrengths(typeCounts) {
    const strengths = [];

    if (typeCounts.explanation > typeCounts.application) {
      strengths.push('conceptual_understanding');
    }
    if (typeCounts.application > typeCounts.explanation) {
      strengths.push('practical_application');
    }
    if (typeCounts.question_generation > 2) {
      strengths.push('self_directed_learning');
    }

    return strengths;
  }

  inferLearningApproach(dominantType) {
    const approaches = {
      explanation: 'theory_focused',
      application: 'practice_focused',
      question_generation: 'inquiry_based',
      assessment: 'performance_driven',
    };

    return approaches[dominantType] || 'balanced';
  }

  calculateConsistency(hourPerformance) {
    const performances = Object.values(hourPerformance).map(
      (data) => data.avgPerformance
    );
    if (performances.length < 2) return 0;

    const mean =
      performances.reduce((sum, p) => sum + p, 0) / performances.length;
    const variance =
      performances.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) /
      performances.length;

    return Math.max(0, 1 - Math.sqrt(variance)); // Higher consistency = lower variance
  }

  calculateConceptMastery(performances) {
    if (performances.length === 0) return 0;

    const avgPerformance =
      performances.reduce((sum, p) => sum + p, 0) / performances.length;
    const consistency = 1 - this.calculateVariance(performances);

    return (avgPerformance + consistency) / 2; // Balance performance and consistency
  }

  analyzeProgression(conceptMastery) {
    if (conceptMastery.length < 2) return 'insufficient_data';

    const sorted = conceptMastery.sort(
      (a, b) => b.avgPerformance - a.avgPerformance
    );
    const topPerformers = sorted.slice(0, Math.ceil(sorted.length * 0.3));
    const lowPerformers = sorted.slice(-Math.ceil(sorted.length * 0.3));

    return {
      strengthAreas: topPerformers.map((c) => c.concept),
      improvementAreas: lowPerformers.map((c) => c.concept),
      overallTrajectory: this.calculateTrajectory(sorted),
    };
  }

  calculateTrajectory(sortedConcepts) {
    if (sortedConcepts.length < 3) return 'stable';

    const firstThird = sortedConcepts.slice(
      0,
      Math.floor(sortedConcepts.length / 3)
    );
    const lastThird = sortedConcepts.slice(
      -Math.floor(sortedConcepts.length / 3)
    );

    const firstAvg =
      firstThird.reduce((sum, c) => sum + c.avgPerformance, 0) /
      firstThird.length;
    const lastAvg =
      lastThird.reduce((sum, c) => sum + c.avgPerformance, 0) /
      lastThird.length;

    if (firstAvg > lastAvg + 0.2) return 'strong_performer';
    if (lastAvg > firstAvg + 0.2) return 'needs_improvement';
    return 'balanced';
  }

  identifyMotivationalFactors(emotionAverages) {
    const factors = [];

    const excitedPerf =
      emotionAverages.find((e) => e.emotion === 'excited')?.avgPerformance || 0;
    const neutralPerf =
      emotionAverages.find((e) => e.emotion === 'neutral')?.avgPerformance || 0;

    if (excitedPerf > neutralPerf + 0.1) {
      factors.push('emotional_engagement');
    }

    if (
      emotionAverages.some((e) => e.emotion === 'frustrated' && e.frequency > 2)
    ) {
      factors.push('challenge_seeking');
    }

    return factors;
  }

  calculateEmotionalResilience(emotionalData) {
    const negativeEmotions = emotionalData.filter((d) =>
      ['frustrated', 'disengaged'].includes(d.emotion)
    );
    const recoveryPatterns = [];

    for (let i = 1; i < emotionalData.length; i++) {
      const prev = emotionalData[i - 1];
      const current = emotionalData[i];

      if (
        ['frustrated', 'disengaged'].includes(prev.emotion) &&
        ['excited', 'neutral'].includes(current.emotion)
      ) {
        recoveryPatterns.push({
          from: prev.emotion,
          to: current.emotion,
          timeDiff: new Date(current.timestamp) - new Date(prev.timestamp),
        });
      }
    }

    return {
      recoveryRate:
        recoveryPatterns.length / Math.max(1, negativeEmotions.length),
      avgRecoveryTime:
        recoveryPatterns.length > 0
          ? recoveryPatterns.reduce((sum, p) => sum + p.timeDiff, 0) /
            recoveryPatterns.length
          : null,
    };
  }

  // Export model for persistence
  exportModel(userId) {
    return JSON.stringify(this.models.get(userId), null, 2);
  }

  // Import model from persistence
  importModel(userId, modelData) {
    try {
      const model = JSON.parse(modelData);
      this.models.set(userId, model);
      return true;
    } catch (error) {
      console.error('Failed to import user model:', error);
      return false;
    }
  }
}

// Create singleton instance
export const userModelManager = new UserModelManager();
