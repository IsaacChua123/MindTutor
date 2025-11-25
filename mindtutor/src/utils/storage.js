// storage.js - IndexedDB management for MindTutor with localStorage fallback

const DB_NAME = 'MindTutorDB';
const DB_VERSION = 1;

// Store names
const TOPICS_STORE = 'topics';
const QUIZ_HISTORY_STORE = 'quizHistory';
const CHAT_HISTORY_STORE = 'chatHistory';
const DIAGNOSTICS_STORE = 'diagnostics';
const USER_MODEL_STORE = 'userModel';

// Legacy localStorage keys for fallback
const TOPICS_KEY = 'mindtutor_topics';
const QUIZ_HISTORY_KEY = 'mindtutor_quiz_history';
const CHAT_HISTORY_KEY = 'mindtutor_chat_history';
const DIAGNOSTICS_KEY = 'mindtutor_diagnostics';

// IndexedDB connection
let dbPromise = null;

/**
 * Initialize IndexedDB database
 */
function initDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, _reject) => {
    if (typeof window.indexedDB === 'undefined') {
      console.warn('IndexedDB not available, falling back to localStorage');
      resolve(null);
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.warn('IndexedDB not available, falling back to localStorage');
      resolve(null);
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(TOPICS_STORE)) {
        const topicsStore = db.createObjectStore(TOPICS_STORE, {
          keyPath: 'name',
        });
        topicsStore.createIndex('lastUpdated', 'lastUpdated', {
          unique: false,
        });
      }

      if (!db.objectStoreNames.contains(QUIZ_HISTORY_STORE)) {
        const quizStore = db.createObjectStore(QUIZ_HISTORY_STORE, {
          keyPath: 'id',
          autoIncrement: true,
        });
        quizStore.createIndex('topic', 'topic', { unique: false });
        quizStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!db.objectStoreNames.contains(CHAT_HISTORY_STORE)) {
        const chatStore = db.createObjectStore(CHAT_HISTORY_STORE, {
          keyPath: 'id',
          autoIncrement: true,
        });
        chatStore.createIndex('topic', 'topic', { unique: false });
        chatStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!db.objectStoreNames.contains(DIAGNOSTICS_STORE)) {
        db.createObjectStore(DIAGNOSTICS_STORE, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(USER_MODEL_STORE)) {
        db.createObjectStore(USER_MODEL_STORE, { keyPath: 'userId' });
      }
    };
  });

  return dbPromise;
}

/**
 * Generic IndexedDB operation with localStorage fallback
 */
