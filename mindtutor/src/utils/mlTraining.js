// mlTraining.js - ML model training and evaluation utilities

import { mlManager, MLUtils } from './machineLearning.js';
import { userModelManager } from './userModel.js';
import { loadTopics } from './storage.js';

/**
 * ML Training and Evaluation Utilities for MindTutor
 */
export class MLTrainingManager {
  constructor() {
    this.trainingHistory = [];
    this.evaluationResults = [];
  }

  /**
   * Comprehensive ML training pipeline
   */
  async runFullTrainingPipeline() {
    console.log('🚀 Starting ML training pipeline...');

    try {
      // Initialize ML components
      await mlManager.initialize();
      await userModelManager.initializeML();

      // Step 1: Prepare training data
      console.log('📊 Preparing training data...');
      const trainingData = await this.prepareTrainingData();

      // Step 2: Train performance prediction model
      console.log('🎯 Training performance prediction model...');
      const performanceResult = await this.trainPerformanceModel(
        trainingData.performanceData
      );

      // Step 3: Train difficulty classification model
      console.log('📏 Training difficulty classification model...');
      const difficultyResult = await this.trainDifficultyModel(
        trainingData.difficultyData
      );

      // Step 4: Evaluate models
      console.log('📈 Evaluating models...');
      const evaluationResults = await this.evaluateModels(trainingData);

      // Step 5: Save training results
      const trainingSession = {
        timestamp: new Date().toISOString(),
        performanceModel: performanceResult,
        difficultyModel: difficultyResult,
        evaluation: evaluationResults,
        dataStats: {
          performanceSamples: trainingData.performanceData.length,
          difficultySamples: trainingData.difficultyData.length,
          totalUsers: trainingData.userCount,
          totalContent: trainingData.contentCount,
        },
      };

      this.trainingHistory.push(trainingSession);

      console.log('✅ ML training pipeline completed successfully!');
      return trainingSession;
    } catch (error) {
      console.error('❌ ML training pipeline failed:', error);
      throw error;
    }
  }

  /**
   * Prepare comprehensive training data
   */
  async prepareTrainingData() {
    const performanceData = [];
    const difficultyData = [];
    let userCount = 0;
    let contentCount = 0;

    // Collect data from all users
    userModelManager.models.forEach((userModel, userId) => {
      if (userModel.learningHistory && userModel.learningHistory.length > 0) {
        userCount++;

        // Generate performance training samples
        const userPerformanceData = MLUtils.generateTrainingData(
          userModel.learningHistory,
          []
        );
        performanceData.push(...userPerformanceData.performanceData);
      }
    });

    // Collect content data
    try {
      const topics = await loadTopics();
      topics.forEach((topic) => {
        if (topic.raw && topic.difficulty) {
          contentCount++;

          // Extract features and create training sample
          const features = mlManager.extractContentFeatures(topic.raw);
          difficultyData.push({
            features: Object.values(features),
            label: topic.difficulty,
          });
        }
      });
    } catch (error) {
      console.warn('Could not load topics for training:', error);
    }

    return {
      performanceData,
      difficultyData,
      userCount,
      contentCount,
    };
  }

  /**
   * Train performance prediction model
   */
  async trainPerformanceModel(performanceData) {
    if (performanceData.length < 20) {
      console.warn('Insufficient performance data for training');
      return { success: false, reason: 'insufficient_data' };
    }

    try {
      // Prepare data for TensorFlow
      const features = performanceData.map((d) => d.features);
      const labels = performanceData.map((d) => [d.label]);

      // Create and train model
      const result = await mlManager.trainPerformanceModel(
        performanceData.map((d) => ({
          performance: d.label,
          timeSpent: d.features[1] || 30,
          difficulty: 3,
        }))
      );

      if (result) {
        return {
          success: true,
          samples: performanceData.length,
          modelSaved: true,
        };
      } else {
        return { success: false, reason: 'training_failed' };
      }
    } catch (error) {
      console.error('Performance model training error:', error);
      return { success: false, reason: 'error', error: error.message };
    }
  }

  /**
   * Train difficulty classification model
   */
  async trainDifficultyModel(difficultyData) {
    if (difficultyData.length < 10) {
      console.warn('Insufficient difficulty data for training');
      return { success: false, reason: 'insufficient_data' };
    }

    try {
      // Convert to content objects for training
      const contentObjects = difficultyData.map((d) => ({
        features: d.features,
        difficulty: d.label,
      }));

      const result = await mlManager.trainDifficultyModel(contentObjects);

      if (result) {
        return {
          success: true,
          samples: difficultyData.length,
          modelSaved: true,
        };
      } else {
        return { success: false, reason: 'training_failed' };
      }
    } catch (error) {
      console.error('Difficulty model training error:', error);
      return { success: false, reason: 'error', error: error.message };
    }
  }

