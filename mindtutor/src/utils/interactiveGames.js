// interactiveGames.js - AI-powered interactive game and lesson generation system

/**
 * Analyze topic content and suggest the best interactive games
 * @param {Object} topic - Topic object with concepts, keywords, and raw text
 * @returns {Array} - Array of suggested interactive game configurations
 */
export function suggestInteractiveGames(topic) {
  const { concepts, keywords, raw } = topic;
  const suggestions = [];

  // Safety check for raw content
  const safeRaw = raw || '';

  // Analyze topic characteristics
  const topicType = analyzeTopicType(keywords, safeRaw);
  const conceptCount = concepts.length;
  const hasProcesses = detectProcesses(safeRaw);
  const hasRelationships = detectRelationships(safeRaw);
  const hasDefinitions = concepts.some(
    (c) => c.definition && c.definition.length > 20
  );

  // Suggest games based on topic analysis
  if (topicType === 'biology' || topicType === 'science') {
    // Biology/Science topics often benefit from simulations
    if (hasProcesses && conceptCount >= 3) {
      suggestions.push(createSimulationGame(concepts, raw));
    }

    // Definitions work well with flashcards
    if (hasDefinitions && conceptCount >= 2) {
      suggestions.push(createFlashcardGame(concepts));
    }

    // Relationships work well with matching games
    if (hasRelationships) {
      suggestions.push(createMatchingGame(concepts, keywords));
    }
  }

  if (topicType === 'history' || topicType === 'literature') {
    // Timeline or sequence games for chronological content
    if (hasProcesses || detectSequences(raw)) {
      suggestions.push(createTimelineGame(concepts));
    }

    // Character/term association games
    if (conceptCount >= 3) {
      suggestions.push(createAssociationGame(concepts));
    }
  }

  if (topicType === 'mathematics' || topicType === 'logic') {
    // Problem-solving simulations
    if (hasProcesses) {
      suggestions.push(createProblemSolvingGame(concepts, raw));
    }

    // Formula/equation matching
    if (detectEquations(raw)) {
      suggestions.push(createEquationGame(concepts));
    }
  }

  // Always suggest analogies if we have enough concepts
  if (conceptCount >= 2) {
    suggestions.push(createAnalogyGame(concepts));
  }

  // Limit to 3 most suitable games, filter out nulls
  return suggestions.filter((game) => game !== null).slice(0, 3);
}

/**
 * Analyze what type of topic this is based on keywords and content
 */
function analyzeTopicType(keywords, raw) {
  const text = ((raw || '') + ' ' + (keywords || []).join(' ')).toLowerCase();

  if (
    text.includes('cell') ||
    text.includes('biology') ||
    text.includes('organism') ||
    text.includes('dna')
  ) {
    return 'biology';
  }
  if (
    text.includes('math') ||
    text.includes('equation') ||
    text.includes('formula') ||
    text.includes('calculate')
  ) {
    return 'mathematics';
  }
  if (
    text.includes('history') ||
    text.includes('century') ||
    text.includes('war') ||
    text.includes('king')
  ) {
    return 'history';
  }
  if (
    text.includes('physics') ||
    text.includes('force') ||
    text.includes('energy') ||
    text.includes('motion')
  ) {
    return 'physics';
  }
  if (
    text.includes('chemistry') ||
    text.includes('reaction') ||
    text.includes('atom') ||
    text.includes('molecule')
  ) {
    return 'chemistry';
  }

  return 'general';
}

/**
 * Detect if the content describes processes or sequences
 */
function detectProcesses(raw) {
  if (!raw) return false;
  const processIndicators = [
    'process',
    'stage',
    'step',
    'phase',
    'cycle',
    'sequence',
    'first',
    'then',
    'next',
    'finally',
  ];
  const text = raw.toLowerCase();
  return processIndicators.some((indicator) => text.includes(indicator));
}

/**
 * Detect relationships between concepts
 */
function detectRelationships(raw) {
  if (!raw) return false;
  const relationshipIndicators = [
    'relationship',
    'connection',
    'link',
    'between',
    'related',
    'associate',
    'connect',
  ];
  const text = raw.toLowerCase();
  return relationshipIndicators.some((indicator) => text.includes(indicator));
}

/**
 * Detect sequences or timelines
 */
function detectSequences(raw) {
  if (!raw) return false;
  const sequenceIndicators = [
    'timeline',
    'chronological',
    'sequence',
    'order',
    'before',
    'after',
    'during',
    'century',
    'year',
  ];
  const text = raw.toLowerCase();
  return sequenceIndicators.some((indicator) => text.includes(indicator));
}

