// machineLearning.js - Machine Learning utilities for MindTutor using TensorFlow.js

import * as tf from '@tensorflow/tfjs';

/**
 * Machine Learning Manager for MindTutor
 * Handles model training, inference, and management for educational analytics
 */
export class MLManager {
  constructor() {
    this.models = new Map();
    this.isInitialized = false;
    this.trainingData = {
      performance: [],
      contentDifficulty: [],
      userPatterns: [],
    };
  }

  /**
   * Initialize TensorFlow.js backend
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Set backend to WebGL for better performance
      await tf.setBackend('webgl');
      await tf.ready();
      console.log('TensorFlow.js initialized with backend:', tf.getBackend());
      this.isInitialized = true;
    } catch (error) {
      console.warn('WebGL backend failed, falling back to CPU:', error);
      await tf.setBackend('cpu');
      await tf.ready();
      this.isInitialized = true;
    }
  }

  /**
   * Create and train a linear regression model for performance prediction
   */
  async createPerformancePredictionModel() {
    await this.initialize();

    const model = tf.sequential();
    model.add(
      tf.layers.dense({ inputShape: [5], units: 32, activation: 'relu' })
    );
    model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mse'],
    });

    this.models.set('performancePrediction', model);
    return model;
  }

  /**
   * Create content difficulty classification model
   */
  async createDifficultyClassificationModel() {
    await this.initialize();

    const model = tf.sequential();
    model.add(
      tf.layers.dense({ inputShape: [10], units: 64, activation: 'relu' })
    );
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 5, activation: 'softmax' })); // 5 difficulty levels

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy'],
    });

    this.models.set('difficultyClassification', model);
    return model;
  }

  /**
   * Create user pattern recognition model
   */
  async createUserPatternModel() {
    await this.initialize();

    const model = tf.sequential();
    model.add(
      tf.layers.lstm({
        inputShape: [null, 8],
        units: 64,
        returnSequences: false,
      })
    );
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 4, activation: 'softmax' })); // 4 learning pattern categories

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy'],
    });

    this.models.set('userPattern', model);
    return model;
  }

  /**
   * Prepare training data for performance prediction
   */
  preparePerformanceTrainingData(userHistory) {
    const features = [];
    const labels = [];

    // Use sliding window of recent activities
    for (let i = 5; i < userHistory.length; i++) {
      const window = userHistory.slice(i - 5, i);
      const nextPerformance = userHistory[i]?.performance || 0;

      // Extract features from the window
      const featureVector = [
        window.reduce((sum, act) => sum + act.performance, 0) / window.length, // avg performance
        window.reduce((sum, act) => sum + act.timeSpent, 0) / window.length, // avg time
        window.reduce((sum, act) => sum + (act.difficulty || 3), 0) /
          window.length, // avg difficulty
        window.filter((act) => act.performance >= 0.8).length / window.length, // success rate
        Math.abs(window[window.length - 1].performance - window[0].performance), // performance change
      ];

      features.push(featureVector);
      labels.push([nextPerformance]);
    }

    return { features, labels };
  }

  /**
   * Prepare training data for difficulty classification
   */
  prepareDifficultyTrainingData(contentData) {
    const features = [];
    const labels = [];

    contentData.forEach((content) => {
      if (!content.features || !content.difficulty) return;

      // Extract NLP and structural features
      const featureVector = [
        content.features.wordCount / 1000, // normalized word count
        content.features.avgWordLength,
        content.features.sentenceCount / 50,
        content.features.complexWords / content.features.wordCount,
        content.features.technicalTerms / content.features.wordCount,
        content.features.conceptDensity,
        content.features.readingLevel / 20,
        content.features.questionCount / 10,
        content.features.exampleCount / 5,
        content.features.definitionCount / 10,
      ];

      // One-hot encode difficulty (1-5 scale)
      const difficultyOneHot = new Array(5).fill(0);
      difficultyOneHot[Math.floor(content.difficulty) - 1] = 1;

      features.push(featureVector);
      labels.push(difficultyOneHot);
    });

    return { features, labels };
  }

  /**
   * Train performance prediction model
   */
  async trainPerformanceModel(userHistory) {
    const model = await this.createPerformancePredictionModel();
    const { features, labels } =
      this.preparePerformanceTrainingData(userHistory);

    if (features.length < 10) {
      console.warn('Insufficient training data for performance model');
      return null;
    }

    const xs = tf.tensor2d(features);
    const ys = tf.tensor2d(labels);

    try {
      await model.fit(xs, ys, {
        epochs: 50,
        batchSize: 8,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 10 === 0) {
              console.log(
                `Performance model epoch ${epoch}: loss = ${logs.loss.toFixed(4)}`
              );
            }
          },
        },
      });

      // Clean up tensors
      xs.dispose();
      ys.dispose();

      return model;
    } catch (error) {
      console.error('Error training performance model:', error);
      return null;
    }
  }

  /**
   * Train difficulty classification model
   */
  async trainDifficultyModel(contentData) {
    const model = await this.createDifficultyClassificationModel();
    const { features, labels } =
      this.prepareDifficultyTrainingData(contentData);

    if (features.length < 20) {
      console.warn('Insufficient training data for difficulty model');
      return null;
    }

    const xs = tf.tensor2d(features);
    const ys = tf.tensor2d(labels);

    try {
      await model.fit(xs, ys, {
        epochs: 100,
        batchSize: 16,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 20 === 0) {
              console.log(
                `Difficulty model epoch ${epoch}: accuracy = ${logs.acc.toFixed(4)}`
              );
            }
          },
        },
      });

      xs.dispose();
      ys.dispose();

      return model;
    } catch (error) {
      console.error('Error training difficulty model:', error);
      return null;
    }
  }

  /**
   * Predict user performance
   */
  async predictPerformance(userHistory) {
    const model = this.models.get('performancePrediction');
    if (!model) return null;

    try {
      const recentActivities = userHistory.slice(-5);
      if (recentActivities.length < 5) return null;

      const features = [
        recentActivities.reduce((sum, act) => sum + act.performance, 0) /
          recentActivities.length,
        recentActivities.reduce((sum, act) => sum + act.timeSpent, 0) /
          recentActivities.length,
        recentActivities.reduce((sum, act) => sum + (act.difficulty || 3), 0) /
          recentActivities.length,
        recentActivities.filter((act) => act.performance >= 0.8).length /
          recentActivities.length,
        Math.abs(
          recentActivities[recentActivities.length - 1].performance -
            recentActivities[0].performance
        ),
      ];

      const input = tf.tensor2d([features]);
      const prediction = model.predict(input);
      const result = await prediction.data();

      input.dispose();
      prediction.dispose();

      return result[0];
    } catch (error) {
      console.error('Error predicting performance:', error);
      return null;
    }
  }

  /**
   * Classify content difficulty
   */
  async classifyDifficulty(contentFeatures) {
    const model = this.models.get('difficultyClassification');
    if (!model) return null;

    try {
      const features = [
        contentFeatures.wordCount / 1000,
        contentFeatures.avgWordLength,
        contentFeatures.sentenceCount / 50,
        contentFeatures.complexWords / contentFeatures.wordCount,
        contentFeatures.technicalTerms / contentFeatures.wordCount,
        contentFeatures.conceptDensity,
        contentFeatures.readingLevel / 20,
        contentFeatures.questionCount / 10,
        contentFeatures.exampleCount / 5,
        contentFeatures.definitionCount / 10,
      ];

      const input = tf.tensor2d([features]);
      const prediction = model.predict(input);
      const result = await prediction.data();

      input.dispose();
      prediction.dispose();

      // Return difficulty level (1-5) based on highest probability
      return result.indexOf(Math.max(...result)) + 1;
    } catch (error) {
      console.error('Error classifying difficulty:', error);
      return null;
    }
  }

  /**
   * Generate personalized recommendations using collaborative filtering approach
   */
  generatePersonalizedRecommendations(userModel, availableContent) {
    const recommendations = [];

    // Content-based filtering using user preferences
    const userStrengths = userModel.strengths || [];
    const userWeaknesses = userModel.weaknesses || [];

    availableContent.forEach((content) => {
      let score = 0.5; // Base score

      // Boost content that addresses weaknesses
      if (
        content.skills &&
        userWeaknesses.some((weakness) =>
          content.skills.some((skill) => skill.includes(weakness.split('.')[0]))
        )
      ) {
        score += 0.3;
      }

      // Boost content that matches learning style
      if (content.learningStyle === userModel.profile?.learningStyle) {
        score += 0.2;
      }

      // Adjust based on current skill level
      const contentDifficulty = content.difficulty || 3;
      const userAbility = userModel.overallAbility || 0.5;

      if (Math.abs(contentDifficulty - userAbility * 5) <= 1) {
        score += 0.2; // Appropriate difficulty
      }

      // Consider engagement patterns
      if (userModel.learningPatterns?.timeOfDay?.bestHour) {
        const contentTime = content.suggestedTime;
        if (contentTime === userModel.learningPatterns.timeOfDay.bestHour) {
          score += 0.1;
        }
      }

      recommendations.push({
        contentId: content.id,
        score: Math.min(1, score),
        reasons: this.generateRecommendationReasons(score, content, userModel),
      });
    });

    return recommendations.sort((a, b) => b.score - a.score);
  }

  /**
   * Generate reasons for recommendations
   */
  generateRecommendationReasons(score, content, userModel) {
    const reasons = [];

    if (score > 0.8)
      reasons.push('Highly personalized for your learning needs');
    else if (score > 0.6)
      reasons.push('Good match for your current skill level');

    if (content.difficulty && userModel.overallAbility) {
      const userLevel = Math.floor(userModel.overallAbility * 5);
      if (content.difficulty === userLevel) {
        reasons.push('Appropriate difficulty level');
      }
    }

    if (content.learningStyle === userModel.profile?.learningStyle) {
      reasons.push(
        `Matches your ${userModel.profile.learningStyle} learning style`
      );
    }

    return reasons;
  }

  /**
   * Extract features from text content for ML processing
   */
  extractContentFeatures(text) {
    const words = text.split(/\s+/);
    const sentences = text.split(/[.!?]+/);

    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      avgWordLength:
        words.reduce((sum, word) => sum + word.length, 0) / words.length,
      complexWords: words.filter((word) => word.length > 6).length,
      technicalTerms: this.countTechnicalTerms(text),
      conceptDensity: this.calculateConceptDensity(text),
      readingLevel: this.calculateReadingLevel(text),
      questionCount: (text.match(/\?/g) || []).length,
      exampleCount: (
        text
          .toLowerCase()
          .match(/\b(example|instance|case|such as|for instance)\b/g) || []
      ).length,
      definitionCount: (
        text.toLowerCase().match(/\b(is|are|means|refers to|represents)\b/g) ||
        []
      ).length,
    };
  }

  /**
   * Count technical/scientific terms
   */
  countTechnicalTerms(text) {
    const technicalTerms = [
      'atom',
      'cell',
      'molecule',
      'electron',
      'proton',
      'neutron',
      'energy',
      'force',
      'system',
      'process',
      'structure',
      'function',
      'theory',
      'law',
      'principle',
      'acid',
      'base',
      'reaction',
      'compound',
      'organism',
      'tissue',
      'organ',
    ];

    return technicalTerms.reduce((count, term) => {
      return (
        count +
        (text.toLowerCase().match(new RegExp(`\\b${term}\\b`, 'g')) || [])
          .length
      );
    }, 0);
  }

  /**
   * Calculate concept density (concepts per 100 words)
   */
  calculateConceptDensity(text) {
    // Simple heuristic: count sentences that look like definitions
    const definitionPatterns = [
      /\b(is|are|means|refers to|represents)\b/gi,
      /\b[a-z]+\s+(is|are)\s+[a-z]/gi,
    ];

    let conceptCount = 0;
    definitionPatterns.forEach((pattern) => {
      conceptCount += (text.match(pattern) || []).length;
    });

    return conceptCount / (text.split(/\s+/).length / 100);
  }

  /**
   * Calculate reading level using simple heuristics
   */
  calculateReadingLevel(text) {
    const words = text.split(/\s+/);
    const sentences = text.split(/[.!?]+/);

    const avgWordsPerSentence = words.length / sentences.length;
    const complexWords = words.filter((word) => word.length > 6).length;
    const complexWordRatio = complexWords / words.length;

    // Simple reading level calculation
    let level = 1;
    if (avgWordsPerSentence > 20) level += 1;
    if (complexWordRatio > 0.15) level += 1;
    if (this.countTechnicalTerms(text) > words.length * 0.02) level += 1;

    return Math.min(5, level);
  }

  /**
   * Save model to local storage
   */
  async saveModel(modelName) {
    const model = this.models.get(modelName);
    if (!model) return false;

    try {
      const saveResult = await model.save(`localstorage://${modelName}`);
      console.log(`Model ${modelName} saved successfully`);
      return true;
    } catch (error) {
      console.error(`Error saving model ${modelName}:`, error);
      return false;
    }
  }

  /**
   * Load model from local storage
   */
  async loadModel(modelName) {
    try {
      const model = await tf.loadLayersModel(`localstorage://${modelName}`);
      this.models.set(modelName, model);
      console.log(`Model ${modelName} loaded successfully`);
      return model;
    } catch (error) {
      console.log(`Model ${modelName} not found in storage`);
      return null;
    }
  }

  /**
   * Get model training status and metrics
   */
  getModelStatus() {
    const status = {};

    this.models.forEach((model, name) => {
      status[name] = {
        loaded: true,
        layers: model.layers.length,
        inputShape: model.inputs[0].shape,
      };
    });

    return status;
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.models.forEach((model) => {
      model.dispose();
    });
    this.models.clear();
  }
}