async function performDBOperation(storeName, operation, data = null) {
  try {
    const db = await initDB();
    if (!db) {
      // Fallback to localStorage
      return performLocalStorageOperation(storeName, operation, data);
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      let request;

      switch (operation) {
        case 'getAll':
          request = store.getAll();
          break;
        case 'get':
          request = store.get(data);
          break;
        case 'put':
          request = store.put(data);
          break;
        case 'delete':
          request = store.delete(data);
          break;
        case 'clear':
          request = store.clear();
          break;
        default:
          reject(new Error(`Unknown operation: ${operation}`));
          return;
      }

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn(
      'IndexedDB operation failed, using localStorage fallback:',
      error
    );
    return performLocalStorageOperation(storeName, operation, data);
  }
}

/**
 * localStorage fallback operations
 */
function performLocalStorageOperation(storeName, operation, data) {
  const keyMap = {
    [TOPICS_STORE]: TOPICS_KEY,
    [QUIZ_HISTORY_STORE]: QUIZ_HISTORY_KEY,
    [CHAT_HISTORY_STORE]: CHAT_HISTORY_KEY,
    [DIAGNOSTICS_STORE]: DIAGNOSTICS_KEY,
  };

  const key = keyMap[storeName];
  if (!key) return null;

  try {
    switch (operation) {
      case 'getAll': {
        if (storeName === CHAT_HISTORY_STORE) {
          const stored = localStorage.getItem(key);
          if (stored) {
            const parsed = JSON.parse(stored);
            return parsed.messages ? parsed.messages : [];
          }
          return [];
        }
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : {};
      }
      case 'get': {
        if (storeName === CHAT_HISTORY_STORE && data === 'history') {
          const stored = localStorage.getItem(key);
          return stored ? JSON.parse(stored) : null;
        }
        const all = performLocalStorageOperation(storeName, 'getAll');
        return all[data] || null;
      }
      case 'put': {
        if (storeName === TOPICS_STORE) {
          const all = performLocalStorageOperation(storeName, 'getAll');
          all[data.name] = { ...data, lastUpdated: new Date().toISOString() };
          localStorage.setItem(key, JSON.stringify(all));
        } else if (storeName === QUIZ_HISTORY_STORE) {
          const all = performLocalStorageOperation(storeName, 'getAll') || [];
          all.push({
            ...data,
            id: Date.now(),
            timestamp: new Date().toISOString(),
          });
          localStorage.setItem(key, JSON.stringify(all));
        } else if (storeName === CHAT_HISTORY_STORE && data.id === 'history') {
          // Save the entire history object
          localStorage.setItem(key, JSON.stringify(data));
        } else {
          localStorage.setItem(key, JSON.stringify(data));
        }
        return data;
      }
      case 'delete': {
        if (storeName === TOPICS_STORE) {
          const all = performLocalStorageOperation(storeName, 'getAll');
          delete all[data];
          localStorage.setItem(key, JSON.stringify(all));
        }
        break;
      }
      case 'clear': {
        localStorage.removeItem(key);
        break;
      }
    }
  } catch (error) {
    console.error('localStorage operation failed:', error);
  }

  return null;
}

/**
 * Load all topics from IndexedDB with localStorage fallback
 * @returns {Object} - All topics keyed by topic name
 */
export async function loadAllTopics() {
  try {
    const topics = (await performDBOperation(TOPICS_STORE, 'getAll')) || [];
    // Convert array to object keyed by name
    const topicsObject = {};
    topics.forEach((topic) => {
      topicsObject[topic.name] = topic;
    });
    return topicsObject;
  } catch (e) {
    console.error('Error loading topics:', e);
    return {};
  }
}

/**
 * Save a single topic to IndexedDB with compression and fallback
 * @param {string} topicName - Name of the topic
 * @param {Object} topicData - Topic data object
 */
export async function saveTopic(topicName, topicData) {
  try {
    // Compress large content if needed
    const compressedData = compressTopicData(topicData);

    const topicToSave = {
      name: topicName,
      ...compressedData,
      lastUpdated: new Date().toISOString(),
    };

    await performDBOperation(TOPICS_STORE, 'put', topicToSave);
  } catch (e) {
    console.error('Error saving topic to IndexedDB:', e);
    // Fallback to localStorage with size optimization
    try {
      const topics = await loadAllTopics();
      const { raw, longFormLesson, ...compressedData } = topicData;

      // Store compressed version
      topics[topicName] = {
        ...compressedData,
        raw: raw ? raw.substring(0, 5000) + '...' : '', // Limit raw content
        longFormLesson: longFormLesson
          ? longFormLesson.substring(0, 10000) + '...'
          : '',
        lastUpdated: new Date().toISOString(),
        compressed: true,
      };

      // Try to save, if it fails, remove more content
      try {
        await performDBOperation(TOPICS_STORE, 'put', {
          name: topicName,
          ...topics[topicName],
        });
      } catch (_e2) {
        // Remove large content and try again
        const minimalData = {
          name: topicName,
          topic: topicData.topic,
          keywords: topicData.keywords || [],
          concepts: (topicData.concepts || []).slice(0, 5),
          lastUpdated: new Date().toISOString(),
          compressed: true,
          storageWarning: 'Content compressed due to size limits',
        };
        await performDBOperation(TOPICS_STORE, 'put', minimalData);
      }
    } catch (e3) {
      console.error('Error saving topic even with compression:', e3);
    }
  }
}

/**
 * Delete a topic from storage
 * @param {string} topicName - Name of the topic to delete
 */
export async function deleteTopic(topicName) {
  try {
    await performDBOperation(TOPICS_STORE, 'delete', topicName);
    // Also clear related data
    await clearChatHistoryForTopic(topicName);
    await clearQuizHistoryForTopic(topicName);
  } catch (e) {
    console.error('Error deleting topic:', e);
  }
}

/**
 * Get a specific topic from storage
 * @param {string} topicName - Name of the topic
 * @returns {Object|null} - Topic data or null if not found
 */
export async function getTopic(topicName) {
  try {
    const topic = await performDBOperation(TOPICS_STORE, 'get', topicName);
    return topic || null;
  } catch (e) {
    console.error('Error getting topic:', e);
    return null;
  }
}

/**
 * Compress topic data for storage efficiency
 */
function compressTopicData(topicData) {
  const compressed = { ...topicData };

  // Compress large text fields - allow more content for reading
  if (compressed.raw && compressed.raw.length > 20000) {
    compressed.raw =
      compressed.raw.substring(0, 20000) + '...[content truncated]';
    compressed.fullRawAvailable = true;
  }

  if (compressed.longFormLesson && compressed.longFormLesson.length > 15000) {
    compressed.longFormLesson =
      compressed.longFormLesson.substring(0, 15000) + '...[content truncated]';
    compressed.fullLessonAvailable = true;
  }

  // Compress concepts array if too large
  if (compressed.concepts && compressed.concepts.length > 20) {
    compressed.concepts = compressed.concepts.slice(0, 20);
    compressed.additionalConcepts = true;
  }

  return compressed;
}

/**
 * Save chat message to IndexedDB
 * @param {Object} message - Chat message object
 */
export async function saveChatMessage(message) {
  try {
    const messageToSave = {
      ...message,
      timestamp: message.timestamp || new Date().toISOString(),
      id: message.id || Date.now(),
    };
    await performDBOperation(CHAT_HISTORY_STORE, 'put', messageToSave);
  } catch (e) {
    console.error('Error saving chat message:', e);
  }
}

/**
 * Load chat history from IndexedDB
 * @param {string} topicName - Optional topic filter
 * @param {number} limit - Maximum number of messages to load
 * @returns {Array} - Array of chat messages
 */
export async function loadChatHistory(topicName = null, limit = 100) {
  try {
    const db = await initDB();
    if (!db) {
      return performLocalStorageOperation(CHAT_HISTORY_STORE, 'getAll') || [];
    }

    // First try to load the saved history array
    const savedHistory = await performDBOperation(
      CHAT_HISTORY_STORE,
      'get',
      'history'
    );
    if (savedHistory && savedHistory.messages) {
      let messages = savedHistory.messages;

      // Filter by topic if specified
      if (topicName) {
        messages = messages.filter((msg) => msg.topic === topicName);
      }

      // Sort by timestamp (newest first) and limit
      messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      return messages.slice(0, limit);
    }

    // Fallback to loading individual messages (old format)
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CHAT_HISTORY_STORE], 'readonly');
      const store = transaction.objectStore(CHAT_HISTORY_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        let messages = request.result || [];

        // Filter by topic if specified
        if (topicName) {
          messages = messages.filter((msg) => msg.topic === topicName);
        }

        // Sort by timestamp (newest first) and limit
        messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        resolve(messages.slice(0, limit));
      };

      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('Error loading chat history:', e);
    return [];
  }
}

