/**
 * Document Processor - Advanced AI-powered document processing system
 * Handles OCR, PDF text extraction, and multimodal content analysis
 */

import * as pdfjsLib from 'pdfjs-dist';
import { trackAIOperation } from './performanceMonitor';

// Configure PDF.js worker safely
(async () => {
  try {
    // Try to import the worker URL
    const module = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
    const pdfjsWorker = module.default;
    console.log('PDF.js version:', pdfjsLib.version);
    console.log('Setting worker src to:', pdfjsWorker);
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
    console.log('Worker src set successfully');
  } catch (error) {
    console.warn('Failed to load PDF.js worker from Vite, using CDN fallback:', error.message);
    // Fallback: try to use CDN worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.mjs';
  }
})();

// Performance-optimized caching
const processingCache = new Map();
const CACHE_SIZE_LIMIT = 50;
const CACHE_TTL = 3600000; // 1 hour

function getCacheKey(file, options = {}) {
  return `${file.name || 'unknown'}_${file.size}_${file.lastModified}_${JSON.stringify(options)}`;
}

function cleanupCache() {
  const now = Date.now();
  for (const [key, entry] of processingCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      processingCache.delete(key);
    }
  }

  // Enforce size limit
  if (processingCache.size > CACHE_SIZE_LIMIT) {
    const entries = Array.from(processingCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = entries.slice(0, processingCache.size - CACHE_SIZE_LIMIT);
    toRemove.forEach(([key]) => processingCache.delete(key));
  }
}

// Performance monitoring
const docProcessingLog = {
  ocr: [],
  pdf: [],
  image: [],
  multimodal: []
};

function logDocProcessing(category, operation, data) {
  const entry = {
    timestamp: new Date().toISOString(),
    category,
    operation,
    ...data
  };

  if (!docProcessingLog[category]) {
    docProcessingLog[category] = [];
  }

  docProcessingLog[category].push(entry);

  // Keep only last 500 entries per category
  if (docProcessingLog[category].length > 500) {
    docProcessingLog[category] = docProcessingLog[category].slice(-500);
  }

  console.log(`📄 Document Processing [${category}:${operation}]:`, data);
}

/**
 * Advanced OCR Engine with multiple language support and preprocessing
 */
export class OCREngine {
  constructor() {
    this.worker = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    const startTime = performance.now();
    try {
      // Dynamically import tesseract.js to avoid bundling issues
      const { createWorker } = await import('tesseract.js');
      this.worker = await createWorker();
      await this.worker.loadLanguage('eng');
      await this.worker.initialize('eng');

      // Load additional languages for better recognition
      await this.worker.loadLanguage('spa+fra+deu');
      await this.worker.initialize('spa+fra+deu');

      this.isInitialized = true;

      logDocProcessing('ocr', 'initialize', {
        processingTime: performance.now() - startTime,
        languages: ['eng', 'spa', 'fra', 'deu'],
        status: 'success'
      });
    } catch (error) {
      logDocProcessing('ocr', 'initialize', {
        processingTime: performance.now() - startTime,
        error: error.message,
        status: 'failed'
      });
      throw error;
    }
  }

  async processImage(imageFile, options = {}) {
    const startTime = performance.now();
    await this.initialize();

    try {
      const {
        language = 'eng',
        preprocess = true,
        confidence = 60
      } = options;

      // Preprocessing for better OCR accuracy
      let processedImage = imageFile;
      if (preprocess) {
        processedImage = await this.preprocessImage(imageFile);
      }

      const { data: { text, confidence: ocrConfidence, words } } = await this.worker.recognize(processedImage);

      // Filter results by confidence
      const highConfidenceWords = words.filter(word => word.confidence > confidence);

      const result = {
        text: text.trim(),
        confidence: ocrConfidence,
        words: highConfidenceWords,
        language,
        preprocessing: preprocess,
        wordCount: text.split(/\s+/).filter(w => w.length > 0).length
      };

      logDocProcessing('ocr', 'processImage', {
        processingTime: performance.now() - startTime,
        inputSize: imageFile.size,
        outputLength: text.length,
        confidence: ocrConfidence,
        wordCount: result.wordCount,
        language
      });

      return result;
    } catch (error) {
      logDocProcessing('ocr', 'processImage', {
        processingTime: performance.now() - startTime,
        error: error.message,
        status: 'failed'
      });
      throw error;
    }
  }

  async preprocessImage(imageFile) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Resize for better OCR performance
        const maxWidth = 2000;
        const maxHeight = 2000;
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Apply preprocessing filters
        ctx.filter = 'contrast(1.2) brightness(1.1) grayscale(1)';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(resolve, 'image/png');
      };
      img.src = URL.createObjectURL(imageFile);
    });
  }

  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }
}

/**
 * Advanced PDF Processing Engine
 */