/**
 * Detect mathematical equations
 */
function detectEquations(raw) {
  if (!raw) return false;
  const equationIndicators = [
    'equation',
    'formula',
    '=',
    '+',
    '-',
    '×',
    '÷',
    '²',
    '³',
  ];
  const text = raw.toLowerCase();
  return equationIndicators.some((indicator) => text.includes(indicator));
}

/**
 * Create a simulation game for processes
 */
function createSimulationGame(concepts, _raw) {
  // Extract process steps from raw text
  const safeRaw = _raw || '';
  const sentences = safeRaw.split(/[.!?]+/).filter((s) => s.trim().length > 20);
  const processSteps = sentences
    .filter((s) =>
      /first|second|third|then|next|finally|step|process|stage/i.test(s)
    )
    .slice(0, 5);

  return {
    type: 'simulation',
    title: 'Interactive Process Simulation',
    description: 'Experience how this process works step by step',
    suitability: 0.9,
    content: {
      scenario: `Let's simulate the ${concepts[0]?.concept.toLowerCase()} process. Make decisions at each step!`,
      steps: processSteps.map((step) => ({
        description: step.trim(),
        choices: ['Continue', 'Pause', 'Skip'],
        correctChoice: 0,
        explanation: `This step is crucial in the ${concepts[0]?.concept.toLowerCase()} process.`,
      })),
    },
  };
}

/**
 * Create diverse flashcards based on concept analysis
 */
function createFlashcardGame(concepts) {
  const flashcards = [];

  concepts.slice(0, 8).forEach((concept, index) => {
    const questionTypes = generateQuestionVariations(
      concept.concept,
      concept.definition
    );

    // Add 1-2 questions per concept for variety
    const numQuestions = Math.min(
      questionTypes.length,
      Math.max(1, 3 - Math.floor(index / 2))
    );
    const selectedQuestions = questionTypes.slice(0, numQuestions);

    selectedQuestions.forEach((question) => {
      flashcards.push({
        front: question.question,
        back: question.answer,
      });
    });
  });

  // Shuffle the flashcards for variety
  for (let i = flashcards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [flashcards[i], flashcards[j]] = [flashcards[j], flashcards[i]];
  }

  return {
    type: 'flashcards',
    title: 'Interactive Knowledge Check',
    description: 'Test your understanding with varied question types',
    suitability: 0.8,
    content: flashcards.slice(0, 10), // Limit to 10 questions max
  };
}

/**
 * Generate different types of questions for a concept
 */
