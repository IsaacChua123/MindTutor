// test-filter-function.js - Context-aware response filtering
function filterInappropriateTerms(response, forcedTerms, topicName) {
  const topicLower = topicName.toLowerCase();
  let filteredResponse = response;

  // Define which terms are inappropriate for each topic type
  const inappropriateTerms = {
    biology: ['acid', 'base', 'acids', 'bases', 'molecule', 'reaction', 'ion', 'electron', 'oxygen', 'carbon', 'fusion', 'physics', 'electricity', 'electric charge', 'force', 'energy', 'mass', 'charge', 'atom', 'velocity', 'current', 'voltage', 'resistance'],
    chemistry: ['cell', 'cells', 'nucleus', 'mitochondria', 'ribosomes', 'chloroplasts', 'vacuole', 'membrane', 'cytoplasm', 'diffusion', 'osmosis', 'transport', 'mitosis', 'tissue', 'tissues', 'organ', 'organs', 'organism', 'organisms', 'microscope', 'magnification', 'resolution', 'photosynthesis', 'respiration', 'dna', 'rna', 'protein', 'enzyme', 'bacteria', 'eukaryotic', 'prokaryotic', 'chromosome', 'organelle', 'physics', 'electricity', 'electric charge', 'force', 'energy', 'mass', 'charge', 'atom', 'velocity', 'current', 'voltage', 'resistance'],
    physics: ['cell', 'cells', 'nucleus', 'mitochondria', 'ribosomes', 'chloroplasts', 'vacuole', 'membrane', 'cytoplasm', 'diffusion', 'osmosis', 'transport', 'mitosis', 'tissue', 'tissues', 'organ', 'organs', 'organism', 'organisms', 'microscope', 'magnification', 'resolution', 'photosynthesis', 'respiration', 'dna', 'rna', 'protein', 'enzyme', 'bacteria', 'eukaryotic', 'prokaryotic', 'chromosome', 'organelle', 'acid', 'base', 'acids', 'bases', 'molecule', 'reaction', 'ion', 'electron', 'oxygen', 'carbon', 'fusion']
  };

  let termsToFilter = [];

  // Determine which terms to filter based on topic
  if (topicLower.includes('biology') || topicLower.includes('cell') || topicLower.includes('organization')) {
    termsToFilter = inappropriateTerms.biology;
  } else if (topicLower.includes('chemistry')) {
    termsToFilter = inappropriateTerms.chemistry;
  } else if (topicLower.includes('physics') || topicLower.includes('electricity') || topicLower.includes('magnetism')) {
    termsToFilter = inappropriateTerms.physics;
  } else {
    // For general topics, filter all forced terms
    termsToFilter = forcedTerms;
  }

  // Remove inappropriate terms from the response
  termsToFilter.forEach(term => {
    const termLower = term.toLowerCase();
    const responseLower = filteredResponse.toLowerCase();

    // Find all occurrences of the term (case-insensitive)
    const regex = new RegExp(`\\b${termLower}\\b`, 'gi');
    const matches = filteredResponse.match(regex);

    if (matches) {
      console.log(`🚫 Filtering out inappropriate term "${term}" from ${topicName} response`);
      // Remove the term from the response
      filteredResponse = filteredResponse.replace(regex, '[filtered]');
    }
  });

  return filteredResponse;
}

// Legacy function for backward compatibility
function filterForcedTermsFromResponse(response, forcedTerms, topicName) {
  return filterInappropriateTerms(response, forcedTerms, topicName);
}

// Extract related concepts based on magic words found
function extractRelatedConcepts(magicWords, topicName, sourceText) {
  const relatedConcepts = new Set();

  if (!sourceText) return [];

  const sourceLower = sourceText.toLowerCase();

  // Define relationships between magic words and related concepts
  const conceptRelationships = {
    'oxygen': ['photosynthesis', 'respiration', 'gas exchange', 'cellular respiration', 'aerobic respiration'],
    'carbon': ['photosynthesis', 'carbon cycle', 'organic compounds', 'glucose', 'carbon dioxide'],
    'control center': ['nucleus', 'cell nucleus', 'genetic control', 'dna replication'],
    'electron': ['electron transport chain', 'oxidative phosphorylation', 'cellular respiration', 'photosynthesis'],
    'ion': ['active transport', 'ion channels', 'sodium-potassium pump', 'membrane potential'],
    'molecule': ['organic molecules', 'biomolecules', 'proteins', 'carbohydrates', 'lipids'],
    'reaction': ['chemical reactions', 'enzymatic reactions', 'metabolic pathways', 'biochemical reactions'],
    'acid': ['amino acids', 'nucleic acids', 'ph balance', 'acid-base reactions'],
    'base': ['amino acids', 'nucleic acids', 'complementary base pairing', 'ph balance'],
    'fusion': ['membrane fusion', 'vesicle fusion', 'endocytosis', 'nuclear fusion']
  };

  // For each magic word found, look for related concepts in the source text
  magicWords.forEach(word => {
    const wordLower = word.toLowerCase();
    if (conceptRelationships[wordLower]) {
      conceptRelationships[wordLower].forEach(relatedConcept => {
        // Check if this related concept appears in the source text
        if (sourceLower.includes(relatedConcept.toLowerCase())) {
          relatedConcepts.add(relatedConcept);
        }
      });
    }
  });

  return Array.from(relatedConcepts).slice(0, 5); // Limit to 5 related concepts
}

