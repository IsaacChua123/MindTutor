// lessonRewriter.js - AI-powered lesson rewriting and customization system

/**
 * Rewrite a lesson in different styles and formats
 * @param {Object} topic - Topic object with raw text and concepts
 * @param {string} style - Desired writing style
 * @param {Object} options - Additional customization options
 * @returns {string} - Rewritten lesson content
 */
export function rewriteLesson(topic, style = 'academic', _options = {}) {
  switch (style.toLowerCase()) {
    case 'story':
    case 'narrative':
      return rewriteAsStory(topic, _options);

    case 'simple':
    case 'beginner':
      return rewriteSimply(topic, _options);

    case 'advanced':
    case 'expert':
      return rewriteForExperts(topic, _options);

    case 'concise':
    case 'summary':
      return rewriteConcise(topic, _options);

    case 'practical':
    case 'application':
      return rewritePractical(topic, _options);

    case 'visual':
    case 'diagram':
      return rewriteVisual(topic, _options);

    case 'question':
    case 'socratic':
      return rewriteSocratic(topic, _options);

    default:
      return rewriteAcademic(topic, _options);
  }
}

/**
 * Rewrite lesson in academic/formal style
 */
function rewriteAcademic(topic, _options) {
  const { concepts, topic: topicName } = topic;

  let content = `# ${topicName}\n\n`;

  // Introduction
  content += `## Introduction\n\n`;
  content += `This comprehensive overview explores the fundamental principles and applications of ${topicName.toLowerCase()}. `;
  content += `Understanding these concepts is essential for developing a thorough comprehension of the subject matter.\n\n`;

  // Main concepts
  concepts.forEach((concept) => {
    content += `## ${concept.concept}\n\n`;
    content += `${concept.definition}\n\n`;

    if (concept.difficulty <= 2) {
      content += `**Key Point:** This concept forms the foundation for more advanced topics in ${topicName.toLowerCase()}.\n\n`;
    } else {
      content += `**Advanced Concept:** This represents a more sophisticated application of ${topicName.toLowerCase()} principles.\n\n`;
    }
  });

  // Conclusion
  content += `## Summary\n\n`;
  content += `The concepts presented in this lesson demonstrate the interconnected nature of ${topicName.toLowerCase()}. `;
  content += `Mastery of these fundamental principles will facilitate understanding of more complex applications in the field.\n\n`;

  return content;
}

/**
 * Rewrite lesson as an engaging story
 */
function rewriteAsStory(topic, _options) {
  const { concepts, topic: topicName } = topic;

  let content = `# The Amazing Journey of ${topicName}\n\n`;

  content += `Imagine embarking on a fascinating expedition through the world of ${topicName.toLowerCase()}. `;
  content += `What discoveries await? What mysteries will be revealed? Let's begin our adventure!\n\n`;

  concepts.forEach((concept) => {
    const storyElements = getStoryElements(concept.concept);

    content += `## The Mystery of ${concept.concept}\n\n`;
    content += `As our journey continues, we encounter ${storyElements.setting}. `;
    content += `Here, we discover that ${concept.concept.toLowerCase()} is like ${storyElements.analogy}.\n\n`;
    content += `"${concept.definition}"\n\n`;
    content += `This revelation opens up new possibilities in our quest to understand ${topicName.toLowerCase()}!\n\n`;
  });

  content += `## The Grand Finale\n\n`;
  content += `Our journey through ${topicName.toLowerCase()} has revealed incredible wonders. `;
  content += `Each concept we've encountered plays a crucial role in the grand tapestry of knowledge. `;
  content += `What adventures await in your own exploration of this fascinating subject?\n\n`;

  return content;
}

/**
 * Rewrite lesson in simple, beginner-friendly language
 */
function rewriteSimply(topic, _options) {
  const { concepts, topic: topicName } = topic;

  let content = `# ${topicName} - Made Simple!\n\n`;

  content += `Hey there! Let's learn about ${topicName.toLowerCase()} together. `;
  content += `Don't worry if it seems complicated at first - we'll take it step by step.\n\n`;

  concepts.forEach((concept) => {
    content += `## What is ${concept.concept}?\n\n`;

    // Simplify the definition
    const simpleDef = concept.definition
      .replace(/eukaryotic/g, 'complex')
      .replace(/prokaryotic/g, 'simple')
      .replace(/organelles/g, 'tiny parts')
      .replace(/membrane-bound/g, 'surrounded by a wall')
      .replace(/selectively permeable/g, 'choosy about what goes in and out');

    content += `${simpleDef}\n\n`;

    content += `**Think of it like:** ${getSimpleAnalogy(concept.concept)}\n\n`;
    content += `**Why it matters:** This helps us understand how ${topicName.toLowerCase()} works in the real world!\n\n`;
  });

  content += `## You're Doing Great!\n\n`;
  content += `You've just learned the basics of ${topicName.toLowerCase()}! `;
  content += `Remember, learning takes time, and you're making progress with every step. `;
  content += `Keep exploring and asking questions!\n\n`;

  return content;
}

