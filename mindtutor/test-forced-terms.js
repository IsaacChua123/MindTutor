// test-forced-terms.js - Test script to verify forced term filtering
import { generateExplanation } from './src/utils/aiCore.jsx';

// Mock topic data that contains forced terms
const mockTopic = {
  topic: 'Biology - Cells and Organization (Sample)',
  keywords: ['cell', 'nucleus', 'mitochondria'],
  concepts: [
    {
      concept: 'Cells',
      definition: 'Cells are the basic building blocks of all living organisms. The nucleus is the control center of the cell containing DNA.'
    }
  ],
  raw: 'Cells are the basic building blocks. The nucleus is the control center. Oxygen and carbon are important for life.'
};

// Test queries
const testQueries = [
  'What are cells?',
  'Explain cells',
  'Tell me about cells'
];

console.log('🧪 Testing forced term filtering...\n');

testQueries.forEach((query, index) => {
  console.log(`Test ${index + 1}: "${query}"`);
  const response = generateExplanation(mockTopic, query, {});
  console.log(`Response: ${response.substring(0, 200)}...`);
  console.log('---\n');
});

console.log('✅ Test completed');