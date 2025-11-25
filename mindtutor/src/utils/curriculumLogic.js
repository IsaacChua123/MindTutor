// curriculumLogic.js - Intelligent curriculum planning and learning path generation

import { userModelManager } from './userModel.js';

export class CurriculumPlanner {
  constructor() {
    this.curriculumGraph = new Map();
    this.skillPrerequisites = new Map();
    this.topicClusters = new Map();
    this.initializeCurriculum();
  }

  initializeCurriculum() {
    // Define core curriculum structure
    this.defineTopics();
    this.defineSkillPrerequisites();
    this.buildCurriculumGraph();
    this.createTopicClusters();
  }

  defineTopics() {
    // Core science topics with prerequisites and skills
    this.topics = {
      atomic_structure: {
        id: 'atomic_structure',
        name: 'Atomic Structure and the Periodic Table',
        prerequisites: [],
        skills: [
          'science.atomic_structure',
          'science.periodic_table',
          'logic.classification',
        ],
        difficulty: 3,
        estimatedTime: 45,
        learningObjectives: [
          'Understand the structure of atoms',
          'Explain the periodic table organization',
          'Apply atomic concepts to real-world scenarios',
        ],
      },
      chemical_bonding: {
        id: 'chemical_bonding',
        name: 'Chemical Bonding',
        prerequisites: ['atomic_structure'],
        skills: ['science.chemical_bonding', 'science.electron_configuration'],
        difficulty: 4,
        estimatedTime: 50,
        learningObjectives: [
          'Explain different types of chemical bonds',
          'Predict bonding behavior',
          'Understand molecular structure',
        ],
      },
      organic_chemistry: {
        id: 'organic_chemistry',
        name: 'Organic Chemistry Basics',
        prerequisites: ['chemical_bonding'],
        skills: ['science.organic_compounds', 'science.functional_groups'],
        difficulty: 5,
        estimatedTime: 60,
        learningObjectives: [
          'Identify organic compounds',
          'Understand functional groups',
          'Predict reaction mechanisms',
        ],
      },
      cell_biology: {
        id: 'cell_biology',
        name: 'Cell Biology',
        prerequisites: [],
        skills: [
          'science.cell_structure',
          'science.cell_function',
          'biology.organelles',
        ],
        difficulty: 3,
        estimatedTime: 40,
        learningObjectives: [
          'Describe cell structure and function',
          'Explain cellular processes',
          'Compare prokaryotic and eukaryotic cells',
        ],
      },
      genetics: {
        id: 'genetics',
        name: 'Genetics and Heredity',
        prerequisites: ['cell_biology'],
        skills: [
          'biology.genetics',
          'biology.inheritance',
          'logic.probability',
        ],
        difficulty: 4,
        estimatedTime: 55,
        learningObjectives: [
          'Explain genetic inheritance',
          'Understand DNA and RNA',
          'Apply genetic principles',
        ],
      },
    };
  }

  defineSkillPrerequisites() {
    this.skillPrerequisites = new Map([
      ['science.atomic_structure', []],
      ['science.periodic_table', ['science.atomic_structure']],
      [
        'science.chemical_bonding',
        ['science.atomic_structure', 'science.electron_configuration'],
      ],
      ['science.electron_configuration', ['science.atomic_structure']],
      ['science.organic_compounds', ['science.chemical_bonding']],
      [
        'science.functional_groups',
        ['science.chemical_bonding', 'science.organic_compounds'],
      ],
      ['science.cell_structure', []],
      ['science.cell_function', ['science.cell_structure']],
      ['biology.organelles', ['science.cell_structure']],
      ['biology.genetics', ['science.cell_function', 'biology.organelles']],
      ['biology.inheritance', ['biology.genetics']],
      ['logic.classification', []],
      ['logic.probability', []],
    ]);
  }

