// patternMatcher.js - Pattern matching engine for topic detection

import { tokenize } from './utils.js';
// Constants for improved matching
const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'shall', 'and', 'or', 'but', 'if', 'then', 'else', 'when', 'where', 'what', 'how', 'why', 'who', 'which', 'that', 'this', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them']);

const importantTerms = new Set(['nucleus', 'ion', 'velocity', 'osmosis', 'diffusion', 'voltage', 'potential', 'energy', 'force', 'mass', 'charge', 'atom', 'molecule', 'cell', 'organelle', 'mitosis', 'meiosis', 'dna', 'rna', 'protein', 'enzyme', 'photosynthesis', 'respiration']);

const synonyms = {
  'osmosis': ['water diffusion', 'osmotic movement'],
  'voltage': ['electrical potential', 'potential difference'],
  'diffusion': ['passive transport'],
  'mitosis': ['cell division'],
  'photosynthesis': ['light reaction', 'dark reaction'],
  // add more as needed
};

// Cache for tokenized topics
const topicTokenCache = new Map();

// Comprehensive definition extraction patterns
const definitionPatterns = [
  // Standard definition patterns
  /\b([A-Z][a-zA-Z\s]{2,50})\s+(?:is|are|means?|refers?\s+to|represents?|defines?|describes?)\s+([^.!?]+[.!?])/gi,
  /\b([^.!?]+[.!?])\s+(?:is|are|means?|refers?\s+to|represents?|defines?|describes?)\s+([A-Z][a-zA-Z\s]{2,50})/gi,

  // Technical/academic definitions
  /\b([A-Z][a-zA-Z\s]{2,50})\s*:\s*([^.!?]+[.!?])/g,
  /\b([A-Z][a-zA-Z\s]{2,50})\s+-\s+([^.!?]+[.!?])/g,

  // Biological/chemical patterns
  /\b(The\s+)?([a-zA-Z\s]{3,50})\s+(?:is|are)\s+(?:a|an|the)\s+([^.!?]+[.!?])/gi,
  /\b([A-Z][a-zA-Z\s]{2,50})\s+(?:consists?\s+of|comprises?|contains?)\s+([^.!?]+[.!?])/gi,

  // Mathematical patterns
  /\b([A-Z][a-zA-Z\s]{2,50})\s+(?:equals?|is\s+equal\s+to|=)\s+([^.!?]+[.!?])/gi,
  /\b([A-Z][a-zA-Z\s]{2,50})\s+(?:is\s+defined\s+as|is\s+given\s+by)\s+([^.!?]+[.!?])/gi,

  // Process patterns
  /\b([A-Z][a-zA-Z\s]{2,50})\s+(?:occurs?|happens?|takes?\s+place)\s+(?:when|where|how)\s+([^.!?]+[.!?])/gi,
  /\b(During|In)\s+([a-zA-Z\s]{3,50}),\s+([^.!?]+[.!?])/gi,

  // Function patterns
  /\b(The\s+)?([a-zA-Z\s]{3,50})\s+(?:function|role|purpose)\s+(?:is|are)\s+(?:to)\s+([^.!?]+[.!?])/gi,
  /\b([A-Z][a-zA-Z\s]{2,50})\s+(?:helps?|allows?|enables?)\s+([^.!?]+[.!?])/gi,

  // Classification patterns
  /\b([A-Z][a-zA-Z\s]{2,50})\s+(?:belongs?\s+to|is\s+a\s+type\s+of|falls?\s+under)\s+(?:the\s+)?([a-zA-Z\s]{3,50})/gi,
  /\b([A-Z][a-zA-Z\s]{2,50})\s+(?:can\s+be\s+classified|is\s+classified)\s+(?:as)\s+([^.!?]+[.!?])/gi,

  // Property patterns
  /\b([A-Z][a-zA-Z\s]{2,50})\s+(?:has|have|possesses?|exhibits?|shows?|displays?)\s+([^.!?]+[.!?])/gi,
  /\b(The\s+)?([a-zA-Z\s]{3,50})\s+(?:of|in)\s+([a-zA-Z\s]{3,50})\s+(?:is|are)\s+([^.!?]+[.!?])/gi,
];

