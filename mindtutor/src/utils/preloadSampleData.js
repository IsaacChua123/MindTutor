// preloadSampleData.js - Pre-load sample study material

import { buildTopicObject } from './aiCore.jsx';
import { saveTopic } from './storage.js';

// Note: This file is designed for Node.js server-side use only
// The browser app loads sample data directly using fetch() in App.jsx
// These constants are not used in the browser environment

/**
 * Pre-load sample biology content if not already loaded
 * @param {string} content - The biology content to load
 */
export async function preloadSampleBiology(content) {
  if (!content) {
    console.warn('No biology content provided to preloadSampleBiology');
    return false;
  }

  const topicName = 'Biology - Cells and Organization (Sample)';

  // Always rebuild to ensure updated keyword filtering
  console.log('Rebuilding biology topic with updated keyword filtering...');

  // Build and save the topic
  const topicObject = await buildTopicObject(topicName, content);
  await saveTopic(topicName, topicObject);

  return true; // Always rebuilt
}

/**
 * Pre-load sample physics content if not already loaded
 * @param {string} content - The physics content to load
 */
export async function preloadSamplePhysics(content) {
  if (!content) {
    console.warn('No physics content provided to preloadSamplePhysics');
    return false;
  }

  const topicName = 'Physics - Electricity and Magnetism (Sample)';

  // Always rebuild to ensure updated keyword filtering
  console.log('Rebuilding physics topic with updated keyword filtering...');

  // Build and save the topic
  const topicObject = await buildTopicObject(topicName, content);
  await saveTopic(topicName, topicObject);

  return true; // Always rebuilt
}

/**
 * Pre-load sample chemistry content if not already loaded
 * @param {string} content - The chemistry content to load
 */
export async function preloadSampleChemistry(content) {
  if (!content) {
    console.warn('No chemistry content provided to preloadSampleChemistry');
    return false;
  }

  const topicName = 'Chemistry - Atomic Structure (Sample)';

  // Always rebuild to ensure updated keyword filtering
  console.log('Rebuilding chemistry topic with updated keyword filtering...');

  // Build and save the topic
  const topicObject = await buildTopicObject(topicName, content);
  await saveTopic(topicName, topicObject);

  return true; // Always rebuilt
}

/**
 * Pre-load all sample content
 */
export async function preloadAllSamples() {
  let loaded = false;
  loaded = (await preloadSampleBiology()) || loaded;
  loaded = (await preloadSamplePhysics()) || loaded;
  loaded = (await preloadSampleChemistry()) || loaded;
  return loaded;
}

/**
 * Check if sample data should be auto-loaded
 * @returns {Promise<boolean>} - Whether sample was loaded
 */
export async function autoLoadSampleIfNeeded() {
  // Always reload samples to ensure updated keyword filtering
  console.log('Auto-reloading all sample topics with updated keyword filtering...');
  return await preloadAllSamples();
}

/**
 * Force clear all cached topics and reload samples
 * Call this to reset the topic cache when keyword filtering is updated
 */
export async function forceReloadAllTopics() {
  console.log('🗑️ Force clearing all cached topics...');

  // Clear localStorage
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('mindtutor_topics');
    console.log('✅ Cleared localStorage cache');
  }

  // Reload all samples
  console.log('🔄 Reloading all sample topics...');
  return await preloadAllSamples();
}