  buildCurriculumGraph() {
    // Build dependency graph
    Object.values(this.topics).forEach((topic) => {
      this.curriculumGraph.set(topic.id, {
        ...topic,
        dependencies: topic.prerequisites,
        dependents: this.findDependents(topic.id),
      });
    });
  }

  findDependents(topicId) {
    return Object.values(this.topics)
      .filter((topic) => topic.prerequisites.includes(topicId))
      .map((topic) => topic.id);
  }

  createTopicClusters() {
    // Group related topics into clusters
    this.topicClusters = new Map([
      [
        'chemistry_fundamentals',
        {
          name: 'Chemistry Fundamentals',
          topics: ['atomic_structure', 'chemical_bonding'],
          theme: 'Building blocks of matter',
        },
      ],
      [
        'organic_chemistry',
        {
          name: 'Organic Chemistry',
          topics: ['organic_chemistry'],
          theme: 'Carbon-based compounds',
        },
      ],
      [
        'biology_fundamentals',
        {
          name: 'Biology Fundamentals',
          topics: ['cell_biology', 'genetics'],
          theme: 'Life and inheritance',
        },
      ],
    ]);
  }

  async generateLearningPath(userId, goalTopic = null, availableTime = 60) {
    const userModel = await userModelManager.getUserModel(userId);

    if (goalTopic) {
      return this.generatePathToGoal(userModel, goalTopic, availableTime);
    } else {
      return this.generateRecommendedPath(userModel, availableTime);
    }
  }

  async generatePathToGoal(userModel, goalTopic, availableTime) {
    let path = {
      topics: [],
      estimatedTime: 0,
      skillGaps: [],
      recommendedOrder: [],
    };

    // Find all prerequisite topics
    const prerequisites = this.getAllPrerequisites(goalTopic);

    // Filter out already mastered topics
    const unmasteredPrerequisites = prerequisites.filter((topicId) => {
      const topic = this.topics[topicId];
      if (!topic) return false;

      // Check if user has mastered required skills
      return !topic.skills.every(
        (skillId) => (userModel.skillLevels[skillId]?.current || 0) >= 0.8
      );
    });

    // Add the goal topic if not mastered
    const goalTopicObj = this.topics[goalTopic];
    const goalMastered = goalTopicObj.skills.every(
      (skillId) => (userModel.skillLevels[skillId]?.current || 0) >= 0.8
    );

    if (!goalMastered) {
      unmasteredPrerequisites.push(goalTopic);
    }

    // Sort by difficulty and prerequisites
    path.recommendedOrder = this.sortTopicsByOptimalOrder(
      unmasteredPrerequisites,
      userModel
    );

    // Calculate total time and identify skill gaps
    path.topics = path.recommendedOrder.map((topicId) => this.topics[topicId]);
    path.estimatedTime = path.topics.reduce(
      (sum, topic) => sum + topic.estimatedTime,
      0
    );
    path.skillGaps = this.identifySkillGaps(path.recommendedOrder, userModel);

    // Adjust for available time
    if (path.estimatedTime > availableTime) {
      path = this.optimizeForTime(path, availableTime);
    }

    return path;
  }

