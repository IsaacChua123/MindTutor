/**
 * Tests for advanced NLP features
 * Tests NER, sentiment analysis, summarization, readability, and concept mapping
 */

import { describe, it, expect } from 'vitest';
import { processTextAdvanced } from '../src/utils/advancedAI.js';

describe('Advanced NLP Features Tests', () => {
  describe('Text Processing Pipeline', () => {
    it('should process text with all NLP features', () => {
      const text = 'Photosynthesis is the process by which plants make food using sunlight. The nucleus controls cell activities.';
      const result = processTextAdvanced(text);

      expect(result).toHaveProperty('tokens');
      expect(result).toHaveProperty('entities');
      expect(result).toHaveProperty('sentiment');
      expect(result).toHaveProperty('keyPhrases');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('readability');
      expect(result).toHaveProperty('concepts');
      expect(result).toHaveProperty('relationships');
      expect(result).toHaveProperty('confidence');
    });

    it('should assign reasonable confidence scores', () => {
      const text = 'DNA replication is a complex process that ensures genetic information is accurately copied.';
      const result = processTextAdvanced(text);

      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Named Entity Recognition', () => {
    it('should identify biological entities', () => {
      const text = 'The nucleus contains DNA and the mitochondria produce energy.';
      const result = processTextAdvanced(text);

      const bioEntities = result.entities.filter(e => e.type === 'biological_structure' || e.type === 'biological_process');
      expect(bioEntities.length).toBeGreaterThan(0);
      expect(bioEntities.some(e => e.text.toLowerCase().includes('nucleus'))).toBe(true);
    });

    it('should identify chemical entities', () => {
      const text = 'ATP is adenosine triphosphate and CO2 is carbon dioxide.';
      const result = processTextAdvanced(text);

      const chemEntities = result.entities.filter(e => e.type === 'chemical_element' || e.type === 'chemical_formula');
      expect(chemEntities.length).toBeGreaterThan(0);
    });

    it('should identify physical concepts', () => {
      const text = 'Velocity is speed with direction and acceleration is the rate of change of velocity.';
      const result = processTextAdvanced(text);

      const physicsEntities = result.entities.filter(e => e.type === 'physical_concept');
      expect(physicsEntities.length).toBeGreaterThan(0);
    });

    it('should identify subject areas', () => {
      const text = 'In biology, cells are the basic units of life. Chemistry studies matter and its changes.';
      const result = processTextAdvanced(text);

      const subjectEntities = result.entities.filter(e => e.type === 'subject');
      expect(subjectEntities.length).toBeGreaterThan(0);
    });
  });

  describe('Sentiment Analysis', () => {
    it('should detect positive sentiment', () => {
      const text = 'This explanation is excellent and very helpful for understanding the concept.';
      const result = processTextAdvanced(text);

      expect(result.sentiment.sentiment).toBe('positive');
      expect(result.sentiment.confidence).toBeGreaterThan(0.5);
    });

    it('should detect negative sentiment', () => {
      const text = 'This is confusing and difficult to understand.';
      const result = processTextAdvanced(text);

      expect(result.sentiment.sentiment).toBe('negative');
      expect(result.sentiment.confidence).toBeGreaterThan(0.5);
    });

    it('should detect neutral sentiment', () => {
      const text = 'Photosynthesis is a process that occurs in plants.';
      const result = processTextAdvanced(text);

      expect(result.sentiment.sentiment).toBe('neutral');
    });

    it('should calculate sentiment scores correctly', () => {
      const text = 'Great explanation! Very clear and helpful.';
      const result = processTextAdvanced(text);

      expect(result.sentiment.scores.positive).toBeGreaterThan(0);
      expect(result.sentiment.scores.negative).toBe(0);
      expect(result.sentiment.scores.total).toBeGreaterThan(0);
    });
  });

  describe('Key Phrase Extraction', () => {
    it('should extract important phrases', () => {
      const text = 'Photosynthesis is the most important process for plant life. It converts light energy into chemical energy.';
      const result = processTextAdvanced(text);

      expect(result.keyPhrases.length).toBeGreaterThan(0);
      expect(result.keyPhrases.some(phrase => phrase.toLowerCase().includes('photosynthesis'))).toBe(true);
    });

    it('should prioritize longer meaningful phrases', () => {
      const text = 'The nucleus is the control center of the cell. It contains DNA and regulates all cellular activities.';
      const result = processTextAdvanced(text);

      expect(result.keyPhrases.some(phrase => phrase.includes('control center'))).toBe(true);
    });

    it('should limit number of key phrases', () => {
      const longText = 'Word '.repeat(100) + ' photosynthesis mitochondria nucleus ribosome endoplasmic reticulum';
      const result = processTextAdvanced(longText);

      expect(result.keyPhrases.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Automatic Summarization', () => {
    it('should generate concise summaries', () => {
      const text = 'Photosynthesis is the process by which plants convert sunlight into energy. This process occurs in the chloroplasts. The energy is stored as glucose. Plants need this energy to grow and survive.';
      const result = processTextAdvanced(text, { summaryLength: 50 });

      expect(result.summary.length).toBeGreaterThan(0);
      expect(result.summary.length).toBeLessThan(text.length);
      expect(result.summary.toLowerCase()).toContain('photosynthesis');
    });

    it('should preserve key information', () => {
      const text = 'Mitosis is cell division that produces two identical daughter cells. It consists of four phases: prophase, metaphase, anaphase, and telophase.';
      const result = processTextAdvanced(text);

      expect(result.summary.toLowerCase()).toMatch(/mitosis|cell division|daughter cells/);
    });

    it('should handle short text appropriately', () => {
      const text = 'DNA is genetic material.';
      const result = processTextAdvanced(text);

      expect(result.summary).toBe(text); // Should return original for very short text
    });
  });

  describe('Readability Analysis', () => {
    it('should calculate readability metrics', () => {
      const text = 'Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize foods. This process involves the conversion of light energy into chemical energy.';
      const result = processTextAdvanced(text);

      expect(result.readability).toHaveProperty('fleschScore');
      expect(result.readability).toHaveProperty('level');
      expect(result.readability).toHaveProperty('metrics');
      expect(result.readability.fleschScore).toBeGreaterThan(0);
    });

    it('should assess text complexity levels', () => {
      const simpleText = 'Plants make food. Sun helps them.';
      const complexText = 'The photosynthetic process involves the conversion of electromagnetic radiation into chemical energy through a series of complex biochemical reactions.';

      const simpleResult = processTextAdvanced(simpleText);
      const complexResult = processTextAdvanced(complexText);

      expect(simpleResult.readability.level).not.toBe(complexResult.readability.level);
    });

    it('should calculate syllable counts accurately', () => {
      const text = 'Photosynthesis requires chlorophyll and sunlight.';
      const result = processTextAdvanced(text);

      expect(result.readability.metrics.totalSyllables).toBeGreaterThan(0);
      expect(result.readability.metrics.avgSyllablesPerWord).toBeGreaterThan(0);
    });
  });

  describe('Concept Extraction and Mapping', () => {
    it('should extract educational concepts', () => {
      const text = 'The nucleus is the control center of the cell. Mitochondria produce energy through respiration.';
      const result = processTextAdvanced(text);

      expect(result.concepts.length).toBeGreaterThan(0);
      expect(result.concepts.some(c => c.term.toLowerCase().includes('nucleus'))).toBe(true);
      expect(result.concepts.some(c => c.term.toLowerCase().includes('mitochondria'))).toBe(true);
    });

    it('should find concept definitions', () => {
      const text = 'Photosynthesis is the process by which plants convert light energy into chemical energy.';
      const result = processTextAdvanced(text);

      const photosynthesisConcept = result.concepts.find(c =>
        c.term.toLowerCase().includes('photosynthesis')
      );
      expect(photosynthesisConcept).toBeDefined();
      expect(photosynthesisConcept.definition).toBeTruthy();
    });

    it('should map concept relationships', () => {
      const text = 'The nucleus controls the cell. Mitochondria provide energy to the cell. Energy from mitochondria helps the nucleus function.';
      const result = processTextAdvanced(text);

      expect(result.relationships.length).toBeGreaterThan(0);
      expect(result.relationships.some(r =>
        r.source.toLowerCase().includes('mitochondria') &&
        r.target.toLowerCase().includes('nucleus')
      )).toBe(true);
    });

    it('should identify different relationship types', () => {
      const text = 'Photosynthesis produces glucose. Glucose is used in respiration. Respiration occurs in mitochondria.';
      const result = processTextAdvanced(text);

      const relationshipTypes = result.relationships.map(r => r.type);
      expect(relationshipTypes.length).toBeGreaterThan(0);
      expect(relationshipTypes.some(type => ['causes', 'part_of', 'related_to'].includes(type))).toBe(true);
    });
  });

  describe('Tokenization with POS', () => {
    it('should provide POS tags for tokens', () => {
      const text = 'The quick brown fox jumps over the lazy dog.';
      const result = processTextAdvanced(text);

      expect(result.tokens.length).toBeGreaterThan(0);
      expect(result.tokens[0]).toHaveProperty('word');
      expect(result.tokens[0]).toHaveProperty('pos');
      expect(result.tokens[0]).toHaveProperty('length');
    });

    it('should identify technical terms', () => {
      const text = 'DNA replication involves RNA polymerase.';
      const result = processTextAdvanced(text);

      const technicalTokens = result.tokens.filter(t => t.isTechnical);
      expect(technicalTokens.length).toBeGreaterThan(0);
      expect(technicalTokens.some(t => t.word.toLowerCase().includes('dna'))).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty text', () => {
      const result = processTextAdvanced('');

      expect(result.tokens).toEqual([]);
      expect(result.entities).toEqual([]);
      expect(result.keyPhrases).toEqual([]);
      expect(result.concepts).toEqual([]);
      expect(result.relationships).toEqual([]);
    });

    it('should handle text with no entities', () => {
      const text = 'This is a simple sentence with no special terms.';
      const result = processTextAdvanced(text);

      expect(result.entities.length).toBe(0);
      expect(result.concepts.length).toBe(0);
    });

    it('should handle very technical text', () => {
      const text = 'ATP ADP NADH NADPH CO2 H2O NaCl KCl Ca2+ Mg2+ DNA RNA mRNA tRNA ribosome endoplasmic reticulum golgi apparatus lysosome vacuole';
      const result = processTextAdvanced(text);

      expect(result.entities.length).toBeGreaterThan(5);
      expect(result.concepts.length).toBeGreaterThan(3);
    });

    it('should handle mixed content types', () => {
      const text = 'In physics, force equals mass times acceleration (F=ma). In biology, cells contain organelles like the nucleus.';
      const result = processTextAdvanced(text);

      expect(result.entities.some(e => e.type === 'physical_concept')).toBe(true);
      expect(result.entities.some(e => e.type === 'biological_structure')).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should process text within reasonable time', () => {
      const text = 'This is a test sentence for performance measurement. '.repeat(50);
      const startTime = performance.now();
      const result = processTextAdvanced(text);
      const endTime = performance.now();

      expect(result.confidence).toBeDefined();
      expect(endTime - startTime).toBeLessThan(500); // Should complete in less than 500ms
    });

    it('should handle large documents', () => {
      const largeText = 'Paragraph. '.repeat(100);
      const result = processTextAdvanced(largeText);

      expect(result).toBeDefined();
      expect(result.tokens.length).toBeGreaterThan(0);
    });
  });
});