function generateQuestionVariations(conceptName, definition) {
  const questions = [];
  const concept = conceptName.toLowerCase();
  const def = definition.toLowerCase();

  // Basic definition question
  questions.push({
    question: `What is ${conceptName}?`,
    answer:
      definition.substring(0, 200) + (definition.length > 200 ? '...' : ''),
  });

  // Function/Role questions
  if (
    def.includes('function') ||
    def.includes('role') ||
    def.includes('purpose') ||
    def.includes('responsible for')
  ) {
    questions.push({
      question: `What is the main function of ${conceptName}?`,
      answer:
        definition.substring(0, 180) + (definition.length > 180 ? '...' : ''),
    });
  }

  // Process questions
  if (
    def.includes('process') ||
    def.includes('stage') ||
    def.includes('step') ||
    def.includes('cycle')
  ) {
    questions.push({
      question: `Describe the ${concept} process.`,
      answer:
        definition.substring(0, 180) + (definition.length > 180 ? '...' : ''),
    });
  }

  // Importance/Significance questions
  if (
    def.includes('important') ||
    def.includes('significant') ||
    def.includes('key') ||
    def.includes('essential')
  ) {
    questions.push({
      question: `Why is ${conceptName} important?`,
      answer:
        definition.substring(0, 180) + (definition.length > 180 ? '...' : ''),
    });
  }

  // Example questions
  if (
    def.includes('example') ||
    def.includes('such as') ||
    def.includes('like') ||
    def.includes('including')
  ) {
    questions.push({
      question: `Give an example of ${conceptName}.`,
      answer:
        definition.substring(0, 180) + (definition.length > 180 ? '...' : ''),
    });
  }

  // Characteristic questions
  if (
    def.includes('characteristic') ||
    def.includes('feature') ||
    def.includes('property') ||
    def.includes('composed of')
  ) {
    questions.push({
      question: `What are the key characteristics of ${conceptName}?`,
      answer:
        definition.substring(0, 180) + (definition.length > 180 ? '...' : ''),
    });
  }

  // Discovery/History questions
  if (
    def.includes('discovered') ||
    def.includes('developed') ||
    def.includes('created') ||
    def.includes('scientist')
  ) {
    questions.push({
      question: `Who discovered ${conceptName} and when?`,
      answer:
        definition.substring(0, 180) + (definition.length > 180 ? '...' : ''),
    });
  }

  // Comparison questions
  if (
    def.includes('different') ||
    def.includes('similar') ||
    def.includes('compared') ||
    def.includes('unlike')
  ) {
    questions.push({
      question: `How does ${conceptName} compare to related concepts?`,
      answer:
        definition.substring(0, 180) + (definition.length > 180 ? '...' : ''),
    });
  }

  // Application questions
  if (
    def.includes('used') ||
    def.includes('applied') ||
    def.includes('helps') ||
    def.includes('enables')
  ) {
    questions.push({
      question: `How is ${conceptName} used in real life?`,
      answer:
        definition.substring(0, 180) + (definition.length > 180 ? '...' : ''),
    });
  }

  // Structure questions
  if (
    def.includes('made of') ||
    def.includes('consists') ||
    def.includes('composed') ||
    def.includes('structure')
  ) {
    questions.push({
      question: `What is the structure of ${conceptName}?`,
      answer:
        definition.substring(0, 180) + (definition.length > 180 ? '...' : ''),
    });
  }

  // If we don't have many specific questions, add some general variations
  if (questions.length < 2) {
    questions.push({
      question: `Explain ${conceptName} in your own words.`,
      answer:
        definition.substring(0, 180) + (definition.length > 180 ? '...' : ''),
    });

    questions.push({
      question: `What are the main points about ${conceptName}?`,
      answer:
        definition.substring(0, 180) + (definition.length > 180 ? '...' : ''),
    });
  }

  return questions;
}

/**
 * Create a matching game for relationships
 */
function createMatchingGame(concepts, _keywords) {
  const pairs = concepts.slice(0, 4).map((concept) => ({
    term: concept.concept,
    definition: concept.definition.substring(0, 100) + '...',
  }));

  return {
    type: 'matching',
    title: 'Match Terms to Definitions',
    description: 'Connect concepts with their explanations',
    suitability: 0.7,
    content: {
      title: 'Match each concept with its correct definition',
      pairs: pairs,
    },
  };
}

/**
 * Create a timeline game for sequences
 */
function createTimelineGame(concepts) {
  const events = concepts.map((concept, index) => ({
    year: 2024 - (concepts.length - index) * 10, // Arbitrary timeline
    event: concept.concept,
    description: concept.definition.substring(0, 80) + '...',
  }));

  return {
    type: 'timeline',
    title: 'Historical Timeline',
    description: 'Arrange events in chronological order',
    suitability: 0.6,
    content: {
      title: 'Drag and drop events in the correct chronological order',
      events: events,
    },
  };
}

/**
 * Create an association game
 */
function createAssociationGame(concepts) {
  const associations = concepts.slice(0, 4).map((concept) => ({
    item: concept.concept,
    category: 'Key Concepts',
    explanation: concept.definition.substring(0, 100),
  }));

  return {
    type: 'association',
    title: 'Concept Association',
    description: 'Connect related ideas and concepts',
    suitability: 0.7,
    content: {
      title: 'Which concepts are most closely related?',
      associations: associations,
    },
  };
}

/**
 * Create a problem-solving simulation
 */
function createProblemSolvingGame(concepts, _raw) {
  const safeConcepts = concepts || [];
  const firstConcept = safeConcepts[0]?.concept || 'this topic';

  return {
    type: 'problem_solving',
    title: 'Problem-Solving Challenge',
    description: 'Apply concepts to solve real-world problems',
    suitability: 0.8,
    content: {
      scenario: `You're faced with a problem involving ${firstConcept.toLowerCase()}. How would you solve it?`,
      problem: `Given the principles of ${firstConcept.toLowerCase()}, how would you approach this situation?`,
      steps: safeConcepts
        .slice(0, 3)
        .map((concept) => concept?.concept || 'Unknown concept'),
      solution: `Apply the concepts of ${safeConcepts.map((c) => c?.concept || 'Unknown').join(', ')} in sequence.`,
    },
  };
}

/**
 * Create an equation matching game
 */