  async generateRecommendedPath(userModel, availableTime) {
    const recommendations = {
      topics: [],
      reasoning: '',
      estimatedTime: 0,
    };

    // Analyze user strengths and weaknesses
    const strengths = userModel.strengths || [];
    const weaknesses = userModel.weaknesses || [];

    // Prioritize weak areas
    if (weaknesses.length > 0) {
      const topicsForWeaknesses = this.findTopicsForSkills(weaknesses);
      recommendations.topics.push(...topicsForWeaknesses.slice(0, 2));
      recommendations.reasoning = 'Focusing on strengthening weak areas first.';
    }

    // Add topics that build on strengths
    if (strengths.length > 0 && recommendations.topics.length < 3) {
      const advancedTopics = this.findAdvancedTopicsForSkills(strengths);
      recommendations.topics.push(...advancedTopics.slice(0, 2));
      recommendations.reasoning += ' Building on existing strengths.';
    }

    // Add foundational topics if user is new
    if (userModel.learningHistory.length < 5) {
      const foundationalTopics = this.getFoundationalTopics();
      recommendations.topics.push(...foundationalTopics.slice(0, 1));
      recommendations.reasoning += ' Starting with fundamental concepts.';
    }

    // Remove duplicates and sort
    recommendations.topics = [...new Set(recommendations.topics)];
    recommendations.topics = this.sortTopicsByOptimalOrder(
      recommendations.topics,
      userModel
    );
    recommendations.estimatedTime = recommendations.topics.reduce(
      (sum, topicId) => {
        return sum + (this.topics[topicId]?.estimatedTime || 0);
      },
      0
    );

    // Adjust for time constraints
    if (recommendations.estimatedTime > availableTime) {
      recommendations.topics = recommendations.topics.slice(
        0,
        Math.floor(availableTime / 30)
      );
      recommendations.estimatedTime = recommendations.topics.reduce(
        (sum, topicId) => {
          return sum + (this.topics[topicId]?.estimatedTime || 0);
        },
        0
      );
    }

    return recommendations;
  }

  getAllPrerequisites(topicId, visited = new Set()) {
    if (visited.has(topicId)) return [];
    visited.add(topicId);

    const topic = this.topics[topicId];
    if (!topic) return [];

    const prerequisites = [...topic.prerequisites];

    // Recursively get prerequisites of prerequisites
    topic.prerequisites.forEach((prereqId) => {
      prerequisites.push(...this.getAllPrerequisites(prereqId, visited));
    });

    return [...new Set(prerequisites)]; // Remove duplicates
  }

  sortTopicsByOptimalOrder(topicIds, userModel) {
    return topicIds.sort((a, b) => {
      const topicA = this.topics[a];
      const topicB = this.topics[b];

      // Prioritize easier topics first
      const difficultyDiff = topicA.difficulty - topicB.difficulty;
      if (Math.abs(difficultyDiff) > 1) return difficultyDiff;

      // Consider user's current skill levels
      const skillLevelA = this.calculateAverageSkillLevel(
        topicA.skills,
        userModel
      );
      const skillLevelB = this.calculateAverageSkillLevel(
        topicB.skills,
        userModel
      );

      // Prefer topics where user has higher skill levels
      return skillLevelB - skillLevelA;
    });
  }

  calculateAverageSkillLevel(skillIds, userModel) {
    const levels = skillIds.map(
      (skillId) => userModel.skillLevels[skillId]?.current || 0
    );
    return levels.reduce((sum, level) => sum + level, 0) / levels.length;
  }

  identifySkillGaps(topicIds, userModel) {
    const skillGaps = [];

    topicIds.forEach((topicId) => {
      const topic = this.topics[topicId];
      topic.skills.forEach((skillId) => {
        const userLevel = userModel.skillLevels[skillId]?.current || 0;
        if (userLevel < 0.6) {
          // Consider below 60% as a gap
          skillGaps.push({
            skill: skillId,
            currentLevel: userLevel,
            requiredLevel: 0.8,
            topic: topicId,
          });
        }
      });
    });

    return skillGaps;
  }

  findTopicsForSkills(skillIds) {
    return Object.values(this.topics)
      .filter((topic) => topic.skills.some((skill) => skillIds.includes(skill)))
      .map((topic) => topic.id);
  }

  findAdvancedTopicsForSkills(skillIds) {
    return Object.values(this.topics)
      .filter(
        (topic) =>
          topic.skills.some((skill) => skillIds.includes(skill)) &&
          topic.difficulty >= 4
      )
      .map((topic) => topic.id);
  }

  getFoundationalTopics() {
    return Object.values(this.topics)
      .filter((topic) => topic.prerequisites.length === 0)
      .sort((a, b) => a.difficulty - b.difficulty)
      .map((topic) => topic.id);
  }