// Create singleton instance
export const mlManager = new MLManager();

// Utility functions for ML integration
export const MLUtils = {
  /**
   * Normalize value to 0-1 range
   */
  normalize: (value, min, max) => (value - min) / (max - min),

  /**
   * Denormalize value from 0-1 range
   */
  denormalize: (value, min, max) => value * (max - min) + min,

  /**
   * Calculate confidence interval for predictions
   */
  calculateConfidence: (predictions, actuals) => {
    if (predictions.length !== actuals.length) return 0;

    const errors = predictions.map((pred, i) => Math.abs(pred - actuals[i]));
    const meanError = errors.reduce((sum, err) => sum + err, 0) / errors.length;
    const stdError = Math.sqrt(
      errors.reduce((sum, err) => sum + Math.pow(err - meanError, 2), 0) /
        errors.length
    );

    // Return confidence as 1 - (error / max possible error)
    return Math.max(0, 1 - meanError / 0.5); // Assuming max error of 0.5 for 0-1 scale
  },

  /**
   * Generate training data from user interactions
   */
  generateTrainingData: (userHistory, contentData) => {
    const performanceData = [];
    const difficultyData = [];

    // Generate performance training data
    userHistory.forEach((activity, index) => {
      if (index < 5) return; // Need history for features

      const recentActivities = userHistory.slice(index - 5, index);
      const features = [
        recentActivities.reduce((sum, a) => sum + a.performance, 0) / 5,
        recentActivities.reduce((sum, a) => sum + a.timeSpent, 0) / 5,
        recentActivities.reduce((sum, a) => sum + (a.difficulty || 3), 0) / 5,
        recentActivities.filter((a) => a.performance >= 0.8).length / 5,
        Math.abs(
          recentActivities[4].performance - recentActivities[0].performance
        ),
      ];

      performanceData.push({
        features,
        label: activity.performance,
      });
    });

    // Generate difficulty training data
    contentData.forEach((content) => {
      const features = mlManager.extractContentFeatures(
        content.raw || content.text || ''
      );
      difficultyData.push({
        features: Object.values(features),
        label: content.difficulty || 3,
      });
    });

    return { performanceData, difficultyData };
  },
};
