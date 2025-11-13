'use client';

import { useState, useEffect, useRef } from 'react';
import { PlusIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, DocumentDuplicateIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { ScriptPlanRow } from '@/types';
import { generateScript, ScriptSection } from '@/lib/geminiApi';
import { generateVideo, downloadVideoAsDataUrl, getVideoDuration, GeneratedVideo } from '@/lib/videoGenerationApi';

interface ScriptPlanningGridProps {
  rows: ScriptPlanRow[];
  onRowsChange: (rows: ScriptPlanRow[]) => void;
  onVideoGenerated?: (videoData: { dataUrl: string; blob: Blob; duration: number; name: string; prompt: string }) => void;
}

// Calculate estimated time based on script word count
// Using average reading speed of 150 words per minute (2.5 words per second)
const calculateEstimatedTime = (script: string): number => {
  if (!script || script.trim().length === 0) return 0;
  const wordCount = script.trim().split(/\s+/).length;
  // 150 WPM = 2.5 words/second, add 0.5s buffer per sentence
  const sentences = script.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const baseTime = wordCount / 2.5;
  const bufferTime = sentences * 0.5;
  return Math.round((baseTime + bufferTime) * 10) / 10; // Round to 1 decimal
};

// Validate headline (max 10 words)
const validateHeadline = (text: string): string => {
  const words = text.trim().split(/\s+/);
  if (words.length > 10) {
    return words.slice(0, 10).join(' ');
  }
  return text.trim();
};

export default function ScriptPlanningGrid({ rows, onRowsChange, onVideoGenerated }: ScriptPlanningGridProps) {
  const [localRows, setLocalRows] = useState<ScriptPlanRow[]>(rows);
  const [editingCell, setEditingCell] = useState<{ rowId: string; column: keyof ScriptPlanRow } | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  
  // GenAI state
  const [centralPrompt, setCentralPrompt] = useState('');
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generatingRowId, setGeneratingRowId] = useState<string | null>(null);
  const [genAIError, setGenAIError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [rowPromptInput, setRowPromptInput] = useState<{ rowId: string; prompt: string } | null>(null);
  
  // Video generation state
  const [generatingVideoRowId, setGeneratingVideoRowId] = useState<string | null>(null);
  const [videoGenError, setVideoGenError] = useState<string | null>(null);

  useEffect(() => {
    setLocalRows(rows);
  }, [rows]);

  // Load API key from environment or localStorage
  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    const envKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (envKey) {
      setApiKey(envKey);
    } else if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  useEffect(() => {
    // Auto-save when rows change (debounced)
    const timer = setTimeout(() => {
      if (JSON.stringify(localRows) !== JSON.stringify(rows)) {
        onRowsChange(localRows);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localRows, rows, onRowsChange]);

  const handleCellEdit = (rowId: string, column: keyof ScriptPlanRow, currentValue: any) => {
    setEditingCell({ rowId, column });
    setEditingValue(String(currentValue || ''));
  };

  const handleCellSave = (rowId: string, column: keyof ScriptPlanRow) => {
    const updatedRows = localRows.map(row => {
      if (row.id !== rowId) return row;

      let newValue: any = editingValue;

      // Special handling for different columns
      if (column === 'headline') {
        newValue = validateHeadline(editingValue);
      } else if (column === 'script') {
        newValue = editingValue;
        // Auto-calculate estimated time when script changes
        const estimatedTime = calculateEstimatedTime(editingValue);
        return { ...row, [column]: newValue, estimatedTime };
      }

      return { ...row, [column]: newValue };
    });

    setLocalRows(updatedRows);
    setEditingCell(null);
    setEditingValue('');
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, rowId: string, column: keyof ScriptPlanRow) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCellSave(rowId, column);
    } else if (e.key === 'Escape') {
      handleCellCancel();
    }
  };

  const addRow = () => {
    const newRow: ScriptPlanRow = {
      id: `row-${Date.now()}`,
      headline: '',
      script: '',
      visualDescription: '',
      estimatedTime: 0,
      notes: '',
      order: localRows.length
    };
    setLocalRows([...localRows, newRow]);
  };

  const deleteRow = (rowId: string) => {
    setLocalRows(localRows.filter(row => row.id !== rowId).map((row, index) => ({
      ...row,
      order: index
    })));
  };

  const duplicateRow = (rowId: string) => {
    const rowIndex = localRows.findIndex(row => row.id === rowId);
    if (rowIndex === -1) return;

    const rowToDuplicate = localRows[rowIndex];
    const newRow: ScriptPlanRow = {
      ...rowToDuplicate,
      id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      order: rowIndex + 1
    };

    // Insert after the duplicated row
    const newRows = [...localRows];
    newRows.splice(rowIndex + 1, 0, newRow);
    // Update order for all rows after insertion
    newRows.forEach((row, i) => {
      row.order = i;
    });
    setLocalRows(newRows);
  };

  const handleGenerateAll = async () => {
    if (!centralPrompt.trim()) {
      setGenAIError('Please enter a prompt for script generation');
      return;
    }

    if (!apiKey) {
      setGenAIError('Please provide a Gemini API key. You can set it in the input below or add NEXT_PUBLIC_GEMINI_API_KEY to your environment variables.');
      return;
    }

    setIsGeneratingAll(true);
    setGenAIError(null);

    try {
      const existingSections: ScriptSection[] = localRows.map(row => ({
        headline: row.headline,
        script: row.script,
        visualDescription: row.visualDescription,
        notes: row.notes
      }));

      const sections = await generateScript({
        prompt: centralPrompt.trim(),
        apiKey,
        existingSections: existingSections.length > 0 ? existingSections : undefined
      });

      // Convert to ScriptPlanRow format
      const newRows: ScriptPlanRow[] = sections.map((section, index) => ({
        id: `row-${Date.now()}-${index}`,
        headline: validateHeadline(section.headline),
        script: section.script,
        visualDescription: section.visualDescription,
        estimatedTime: calculateEstimatedTime(section.script),
        notes: section.notes || '',
        order: index
      }));

      setLocalRows(newRows);
      setCentralPrompt(''); // Clear prompt after successful generation
    } catch (err: any) {
      console.error('Error generating script:', err);
      setGenAIError(err.message || 'Failed to generate script. Please try again.');
    } finally {
      setIsGeneratingAll(false);
    }
  };

  const handleGenerateRowClick = (rowId: string) => {
    setRowPromptInput({ rowId, prompt: '' });
  };

  const handleGenerateRow = async (rowId: string, promptText: string) => {
    const rowIndex = localRows.findIndex(row => row.id === rowId);
    if (rowIndex === -1) return;

    if (!promptText || !promptText.trim()) {
      setRowPromptInput(null);
      return;
    }

    if (!apiKey) {
      setGenAIError('Please provide a Gemini API key. You can set it in the input below or add NEXT_PUBLIC_GEMINI_API_KEY to your environment variables.');
      setRowPromptInput(null);
      return;
    }

    setGeneratingRowId(rowId);
    setGenAIError(null);
    setRowPromptInput(null);

    try {
      const existingSections: ScriptSection[] = localRows.map(row => ({
        headline: row.headline,
        script: row.script,
        visualDescription: row.visualDescription,
        notes: row.notes
      }));

      const sections = await generateScript({
        prompt: promptText.trim(),
        apiKey,
        existingSections,
        targetSectionIndex: rowIndex
      });

      if (sections.length > 0) {
        const section = sections[0];
        const updatedRows = localRows.map((row, index) => {
          if (row.id === rowId) {
            return {
              ...row,
              headline: validateHeadline(section.headline),
              script: section.script,
              visualDescription: section.visualDescription,
              estimatedTime: calculateEstimatedTime(section.script),
              notes: section.notes || row.notes
            };
          }
          return row;
        });
        setLocalRows(updatedRows);
      }
    } catch (err: any) {
      console.error('Error generating script section:', err);
      setGenAIError(err.message || 'Failed to generate script section. Please try again.');
    } finally {
      setGeneratingRowId(null);
    }
  };

  const handleGenerateVideo = async (rowId: string) => {
    const row = localRows.find(r => r.id === rowId);
    if (!row) return;

    const visualDescription = row.visualDescription?.trim();
    if (!visualDescription) {
      setVideoGenError('Please add a visual description first before generating a video.');
      return;
    }

    if (!apiKey) {
      setVideoGenError('Please provide a Gemini API key. You can set it in the central AI prompt section or add NEXT_PUBLIC_GEMINI_API_KEY to your environment variables.');
      return;
    }

    setGeneratingVideoRowId(rowId);
    setVideoGenError(null);

    try {
      // Generate video using the visual description as prompt
      const generatedVideo = await generateVideo({
        prompt: visualDescription,
        apiKey,
        duration: Math.max(4, Math.min(8, row.estimatedTime || 5)), // Use estimated time, clamped to 4-8s
        resolution: '1080p'
      });

      // If we already have a blob from the API, use it; otherwise download
      let blob: Blob;
      let dataUrl: string;
      
      if (generatedVideo.videoBlob) {
        // Already downloaded and converted
        blob = generatedVideo.videoBlob;
        dataUrl = generatedVideo.videoUrl; // This is already a data URL
      } else {
        // Fallback: download from URL (for other providers)
        const downloaded = await downloadVideoAsDataUrl(generatedVideo.videoUrl);
        blob = downloaded.blob;
        dataUrl = downloaded.dataUrl;
      }

      // Use the duration from the API response, or calculate it
      const duration = generatedVideo.duration || await getVideoDuration(blob);

      // Generate a name for the video asset
      const videoName = `${row.headline || `Section ${localRows.findIndex(r => r.id === rowId) + 1}`}_${Date.now()}.mp4`;

      // Call the callback to add video to media assets
      if (onVideoGenerated) {
        onVideoGenerated({
          dataUrl,
          blob,
          duration,
          name: videoName,
          prompt: visualDescription
        });
      }

      // Optionally update notes to indicate video was generated
      const updatedRows = localRows.map(r => {
        if (r.id === rowId) {
          return {
            ...r,
            notes: `${r.notes ? r.notes + '\n\n' : ''}Video generated: ${new Date().toLocaleString()}`
          };
        }
        return r;
      });
      setLocalRows(updatedRows);

    } catch (err: any) {
      console.error('Error generating video:', err);
      // Format error message for better readability (handle newlines)
      const errorMessage = err.message || 'Failed to generate video. Please check if Veo API is available and you have access.';
      setVideoGenError(errorMessage.split('\n').join(' ')); // Replace newlines with spaces for display
    } finally {
      setGeneratingVideoRowId(null);
    }
  };

  const moveRow = (rowId: string, direction: 'up' | 'down') => {
    const index = localRows.findIndex(row => row.id === rowId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= localRows.length) return;

    const newRows = [...localRows];
    [newRows[index], newRows[newIndex]] = [newRows[newIndex], newRows[index]];
    // Update order
    newRows.forEach((row, i) => {
      row.order = i;
    });
    setLocalRows(newRows);
  };

  const totalTime = localRows.reduce((sum, row) => sum + row.estimatedTime, 0);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Script Planning</h2>
          <p className="text-sm text-gray-500">
            Plan your video script section by section. Estimated total time: <span className="font-medium">{totalTime.toFixed(1)}s</span>
          </p>
        </div>
        <button
          onClick={addRow}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Add Section
        </button>
      </div>

      {/* Central GenAI Prompt */}
      <div className="p-4 border-b border-gray-200 bg-blue-50">
        <div className="mb-3">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <img 
              src="/salesforce-agent.png" 
              alt="Salesforce Agent" 
              className="w-5 h-5 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <span>AI Script Generator</span>
          </label>
          <p className="text-xs text-gray-600 mb-3">
            Generate or regenerate all script sections at once. Describe the video you want to create.
          </p>
          
          <textarea
            value={centralPrompt}
            onChange={(e) => setCentralPrompt(e.target.value)}
            placeholder="e.g., Create a product demo video for a CRM software, showing key features and benefits"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-2"
            disabled={isGeneratingAll}
          />
          
          {/* API Key Input - Only show if not set in environment */}
          {!process.env.NEXT_PUBLIC_GEMINI_API_KEY && (
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Gemini API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  if (e.target.value) {
                    localStorage.setItem('gemini_api_key', e.target.value);
                  } else {
                    localStorage.removeItem('gemini_api_key');
                  }
                }}
                placeholder="Enter your Gemini API key"
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                disabled={isGeneratingAll}
              />
              <p className="text-xs text-gray-500 mt-1">
                API key will be saved in browser localStorage
              </p>
            </div>
          )}

          {(genAIError || videoGenError) && (
            <div className="mb-2 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-700">
              {genAIError || videoGenError}
            </div>
          )}

          <button
            onClick={handleGenerateAll}
            disabled={isGeneratingAll || !centralPrompt.trim() || (!apiKey && !process.env.NEXT_PUBLIC_GEMINI_API_KEY)}
            className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isGeneratingAll ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              'Generate All Sections'
            )}
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-full">
          {/* Table Header */}
          <div className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
            <div className="grid grid-cols-12 gap-2 p-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
              <div className="col-span-1 text-center">Actions</div>
              <div className="col-span-2">Headline (10 words max)</div>
              <div className="col-span-4">Script</div>
              <div className="col-span-2">Visual Description</div>
              <div className="col-span-1 text-center">Time (s)</div>
              <div className="col-span-2">Notes</div>
            </div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-gray-200">
            {localRows.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No script sections yet. Click "Add Section" to get started.</p>
              </div>
            ) : (
              localRows
                .sort((a, b) => a.order - b.order)
                .map((row, index) => (
                  <div key={row.id}>
                    {/* Inline prompt input for row GenAI */}
                    {rowPromptInput?.rowId === row.id && (
                      <div className="p-2 bg-blue-50 border border-blue-200 rounded m-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={rowPromptInput.prompt}
                            onChange={(e) => setRowPromptInput({ ...rowPromptInput, prompt: e.target.value })}
                            placeholder={`Enter prompt to regenerate section ${index + 1}...`}
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleGenerateRow(row.id, rowPromptInput.prompt);
                              } else if (e.key === 'Escape') {
                                setRowPromptInput(null);
                              }
                            }}
                          />
                          <button
                            onClick={() => handleGenerateRow(row.id, rowPromptInput.prompt)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            Generate
                          </button>
                          <button
                            onClick={() => setRowPromptInput(null)}
                            className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-12 gap-2 p-3 hover:bg-gray-50 group">
                      {/* Order/Actions */}
                      <div className="col-span-1 flex items-center justify-center gap-1 flex-wrap">
                        <button
                          onClick={() => moveRow(row.id, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <ArrowUpIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveRow(row.id, 'down')}
                          disabled={index === localRows.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <ArrowDownIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => duplicateRow(row.id)}
                          className="p-1 text-gray-400 hover:text-blue-600"
                          title="Duplicate section"
                        >
                          <DocumentDuplicateIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteRow(row.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Delete section"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleGenerateRowClick(row.id)}
                          disabled={generatingRowId === row.id || (!apiKey && !process.env.NEXT_PUBLIC_GEMINI_API_KEY)}
                          className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Generate with AI"
                        >
                          {generatingRowId === row.id ? (
                            <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <img 
                              src="/salesforce-agent.png" 
                              alt="AI Generate" 
                              className="w-4 h-4 object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                        </button>
                      </div>

                    {/* Headline */}
                    <div className="col-span-2">
                      {editingCell?.rowId === row.id && editingCell.column === 'headline' ? (
                        <input
                          ref={inputRef as React.RefObject<HTMLInputElement>}
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={() => handleCellSave(row.id, 'headline')}
                          onKeyDown={(e) => handleKeyDown(e, row.id, 'headline')}
                          className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          autoFocus
                        />
                      ) : (
                        <div
                          onClick={() => handleCellEdit(row.id, 'headline', row.headline)}
                          className="px-2 py-1 text-sm cursor-text hover:bg-gray-100 rounded min-h-[32px] flex items-center"
                        >
                          {row.headline || <span className="text-gray-400">Click to add headline...</span>}
                        </div>
                      )}
                    </div>

                    {/* Script */}
                    <div className="col-span-4">
                      {editingCell?.rowId === row.id && editingCell.column === 'script' ? (
                        <textarea
                          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={() => handleCellSave(row.id, 'script')}
                          onKeyDown={(e) => handleKeyDown(e, row.id, 'script')}
                          className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                          rows={3}
                          autoFocus
                        />
                      ) : (
                        <div
                          onClick={() => handleCellEdit(row.id, 'script', row.script)}
                          className="px-2 py-1 text-sm cursor-text hover:bg-gray-100 rounded min-h-[60px] flex items-start"
                        >
                          {row.script || <span className="text-gray-400">Click to add script...</span>}
                        </div>
                      )}
                    </div>

                    {/* Visual Description */}
                    <div className="col-span-2">
                      <div className="flex items-start gap-1">
                        <div className="flex-1">
                          {editingCell?.rowId === row.id && editingCell.column === 'visualDescription' ? (
                            <textarea
                              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              onBlur={() => handleCellSave(row.id, 'visualDescription')}
                              onKeyDown={(e) => handleKeyDown(e, row.id, 'visualDescription')}
                              className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                              rows={3}
                              autoFocus
                            />
                          ) : (
                            <div
                              onClick={() => handleCellEdit(row.id, 'visualDescription', row.visualDescription)}
                              className="px-2 py-1 text-sm cursor-text hover:bg-gray-100 rounded min-h-[60px] flex items-start"
                            >
                              {row.visualDescription || <span className="text-gray-400">Click to describe visual...</span>}
                            </div>
                          )}
                        </div>
                        {row.visualDescription && (
                          <button
                            onClick={() => handleGenerateVideo(row.id)}
                            disabled={generatingVideoRowId === row.id || (!apiKey && !process.env.NEXT_PUBLIC_GEMINI_API_KEY)}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-purple-600 hover:bg-purple-50 disabled:opacity-30 disabled:cursor-not-allowed rounded border border-gray-300 hover:border-purple-400 transition-colors"
                            title="Generate video with AI from visual description"
                          >
                            {generatingVideoRowId === row.id ? (
                              <>
                                <svg className="animate-spin h-3 w-3 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="text-xs">Generating...</span>
                              </>
                            ) : (
                              <>
                                <img 
                                  src="/salesforce-agent.png" 
                                  alt="AI" 
                                  className="w-3 h-3 object-contain"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                                <VideoCameraIcon className="w-3 h-3" />
                                <span className="text-xs font-medium">AI Video</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Estimated Time */}
                    <div className="col-span-1 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">{row.estimatedTime.toFixed(1)}s</span>
                    </div>

                    {/* Notes */}
                    <div className="col-span-2">
                      {editingCell?.rowId === row.id && editingCell.column === 'notes' ? (
                        <textarea
                          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={() => handleCellSave(row.id, 'notes')}
                          onKeyDown={(e) => handleKeyDown(e, row.id, 'notes')}
                          className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                          rows={3}
                          autoFocus
                        />
                      ) : (
                        <div
                          onClick={() => handleCellEdit(row.id, 'notes', row.notes)}
                          className="px-2 py-1 text-sm cursor-text hover:bg-gray-100 rounded min-h-[60px] flex items-start"
                        >
                          {row.notes || <span className="text-gray-400">Click to add notes...</span>}
                        </div>
                      )}
                    </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