// Advanced definition extraction with context
function extractDefinitions(text) {
  const definitions = [];
  const lowerText = text.toLowerCase();

  definitionPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      // Extract term and definition based on pattern structure
      let term = '';
      let definition = '';

      if (match[1] && match[2]) {
        term = match[1].trim();
        definition = match[2].trim();
      } else if (match[2] && match[3]) {
        term = match[2].trim();
        definition = match[3].trim();
      }

      if (term && definition && term.length > 2 && definition.length > 10) {
        // Clean up the definition
        definition = definition.replace(/^[,;:\s]+|[,;:\s]+$/g, '');

        // Check for quality indicators
        const qualityScore = calculateDefinitionQuality(term, definition, text);

        definitions.push({
          term: term,
          definition: definition,
          confidence: qualityScore,
          pattern: pattern.source,
          context: getDefinitionContext(text, match.index, 100)
        });
      }
    }
  });

  // Remove duplicates and sort by confidence
  const uniqueDefinitions = definitions.filter((def, index, self) =>
    index === self.findIndex(d => d.term.toLowerCase() === def.term.toLowerCase())
  );

  return uniqueDefinitions.sort((a, b) => b.confidence - a.confidence);
}

// Calculate definition quality score
function calculateDefinitionQuality(term, definition, fullText) {
  let score = 0.5; // Base score

  // Length appropriateness
  if (definition.length > 20 && definition.length < 200) score += 0.2;

  // Contains key indicators
  const qualityIndicators = [
    /\b(is|are|means?|refers?|represents?|defines?)\b/gi,
    /\b(process|function|structure|system|component)\b/gi,
    /\b(used|helps?|allows?|enables?)\b/gi,
    /\b(example|instance|type|kind|form)\b/gi
  ];

  qualityIndicators.forEach(pattern => {
    if (pattern.test(definition)) score += 0.1;
  });

  // Term appears in definition appropriately
  const termWords = term.toLowerCase().split(/\s+/);
  const defWords = definition.toLowerCase().split(/\s+/);
  const termMatches = termWords.filter(word =>
    word.length > 2 && defWords.includes(word)
  ).length;

  if (termMatches > 0 && termMatches <= termWords.length / 2) {
    score += 0.2;
  }

  // Context relevance
  const contextWords = getContextWords(fullText, term);
  const contextRelevance = contextWords.filter(word =>
    defWords.includes(word.toLowerCase())
  ).length / Math.max(contextWords.length, 1);

  score += contextRelevance * 0.2;

  return Math.min(1.0, score);
}

// Get surrounding context for definition
function getDefinitionContext(text, position, radius = 100) {
  const start = Math.max(0, position - radius);
  const end = Math.min(text.length, position + radius);
  return text.substring(start, end).trim();
}

// Get related words from context
function getContextWords(text, term) {
  const sentences = text.split(/[.!?]+/);
  const termLower = term.toLowerCase();

  for (const sentence of sentences) {
    if (sentence.toLowerCase().includes(termLower)) {
      return sentence.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2 && word !== termLower)
        .slice(0, 10);
    }
  }

  return [];
}

// Helper functions
function normalizeToken(token) {
  let normalized = token.toLowerCase();
  normalized = normalized.replace(/s$/, ''); // remove plural
  normalized = normalized.replace(/ing$/, ''); // remove -ing
  normalized = normalized.replace(/ed$/, ''); // remove -ed
  normalized = normalized.replace(/ly$/, ''); // remove -ly
  return normalized;
}


function diceCoefficient(s1, s2) {
  if (s1 === s2) return 1;
  const bigrams1 = new Set();
  for (let i = 0; i < s1.length - 1; i++) {
    bigrams1.add(s1.substr(i, 2));
  }
  const bigrams2 = new Set();
  for (let i = 0; i < s2.length - 1; i++) {
    bigrams2.add(s2.substr(i, 2));
  }
  const intersection = new Set([...bigrams1].filter(x => bigrams2.has(x)));
  const union = bigrams1.size + bigrams2.size;
  return union === 0 ? 0 : (2 * intersection.size) / union;
}