function createEquationGame(concepts) {
  const equations = concepts
    .filter((c) => c.definition.includes('=') || c.definition.includes('→'))
    .slice(0, 3)
    .map((concept) => ({
      equation: concept.concept,
      description: concept.definition,
    }));

  if (equations.length === 0) {
    return null; // Not suitable for this topic
  }

  return {
    type: 'equation_matching',
    title: 'Equation Builder',
    description: 'Construct and understand mathematical relationships',
    suitability: 0.9,
    content: {
      title: 'Match equations with their descriptions',
      equations: equations,
    },
  };
}

/**
 * Create an analogy game based on topic content
 */
function createAnalogyGame(concepts) {
  const concept = concepts[0];
  if (!concept) return null;

  // Get appropriate analogies based on concept type
  const analogies = getConceptAnalogies(concept.concept, concept.definition);

  if (analogies.length === 0) return null;

  const selectedAnalogy =
    analogies[Math.floor(Math.random() * analogies.length)];

  return {
    type: 'analogy',
    title: `${selectedAnalogy.category} Analogy Challenge`,
    description: `Find the best analogy for ${concept.concept}`,
    suitability: 0.8,
    content: {
      question: `What would ${concept.concept} be in ${selectedAnalogy.context}?`,
      analogy: selectedAnalogy.context,
      options: selectedAnalogy.options.map((option) => ({
        text: option.text,
        correct: option.correct,
        explanation: option.explanation,
      })),
    },
  };
}

/**
 * Get appropriate analogies based on concept type and content
 */