// Check if a forced term is relevant in the given context
function isTermRelevantInContext(sentence, term, topicName) {
  const sentenceLower = sentence.toLowerCase();
  const termLower = term.toLowerCase();

  // For biology topics, certain terms are always relevant
  if (topicName.toLowerCase().includes('biology') || topicName.toLowerCase().includes('cell')) {
    const biologyRelevantContexts = {
      'oxygen': ['photosynthesis', 'respiration', 'gas exchange', 'breathing', 'air', 'atmosphere', 'blood', 'lungs', 'alveoli'],
      'carbon': ['photosynthesis', 'respiration', 'carbon dioxide', 'organic', 'glucose', 'sugar', 'compound', 'molecule', 'cycle'],
      'control center': ['nucleus', 'brain', 'cell', 'organelle', 'dna', 'genetic'],
      'electron': ['transport', 'chain', 'energy', 'atp', 'respiration', 'photosynthesis', 'chemical'],
      'ion': ['transport', 'channel', 'pump', 'membrane', 'concentration', 'gradient', 'active transport'],
      'molecule': ['organic', 'compound', 'protein', 'dna', 'rna', 'enzyme', 'substrate'],
      'reaction': ['chemical', 'biological', 'enzyme', 'catalyst', 'metabolism', 'photosynthesis', 'respiration'],
      'acid': ['amino', 'nucleic', 'fatty', 'organic', 'ph', 'base'],
      'base': ['amino', 'nucleic', 'ph', 'acid', 'complementary'],
      'fusion': ['nuclear', 'membrane', 'vesicle', 'endocytosis']
    };

    if (biologyRelevantContexts[termLower]) {
      // Check if any relevant context words appear in the sentence
      return biologyRelevantContexts[termLower].some(context =>
        sentenceLower.includes(context)
      );
    }
  }

  // For other topics, check if the term appears to be used in a scientific/educational context
  const scientificContexts = ['process', 'system', 'structure', 'function', 'energy', 'transport', 'exchange', 'cycle'];
  return scientificContexts.some(context => sentenceLower.includes(context));
}

// Test the function
const fs = require('fs');
const forcedTerms = ['acid', 'base', 'molecule', 'reaction', 'ion', 'electron', 'control center', 'oxygen', 'carbon', 'fusion'];

// Load biology source text for testing
const sourceText = fs.readFileSync('./public/sample-data/biology-cells-organization.txt', 'utf8');

const testResponse = "Cells are the basic building blocks. The nucleus is the control center. Oxygen and carbon are important for life. This is a test response.";

console.log('Original response:', testResponse);
const filtered = filterInappropriateTerms(testResponse, forcedTerms, 'Biology - Cells');
console.log('Filtered response:', filtered);

// Test with physics topic (should filter inappropriate terms)
const physicsResponse = "Physics involves force, energy, and electricity. Electric charge is fundamental. Current flows through circuits.";
console.log('\nPhysics response with inappropriate terms:', physicsResponse);
const physicsFiltered = filterInappropriateTerms(physicsResponse, forcedTerms, 'Physics: Electricity and Magnetism');
console.log('Physics filtered (should remove inappropriate terms):', physicsFiltered);

// Test with chemistry topic (should filter inappropriate terms)
const chemistryResponse = "Acids and bases react to form salts. Molecules contain atoms. Cells are basic units.";
console.log('\nChemistry response with inappropriate terms:', chemistryResponse);
const chemistryFiltered = filterInappropriateTerms(chemistryResponse, forcedTerms, 'Chemistry - Acids');
console.log('Chemistry filtered (should remove inappropriate terms):', chemistryFiltered);