/**
 * Rewrite for expert/advanced audience
 */
function rewriteForExperts(topic, _options) {
  const { concepts, topic: topicName } = topic;

  let content = `# Advanced Analysis: ${topicName}\n\n`;

  content += `## Theoretical Framework\n\n`;
  content += `This analysis examines ${topicName.toLowerCase()} through an advanced theoretical lens, `;
  content += `considering current research paradigms and emerging methodologies.\n\n`;

  concepts.forEach((concept) => {
    content += `## ${concept.concept}: Advanced Considerations\n\n`;
    content += `${concept.definition}\n\n`;

    content += `**Theoretical Implications:**\n`;
    content += `• Integration with existing ${topicName.toLowerCase()} frameworks\n`;
    content += `• Potential applications in emerging research domains\n`;
    content += `• Methodological considerations for empirical validation\n\n`;

    content += `**Research Directions:**\n`;
    content += `Further investigation into the quantitative aspects and interdisciplinary connections is warranted.\n\n`;
  });

  content += `## Future Perspectives\n\n`;
  content += `The concepts explored herein suggest promising avenues for future research in ${topicName.toLowerCase()}. `;
  content += `Particular attention should be given to the integration of these principles with contemporary technological advancements.\n\n`;

  return content;
}

/**
 * Create a concise summary version
 */
function rewriteConcise(topic, _options) {
  const { concepts, topic: topicName } = topic;

  let content = `# ${topicName} - Quick Reference\n\n`;

  concepts.forEach((concept) => {
    content += `**${concept.concept}:** ${concept.definition.substring(0, 100)}...\n\n`;
  });

  content += `**Key Terms:** ${topic.keywords?.slice(0, 10).join(', ')}\n\n`;
  content += `*For detailed explanations, refer to the full lesson.*\n\n`;

  return content;
}

/**
 * Rewrite focusing on practical applications
 */
function rewritePractical(topic, _options) {
  const { concepts, topic: topicName } = topic;

  let content = `# ${topicName} in Action\n\n`;

  content += `Let's see how ${topicName.toLowerCase()} works in the real world!\n\n`;

  concepts.forEach((concept) => {
    content += `## ${concept.concept} - Real World Applications\n\n`;
    content += `${concept.definition}\n\n`;

    content += `**Where you'll see this:**\n`;
    content += `• ${getPracticalApplication(concept.concept)}\n`;
    content += `• ${getPracticalApplication(concept.concept)}\n\n`;

    content += `**How to apply it:**\n`;
    content += `1. Identify the core principle\n`;
    content += `2. Analyze the specific situation\n`;
    content += `3. Apply the concept systematically\n\n`;
  });

  content += `## Putting It All Together\n\n`;
  content += `Now that you understand these practical applications, you can start applying ${topicName.toLowerCase()} `;
  content += `to solve real-world problems and make informed decisions!\n\n`;

  return content;
}

/**
 * Create a visual/diagram-focused version
 */
function rewriteVisual(topic, _options) {
  const { concepts, topic: topicName } = topic;

  let content = `# ${topicName} - Visual Guide\n\n`;

  content += `## Mind Map Overview\n\n`;
  content += `🌟 **${topicName.toUpperCase()}**\n\n`;

  concepts.forEach((concept) => {
    content += `├─── **${concept.concept}**\n`;

    // Break down definition into key points
    const keyPoints = concept.definition
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 10)
      .slice(0, 2);
    keyPoints.forEach((point, idx) => {
      const branch = idx === keyPoints.length - 1 ? '│   └───' : '│   ├───';
      content += `${branch} ${point.trim().substring(0, 50)}...\n`;
    });
    content += `\n`;
  });

  content += `## Key Relationships\n\n`;
  content += `**How it all connects:**\n`;
  concepts.forEach((concept) => {
    content += `• ${concept.concept} → ${getRelatedConcepts(concept.concept, concepts)}\n`;
  });

  content += `\n## Visual Learning Tips\n\n`;
  content += `• Start from the center and work outward\n`;
  content += `• Look for connections between branches\n`;
  content += `• Use colors to highlight important relationships\n`;
  content += `• Draw your own diagrams as you learn\n\n`;

  return content;
}

/**
 * Create a Socratic question-based version
 */