export class PDFProcessor {
  constructor() {
    this.pdfDocument = null;
  }

  async loadPDF(pdfFile) {
    const startTime = performance.now();

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      this.pdfDocument = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      const info = await this.pdfDocument.getMetadata();

      logDocProcessing('pdf', 'loadPDF', {
        processingTime: performance.now() - startTime,
        pageCount: this.pdfDocument.numPages,
        title: info.info?.Title || 'Unknown',
        author: info.info?.Author || 'Unknown',
        fileSize: pdfFile.size
      });

      return {
        pageCount: this.pdfDocument.numPages,
        metadata: info.info,
        outline: await this.pdfDocument.getOutline()
      };
    } catch (error) {
      logDocProcessing('pdf', 'loadPDF', {
        processingTime: performance.now() - startTime,
        error: error.message,
        status: 'failed'
      });
      throw error;
    }
  }

  async extractText(options = {}) {
    if (!this.pdfDocument) throw new Error('PDF not loaded');

    const startTime = performance.now();
    const {
      startPage = 1,
      endPage = this.pdfDocument.numPages,
      includeMetadata = true
    } = options;

    const extractedText = [];
    const pageTexts = [];

    for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
      const page = await this.pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();

      const pageText = textContent.items
        .map(item => item.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      pageTexts.push({
        pageNumber: pageNum,
        text: pageText,
        wordCount: pageText.split(/\s+/).filter(w => w.length > 0).length
      });

      extractedText.push(pageText);
    }

    const fullText = extractedText.join('\n\n');
    const result = {
      fullText,
      pageTexts,
      totalPages: pageTexts.length,
      totalWords: fullText.split(/\s+/).filter(w => w.length > 0).length,
      metadata: includeMetadata ? await this.pdfDocument.getMetadata() : null
    };

    logDocProcessing('pdf', 'extractText', {
      processingTime: performance.now() - startTime,
      pagesProcessed: pageTexts.length,
      totalWords: result.totalWords,
      avgWordsPerPage: result.totalWords / pageTexts.length
    });

    return result;
  }

  async extractImages(options = {}) {
    if (!this.pdfDocument) throw new Error('PDF not loaded');

    const startTime = performance.now();
    const { maxImages = 10 } = options;

    const images = [];

    for (let pageNum = 1; pageNum <= Math.min(this.pdfDocument.numPages, 5); pageNum++) {
      const page = await this.pdfDocument.getPage(pageNum);

      try {
        const ops = await page.getOperatorList();
        const imagesOnPage = [];

        for (let i = 0; i < ops.fnArray.length; i++) {
          if (ops.fnArray[i] === pdfjsLib.OPS.paintImageXObject) {
            const imgIndex = ops.argsArray[i][0];
            const img = page.objs.get(imgIndex);

            if (img && img.width > 100 && img.height > 100) {
              imagesOnPage.push({
                pageNumber: pageNum,
                width: img.width,
                height: img.height,
                data: img.data
              });
            }
          }
        }

        images.push(...imagesOnPage);
        if (images.length >= maxImages) break;
      } catch (error) {
        console.warn(`Error extracting images from page ${pageNum}:`, error);
      }
    }

    logDocProcessing('pdf', 'extractImages', {
      processingTime: performance.now() - startTime,
      imagesFound: images.length,
      pagesScanned: Math.min(this.pdfDocument.numPages, 5)
    });

    return images;
  }
}

/**
 * Multimodal Content Processor - Combines OCR, PDF, and text analysis
 */
export class MultimodalProcessor {
  constructor() {
    this.ocrEngine = new OCREngine();
    this.pdfProcessor = new PDFProcessor();
  }

  async processFile(file, options = {}) {
    const startTime = performance.now();
    const fileType = this.detectFileType(file);
    const cacheKey = getCacheKey(file, options);

    // Check cache first
    const cachedResult = processingCache.get(cacheKey);
    if (cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_TTL) {
      trackAIOperation('documentProcessing', {
        operation: 'cache_hit',
        fileType,
        fileSize: file.size,
        cachedAge: Date.now() - cachedResult.timestamp
      });
      return cachedResult.data;
    }

    let result;

    try {
      switch (fileType) {
        case 'pdf':
          result = await this.processPDF(file, options);
          break;
        case 'image':
          result = await this.processImage(file, options);
          break;
        case 'text':
          result = await this.processText(file, options);
          break;
        default:
          throw new Error(`Unsupported file type: ${file.type}`);
      }

      // Enhanced content analysis with performance tracking
      const analysisStart = performance.now();
      result.analysis = await this.analyzeContent(result.content, options);
      const analysisTime = performance.now() - analysisStart;

      const processingTime = performance.now() - startTime;

      // Cache the result
      processingCache.set(cacheKey, {
        timestamp: Date.now(),
        data: result
      });

      // Cleanup cache periodically
      if (processingCache.size % 10 === 0) {
        cleanupCache();
      }

      logDocProcessing('multimodal', 'processFile', {
        processingTime,
        analysisTime,
        fileType,
        fileSize: file.size,
        contentLength: result.content.length,
        analysis: result.analysis,
        cached: false
      });

      trackAIOperation('documentProcessing', {
        operation: 'process_file',
        fileType,
        fileSize: file.size,
        processingTime,
        analysisTime,
        contentLength: result.content.length
      });

      return result;
    } catch (error) {
      logDocProcessing('multimodal', 'processFile', {
        processingTime: performance.now() - startTime,
        fileType,
        error: error.message,
        status: 'failed'
      });

      trackAIOperation('documentProcessing', {
        operation: 'process_error',
        fileType,
        fileSize: file.size,
        error: error.message,
        processingTime: performance.now() - startTime
      });

      throw error;
    }
  }