  /**
   * Evaluate trained models
   */
  async evaluateModels(trainingData) {
    const results = {
      performanceModel: null,
      difficultyModel: null,
      overall: null,
    };

    // Evaluate performance model
    if (trainingData.performanceData.length >= 10) {
      results.performanceModel = await this.evaluatePerformanceModel(
        trainingData.performanceData
      );
    }

    // Evaluate difficulty model
    if (trainingData.difficultyData.length >= 5) {
      results.difficultyModel = await this.evaluateDifficultyModel(
        trainingData.difficultyData
      );
    }

    // Calculate overall metrics
    results.overall = this.calculateOverallMetrics(results);

    this.evaluationResults.push({
      timestamp: new Date().toISOString(),
      ...results,
    });

    return results;
  }

  /**
   * Evaluate performance prediction model
   */
  async evaluatePerformanceModel(performanceData) {
    const testSize = Math.floor(performanceData.length * 0.2);
    const testData = performanceData.slice(-testSize);
    const trainData = performanceData.slice(0, -testSize);

    if (testData.length < 3) return null;

    try {
      // Train on subset
      await mlManager.trainPerformanceModel(
        trainData.map((d) => ({
          performance: d.label,
          timeSpent: d.features[1] || 30,
          difficulty: 3,
        }))
      );

      // Test predictions
      const predictions = [];
      const actuals = [];

      for (const testSample of testData) {
        const mockHistory = [
          {
            performance: testSample.features[0],
            timeSpent: testSample.features[1] || 30,
            difficulty: 3,
          },
          {
            performance: testSample.features[0] * 0.9,
            timeSpent: testSample.features[1] || 30,
            difficulty: 3,
          },
          {
            performance: testSample.features[0] * 1.1,
            timeSpent: testSample.features[1] || 30,
            difficulty: 3,
          },
          {
            performance: testSample.features[0],
            timeSpent: testSample.features[1] || 30,
            difficulty: 3,
          },
          {
            performance: testSample.features[0],
            timeSpent: testSample.features[1] || 30,
            difficulty: 3,
          },
        ];

        const prediction = await mlManager.predictPerformance(mockHistory);
        if (prediction !== null) {
          predictions.push(prediction);
          actuals.push(testSample.label);
        }
      }

      if (predictions.length > 0) {
        const mse = MLUtils.calculateConfidence(predictions, actuals);
        const mae =
          predictions.reduce(
            (sum, pred, i) => sum + Math.abs(pred - actuals[i]),
            0
          ) / predictions.length;

        return {
          mse,
          mae,
          accuracy: 1 - mae, // Simplified accuracy metric
          testSamples: predictions.length,
        };
      }
    } catch (error) {
      console.error('Performance model evaluation error:', error);
    }

    return null;
  }

  /**
   * Evaluate difficulty classification model
   */
  async evaluateDifficultyModel(difficultyData) {
    const testSize = Math.floor(difficultyData.length * 0.2);
    const testData = difficultyData.slice(-testSize);
    const trainData = difficultyData.slice(0, -testSize);

    if (testData.length < 2) return null;

    try {
      // Train on subset
      await mlManager.trainDifficultyModel(
        trainData.map((d) => ({
          features: d.features,
          difficulty: d.label,
        }))
      );

      // Test predictions
      let correct = 0;
      let total = 0;

      for (const testSample of testData) {
        const prediction = await mlManager.classifyDifficulty(
          testSample.features
        );
        if (prediction !== null) {
          total++;
          // Allow 1-level difference for "correct"
          if (Math.abs(prediction - testSample.label) <= 1) {
            correct++;
          }
        }
      }

      if (total > 0) {
        return {
          accuracy: correct / total,
          testSamples: total,
          precision: correct / total, // Simplified
        };
      }
    } catch (error) {
      console.error('Difficulty model evaluation error:', error);
    }

    return null;
  }

  /**
   * Calculate overall evaluation metrics
   */
  calculateOverallMetrics(results) {
    const metrics = {
      overallScore: 0,
      modelCount: 0,
      bestPerformingModel: null,
    };

    if (results.performanceModel) {
      metrics.modelCount++;
      metrics.overallScore += results.performanceModel.accuracy || 0;
    }

    if (results.difficultyModel) {
      metrics.modelCount++;
      metrics.overallScore += results.difficultyModel.accuracy || 0;
    }

    if (metrics.modelCount > 0) {
      metrics.overallScore /= metrics.modelCount;
    }

    // Determine best performing model
    if (results.performanceModel && results.difficultyModel) {
      const perfScore = results.performanceModel.accuracy || 0;
      const diffScore = results.difficultyModel.accuracy || 0;
      metrics.bestPerformingModel =
        perfScore > diffScore ? 'performance' : 'difficulty';
    } else if (results.performanceModel) {
      metrics.bestPerformingModel = 'performance';
    } else if (results.difficultyModel) {
      metrics.bestPerformingModel = 'difficulty';
    }

    return metrics;
  }

