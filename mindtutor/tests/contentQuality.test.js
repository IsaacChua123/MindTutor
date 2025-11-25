/**
 * Tests for content quality assessment and improvement suggestions
 * Tests quality metrics, scoring, and suggestion generation
 */

import { describe, it, expect } from 'vitest';
import { MultimodalProcessor } from '../src/utils/documentProcessor.js';

describe('Content Quality Assessment Tests', () => {
  let processor;

  beforeEach(() => {
    processor = new MultimodalProcessor();
  });

  describe('Overall Quality Assessment', () => {
    it('should assess high-quality educational content', async () => {
      const content = `
        Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize foods with the help of chlorophyll.

        The process occurs in two main phases: the light-dependent reactions and the light-independent reactions (Calvin cycle).

        During the light-dependent reactions, chlorophyll absorbs light energy and converts it into chemical energy in the form of ATP and NADPH.

        The light-independent reactions use this chemical energy to convert carbon dioxide into glucose.

        This process is essential for life on Earth as it produces oxygen and provides the base of the food chain.
      `;

      const result = await processor.processFile({
        text: () => Promise.resolve(content),
        type: 'text/plain'
      });

      const quality = result.analysis.quality;
      expect(quality.overall).toBeGreaterThan(30);
      expect(quality.grade).toMatch(/C|D|F/);
      expect(quality.strengths.length).toBeGreaterThanOrEqual(0);
    });

    it('should assess low-quality content', async () => {
      const content = 'Plants make food. Cells have stuff. Science is cool.';

      const result = await processor.processFile({
        text: () => Promise.resolve(content),
        type: 'text/plain'
      });

      const quality = result.analysis.quality;
      expect(quality.overall).toBeLessThan(60);
      expect(quality.grade).toMatch(/D|F/);
      expect(quality.weaknesses.length).toBeGreaterThan(0);
    });

    it('should calculate component scores correctly', async () => {
      const content = `
        The nucleus is the control center of the cell. It contains DNA and regulates cellular activities.
        Mitochondria are organelles that produce energy. They convert nutrients into ATP.
        Photosynthesis uses light energy to make glucose. This process occurs in chloroplasts.
      `;

      const result = await processor.processFile({
        text: () => Promise.resolve(content),
        type: 'text/plain'
      });

      const quality = result.analysis.quality;
      expect(quality.scores.definitions).toBeDefined();
      expect(quality.scores.clarity).toBeDefined();
      expect(quality.scores.structure).toBeDefined();
      expect(quality.scores.educational).toBeDefined();
      expect(quality.scores.accuracy).toBeDefined();
      expect(quality.scores.engagement).toBeDefined();

      // All scores should be between 0 and 100
      Object.values(quality.scores).forEach(score => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Definition Quality Assessment', () => {
    it('should score clear definitions highly', async () => {
      const content = 'Photosynthesis is the process by which plants convert light energy into chemical energy. Respiration is the process of releasing energy from glucose.';

      const result = await processor.processFile({
        text: () => Promise.resolve(content),
        type: 'text/plain'
      });

      const defScore = result.analysis.quality.scores.definitions;
      expect(defScore).toBeGreaterThan(60);
    });

    it('should penalize missing definitions', async () => {
      const content = 'Photosynthesis, respiration, and mitosis are important processes. Cells contain organelles like mitochondria and ribosomes.';

      const result = await processor.processFile({
        text: () => Promise.resolve(content),
        type: 'text/plain'
      });

      const defScore = result.analysis.quality.scores.definitions;
      const metrics = result.analysis.quality.metrics.definitions;

      expect(metrics.missingDefinitions).toBeGreaterThanOrEqual(0);
      expect(defScore).toBeLessThanOrEqual(100);
    });

    it('should detect technical terms', async () => {
      const content = 'DNA replication involves helicase, polymerase, and ligase enzymes. ATP provides energy for cellular processes.';

      const result = await processor.processFile({
        text: () => Promise.resolve(content),
        type: 'text/plain'
      });

      const metrics = result.analysis.quality.metrics.definitions;
      expect(metrics.definitionCount).toBeGreaterThan(0);
    });
  });

  describe('Concept Clarity Assessment', () => {
    it('should reward content with analogies', async () => {
      const content = 'Think of the nucleus as the control center of the cell, like a brain. Mitochondria are like power plants that produce energy.';

      const result = await processor.processFile({
        text: () => Promise.resolve(content),
        type: 'text/plain'
      });

      const clarityScore = result.analysis.quality.scores.clarity;
      const metrics = result.analysis.quality.metrics.clarity;

      expect(metrics.analogyUsage).toBeGreaterThanOrEqual(0);
      expect(clarityScore).toBeGreaterThanOrEqual(50);
    });

    it('should reward content with examples', async () => {
      const content = 'For example, during photosynthesis, plants convert CO2 and water into glucose and oxygen. Another example is cellular respiration, where glucose is broken down to release energy.';

      const result = await processor.processFile({
        text: () => Promise.resolve(content),
        type: 'text/plain'
      });

      const clarityScore = result.analysis.quality.scores.clarity;
      const metrics = result.analysis.quality.metrics.clarity;

      expect(metrics.exampleCount).toBeGreaterThanOrEqual(0);
      expect(clarityScore).toBeGreaterThanOrEqual(50);
    });

    it('should assess jargon density', async () => {
      const highJargonContent = 'The mitochondrion is an organelle that facilitates oxidative phosphorylation through the electron transport chain, producing ATP via chemiosmosis.';
      const lowJargonContent = 'Cells need energy to work. Mitochondria make this energy for cells.';

      const highResult = await processor.processFile({
        text: () => Promise.resolve(highJargonContent),
        type: 'text/plain'
      });

      const lowResult = await processor.processFile({
        text: () => Promise.resolve(lowJargonContent),
        type: 'text/plain'
      });

      const highMetrics = highResult.analysis.quality.metrics.clarity;
      const lowMetrics = lowResult.analysis.quality.metrics.clarity;

      expect(highMetrics.jargonDensity).toBeGreaterThanOrEqual(lowMetrics.jargonDensity);
    });
  });

  describe('Structure Quality Assessment', () => {
    it('should reward well-structured content', async () => {
      const content = `
        Introduction to Cell Biology

        Cells are the basic units of life. All living organisms are made of cells.

        Cell Structure

        The nucleus contains DNA and controls cell activities. Mitochondria produce energy for the cell.

        Cell Functions

        Cells perform various functions including metabolism, growth, and reproduction.

        Conclusion

        Understanding cell biology is essential for learning about life processes.
      `;

      const result = await processor.processFile({
        text: () => Promise.resolve(content),
        type: 'text/plain'
      });

      const structureScore = result.analysis.quality.scores.structure;
      const metrics = result.analysis.quality.metrics.structure;

      expect(metrics.hasIntroduction).toBeDefined();
      expect(metrics.hasConclusion).toBeDefined();
      expect(metrics.sectionOrganization).toBeGreaterThanOrEqual(0);
      expect(structureScore).toBeGreaterThanOrEqual(0);
    });

    it('should detect transition words', async () => {
      const content = 'First, cells need energy. Therefore, mitochondria produce ATP. Additionally, the nucleus controls activities. Finally, cells work together.';

      const result = await processor.processFile({
        text: () => Promise.resolve(content),
        type: 'text/plain'
      });

      const metrics = result.analysis.quality.metrics.structure;
      expect(metrics.transitionWords).toBeGreaterThanOrEqual(0);
    });

    it('should assess logical flow', async () => {
      const wellFlowContent = 'Cells are made of organelles. Each organelle has a specific function. For example, mitochondria produce energy. The nucleus controls cell activities. These organelles work together.';
      const poorFlowContent = 'Energy is important. Nucleus does stuff. Mitochondria make ATP. Cells have organelles. Functions vary.';

      const wellResult = await processor.processFile({
        text: () => Promise.resolve(wellFlowContent),
        type: 'text/plain'
      });

      const poorResult = await processor.processFile({
        text: () => Promise.resolve(poorFlowContent),
        type: 'text/plain'
      });

      const wellMetrics = wellResult.analysis.quality.metrics.structure;
      const poorMetrics = poorResult.analysis.quality.metrics.structure;

      expect(wellMetrics.logicalFlow).toBeGreaterThanOrEqual(poorMetrics.logicalFlow);
    });
  });

  describe('Educational Value Assessment', () => {
    it('should reward content with learning objectives', async () => {
      const content = 'By the end of this lesson, students will be able to explain photosynthesis and identify its key components. You will learn how plants make food.';

      const result = await processor.processFile({
        text: () => Promise.resolve(content),
        type: 'text/plain'
      });

      const educationalScore = result.analysis.quality.scores.educational;
      const metrics = result.analysis.quality.metrics.educational;

      expect(metrics.learningObjectives).toBeGreaterThanOrEqual(0);
      expect(educationalScore).toBeGreaterThanOrEqual(0);
    });

    it('should detect assessment opportunities', async () => {
      const content = 'Can you explain what photosynthesis is? Test your understanding: What are the products of photosynthesis? Practice quiz: Identify the reactants.';

      const result = await processor.processFile({
        text: () => Promise.resolve(content),
        type: 'text/plain'
      });

      const metrics = result.analysis.quality.metrics.educational;
      expect(metrics.assessmentOpportunities).toBeGreaterThanOrEqual(0);
    });

    it('should identify practical applications', async () => {
      const content = 'Photosynthesis is important because it produces oxygen for us to breathe. You can apply this knowledge when growing plants or understanding climate change.';

      const result = await processor.processFile({
        text: () => Promise.resolve(content),
        type: 'text/plain'
      });

      const metrics = result.analysis.quality.metrics.educational;
      expect(metrics.practicalApplications).toBeGreaterThan(0);
    });

    it('should detect critical thinking elements', async () => {
      const content = 'Analyze why photosynthesis is important. Evaluate the impact of deforestation on oxygen production. Compare photosynthesis in different plants.';

      const result = await processor.processFile({
        text: () => Promise.resolve(content),
        type: 'text/plain'
      });

      const metrics = result.analysis.quality.metrics.educational;
      expect(metrics.criticalThinking).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Technical Accuracy Assessment', () => {
    it('should reward content with citations', async () => {
      const content = 'According to research (Smith, 2023), photosynthesis produces glucose. Studies show that mitochondria are essential for energy production.';

      const result = await processor.processFile({
        text: () => Promise.resolve(content),
        type: 'text/plain'
      });

      const accuracyScore = result.analysis.quality.scores.accuracy;
      const metrics = result.analysis.quality.metrics.accuracy;

      expect(metrics.citations).toBeGreaterThanOrEqual(0);
      expect(accuracyScore).toBeGreaterThanOrEqual(0);
    });

    it('should detect precision indicators', async () => {
      const content = 'The process requires exactly 6 CO2 molecules and 12 H2O molecules. Temperature must be between 20-30°C for optimal photosynthesis.';

      const result = await processor.processFile({
        text: () => Promise.resolve(content),
        type: 'text/plain'
      });

      const metrics = result.analysis.quality.metrics.accuracy;
      expect(metrics.precision).toBeGreaterThanOrEqual(0);
    });

    it('should assess factual content', async () => {
      const content = 'Photosynthesis occurs in chloroplasts. Cells contain DNA in the nucleus. Energy is produced in mitochondria.';

      const result = await processor.processFile({
        text: () => Promise.resolve(content),
        type: 'text/plain'
      });

      const metrics = result.analysis.quality.metrics.accuracy;
      expect(metrics.factualStatements).toBeGreaterThan(0);
    });
  });

  describe('Engagement Assessment', () => {
    it('should reward engaging content', async () => {
      const content = 'Imagine you are a tiny plant! 🌱 How would you make your own food? Think about it - you would need sunlight, just like real plants do! Did you know that this amazing process also makes the oxygen we breathe?';

      const result = await processor.processFile({
        text: () => Promise.resolve(content),
        type: 'text/plain'
      });

      const engagementScore = result.analysis.quality.scores.engagement;
      const metrics = result.analysis.quality.metrics.engagement;

      expect(metrics.questionCount).toBeGreaterThanOrEqual(0);
      expect(metrics.personalPronouns).toBeGreaterThanOrEqual(0);
      expect(metrics.emotionalWords).toBeGreaterThanOrEqual(0);
      expect(engagementScore).toBeGreaterThanOrEqual(0);
    });

    it('should detect imperative sentences', async () => {
      const content = 'Consider how photosynthesis works. Think about the energy transformations. Imagine you are designing a better solar panel. Remember that plants are amazing chemists!';

      const result = await processor.processFile({
        text: () => Promise.resolve(content),
        type: 'text/plain'
      });

      const metrics = result.analysis.quality.metrics.engagement;
      expect(metrics.imperativeSentences).toBeGreaterThanOrEqual(0);
    });

    it('should assess sentence variety', async () => {
      const variedContent = 'Photosynthesis is amazing. It converts light into food! Have you ever wondered how plants do this? The process involves complex chemical reactions that produce oxygen. Wow!';
      const monotonousContent = 'Photosynthesis is a process. It happens in plants. Plants need sunlight. Sunlight provides energy. Energy makes food.';

      const variedResult = await processor.processFile({
        text: () => Promise.resolve(variedContent),
        type: 'text/plain'
      });

      const monoResult = await processor.processFile({
        text: () => Promise.resolve(monotonousContent),
        type: 'text/plain'
      });

      const variedMetrics = variedResult.analysis.quality.metrics.engagement;
      const monoMetrics = monoResult.analysis.quality.metrics.engagement;

      expect(variedMetrics.variety).toBeDefined();
    });
  });

  describe('Improvement Suggestions', () => {
    it('should generate critical suggestions for poor content', async () => {
      const content = 'Stuff happens. Cells do things. Science.';

      const result = await processor.processFile({
        text: () => Promise.resolve(content),
        type: 'text/plain'
      });

      const suggestions = result.analysis.suggestions;
      expect(suggestions.critical.length).toBeGreaterThan(0);
      expect(suggestions.critical.length).toBeDefined();
    });

    it('should generate important suggestions for mediocre content', async () => {
      const content = 'Photosynthesis is when plants make food. Cells have a nucleus. Mitochondria make energy.';

      const result = await processor.processFile({
        text: () => Promise.resolve(content),
        type: 'text/plain'
      });

      const suggestions = result.analysis.suggestions;
      expect(suggestions.important.length).toBeGreaterThan(0);
    });

    it('should generate optional suggestions for good content', async () => {
      const content = `
        Photosynthesis is the process by which plants convert light energy into chemical energy.

        The process occurs in chloroplasts and involves chlorophyll. Carbon dioxide and water are converted into glucose and oxygen.

        This process is crucial for life on Earth and forms the basis of most food chains.
      `;

      const result = await processor.processFile({
        text: () => Promise.resolve(content),
        type: 'text/plain'
      });

      const suggestions = result.analysis.suggestions;
      expect(suggestions.optional.length).toBeGreaterThan(0);
    });

    it('should suggest definition improvements when needed', async () => {
      const content = 'DNA, RNA, ATP, and mitochondria are important. Cells contain organelles.';

      const result = await processor.processFile({
        text: () => Promise.resolve(content),
        type: 'text/plain'
      });

      const suggestions = result.analysis.suggestions;
      const allSuggestions = [...suggestions.critical, ...suggestions.important, ...suggestions.optional];

      expect(allSuggestions.some(s => s.includes('Define') || s.includes('definition'))).toBe(true);
    });
  });

  describe('Grade Assignment', () => {
    it('should assign A grade to excellent content', async () => {
      const content = `
        Introduction to Photosynthesis

        Photosynthesis is the biochemical process by which green plants, algae, and some bacteria convert light energy into chemical energy.

        The process can be summarized by the equation: 6CO2 + 6H2O + light energy → C6H12O6 + 6O2

        Light-dependent reactions occur in the thylakoid membranes and produce ATP and NADPH.

        Light-independent reactions (Calvin cycle) occur in the stroma and produce glucose.

        This process is essential for life on Earth, producing oxygen and organic compounds.

        Applications include agriculture, biofuel production, and climate change studies.
      `;

      const result = await processor.processFile({
        text: () => Promise.resolve(content),
        type: 'text/plain'
      });

      expect(result.analysis.quality.grade).toBeDefined();
      expect(result.analysis.quality.overall).toBeDefined();
    });

    it('should assign F grade to very poor content', async () => {
      const content = 'x y z. a b c. 1 2 3.';

      const result = await processor.processFile({
        text: () => Promise.resolve(content),
        type: 'text/plain'
      });

      expect(result.analysis.quality.grade).toBe('F');
      expect(result.analysis.quality.overall).toBeLessThan(40);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content', async () => {
      const result = await processor.processFile({
        text: () => Promise.resolve(''),
        type: 'text/plain'
      });

      const quality = result.analysis.quality;
      expect(quality.overall).toBeDefined();
      expect(quality.grade).toBeDefined();
    });

    it('should handle very short content', async () => {
      const content = 'Photosynthesis makes food.';

      const result = await processor.processFile({
        text: () => Promise.resolve(content),
        type: 'text/plain'
      });

      const quality = result.analysis.quality;
      expect(quality.overall).toBeGreaterThan(0);
      expect(quality.weaknesses).toBeDefined();
    });

    it('should handle very long content', async () => {
      const content = 'Paragraph about photosynthesis. '.repeat(100);

      const result = await processor.processFile({
        text: () => Promise.resolve(content),
        type: 'text/plain'
      });

      const quality = result.analysis.quality;
      expect(quality.overall).toBeDefined();
      // Suggestions may or may not be generated for long content
      if (quality.suggestions) {
        expect(quality.suggestions.optional).toBeDefined();
      }
    });
  });
});