  detectFileType(file) {
    if (file.type === 'application/pdf') return 'pdf';
    if (file.type.startsWith('image/')) return 'image';
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) return 'text';
    return 'unknown';
  }

  async processPDF(file, options) {
    await this.pdfProcessor.loadPDF(file);
    const textResult = await this.pdfProcessor.extractText(options);

    return {
      type: 'pdf',
      content: textResult.fullText,
      metadata: {
        pageCount: textResult.totalPages,
        wordCount: textResult.totalWords,
        pdfMetadata: textResult.metadata
      },
      pages: textResult.pageTexts
    };
  }

  async processImage(file, options) {
    const ocrResult = await this.ocrEngine.processImage(file, options);

    return {
      type: 'image',
      content: ocrResult.text,
      metadata: {
        confidence: ocrResult.confidence,
        wordCount: ocrResult.wordCount,
        language: ocrResult.language
      },
      ocr: ocrResult
    };
  }

  async processText(file, options) {
    let text;
    if (typeof file.text === 'function') {
      text = await file.text();
    } else {
      text = await file.text();
    }

    return {
      type: 'text',
      content: text,
      metadata: {
        wordCount: text.split(/\s+/).filter(w => w.length > 0).length,
        lineCount: text.split('\n').length
      }
    };
  }

  async analyzeContent(content, options) {
    const analysis = {
      readability: this.calculateReadability(content),
      topics: this.extractTopics(content),
      complexity: this.assessComplexity(content),
      structure: this.analyzeStructure(content),
      learningPotential: this.assessLearningPotential(content),
      quality: this.assessContentQuality(content)
    };

    // Add suggestions after analysis is complete
    analysis.suggestions = this.generateImprovementSuggestions(content, analysis);

    return analysis;
  }

  calculateReadability(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const syllables = this.countSyllables(text);

    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;

    // Flesch Reading Ease Score
    const fleschScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);

    return {
      fleschScore: Math.max(0, Math.min(100, fleschScore)),
      avgWordsPerSentence,
      avgSyllablesPerWord,
      level: fleschScore > 60 ? 'easy' : fleschScore > 30 ? 'medium' : 'difficult'
    };
  }

  countSyllables(text) {
    const words = text.toLowerCase().split(/\s+/);
    let syllables = 0;

    words.forEach(word => {
      word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
      word = word.replace(/^y/, '');
      const matches = word.match(/[aeiouy]{1,2}/g);
      syllables += matches ? matches.length : 1;
    });

    return syllables;
  }

  extractTopics(text) {
    const topics = [];
    const lowerText = text.toLowerCase();

    // Academic subject detection
    const subjects = {
      mathematics: /\b(math|algebra|calculus|geometry|statistics|equation|theorem|proof)\b/gi,
      biology: /\b(biology|cell|dna|protein|organism|evolution|ecosystem|photosynthesis)\b/gi,
      chemistry: /\b(chemistry|atom|molecule|reaction|acid|base|compound|element)\b/gi,
      physics: /\b(physics|force|energy|motion|gravity|electricity|magnetism|quantum)\b/gi,
      history: /\b(history|civilization|empire|revolution|war|treaty|dynasty)\b/gi,
      literature: /\b(literature|novel|poem|drama|character|plot|theme|author)\b/gi
    };

    Object.entries(subjects).forEach(([subject, pattern]) => {
      if (pattern.test(lowerText)) {
        const matches = lowerText.match(pattern);
        topics.push({
          subject,
          relevance: matches ? matches.length : 0
        });
      }
    });

    return topics.sort((a, b) => b.relevance - a.relevance);
  }

  assessComplexity(text) {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const longWords = words.filter(w => w.length > 6).length;
    const technicalTerms = this.detectTechnicalTerms(text);

    return {
      technicalDensity: technicalTerms.length / words.length,
      longWordRatio: longWords / words.length,
      vocabulary: this.assessVocabulary(text),
      technicalTerms: technicalTerms.slice(0, 10)
    };
  }

  detectTechnicalTerms(text) {
    const technicalPatterns = [
      /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g, // Proper nouns
      /\b\w+(?:-(?:\w+))+\b/g, // Hyphenated terms
      /\b\w+_\w+\b/g, // Underscore terms
      /\b\d+(?:\.\d+)?\s*[a-zA-Z]+\b/g, // Units and measurements
    ];

    const terms = new Set();
    technicalPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => terms.add(match));
      }
    });

    return Array.from(terms);
  }

  assessVocabulary(text) {
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const uniqueWords = new Set(words);
    const vocabularyRichness = uniqueWords.size / words.length;

    return {
      uniqueWords: uniqueWords.size,
      totalWords: words.length,
      richness: vocabularyRichness,
      level: vocabularyRichness > 0.6 ? 'advanced' : vocabularyRichness > 0.4 ? 'intermediate' : 'basic'
    };
  }

  analyzeStructure(text) {
    const lines = text.split('\n');
    const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);

    return {
      lineCount: lines.length,
      paragraphCount: paragraphs.length,
      avgParagraphLength: text.length / paragraphs.length,
      hasHeadings: /#{1,6}\s/.test(text),
      hasLists: /^[\s]*[-\*\+]|\d+\./m.test(text),
      hasCode: /```|`[^`]+`/.test(text)
    };
  }

  assessLearningPotential(text) {
    const indicators = {
      explanatory: /\b(because|therefore|thus|hence|consequently)\b/gi,
      comparative: /\b(compare|contrast|versus|similar|different)\b/gi,
      procedural: /\b(step|first|then|next|finally)\b/gi,
      definitional: /\b(is|are|means|refers to|defined as)\b/gi,
      analytical: /\b(analyze|evaluate|assess|critique)\b/gi
    };

    const scores = {};
    Object.entries(indicators).forEach(([type, pattern]) => {
      const matches = text.match(pattern);
      scores[type] = matches ? matches.length : 0;
    });

    const totalIndicators = Object.values(scores).reduce((sum, val) => sum + val, 0);

    return {
      scores,
      totalIndicators,
      learningType: this.determineLearningType(scores),
      potential: totalIndicators > 10 ? 'high' : totalIndicators > 5 ? 'medium' : 'low'
    };
  }

  determineLearningType(scores) {
    const maxScore = Math.max(...Object.values(scores));
    const dominantType = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0];

    return dominantType || 'general';
  }

  /**
   * Comprehensive content quality assessment
   */
  assessContentQuality(content) {
    const quality = {
      overall: 0,
      scores: {},
      metrics: {},
      grade: 'F',
      strengths: [],
      weaknesses: []
    };

    // Content length and density
    quality.metrics.contentLength = content.length;
    quality.metrics.wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    quality.metrics.sentenceCount = content.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

    // Definition quality (20% weight)
    const definitionScore = this.assessDefinitionQuality(content);
    quality.scores.definitions = definitionScore.score;
    quality.metrics.definitions = definitionScore.metrics;

    // Concept clarity (20% weight)
    const clarityScore = this.assessConceptClarity(content);
    quality.scores.clarity = clarityScore.score;
    quality.metrics.clarity = clarityScore.metrics;

    // Structure and organization (15% weight)
    const structureScore = this.assessStructureQuality(content);
    quality.scores.structure = structureScore.score;
    quality.metrics.structure = structureScore.metrics;

    // Educational value (15% weight)
    const educationalScore = this.assessEducationalValue(content);
    quality.scores.educational = educationalScore.score;
    quality.metrics.educational = educationalScore.metrics;

    // Technical accuracy (15% weight)
    const accuracyScore = this.assessTechnicalAccuracy(content);
    quality.scores.accuracy = accuracyScore.score;
    quality.metrics.accuracy = accuracyScore.metrics;

    // Engagement and readability (15% weight)
    const engagementScore = this.assessEngagement(content);
    quality.scores.engagement = engagementScore.score;
    quality.metrics.engagement = engagementScore.metrics;

    // Calculate overall score
    quality.overall = (
      quality.scores.definitions * 0.20 +
      quality.scores.clarity * 0.20 +
      quality.scores.structure * 0.15 +
      quality.scores.educational * 0.15 +
      quality.scores.accuracy * 0.15 +
      quality.scores.engagement * 0.15
    );

    // Assign grade
    if (quality.overall >= 90) quality.grade = 'A';
    else if (quality.overall >= 80) quality.grade = 'B';
    else if (quality.overall >= 70) quality.grade = 'C';
    else if (quality.overall >= 60) quality.grade = 'D';
    else quality.grade = 'F';

    // Identify strengths and weaknesses
    quality.strengths = this.identifyStrengths(quality.scores);
    quality.weaknesses = this.identifyWeaknesses(quality.scores);

    return quality;
  }

  /**
   * Assess definition quality
   */
  assessDefinitionQuality(content) {
    const metrics = {
      definitionCount: 0,
      clearDefinitions: 0,
      ambiguousDefinitions: 0,
      missingDefinitions: 0
    };

    // Count definitions using various patterns
    const definitionPatterns = [
      /\b([A-Z][a-zA-Z\s]{2,30})\s+(?:is|are|means?|refers?\s+to|represents?|defines?)\s+([^.!?]+[.!?])/gi,
      /\b([A-Z][a-zA-Z\s]{2,30})\s*:\s*([^.!?]+[.!?])/g,
      /\b([^.!?]+[.!?])\s+(?:is|are|means?|refers?\s+to|represents?|defines?)\s+([A-Z][a-zA-Z\s]{2,30})/gi
    ];

    let totalDefinitions = 0;
    let clearDefinitions = 0;

    definitionPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        totalDefinitions += matches.length;
        // Assess clarity of each definition
        matches.forEach(match => {
          if (this.isClearDefinition(match)) {
            clearDefinitions++;
          }
        });
      }
    });

    metrics.definitionCount = totalDefinitions;
    metrics.clearDefinitions = clearDefinitions;
    metrics.ambiguousDefinitions = totalDefinitions - clearDefinitions;

    // Check for undefined technical terms
    const technicalTerms = this.findTechnicalTerms(content);
    const definedTerms = this.findDefinedTerms(content);
    metrics.missingDefinitions = technicalTerms.filter(term =>
      !definedTerms.some(defined => defined.toLowerCase().includes(term.toLowerCase()))
    ).length;

    const score = totalDefinitions > 0 ?
      (clearDefinitions / totalDefinitions) * 80 + (technicalTerms.length - metrics.missingDefinitions) / Math.max(technicalTerms.length, 1) * 20 :
      30; // Base score for content with no definitions

    return { score: Math.min(100, score), metrics };
  }

  /**
   * Check if a definition is clear
   */
  isClearDefinition(definitionText) {
    const lower = definitionText.toLowerCase();

    // Clear indicators
    const clearIndicators = [
      /\b(is|are|means?|refers?|represents?|defines?)\b.*\b(process|structure|function|system|component|element|part)\b/i,
      /\b(occurs?|happens?|takes?\s+place|located|found)\b.*\b(when|where|how|in|on|at)\b/i,
      /\b(helps?|allows?|enables?|causes?|produces?|results?\s+in)\b/i,
      /\b(example|instance|type|kind|form|variety)\b.*\b(of|called)\b/i
    ];

    return clearIndicators.some(pattern => pattern.test(lower)) &&
           definitionText.length > 20 &&
           definitionText.length < 200;
  }

  /**
   * Find technical terms in content
   */
  findTechnicalTerms(content) {
    const technicalPatterns = [
      /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g, // Proper nouns
      /\b\w+(?:-(?:\w+))+\b/g, // Hyphenated terms
      /\b\d+(?:\.\d+)?\s*[a-zA-Z%°℃℉]+(?:\s*\/\s*\d+(?:\.\d+)?\s*[a-zA-Z%°℃℉]+)?\b/g, // Units
      /\b(?:DNA|RNA|ATP|ADP|NADPH|NADH|CO2|H2O|NaCl|KCl|Ca2\+|Mg2\+)\b/gi, // Molecules
      /\b(?:mitosis|meiosis|photosynthesis|respiration|diffusion|osmosis)\b/gi, // Processes
      /\b(?:velocity|acceleration|force|energy|power|work|momentum)\b/gi // Physics
    ];

    const terms = new Set();
    technicalPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => terms.add(match));
      }
    });

    return Array.from(terms);
  }

  /**
   * Find defined terms in content
   */
  findDefinedTerms(content) {
    const definedTerms = new Set();

    // Extract terms that appear before "is", "are", "means", etc.
    const definitionStarters = /\b([A-Z][a-zA-Z\s]{2,30})\s+(?:is|are|means?|refers?\s+to|represents?|defines?)\s+/gi;
    let match;
    while ((match = definitionStarters.exec(content)) !== null) {
      definedTerms.add(match[1].trim());
    }

    // Extract terms after colons
    const colonDefinitions = /\b([A-Z][a-zA-Z\s]{2,30})\s*:/g;
    while ((match = colonDefinitions.exec(content)) !== null) {
      definedTerms.add(match[1].trim());
    }

    return Array.from(definedTerms);
  }

  /**
   * Assess concept clarity
   */
  assessConceptClarity(content) {
    const metrics = {
      jargonDensity: 0,
      explanationDepth: 0,
      analogyUsage: 0,
      exampleCount: 0
    };

    const words = content.split(/\s+/).filter(w => w.length > 0);
    const technicalTerms = this.findTechnicalTerms(content);

    metrics.jargonDensity = technicalTerms.length / words.length;

    // Check for explanations
    const explanationIndicators = /\b(because|therefore|thus|hence|so|as a result|consequently|for example|such as|like|similar to|compared to)\b/gi;
    metrics.explanationDepth = (content.match(explanationIndicators) || []).length / words.length * 100;

    // Check for analogies
    const analogyIndicators = /\b(like|similar to|compared to|think of it as|imagine|picture|visualize)\b/gi;
    metrics.analogyUsage = (content.match(analogyIndicators) || []).length;

    // Count examples
    const exampleIndicators = /\b(for example|such as|e\.g\.|example|instance|case)\b/gi;
    metrics.exampleCount = (content.match(exampleIndicators) || []).length;

    // Calculate score based on balance of technical terms and explanations
    let score = 50; // Base score

    if (metrics.jargonDensity < 0.05) score -= 20; // Too simple
    else if (metrics.jargonDensity > 0.15) score -= 10; // Too technical

    if (metrics.explanationDepth > 2) score += 20; // Good explanations
    if (metrics.analogyUsage > 0) score += 15; // Uses analogies
    if (metrics.exampleCount > 2) score += 15; // Has examples

    return { score: Math.max(0, Math.min(100, score)), metrics };
  }

  /**
   * Assess structure quality
   */
  assessStructureQuality(content) {
    const metrics = {
      hasIntroduction: false,
      hasConclusion: false,
      logicalFlow: 0,
      sectionOrganization: 0,
      transitionWords: 0
    };

    const lowerContent = content.toLowerCase();
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // Check for introduction indicators
    const introIndicators = /\b(introduction|overview|background|first|initially|to begin with)\b/i;
    metrics.hasIntroduction = introIndicators.test(content.substring(0, Math.min(500, content.length)));

    // Check for conclusion indicators
    const conclusionIndicators = /\b(conclusion|summary|finally|in conclusion|to sum up|overall)\b/i;
    metrics.hasConclusion = conclusionIndicators.test(content.substring(Math.max(0, content.length - 500)));

    // Assess logical flow with transition words
    const transitionWords = /\b(however|therefore|thus|hence|consequently|furthermore|moreover|additionally|similarly|likewise|in contrast|on the other hand|as a result|because|since|due to|first|second|third|next|then|finally|lastly)\b/gi;
    metrics.transitionWords = (content.match(transitionWords) || []).length;

    // Check for section organization (headings, lists)
    metrics.sectionOrganization = (
      (content.includes('#') ? 1 : 0) + // Markdown headings
      (content.match(/^\d+\./gm) ? 1 : 0) + // Numbered lists
      (content.match(/^[-*+]/gm) ? 1 : 0) + // Bullet lists
      (content.match(/\b(?:chapter|section|part)\s+\d+/gi) ? 1 : 0) // Section headers
    );

    // Assess logical flow based on sentence connections
    let logicalConnections = 0;
    for (let i = 1; i < sentences.length; i++) {
      const prevSentence = sentences[i-1].toLowerCase();
      const currSentence = sentences[i].toLowerCase();

      // Check if sentences are logically connected
      if (transitionWords.test(prevSentence) ||
          /\b(this|these|those|it|they|he|she)\b/.test(currSentence)) {
        logicalConnections++;
      }
    }
    metrics.logicalFlow = logicalConnections / Math.max(1, sentences.length - 1);

    const score = (
      (metrics.hasIntroduction ? 15 : 0) +
      (metrics.hasConclusion ? 15 : 0) +
      (metrics.transitionWords > 5 ? 20 : metrics.transitionWords * 4) +
      (metrics.sectionOrganization * 10) +
      (metrics.logicalFlow * 40)
    );

    return { score: Math.min(100, score), metrics };
  }

  /**
   * Assess educational value
   */
  assessEducationalValue(content) {
    const metrics = {
      learningObjectives: 0,
      assessmentOpportunities: 0,
      practicalApplications: 0,
      criticalThinking: 0,
      realWorldConnections: 0
    };

    const lowerContent = content.toLowerCase();

    // Learning objectives indicators
    const objectiveIndicators = /\b(learn|understand|know|able to|can|will be able to|students will|by the end)\b/gi;
    metrics.learningObjectives = (content.match(objectiveIndicators) || []).length;

    // Assessment opportunities
    const assessmentIndicators = /\b(quiz|test|question|exercise|practice|check|assess|evaluate)\b/gi;
    metrics.assessmentOpportunities = (content.match(assessmentIndicators) || []).length;

    // Practical applications
    const applicationIndicators = /\b(apply|use|implement|practice|demonstrate|show|create|build|design)\b/gi;
    metrics.practicalApplications = (content.match(applicationIndicators) || []).length;

    // Critical thinking
    const thinkingIndicators = /\b(analyze|evaluate|compare|contrast|critique|solve|decide|justify|explain why|what if)\b/gi;
    metrics.criticalThinking = (content.match(thinkingIndicators) || []).length;

    // Real world connections
    const realWorldIndicators = /\b(real world|everyday|daily life|practical|industry|career|job|profession|application|use in)\b/gi;
    metrics.realWorldConnections = (content.match(realWorldIndicators) || []).length;

    const score = Math.min(100,
      (metrics.learningObjectives * 2) +
      (metrics.assessmentOpportunities * 3) +
      (metrics.practicalApplications * 2) +
      (metrics.criticalThinking * 4) +
      (metrics.realWorldConnections * 3)
    );

    return { score, metrics };
  }

  /**
   * Assess technical accuracy
   */
  assessTechnicalAccuracy(content) {
    const metrics = {
      factualStatements: 0,
      citations: 0,
      disclaimers: 0,
      contradictions: 0,
      precision: 0
    };

    // Count factual indicators
    const factualIndicators = /\b(is|are|was|were|has|have|does|do|can|cannot|will|would|should|must)\b[^.!?]*[.!?]/gi;
    metrics.factualStatements = (content.match(factualIndicators) || []).length;

    // Check for citations
    const citationPatterns = [
      /\(\s*\d{4}\s*\)/g, // (2023)
      /\b(?:according to|as stated by|research shows|studies indicate|data from)\b/gi,
      /\b(?:source|reference|cited|literature)\b/gi
    ];
    metrics.citations = citationPatterns.reduce((count, pattern) =>
      count + (content.match(pattern) || []).length, 0);

    // Check for accuracy disclaimers
    const disclaimerPatterns = /\b(?:approximately|about|roughly|generally|typically|usually|often|sometimes|may|might|could|can|possibly)\b/gi;
    metrics.disclaimers = (content.match(disclaimerPatterns) || []).length;

    // Check for precision in measurements and quantities
    const precisionPatterns = [
      /\b\d+(?:\.\d+)?\s*(?:m|cm|mm|km|g|kg|mg|s|min|h|°C|°F|K|N|J|W|V|A|Hz|Pa)\b/gi, // Units
      /\b\d+(?:\.\d+)?\s*(?:percent|%)\b/gi, // Percentages
      /\b(?:exactly|precisely|specifically|clearly|definitely|certainly)\b/gi // Precision words
    ];
    metrics.precision = precisionPatterns.reduce((count, pattern) =>
      count + (content.match(pattern) || []).length, 0);

    // Simple contradiction detection (basic)
    const contradictionPatterns = [
      /\b(but|however|although|despite|in contrast|on the other hand|yet|nevertheless)\b/gi
    ];
    metrics.contradictions = contradictionPatterns.reduce((count, pattern) =>
      count + (content.match(pattern) || []).length, 0);

    const score = Math.min(100,
      40 + // Base accuracy score
      (metrics.factualStatements * 0.5) +
      (metrics.citations * 5) +
      (metrics.disclaimers * 2) +
      (metrics.precision * 3) -
      (metrics.contradictions * 2)
    );

    return { score: Math.max(0, score), metrics };
  }

  /**
   * Assess engagement and readability
   */
  assessEngagement(content) {
    const metrics = {
      questionCount: 0,
      imperativeSentences: 0,
      personalPronouns: 0,
      emotionalWords: 0,
      variety: 0
    };

    // Count questions
    metrics.questionCount = (content.match(/\?/g) || []).length;

    // Count imperative sentences (commands)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    metrics.imperativeSentences = sentences.filter(s =>
      /^\s*(consider|think|imagine|remember|note|notice|see|look|watch|listen|try|practice)/i.test(s.trim())
    ).length;

    // Count personal pronouns (engagement)
    const personalPronouns = /\b(you|your|we|us|our|let's|imagine|think|consider)\b/gi;
    metrics.personalPronouns = (content.match(personalPronouns) || []).length;

    // Count emotional/engaging words
    const emotionalWords = /\b(amazing|awesome|exciting|interesting|fascinating|surprising|important|crucial|essential|vital|key|critical|wonderful|great|excellent|brilliant|clever|smart|clever|ingenious)\b/gi;
    metrics.emotionalWords = (content.match(emotionalWords) || []).length;

    // Assess sentence variety
    const avgSentenceLength = content.length / sentences.length;
    const sentenceLengthVariance = sentences.reduce((sum, s) => {
      const diff = s.length - avgSentenceLength;
      return sum + (diff * diff);
    }, 0) / sentences.length;
    metrics.variety = Math.sqrt(sentenceLengthVariance) / avgSentenceLength; // Coefficient of variation

    const score = Math.min(100,
      (metrics.questionCount * 5) +
      (metrics.imperativeSentences * 3) +
      (metrics.personalPronouns * 2) +
      (metrics.emotionalWords * 4) +
      (metrics.variety * 20)
    );

    return { score, metrics };
  }

  /**
   * Identify content strengths
   */
  identifyStrengths(scores) {
    const strengths = [];

    if (scores.definitions > 80) strengths.push('Excellent definition quality');
    else if (scores.definitions > 60) strengths.push('Good definition coverage');

    if (scores.clarity > 80) strengths.push('Very clear concept explanations');
    else if (scores.clarity > 60) strengths.push('Clear and understandable content');

    if (scores.structure > 80) strengths.push('Well-organized structure');
    else if (scores.structure > 60) strengths.push('Good content organization');

    if (scores.educational > 80) strengths.push('High educational value');
    else if (scores.educational > 60) strengths.push('Strong learning focus');

    if (scores.accuracy > 80) strengths.push('High technical accuracy');
    else if (scores.accuracy > 60) strengths.push('Good factual accuracy');

    if (scores.engagement > 80) strengths.push('Highly engaging content');
    else if (scores.engagement > 60) strengths.push('Engaging presentation');

    return strengths;
  }

  /**
   * Identify content weaknesses
   */
  identifyWeaknesses(scores) {
    const weaknesses = [];

    if (scores.definitions < 40) weaknesses.push('Poor definition quality - needs clearer explanations');
    else if (scores.definitions < 60) weaknesses.push('Limited definition coverage');

    if (scores.clarity < 40) weaknesses.push('Unclear explanations - needs simplification');
    else if (scores.clarity < 60) weaknesses.push('Concept clarity could be improved');

    if (scores.structure < 40) weaknesses.push('Poor organization - needs better structure');
    else if (scores.structure < 60) weaknesses.push('Structure could be improved');

    if (scores.educational < 40) weaknesses.push('Low educational value - needs learning objectives');
    else if (scores.educational < 60) weaknesses.push('Educational focus could be strengthened');

    if (scores.accuracy < 40) weaknesses.push('Technical accuracy issues - needs fact-checking');
    else if (scores.accuracy < 60) weaknesses.push('Accuracy could be improved');

    if (scores.engagement < 40) weaknesses.push('Low engagement - needs more interactive elements');
    else if (scores.engagement < 60) weaknesses.push('Engagement could be enhanced');

    return weaknesses;
  }

  /**
   * Generate improvement suggestions
   */
  generateImprovementSuggestions(content, analysis) {
    const suggestions = {
      critical: [],
      important: [],
      optional: []
    };

    const quality = analysis.quality;

    // Critical improvements (score < 40)
    if (quality.scores.definitions < 40) {
      suggestions.critical.push('Add clear definitions for technical terms and concepts');
    }
    if (quality.scores.clarity < 40) {
      suggestions.critical.push('Simplify complex explanations and add analogies');
    }
    if (quality.scores.structure < 40) {
      suggestions.critical.push('Reorganize content with clear sections and logical flow');
    }

    // Important improvements (score 40-60)
    if (quality.scores.definitions >= 40 && quality.scores.definitions < 60) {
      suggestions.important.push('Enhance definition completeness and clarity');
    }
    if (quality.scores.educational >= 40 && quality.scores.educational < 60) {
      suggestions.important.push('Add learning objectives and assessment opportunities');
    }
    if (quality.scores.accuracy >= 40 && quality.scores.accuracy < 60) {
      suggestions.important.push('Verify technical accuracy and add citations where needed');
    }

    // Optional improvements (score 60-80)
    if (quality.scores.engagement >= 60 && quality.scores.engagement < 80) {
      suggestions.optional.push('Add more engaging elements like questions and examples');
    }
    if (quality.scores.structure >= 60 && quality.scores.structure < 80) {
      suggestions.optional.push('Improve transitions and section organization');
    }

    // General suggestions based on content type
    if (content.length < 500) {
      suggestions.important.push('Content is quite short - consider expanding with more details and examples');
    } else if (content.length > 5000) {
      suggestions.optional.push('Content is lengthy - consider breaking into smaller, focused sections');
    }

    // Specific suggestions based on metrics
    if (quality.metrics.definitions?.missingDefinitions > 0) {
      suggestions.important.push(`Define ${quality.metrics.definitions.missingDefinitions} undefined technical terms`);
    }

    if (quality.metrics.clarity?.analogyUsage === 0) {
      suggestions.optional.push('Consider adding analogies to make concepts more relatable');
    }

    if (quality.metrics.engagement?.questionCount === 0) {
      suggestions.optional.push('Add questions to increase learner engagement');
    }

    return suggestions;
  }

  async cleanup() {
    await this.ocrEngine.terminate();
  }
}

// Singleton instance
export const multimodalProcessor = new MultimodalProcessor();

// Export performance logs
export function getDocProcessingLogs() {
  return { ...docProcessingLog };
}

export function clearDocProcessingLogs() {
  Object.keys(docProcessingLog).forEach(key => {
    docProcessingLog[key] = [];
  });
}