function rewriteSocratic(topic, _options) {
  const { concepts, topic: topicName } = topic;

  let content = `# Exploring ${topicName} Through Questions\n\n`;

  content += `Let's discover ${topicName.toLowerCase()} by asking the right questions:\n\n`;

  concepts.forEach((concept, index) => {
    content += `## Question Set ${index + 1}: ${concept.concept}\n\n`;

    content += `**What is ${concept.concept.toLowerCase()}?**\n`;
    content += `${concept.definition}\n\n`;

    content += `**Why does ${concept.concept.toLowerCase()} matter?**\n`;
    content += `Because it helps us understand ${getConceptPurpose(concept.concept)}.\n\n`;

    content += `**How does ${concept.concept.toLowerCase()} relate to other concepts?**\n`;
    content += `It connects with ${getRelatedConcepts(concept.concept, concepts)}.\n\n`;

    content += `**What would happen without ${concept.concept.toLowerCase()}?**\n`;
    content += `Consider how ${topicName.toLowerCase()} would function differently.\n\n`;
  });

  content += `## Reflection Questions\n\n`;
  content += `• How do these concepts work together?\n`;
  content += `• What real-world situations involve these ideas?\n`;
  content += `• How might you apply this knowledge?\n`;
  content += `• What questions do you still have?\n\n`;

  return content;
}

// Helper functions

function getStoryElements(concept) {
  const storyMap = {
    Cell: { setting: 'a microscopic world', analogy: 'a bustling city' },
    Nucleus: {
      setting: 'the heart of a great kingdom',
      analogy: 'a wise king ruling from his throne',
    },
    Mitochondria: {
      setting: 'a power plant in a busy factory',
      analogy: 'tireless workers generating energy',
    },
    Membrane: {
      setting: 'the walls of an ancient fortress',
      analogy: 'guards protecting the castle',
    },
  };

  return (
    storyMap[concept] || {
      setting: 'an unknown realm',
      analogy: 'a mysterious force',
    }
  );
}

function getSimpleAnalogy(concept) {
  const analogies = {
    Cell: 'a tiny factory that makes everything needed for life',
    Nucleus: 'the boss who gives instructions to everyone',
    Mitochondria: 'the power plant that keeps the lights on',
    Membrane: 'the security guard who decides who gets in and out',
  };

  return (
    analogies[concept] || 'something really important that helps things work'
  );
}

function getPracticalApplication(concept) {
  const applications = {
    Cell: 'Understanding how medicines work in the body',
    Nucleus: 'Genetic engineering and biotechnology',
    Mitochondria: 'Treating diseases related to energy production',
    Membrane: 'Drug delivery systems and medical treatments',
  };

  return (
    applications[concept] ||
    'Solving real-world problems in science and medicine'
  );
}

function getRelatedConcepts(concept, allConcepts) {
  // Simple relatedness based on keywords
  const related = allConcepts
    .filter((c) => c.concept !== concept)
    .slice(0, 2)
    .map((c) => c.concept);

  return related.length > 0
    ? related.join(' and ')
    : 'other important concepts';
}

function getConceptPurpose(concept) {
  const purposes = {
    Cell: 'how living things are structured and function',
    Nucleus: 'how genetic information is stored and used',
    Mitochondria: 'how energy is produced in living organisms',
    Membrane: 'how cells maintain their internal environment',
  };

  return purposes[concept] || 'fundamental processes in biology';
}

/**
 * Get available rewriting styles
 */
export function getAvailableStyles() {
  return [
    {
      id: 'academic',
      name: 'Academic/Formal',
      description: 'Traditional educational format',
    },
    {
      id: 'story',
      name: 'Story/Narrative',
      description: 'Engaging story format',
    },
    {
      id: 'simple',
      name: 'Simple/Beginner',
      description: 'Easy to understand language',
    },
    {
      id: 'advanced',
      name: 'Advanced/Expert',
      description: 'Technical and in-depth',
    },
    { id: 'concise', name: 'Concise/Summary', description: 'Brief overview' },
    {
      id: 'practical',
      name: 'Practical/Application',
      description: 'Real-world focus',
    },
    {
      id: 'visual',
      name: 'Visual/Diagram',
      description: 'Mind maps and diagrams',
    },
    {
      id: 'question',
      name: 'Socratic/Questions',
      description: 'Question-based learning',
    },
  ];
}

/**
 * Get style recommendations based on topic and user preferences
 */
export function recommendStyles(topic, userLevel = 'intermediate') {
  const { concepts } = topic;
  const recommendations = [];

  if (userLevel === 'beginner') {
    recommendations.push('simple', 'story', 'visual');
  } else if (userLevel === 'advanced') {
    recommendations.push('advanced', 'practical', 'question');
  } else {
    recommendations.push('academic', 'practical', 'visual');
  }

  // Topic-specific recommendations
  if (concepts.some((c) => c.difficulty >= 4)) {
    recommendations.push('advanced');
  }

  if (concepts.length > 5) {
    recommendations.push('concise');
  }

  return [...new Set(recommendations)]; // Remove duplicates
}