/**
 * Clear chat history for a specific topic
 * @param {string} topicName - Name of the topic
 */
export async function clearChatHistoryForTopic(topicName) {
  try {
    const db = await initDB();
    if (!db) {
      // Fallback implementation would be complex, so we'll skip for now
      return;
    }

    const transaction = db.transaction([CHAT_HISTORY_STORE], 'readwrite');
    const store = transaction.objectStore(CHAT_HISTORY_STORE);
    const index = store.index('topic');
    const request = index.openCursor(
      window.IDBKeyRange ? window.IDBKeyRange.only(topicName) : null
    );

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  } catch (e) {
    console.error('Error clearing chat history for topic:', e);
  }
}

/**
 * Save chat history (array of messages)
 * @param {Array} messages - Array of chat messages
 */
export async function saveChatHistory(messages) {
  try {
    // For simplicity, we'll save the entire array as one entry
    // In a real app, you might want to save each message individually
    await performDBOperation(CHAT_HISTORY_STORE, 'put', {
      id: 'history',
      messages: messages,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error('Error saving chat history:', e);
  }
}

/**
 * Clear all chat history
 */
export async function clearAllChatHistory() {
  try {
    await performDBOperation(CHAT_HISTORY_STORE, 'clear');
  } catch (e) {
    console.error('Error clearing all chat history:', e);
  }
}

/**
 * Save quiz attempt to IndexedDB
 * @param {Object} quizAttempt - Quiz attempt data
 */
export async function saveQuizAttempt(quizAttempt) {
  try {
    const attemptToSave = {
      ...quizAttempt,
      timestamp: quizAttempt.timestamp || new Date().toISOString(),
      id: quizAttempt.id || Date.now(),
    };
    await performDBOperation(QUIZ_HISTORY_STORE, 'put', attemptToSave);
  } catch (e) {
    console.error('Error saving quiz attempt:', e);
  }
}

/**
 * Load quiz history from IndexedDB
 * @param {string} topicName - Optional topic filter
 * @param {number} limit - Maximum number of attempts to load
 * @returns {Array} - Array of quiz attempts
 */
export async function loadQuizHistory(topicName = null, limit = 50) {
  try {
    const db = await initDB();
    if (!db) {
      return performLocalStorageOperation(QUIZ_HISTORY_STORE, 'getAll') || [];
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([QUIZ_HISTORY_STORE], 'readonly');
      const store = transaction.objectStore(QUIZ_HISTORY_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        let attempts = request.result || [];

        // Filter by topic if specified
        if (topicName) {
          attempts = attempts.filter((attempt) => attempt.topic === topicName);
        }

        // Sort by timestamp (newest first) and limit
        attempts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        resolve(attempts.slice(0, limit));
      };

      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('Error loading quiz history:', e);
    return [];
  }
}

/**
 * Clear quiz history for a specific topic
 * @param {string} topicName - Name of the topic
 */
export async function clearQuizHistoryForTopic(topicName) {
  try {
    const db = await initDB();
    if (!db) return;

    const transaction = db.transaction([QUIZ_HISTORY_STORE], 'readwrite');
    const store = transaction.objectStore(QUIZ_HISTORY_STORE);
    const index = store.index('topic');
    const request = index.openCursor(
      window.IDBKeyRange ? window.IDBKeyRange.only(topicName) : null
    );

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  } catch (e) {
    console.error('Error clearing quiz history for topic:', e);
  }
}

/**
 * Save diagnostics data to IndexedDB
 * @param {Object} diagnostics - Diagnostics data
 */
export async function saveDiagnostics(diagnostics) {
  try {
    const diagnosticsToSave = {
      id: 'main',
      ...diagnostics,
      lastUpdated: new Date().toISOString(),
    };
    await performDBOperation(DIAGNOSTICS_STORE, 'put', diagnosticsToSave);
  } catch (e) {
    console.error('Error saving diagnostics:', e);
  }
}

/**
 * Load diagnostics data from IndexedDB
 * @returns {Object} - Diagnostics data
 */
export async function loadDiagnostics() {
  try {
    const diagnostics = await performDBOperation(
      DIAGNOSTICS_STORE,
      'get',
      'main'
    );
    return (
      diagnostics || {
        topicAccuracy: {},
        conceptAccuracy: {},
        weaknesses: [],
        strengths: [],
        cognitiveTypes: {
          numerical: 0,
          spatial: 0,
          readingComprehension: 0,
          memory: 0,
        },
        lastUpdated: new Date().toISOString(),
      }
    );
  } catch (e) {
    console.error('Error loading diagnostics:', e);
    return {
      topicAccuracy: {},
      conceptAccuracy: {},
      weaknesses: [],
      strengths: [],
      cognitiveTypes: {
        numerical: 0,
        spatial: 0,
        readingComprehension: 0,
        memory: 0,
      },
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Save user model to IndexedDB
 * @param {string} userId - User ID
 * @param {Object} userModel - User model data
 */
export async function saveUserModel(userId, userModel) {
  try {
    const modelToSave = {
      userId,
      ...userModel,
      lastUpdated: new Date().toISOString(),
    };
    await performDBOperation(USER_MODEL_STORE, 'put', modelToSave);
  } catch (e) {
    console.error('Error saving user model:', e);
  }
}

/**
 * Load user model from IndexedDB
 * @param {string} userId - User ID
 * @returns {Object|null} - User model data or null
 */
export async function loadUserModel(userId) {
  try {
    const userModel = await performDBOperation(USER_MODEL_STORE, 'get', userId);
    return userModel || null;
  } catch (e) {
    console.error('Error loading user model:', e);
    return null;
  }
}

/**
 * Get storage statistics
 * @returns {Object} - Storage usage statistics
 */
export async function getStorageStats() {
  try {
    const db = await initDB();
    if (!db) {
      return { usingIndexedDB: false, topicsCount: 0, totalSize: 0 };
    }

    const stats = {
      usingIndexedDB: true,
      topicsCount: 0,
      chatMessagesCount: 0,
      quizAttemptsCount: 0,
      estimatedSize: 0,
    };

    // Count topics
    const topics = (await performDBOperation(TOPICS_STORE, 'getAll')) || [];
    stats.topicsCount = topics.length;

    // Count chat messages
    const chatMessages =
      (await performDBOperation(CHAT_HISTORY_STORE, 'getAll')) || [];
    stats.chatMessagesCount = chatMessages.length;

    // Count quiz attempts
    const quizAttempts =
      (await performDBOperation(QUIZ_HISTORY_STORE, 'getAll')) || [];
    stats.quizAttemptsCount = quizAttempts.length;

    // Estimate size (rough calculation)
    stats.estimatedSize = JSON.stringify({
      topics,
      chatMessages,
      quizAttempts,
    }).length;

    return stats;
  } catch (e) {
    console.error('Error getting storage stats:', e);
    return { usingIndexedDB: false, error: e.message };
  }
}

/**
 * Clear all data (reset app)
 */
export async function clearAllData() {
  try {
    const stores = [
      TOPICS_STORE,
      QUIZ_HISTORY_STORE,
      CHAT_HISTORY_STORE,
      DIAGNOSTICS_STORE,
      USER_MODEL_STORE,
    ];
    await Promise.all(
      stores.map((store) => performDBOperation(store, 'clear'))
    );
  } catch (e) {
    console.error('Error clearing IndexedDB data:', e);
    // Fallback to localStorage
    try {
      localStorage.removeItem(TOPICS_KEY);
      localStorage.removeItem(QUIZ_HISTORY_KEY);
      localStorage.removeItem(CHAT_HISTORY_KEY);
      localStorage.removeItem(DIAGNOSTICS_KEY);
    } catch (e2) {
      console.error('Error clearing localStorage data:', e2);
    }
  }
}

/**
 * Export all data for backup
 * @returns {Object} - All stored data
 */
export async function exportAllData() {
  try {
    const [topics, chatHistory, quizHistory, diagnostics, userModels] =
      await Promise.all([
        performDBOperation(TOPICS_STORE, 'getAll'),
        performDBOperation(CHAT_HISTORY_STORE, 'getAll'),
        performDBOperation(QUIZ_HISTORY_STORE, 'getAll'),
        performDBOperation(DIAGNOSTICS_STORE, 'getAll'),
        performDBOperation(USER_MODEL_STORE, 'getAll'),
      ]);

    return {
      topics: topics || [],
      chatHistory: chatHistory || [],
      quizHistory: quizHistory || [],
      diagnostics: diagnostics || [],
      userModels: userModels || [],
      exportDate: new Date().toISOString(),
      version: '1.0',
    };
  } catch (e) {
    console.error('Error exporting data:', e);
    return null;
  }
}

/**
 * Import data from backup
 * @param {Object} data - Exported data to import
 * @returns {boolean} - Success status
 */
export async function importAllData(data) {
  try {
    if (!data || !data.version) {
      throw new Error('Invalid data format');
    }

    // Import topics
    if (data.topics) {
      for (const topic of data.topics) {
        await performDBOperation(TOPICS_STORE, 'put', topic);
      }
    }

    // Import chat history
    if (data.chatHistory) {
      for (const message of data.chatHistory) {
        await performDBOperation(CHAT_HISTORY_STORE, 'put', message);
      }
    }

    // Import quiz history
    if (data.quizHistory) {
      for (const attempt of data.quizHistory) {
        await performDBOperation(QUIZ_HISTORY_STORE, 'put', attempt);
      }
    }

    // Import diagnostics
    if (data.diagnostics) {
      for (const diagnostic of data.diagnostics) {
        await performDBOperation(DIAGNOSTICS_STORE, 'put', diagnostic);
      }
    }

    // Import user models
    if (data.userModels) {
      for (const model of data.userModels) {
        await performDBOperation(USER_MODEL_STORE, 'put', model);
      }
    }

    return true;
  } catch (e) {
    console.error('Error importing data:', e);
    return false;
  }
}
