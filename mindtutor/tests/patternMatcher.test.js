/**
 * Tests for enhanced patternMatcher.js functionality
 * Tests definition extraction, advanced matching, and NLP features
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  extractDefinitionsFromText,
  findDefinitionsForConcepts,
  findBestMatchWithDefinitions
} from '../src/utils/patternMatcher.js';

describe('Enhanced Pattern Matcher Tests', () => {
  describe('Definition Extraction', () => {
    it('should extract basic definitions', () => {
      const text = 'Photosynthesis is the process by which plants make food. Mitosis is cell division.';
      const definitions = extractDefinitionsFromText(text);

      expect(definitions.length).toBeGreaterThan(0);
      expect(definitions.some(d => d.term.includes('Photosynthesis'))).toBe(true);
      expect(definitions.some(d => d.term.includes('Mitosis'))).toBe(true);
    });

    it('should extract colon definitions', () => {
      const text = 'Nucleus: The control center of the cell. Mitochondria: Energy-producing organelles.';
      const definitions = extractDefinitionsFromText(text);

      expect(definitions.length).toBe(2);
      expect(definitions[0].term).toContain('Nucleus');
      expect(definitions[1].term).toContain('Mitochondria');
    });

    it('should extract technical definitions with units', () => {
      const text = 'Velocity is the rate of change of position measured in meters per second (m/s).';
      const definitions = extractDefinitionsFromText(text);

      expect(definitions.length).toBeGreaterThan(0);
      expect(definitions[0].definition).toContain('m/s');
    });

    it('should handle complex biological definitions', () => {
      const text = 'The nucleus contains the cell\'s DNA and controls cellular activities. Ribosomes are responsible for protein synthesis.';
      const definitions = extractDefinitionsFromText(text);

      expect(definitions.length).toBe(2);
      expect(definitions.every(d => d.confidence > 0)).toBe(true);
    });

    it('should filter low-quality definitions', () => {
      const text = 'A is B. X means Y. This is a very short definition. Here is a much longer and more detailed definition that should be considered higher quality.';
      const definitions = extractDefinitionsFromText(text);

      // Should have some definitions
      expect(definitions.length).toBeGreaterThan(0);

      // Should have varying confidence levels
      const confidences = definitions.map(d => d.confidence);
      const hasVariation = Math.max(...confidences) > Math.min(...confidences);
      expect(hasVariation).toBe(true);
    });
  });

  describe('Concept-Specific Definition Finding', () => {
    it('should find definitions for specific concepts', () => {
      const text = 'Photosynthesis is the process plants use to make food. Respiration is how cells release energy. Osmosis is the movement of water.';
      const concepts = ['photosynthesis', 'osmosis'];

      const definitions = findDefinitionsForConcepts(text, concepts);

      expect(definitions.length).toBe(2);
      expect(definitions.some(d => d.term.toLowerCase().includes('photosynthesis'))).toBe(true);
      expect(definitions.some(d => d.term.toLowerCase().includes('osmosis'))).toBe(true);
    });

    it('should handle case-insensitive matching', () => {
      const text = 'MITOSIS is cell division. meiosis is another type of cell division.';
      const concepts = ['Mitosis', 'MEIOSIS'];

      const definitions = findDefinitionsForConcepts(text, concepts);

      expect(definitions.length).toBe(2);
    });

    it('should return empty array for concepts not in text', () => {
      const text = 'Photosynthesis is a plant process.';
      const concepts = ['quantum physics'];

      const definitions = findDefinitionsForConcepts(text, concepts);

      expect(definitions.length).toBe(0);
    });
  });

  describe('Enhanced Topic Matching with Definitions', () => {
    const mockTopics = {
      biology: {
        topic: 'Cell Biology',
        raw: 'The nucleus is the control center of the cell. Mitochondria are the powerhouses of the cell. Photosynthesis occurs in chloroplasts.',
        concepts: [
          { concept: 'nucleus', definition: 'Control center of the cell' },
          { concept: 'mitochondria', definition: 'Energy-producing organelles' }
        ]
      }
    };

    it('should include definitions in match results', () => {
      const query = 'what is the nucleus';
      const result = findBestMatchWithDefinitions(query, mockTopics);

      expect(result).toHaveProperty('definitions');
      expect(result.definitions.length).toBeGreaterThan(0);
      expect(result.definitions[0].term.toLowerCase()).toContain('nucleus');
    });

    it('should find relevant definitions for technical queries', () => {
      const query = 'explain mitochondria';
      const result = findBestMatchWithDefinitions(query, mockTopics);

      expect(result.definitions.some(d =>
        d.term.toLowerCase().includes('mitochondria') ||
        d.definition.toLowerCase().includes('energy')
      )).toBe(true);
    });

    it('should handle queries without definitions', () => {
      const query = 'general biology question';
      const result = findBestMatchWithDefinitions(query, mockTopics);

      expect(result).toHaveProperty('definitions');
      expect(Array.isArray(result.definitions)).toBe(true);
    });
  });

  describe('Definition Quality Assessment', () => {
    it('should assign higher confidence to clear definitions', () => {
      const clearDef = 'Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize foods with the help of chlorophyll.';
      const vagueDef = 'X is Y.';

      const clearDefs = extractDefinitionsFromText(clearDef);
      const vagueDefs = extractDefinitionsFromText(vagueDef);

      expect(clearDefs[0].confidence).toBeGreaterThan(vagueDefs[0]?.confidence || 0);
    });

    it('should detect definition context', () => {
      const text = 'In biology, the nucleus is the control center of the cell. It contains DNA and regulates cellular activities.';
      const definitions = extractDefinitionsFromText(text);

      expect(definitions[0]).toHaveProperty('context');
      expect(definitions[0].context.length).toBeGreaterThan(definitions[0].definition.length);
    });

    it('should handle multiple definition patterns', () => {
      const text = 'Velocity: The rate of change of position. Acceleration is the rate of change of velocity. Force = mass × acceleration (F=ma).';

      const definitions = extractDefinitionsFromText(text);

      expect(definitions.length).toBe(3);
      expect(definitions.some(d => d.term.includes('Velocity'))).toBe(true);
      expect(definitions.some(d => d.term.includes('Acceleration'))).toBe(true);
      expect(definitions.some(d => d.term.includes('Force'))).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty text', () => {
      const definitions = extractDefinitionsFromText('');
      expect(definitions).toEqual([]);
    });

    it('should prioritize high-confidence definitions', () => {
      const text = 'Photosynthesis is the process by which plants make food. This is a regular sentence. Osmosis is the movement of water.';
      const definitions = extractDefinitionsFromText(text);

      // Should find the actual definitions with higher confidence
      const highConfidenceDefinitions = definitions.filter(d => d.confidence > 0.5);
      expect(highConfidenceDefinitions.length).toBeGreaterThan(0);
      expect(highConfidenceDefinitions.some(d => d.term.includes('Photosynthesis') || d.term.includes('Osmosis'))).toBe(true);
    });

    it('should handle very long definitions', () => {
      const longDef = 'Photosynthesis is ' + 'a'.repeat(300) + '.';
      const definitions = extractDefinitionsFromText(longDef);

      expect(definitions.length).toBeGreaterThan(0);
      expect(definitions[0].definition.length).toBeGreaterThan(200);
    });

    it('should handle special characters in definitions', () => {
      const text = 'ATP is adenosine triphosphate. H2O is water.';
      const definitions = extractDefinitionsFromText(text);

      expect(definitions.length).toBeGreaterThan(0);
      // Check that definitions contain the expected terms
      const atpFound = definitions.some(d => d.term === 'ATP' || d.definition.includes('adenosine'));
      const h2oFound = definitions.some(d => d.term === 'H2O' || d.definition.includes('water'));
      expect(atpFound || h2oFound).toBe(true);
    });
  });
});