function getConceptAnalogies(conceptName, definition) {
  const concept = conceptName.toLowerCase();
  const def = definition.toLowerCase();

  // Scientific discoveries and inventions
  if (
    concept.includes('discovery') ||
    concept.includes('theory') ||
    concept.includes('law') ||
    concept.includes('principle') ||
    def.includes('scientist') ||
    def.includes('discovered')
  ) {
    return [
      {
        category: 'Scientific Discovery',
        context: 'a research laboratory',
        options: [
          {
            text: 'The groundbreaking experiment',
            correct: true,
            explanation:
              'The discovery represents the key breakthrough that changed scientific understanding.',
          },
          {
            text: 'The laboratory equipment',
            correct: false,
            explanation:
              'Equipment are tools used in research, not the discovery itself.',
          },
          {
            text: 'The research funding',
            correct: false,
            explanation: "Funding enables research but isn't the discovery.",
          },
          {
            text: 'The lab coffee machine',
            correct: false,
            explanation:
              'The coffee machine is unrelated to the scientific work.',
          },
        ],
      },
    ];
  }

  // Periodic table specifically
  if (
    concept.includes('periodic table') ||
    concept.includes('periodic') ||
    def.includes('elements') ||
    def.includes('mendeleev')
  ) {
    return [
      {
        category: 'Chemistry',
        context: 'a vast library of books',
        options: [
          {
            text: 'The card catalog system',
            correct: true,
            explanation:
              'The periodic table organizes elements systematically, just like a library catalog organizes books.',
          },
          {
            text: 'A single encyclopedia volume',
            correct: false,
            explanation:
              "A single volume can't organize all elements like the periodic table does.",
          },
          {
            text: 'The library checkout desk',
            correct: false,
            explanation:
              'The checkout desk manages access, not organization of content.',
          },
          {
            text: 'The library parking lot',
            correct: false,
            explanation:
              'The parking lot is unrelated to content organization.',
          },
        ],
      },
    ];
  }

  // Biological concepts (original analogies)
  if (
    concept.includes('cell') ||
    concept.includes('mitochondria') ||
    concept.includes('nucleus') ||
    concept.includes('membrane') ||
    def.includes('organelle') ||
    def.includes('biology')
  ) {
    return [
      {
        category: 'Cell Biology',
        context: 'a bustling city',
        options: [
          {
            text: 'Power plant',
            correct: concept.includes('mitochondria'),
            explanation: 'Mitochondria generate energy like a power plant.',
          },
          {
            text: 'City hall',
            correct: concept.includes('nucleus'),
            explanation:
              'The nucleus controls the cell like city hall controls the city.',
          },
          {
            text: 'City walls',
            correct: concept.includes('membrane'),
            explanation:
              'The cell membrane protects the cell like walls protect a city.',
          },
          {
            text: 'Traffic lights',
            correct: false,
            explanation:
              "Traffic lights control flow but don't represent core cell structures.",
          },
        ],
      },
      {
        category: 'Cell Biology',
        context: 'a factory',
        options: [
          {
            text: 'Assembly line',
            correct:
              concept.includes('ribosome') || concept.includes('protein'),
            explanation:
              'Ribosomes assemble proteins like factory assembly lines.',
          },
          {
            text: 'Power generator',
            correct: concept.includes('mitochondria'),
            explanation:
              'Mitochondria generate energy like factory power generators.',
          },
          {
            text: 'Factory manager',
            correct: concept.includes('nucleus'),
            explanation:
              'The nucleus directs cell activities like a factory manager.',
          },
          {
            text: 'Parking lot',
            correct: false,
            explanation:
              'Parking lots are storage areas, not core factory functions.',
          },
        ],
      },
    ];
  }

  // Chemical concepts
  if (
    concept.includes('atom') ||
    concept.includes('molecule') ||
    concept.includes('reaction') ||
    concept.includes('bond') ||
    def.includes('chemistry') ||
    def.includes('chemical')
  ) {
    return [
      {
        category: 'Chemistry',
        context: 'a molecular kitchen',
        options: [
          {
            text: 'The basic ingredients',
            correct: concept.includes('atom') || concept.includes('element'),
            explanation:
              'Atoms and elements are the fundamental ingredients that make up all matter.',
          },
          {
            text: 'The recipe instructions',
            correct:
              concept.includes('reaction') || concept.includes('process'),
            explanation:
              'Chemical reactions are like recipes that show how ingredients combine.',
          },
          {
            text: 'The measuring cups',
            correct: concept.includes('bond') || concept.includes('compound'),
            explanation:
              'Chemical bonds hold atoms together like measuring tools ensure proper proportions.',
          },
          {
            text: 'The kitchen timer',
            correct: false,
            explanation:
              "The timer measures time but doesn't represent the core chemical components.",
          },
        ],
      },
    ];
  }

  // Physical concepts
  if (
    concept.includes('force') ||
    concept.includes('energy') ||
    concept.includes('motion') ||
    concept.includes('gravity') ||
    def.includes('physics')
  ) {
    return [
      {
        category: 'Physics',
        context: 'a sports game',
        options: [
          {
            text: 'The playing field',
            correct: concept.includes('space') || concept.includes('field'),
            explanation: 'Physical fields define the space where forces act.',
          },
          {
            text: 'The ball in motion',
            correct: concept.includes('motion') || concept.includes('velocity'),
            explanation: 'Moving objects demonstrate physical principles.',
          },
          {
            text: 'The referee',
            correct: concept.includes('law') || concept.includes('principle'),
            explanation:
              'Physical laws govern behavior like referees govern games.',
          },
          {
            text: 'The crowd cheering',
            correct: false,
            explanation:
              'Crowd reactions are external, not core physical principles.',
          },
        ],
      },
    ];
  }

  // Mathematical concepts
  if (
    concept.includes('equation') ||
    concept.includes('function') ||
    concept.includes('theorem') ||
    def.includes('mathematics') ||
    def.includes('calculate')
  ) {
    return [
      {
        category: 'Mathematics',
        context: 'a recipe book',
        options: [
          {
            text: 'The ingredients list',
            correct: concept.includes('variable') || concept.includes('number'),
            explanation:
              'Variables and numbers are like ingredients in a recipe.',
          },
          {
            text: 'The cooking instructions',
            correct:
              concept.includes('equation') || concept.includes('function'),
            explanation:
              'Equations and functions provide step-by-step procedures.',
          },
          {
            text: 'The cookbook index',
            correct: concept.includes('theorem') || concept.includes('formula'),
            explanation:
              'Theorems and formulas are reference tools like a cookbook index.',
          },
          {
            text: 'The book cover design',
            correct: false,
            explanation:
              'Book covers are decorative, not functional recipe elements.',
          },
        ],
      },
    ];
  }

  // Default analogies for any concept
  return [
    {
      category: 'General Concept',
      context: 'a well-organized library',
      options: [
        {
          text: 'A key reference book',
          correct: true,
          explanation:
            'The concept is a fundamental reference point, like an important book in a library.',
        },
        {
          text: 'The library card catalog',
          correct: false,
          explanation:
            "The catalog organizes information but isn't the content itself.",
        },
        {
          text: 'The reading chairs',
          correct: false,
          explanation:
            'Reading chairs are places to use the content, not the content itself.',
        },
        {
          text: 'The library hours sign',
          correct: false,
          explanation:
            'The hours sign provides access information, not the core content.',
        },
      ],
    },
  ];
}
