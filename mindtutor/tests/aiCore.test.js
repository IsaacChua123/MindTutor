import { describe, it, expect } from 'vitest';
import * as aiCore from '../src/utils/utils.js';

describe('aiCore module tests', () => {
  describe('sanitizeText', () => {
    it('should trim and lowercase the input text', () => {
      expect(aiCore.sanitizeText('  Hello World  ')).toBe('hello world');
    });

    it('should return empty string for non-string input', () => {
      expect(aiCore.sanitizeText(null)).toBe('');
      expect(aiCore.sanitizeText(undefined)).toBe('');
      expect(aiCore.sanitizeText(123)).toBe('');
    });
  });

  describe('containsPattern', () => {
    it('should detect string pattern in text', () => {
      expect(aiCore.containsPattern('this is a test', 'test')).toBe(true);
      expect(aiCore.containsPattern('no match here', 'fail')).toBe(false);
    });

    it('should detect regex pattern in text', () => {
      expect(aiCore.containsPattern('abc123xyz', /\d+/)).toBe(true);
      expect(aiCore.containsPattern('abcxyz', /\d+/)).toBe(false);
    });

    it('should handle invalid inputs gracefully', () => {
      expect(aiCore.containsPattern(null, 'test')).toBe(false);
      expect(aiCore.containsPattern('test', null)).toBe(false);
    });
  });

  describe('extractConcepts', () => {
    it('should extract meaningful concepts from text', () => {
      const text = 'The biology of cells includes the nucleus, mitochondria, and membrane.';
      const concepts = aiCore.extractConcepts(text);
      expect(concepts).toContain('biology');
      expect(concepts).toContain('cells');
      expect(concepts).toContain('nucleus');
      expect(concepts).toContain('mitochondria');
      expect(concepts).toContain('membrane');
      expect(concepts).not.toContain('the');
      expect(concepts).not.toContain('of');
    });

    it('should return empty array for empty or non-string input', () => {
      expect(aiCore.extractConcepts('')).toEqual([]);
      expect(aiCore.extractConcepts(null)).toEqual([]);
    });
  });

  describe('detectIntent', () => {
    it('should detect various user intents correctly', () => {
      expect(aiCore.detectIntent('Can you help me?')).toBe('request_help');
      expect(aiCore.detectIntent('Give me a quiz')).toBe('request_quiz');
      expect(aiCore.detectIntent('I need a hint')).toBe('request_hint');
      expect(aiCore.detectIntent('Please repeat that')).toBe('request_repeat');
      expect(aiCore.detectIntent('No, that is wrong')).toBe('negative_feedback');
      expect(aiCore.detectIntent('This is unrelated text')).toBe(null);
    });

    it('should return null for empty or null input', () => {
      expect(aiCore.detectIntent(null)).toBe(null);
      expect(aiCore.detectIntent('')).toBe(null);
    });
  });

  describe('generateResponse', () => {
    it('should generate appropriate responses based on intent', () => {
      const userId = 'user123';
      const concepts = ['biology', 'cells'];

      expect(aiCore.generateResponse(userId, 'request_help', concepts)).toContain('explain');
      expect(aiCore.generateResponse(userId, 'request_quiz', concepts)).toContain('quiz');
      expect(aiCore.generateResponse(userId, 'request_hint', concepts)).toContain('hint');
      expect(aiCore.generateResponse(userId, 'request_repeat', concepts)).toContain('Repeating');
      expect(aiCore.generateResponse(userId, 'negative_feedback', concepts)).toContain('different approach');
      expect(aiCore.generateResponse(userId, 'unknown_intent', concepts)).toContain('assist you');
    });

    it('should return empty string if userId or intent missing', () => {
      expect(aiCore.generateResponse('', 'request_help', ['concept'])).toBe('');
      expect(aiCore.generateResponse('user', '', ['concept'])).toBe('');
    });
  });

  describe('findMatches', () => {
    it('should find matches for regex in text', () => {
      const text = 'abc 123 xyz 456';
      const matches = aiCore.findMatches(text, /\d+/g);
      expect(matches).toEqual(['123', '456']);
    });

    it('should return empty array for no matches or invalid inputs', () => {
      expect(aiCore.findMatches('text', /nomatch/)).toEqual([]);
      expect(aiCore.findMatches(null, /\d+/)).toEqual([]);
      expect(aiCore.findMatches('text', null)).toEqual([]);
    });
  });

  describe('scoreHelpfulness', () => {
    it('should score helpfulness based on response length', () => {
      expect(aiCore.scoreHelpfulness('')).toBe(0);
      expect(aiCore.scoreHelpfulness('short')).toBeCloseTo(0.05, 2);
      expect(aiCore.scoreHelpfulness('a'.repeat(100))).toBe(1);
      expect(aiCore.scoreHelpfulness('a'.repeat(200))).toBe(1);
    });
  });

  describe('recognizePattern', () => {
    it('should detect cause and effect pattern', () => {
      const text = 'This happened because of that.';
      const patternInfo = aiCore.recognizePattern(text);
      expect(patternInfo).not.toBeNull();
      expect(patternInfo.patternName).toBe('cause_effect');
    });

    it('should return null if no pattern matched', () => {
      const text = 'Random unrelated text.';
      expect(aiCore.recognizePattern(text)).toBeNull();
      expect(aiCore.recognizePattern('')).toBeNull();
      expect(aiCore.recognizePattern(null)).toBeNull();
    });
  });

  describe('validateTextInput', () => {
    it('should validate non-empty string inputs', () => {
      expect(aiCore.validateTextInput('valid')).toBe(true);
      expect(aiCore.validateTextInput('')).toBe(false);
      expect(aiCore.validateTextInput('   ')).toBe(false);
      expect(aiCore.validateTextInput(null)).toBe(false);
      expect(aiCore.validateTextInput(undefined)).toBe(false);
      expect(aiCore.validateTextInput(123)).toBe(false);
    });
  });
});