function expandTokensWithSynonyms(tokens) {
  const expanded = new Set(tokens);
  tokens.forEach(token => {
    const norm = normalizeToken(token);
    if (synonyms[norm]) {
      synonyms[norm].forEach(syn => {
        tokenize(syn).forEach(t => expanded.add(t));
      });
    }
  });
  return Array.from(expanded);
}
function getTopicTokens(topicName, topicData) {
  const cacheKey = topicName + JSON.stringify(topicData.keywords || []) + JSON.stringify((topicData.concepts || []).map(c => c.concept));
  if (topicTokenCache.has(cacheKey)) {
    return topicTokenCache.get(cacheKey);
  }
  const tokens = [
    ...tokenize(topicName),
    ...(topicData.keywords || []),
    ...(topicData.concepts || []).map((c) => tokenize(c.concept)).flat(),
  ];
  topicTokenCache.set(cacheKey, tokens);
  return tokens;
}

/**
 * Calculate similarity score between two sets of tokens
 * @param {Array<string>} tokens1 - First set of tokens
 * @param {Array<string>} tokens2 - Second set of tokens
 * @returns {number} - Similarity score (0-1)
 */
function calculateSimilarity(tokens1, tokens2) {
  if (tokens1.length === 0 || tokens2.length === 0) return 0;

  // Process tokens: filter stop words, normalize, expand synonyms
  const processTokens = (tokens) => {
    let processed = tokens.filter(token => !stopWords.has(token.toLowerCase()));
    processed = processed.map(normalizeToken);
    processed = expandTokensWithSynonyms(processed);
    return processed;
  };

  const proc1 = processTokens(tokens1);
  const proc2 = processTokens(tokens2);

  if (proc1.length === 0 || proc2.length === 0) return 0;

  const set1 = new Set(proc1);
  const set2 = new Set(proc2);

  // Calculate Jaccard similarity
  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  const jaccardScore = intersection.size / union.size;

  // Calculate weighted overlap with importance weighting
  let weightedScore = 0;
  let totalWeight = 0;

  proc1.forEach((token) => {
    let weight = 1;
    if (importantTerms.has(token)) weight = 3; // Higher weight for important scientific terms
    totalWeight += weight;
    if (set2.has(token)) {
      weightedScore += weight;
    }
  });

  const normalizedWeighted = totalWeight > 0 ? weightedScore / totalWeight : 0;

  // Fuzzy matching bonus using Dice coefficient
  let fuzzyBonus = 0;
  proc1.forEach((token1) => {
    proc2.forEach((token2) => {
      if (token1.length > 3 && token2.length > 3) {
        const dice = diceCoefficient(token1, token2);
        if (dice > 0.6) { // Threshold for fuzzy match
          fuzzyBonus += dice * 0.1;
        }
      }
    });
  });
  fuzzyBonus = Math.min(fuzzyBonus, 0.3); // Cap at 0.3

  // Combine all scores
  return Math.min(1, jaccardScore * 0.3 + normalizedWeighted * 0.4 + fuzzyBonus * 0.3);
}

/**
 * Find the best matching topic for a user query
 * @param {string} query - User's question or input
 * @param {Object} topics - All available topics
 * @returns {Object} - { topic: topicObject, score: number, topicName: string }
 */
export function findBestMatch(query, topics) {
  if (!query || !topics || Object.keys(topics).length === 0) {
    return { topic: null, score: 0, topicName: null };
  }

  const queryTokens = tokenize(query);

  if (queryTokens.length === 0) {
    return { topic: null, score: 0, topicName: null };
  }

  let bestMatch = { topic: null, score: 0, topicName: null };

  Object.entries(topics).forEach(([topicName, topicData]) => {
    const topicTokens = getTopicTokens(topicName, topicData);

    const score = calculateSimilarity(queryTokens, topicTokens);

    // Boost score if query contains exact topic name
    const queryLower = query.toLowerCase();
    const topicNameLower = topicName.toLowerCase();
    let adjustedScore = score;

    if (
      queryLower.includes(topicNameLower) ||
      topicNameLower.includes(queryLower)
    ) {
      adjustedScore = Math.min(1, score + 0.3);
    }

    // Additional boost for concept matches
    const conceptMatches = (topicData.concepts || []).filter((c) =>
      queryTokens.some((token) => {
        const normToken = normalizeToken(token);
        const normConcept = normalizeToken(c.concept);
        return normConcept === normToken || diceCoefficient(normToken, normConcept) > 0.8;
      })
    );

    if (conceptMatches.length > 0) {
      adjustedScore = Math.min(1, adjustedScore + 0.2);
    }

    // Boost for keyword matches
    const keywordMatches = (topicData.keywords || []).filter((kw) =>
      queryTokens.some((token) => {
        const normToken = normalizeToken(token);
        const normKw = normalizeToken(kw);
        return normKw === normToken || diceCoefficient(normToken, normKw) > 0.8;
      })
    );

    if (keywordMatches.length > 0) {
      adjustedScore = Math.min(1, adjustedScore + 0.1);
    }

    // CRITICAL FIX: Check if query terms appear in the raw content
    // This ensures topics are matched even for specific concepts like "osmosis"
    const rawContent = (topicData.raw || '').toLowerCase();
    const contentMatches = queryTokens.filter((token) =>
      rawContent.includes(normalizeToken(token))
    );

    if (contentMatches.length > 0) {
      // Strong boost for content matches - this is key for concept-specific queries
      adjustedScore = Math.min(1, adjustedScore + 0.4);
    }

    // Additional boost for exact concept name matches in content
    const exactConceptMatches = (topicData.concepts || []).filter((c) => {
      const normQuery = normalizeToken(queryLower.replace(/what is|what are|define|explain/gi, '').trim());
      const normConcept = normalizeToken(c.concept);
      return normQuery.includes(normConcept) || normConcept.includes(normQuery) || diceCoefficient(normQuery, normConcept) > 0.9;
    });

    if (exactConceptMatches.length > 0) {
      adjustedScore = Math.min(1, adjustedScore + 0.3);
    }

    if (adjustedScore > bestMatch.score) {
      bestMatch = { topic: topicData, score: adjustedScore, topicName };
    }

  });

  return bestMatch;
}

