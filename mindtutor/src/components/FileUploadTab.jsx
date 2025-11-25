import React, { useState, useRef, useCallback } from 'react';
import { multimodalProcessor } from '../utils/documentProcessor.js';
import { buildTopicObject } from '../utils/aiCore.js';

/**
 * Advanced File Upload Component with OCR and PDF processing
 */
const FileUploadTab = ({ onTopicCreated, onProcessingStart, onProcessingEnd }) => {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({});
  const [results, setResults] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const supportedTypes = {
    'application/pdf': 'PDF',
    'image/jpeg': 'JPEG Image',
    'image/png': 'PNG Image',
    'image/webp': 'WebP Image',
    'text/plain': 'Text File'
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
  };

  const handleFiles = (fileList) => {
    const validFiles = fileList.filter(file => {
      const isValidType = Object.keys(supportedTypes).includes(file.type) ||
                         file.name.toLowerCase().endsWith('.txt');
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit

      if (!isValidType) {
        alert(`Unsupported file type: ${file.type}. Please upload PDF, image, or text files.`);
        return false;
      }

      if (!isValidSize) {
        alert(`File ${file.name} is too large. Maximum size is 50MB.`);
        return false;
      }

      return true;
    });

    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setResults(prev => {
      const newResults = { ...prev };
      delete newResults[index];
      return newResults;
    });
  };

  const processFile = async (file, index) => {
    setProcessing(true);
    onProcessingStart?.();

    try {
      setProgress(prev => ({ ...prev, [index]: { status: 'processing', message: 'Initializing...' } }));

      // Process the file with multimodal processor
      const result = await multimodalProcessor.processFile(file, {
        language: 'eng',
        preprocess: true,
        confidence: 60
      });

      setProgress(prev => ({
        ...prev,
        [index]: { status: 'completed', message: 'Processing complete' }
      }));

      setResults(prev => ({ ...prev, [index]: result }));

      // Automatically create topic from processed content
      if (result.content && result.content.length > 100) {
        setProgress(prev => ({
          ...prev,
          [index]: { status: 'creating_topic', message: 'Creating topic...' }
        }));

        const topicName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
        const topic = buildTopicObject(topicName, result.content);

        // Add multimodal metadata
        topic.multimodalData = {
          sourceType: result.type,
          analysis: result.analysis,
          processingMetadata: result.metadata,
          originalFile: {
            name: file.name,
            size: file.size,
            type: file.type
          }
        };

        onTopicCreated?.(topic);

        setProgress(prev => ({
          ...prev,
          [index]: { status: 'topic_created', message: 'Topic created successfully!' }
        }));
      }

    } catch (error) {
      console.error('File processing error:', error);
      setProgress(prev => ({
        ...prev,
        [index]: { status: 'error', message: error.message }
      }));
    } finally {
      setProcessing(false);
      onProcessingEnd?.();
    }
  };

  const processAllFiles = async () => {
    for (let i = 0; i < files.length; i++) {
      if (!results[i]) {
        await processFile(files[i], i);
      }
    }
  };

  const clearAll = () => {
    setFiles([]);
    setResults({});
    setProgress({});
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType === 'application/pdf') return '📄';
    return '📝';
  };

  const getProgressColor = (status) => {
    switch (status) {
      case 'processing': return 'text-blue-600';
      case 'completed': return 'text-green-600';
      case 'creating_topic': return 'text-purple-600';
      case 'topic_created': return 'text-emerald-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">📤 Advanced File Upload</h2>
        <p className="text-gray-600 mb-6">
          Upload PDFs, images, or text files. Our AI will automatically extract text using OCR for images and process content for intelligent analysis.
        </p>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="text-6xl">📁</div>
          <div>
            <p className="text-xl font-medium text-gray-700 mb-2">
              Drop files here or click to browse
            </p>
            <p className="text-gray-500">
              Supports PDF, JPEG, PNG, WebP images, and text files (max 50MB each)
            </p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            disabled={processing}
          >
            Choose Files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.webp,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">📋 Files ({files.length})</h3>
            <div className="space-x-2">
              <button
                onClick={processAllFiles}
                disabled={processing}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {processing ? '🔄 Processing...' : '🚀 Process All'}
              </button>
              <button
                onClick={clearAll}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                🗑️ Clear All
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {files.map((file, index) => (
              <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getFileIcon(file.type)}</span>
                    <div>
                      <p className="font-medium text-gray-800">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB • {supportedTypes[file.type] || 'Unknown'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {progress[index] && (
                      <span className={`text-sm font-medium ${getProgressColor(progress[index].status)}`}>
                        {progress[index].message}
                      </span>
                    )}

                    {!results[index] && (
                      <button
                        onClick={() => processFile(file, index)}
                        disabled={processing}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        Process
                      </button>
                    )}

                    <button
                      onClick={() => removeFile(index)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Results Display */}
                {results[index] && (
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <h4 className="font-medium text-gray-800 mb-2">📊 Processing Results</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Type:</span>
                        <span className="ml-1 font-medium">{results[index].type.toUpperCase()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Words:</span>
                        <span className="ml-1 font-medium">{results[index].metadata.wordCount || 'N/A'}</span>
                      </div>
                      {results[index].type === 'image' && (
                        <div>
                          <span className="text-gray-600">OCR Confidence:</span>
                          <span className="ml-1 font-medium">{results[index].metadata.confidence?.toFixed(1)}%</span>
                        </div>
                      )}
                      {results[index].type === 'pdf' && (
                        <div>
                          <span className="text-gray-600">Pages:</span>
                          <span className="ml-1 font-medium">{results[index].metadata.pageCount}</span>
                        </div>
                      )}
                    </div>

                    {/* Content Preview */}
                    <div className="mt-3">
                      <details className="cursor-pointer">
                        <summary className="text-blue-600 hover:text-blue-800">
                          Preview extracted content
                        </summary>
                        <div className="mt-2 p-2 bg-white border rounded text-sm max-h-32 overflow-y-auto">
                          {results[index].content.substring(0, 500)}
                          {results[index].content.length > 500 && '...'}
                        </div>
                      </details>
                    </div>

                    {/* Analysis Summary */}
                    {results[index].analysis && (
                      <div className="mt-3 pt-3 border-t">
                        <h5 className="font-medium text-gray-800 mb-2">🧠 AI Analysis</h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                          <div className="bg-blue-100 p-2 rounded">
                            <span className="text-blue-800 font-medium">Readability:</span>
                            <span className="ml-1">{results[index].analysis.readability.level}</span>
                          </div>
                          <div className="bg-green-100 p-2 rounded">
                            <span className="text-green-800 font-medium">Complexity:</span>
                            <span className="ml-1">{results[index].analysis.complexity.vocabulary.level}</span>
                          </div>
                          <div className="bg-purple-100 p-2 rounded">
                            <span className="text-purple-800 font-medium">Learning Potential:</span>
                            <span className="ml-1">{results[index].analysis.learningPotential.potential}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">💡 How It Works</h3>
        <div className="space-y-2 text-blue-700">
          <p><strong>📄 PDFs:</strong> Text is extracted from all pages automatically</p>
          <p><strong>🖼️ Images:</strong> OCR technology detects and extracts text from photos</p>
          <p><strong>📝 Text Files:</strong> Content is processed directly for analysis</p>
          <p><strong>🧠 AI Analysis:</strong> Each file gets analyzed for readability, topics, and learning potential</p>
          <p><strong>📚 Auto-Topic Creation:</strong> Processed content becomes interactive learning topics</p>
        </div>
      </div>
    </div>
  );
};

export default FileUploadTab;