  /**
   * Generate training report
   */
  generateTrainingReport(session) {
    return {
      summary: {
        timestamp: session.timestamp,
        success:
          session.performanceModel?.success && session.difficultyModel?.success,
        modelsTrained: [
          session.performanceModel?.success ? 'Performance Prediction' : null,
          session.difficultyModel?.success ? 'Difficulty Classification' : null,
        ].filter(Boolean),
        dataStats: session.dataStats,
      },
      performance: session.evaluation?.performanceModel || null,
      difficulty: session.evaluation?.difficultyModel || null,
      recommendations: this.generateTrainingRecommendations(session),
    };
  }

  /**
   * Generate training recommendations
   */
  generateTrainingRecommendations(session) {
    const recommendations = [];

    if (!session.performanceModel?.success) {
      recommendations.push({
        type: 'data_collection',
        message: 'Collect more user performance data for better model training',
        priority: 'high',
      });
    }

    if (!session.difficultyModel?.success) {
      recommendations.push({
        type: 'content_labeling',
        message:
          'Add difficulty labels to more content for better classification',
        priority: 'medium',
      });
    }

    if (session.evaluation?.overall?.overallScore < 0.7) {
      recommendations.push({
        type: 'model_tuning',
        message: 'Consider adjusting model architecture or hyperparameters',
        priority: 'medium',
      });
    }

    if (session.dataStats.performanceSamples < 50) {
      recommendations.push({
        type: 'user_engagement',
        message: 'Encourage more quiz attempts to build training data',
        priority: 'high',
      });
    }

    return recommendations;
  }

  /**
   * Get training history and statistics
   */
  getTrainingStats() {
    return {
      totalSessions: this.trainingHistory.length,
      lastTraining:
        this.trainingHistory[this.trainingHistory.length - 1] || null,
      averagePerformance: this.calculateAverageMetric(
        'performanceModel',
        'accuracy'
      ),
      averageDifficulty: this.calculateAverageMetric(
        'difficultyModel',
        'accuracy'
      ),
      improvement: this.calculateImprovementTrend(),
    };
  }

  /**
   * Calculate average metric across training sessions
   */
  calculateAverageMetric(modelType, metricName) {
    const values = this.trainingHistory
      .map((session) => session.evaluation?.[modelType]?.[metricName])
      .filter((value) => value !== undefined && value !== null);

    if (values.length === 0) return null;

    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  /**
   * Calculate improvement trend
   */
  calculateImprovementTrend() {
    if (this.trainingHistory.length < 2) return null;

    const recent = this.trainingHistory.slice(-3);
    const scores = recent
      .map((session) => session.evaluation?.overall?.overallScore)
      .filter((score) => score !== undefined);

    if (scores.length < 2) return null;

    const trend = scores[scores.length - 1] - scores[0];
    return {
      direction:
        trend > 0.05 ? 'improving' : trend < -0.05 ? 'declining' : 'stable',
      change: trend,
      period: `${recent.length} sessions`,
    };
  }
}

// Create singleton instance
export const mlTrainingManager = new MLTrainingManager();

// Utility functions for automated training
export const MLTrainingUtils = {
  /**
   * Check if training should be triggered
   */
  shouldTriggerTraining() {
    const stats = mlTrainingManager.getTrainingStats();

    // Trigger if no training done yet
    if (stats.totalSessions === 0) return true;

    // Trigger if last training was more than 7 days ago
    if (stats.lastTraining) {
      const daysSinceLastTraining =
        (Date.now() - new Date(stats.lastTraining.timestamp)) /
        (1000 * 60 * 60 * 24);
      if (daysSinceLastTraining > 7) return true;
    }

    // Trigger if performance is declining
    if (stats.improvement?.direction === 'declining') return true;

    return false;
  },

  /**
   * Run automated training if conditions are met
   */
  async runAutomatedTraining() {
    if (this.shouldTriggerTraining()) {
      console.log('🤖 Running automated ML training...');
      try {
        const result = await mlTrainingManager.runFullTrainingPipeline();
        console.log('✅ Automated training completed:', result);
        return result;
      } catch (error) {
        console.error('❌ Automated training failed:', error);
        return null;
      }
    } else {
      console.log('⏭️ Skipping automated training - conditions not met');
      return null;
    }
  },
};