  optimizeForTime(path, availableTime) {
    // Sort topics by importance and time efficiency
    const sortedTopics = path.topics.sort((a, b) => {
      const timeEfficiencyA = this.calculateImportance(a) / a.estimatedTime;
      const timeEfficiencyB = this.calculateImportance(b) / b.estimatedTime;
      return timeEfficiencyB - timeEfficiencyA;
    });

    // Select topics that fit within time limit
    const selectedTopics = [];
    let totalTime = 0;

    for (const topic of sortedTopics) {
      if (totalTime + topic.estimatedTime <= availableTime) {
        selectedTopics.push(topic);
        totalTime += topic.estimatedTime;
      }
    }

    return {
      ...path,
      topics: selectedTopics,
      estimatedTime: totalTime,
    };
  }

  calculateImportance(topic) {
    // Calculate topic importance based on dependents and difficulty
    const dependents = this.curriculumGraph.get(topic.id)?.dependents || [];
    return dependents.length * 10 + topic.difficulty;
  }

  async getNextRecommendedTopic(userId, currentTopic = null) {
    const userModel = await userModelManager.getUserModel(userId);

    // If user just completed a topic, recommend next logical step
    if (currentTopic) {
      const nextTopics =
        this.curriculumGraph.get(currentTopic)?.dependents || [];
      if (nextTopics.length > 0) {
        // Find the most appropriate next topic
        const suitableTopics = nextTopics.filter((topicId) => {
          const topic = this.topics[topicId];
          return this.isTopicSuitable(topic, userModel);
        });

        if (suitableTopics.length > 0) {
          return this.topics[suitableTopics[0]];
        }
      }
    }

    // Otherwise, find the most suitable topic overall
    const suitableTopics = Object.values(this.topics).filter((topic) =>
      this.isTopicSuitable(topic, userModel)
    );

    if (suitableTopics.length === 0) {
      return null; // No suitable topics
    }

    // Sort by priority (weaker skills first, then difficulty)
    suitableTopics.sort((a, b) => {
      const priorityA = this.calculateTopicPriority(a, userModel);
      const priorityB = this.calculateTopicPriority(b, userModel);
      return priorityB - priorityA; // Higher priority first
    });

    return suitableTopics[0];
  }

  isTopicSuitable(topic, userModel) {
    // Check prerequisites
    for (const prereqId of topic.prerequisites) {
      const prereq = this.topics[prereqId];
      if (!prereq) continue;

      const prereqMastered = prereq.skills.every(
        (skillId) => (userModel.skillLevels[skillId]?.current || 0) >= 0.7
      );

      if (!prereqMastered) return false;
    }

    // Check if topic is not already mastered
    const topicMastered = topic.skills.every(
      (skillId) => (userModel.skillLevels[skillId]?.current || 0) >= 0.8
    );

    return !topicMastered;
  }

  calculateTopicPriority(topic, userModel) {
    let priority = 0;

    // Higher priority for topics that address weaknesses
    const addressesWeakness = topic.skills.some((skillId) =>
      userModel.weaknesses?.includes(skillId)
    );
    if (addressesWeakness) priority += 50;

    // Moderate priority for topics that build on strengths
    const buildsOnStrength = topic.skills.some((skillId) =>
      userModel.strengths?.includes(skillId)
    );
    if (buildsOnStrength) priority += 25;

    // Lower priority for very difficult topics when user is struggling
    if (topic.difficulty > 4 && userModel.overallAbility < 0.6) {
      priority -= 20;
    }

    // Consider user's preferred difficulty
    const difficultyMatch =
      1 -
      Math.abs(topic.difficulty - userModel.profile.preferredDifficulty) / 5;
    priority += difficultyMatch * 10;

    return priority;
  }
}

// Create singleton instance
export const curriculumPlanner = new CurriculumPlanner();
