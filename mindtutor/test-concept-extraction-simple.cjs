// Simple test for concept extraction
function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

function extractConcepts(text) {
  const concepts = [];
  const lines = text.split('\n').filter((line) => line.trim());

  lines.forEach((line) => {
    // Simple pattern matching for definitions
    const patterns = [
      /^(.+?)\s+(is|are)\s+(.+?)[.\n]/gi,
      /^(.+?):\s+(.+?)[.\n]/gi,
    ];

    patterns.forEach((pattern) => {
      const matches = [...line.matchAll(pattern)];
      matches.forEach((match) => {
        if (match[1] && (match[2] || match[3])) {
          let concept = match[1].trim();
          let definition = match[2] || match[3];

          // Clean up
          concept = concept.replace(/^the\s+/i, '');
          concept = concept.charAt(0).toUpperCase() + concept.slice(1).toLowerCase();

          if (concept.length > 3 && concept.length < 50 && definition.length > 10) {
            concepts.push({
              concept: concept,
              definition: definition.trim(),
              difficulty: 2
            });
          }
        }
      });
    });
  });

  return concepts;
}

// Test with biology text
const fs = require('fs');
const text = fs.readFileSync('./public/sample-data/biology-cells-organization.txt', 'utf8');
const concepts = extractConcepts(text);

console.log('Extracted concepts:');
concepts.slice(0, 10).forEach((c, i) => console.log(`${i+1}. ${c.concept} - ${c.definition.substring(0, 100)}...`));