/**
 * Check if a match score is good enough (threshold: 0.1)
 * @param {number} score - Similarity score
 * @returns {boolean} - Whether the match is acceptable
 */
export function isGoodMatch(score) {
  return score >= 0.1;
}

/**
 * Get all topics ranked by relevance to query
 * @param {string} query - User's question
 * @param {Object} topics - All available topics
 * @param {number} limit - Maximum number of results
 * @returns {Array} - Array of { topicName, score, topic }
 */
export function getRankedTopics(query, topics, limit = 5) {
  if (!query || !topics || Object.keys(topics).length === 0) {
    return [];
  }

  const queryTokens = tokenize(query);

  if (queryTokens.length === 0) {
    return [];
  }

  const results = [];

  Object.entries(topics).forEach(([topicName, topicData]) => {
    const topicTokens = getTopicTokens(topicName, topicData);

    const score = calculateSimilarity(queryTokens, topicTokens);

    results.push({ topicName, score, topic: topicData });
  });

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * Extract definitions from text content
 * @param {string} text - Text to extract definitions from
 * @returns {Array} - Array of definition objects with term, definition, confidence, and context
 */
export function extractDefinitionsFromText(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  return extractDefinitions(text);
}

/**
 * Find definitions related to specific concepts
 * @param {string} text - Text to search in
 * @param {string[]} concepts - Concepts to find definitions for
 * @returns {Array} - Array of matching definitions
 */
export function findDefinitionsForConcepts(text, concepts) {
  if (!text || !concepts || !Array.isArray(concepts)) {
    return [];
  }

  const allDefinitions = extractDefinitions(text);
  const conceptLower = concepts.map(c => c.toLowerCase());

  return allDefinitions.filter(def =>
    conceptLower.some(concept =>
      def.term.toLowerCase().includes(concept) ||
      concept.includes(def.term.toLowerCase())
    )
  );
}

/**
 * Enhanced topic matching that considers definitions
 * @param {string} query - User's question
 * @param {Object} topics - Available topics
 * @returns {Object} - Enhanced match result with definition context
 */
export function findBestMatchWithDefinitions(query, topics) {
  const baseMatch = findBestMatch(query, topics);

  if (!baseMatch.topic || !baseMatch.topic.raw) {
    return baseMatch;
  }

  // Extract definitions from the matched topic
  const definitions = extractDefinitions(baseMatch.topic.raw);

  // Find definitions relevant to the query
  const queryTokens = tokenize(query);
  const relevantDefinitions = definitions.filter(def =>
    queryTokens.some(token =>
      def.term.toLowerCase().includes(token) ||
      def.definition.toLowerCase().includes(token)
    )
  );

  return {
    ...baseMatch,
    definitions: relevantDefinitions.slice(0, 3), // Top 3 relevant definitions
    definitionCount: definitions.length
  };
}

export default findBestMatch;
