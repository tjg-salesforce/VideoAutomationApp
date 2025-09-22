import React, { useState } from 'react';
import { TimelineTab } from '@/types/timeline';

interface TimelineTabBarProps {
  tabs: TimelineTab[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabRename: (tabId: string, newName: string) => void;
  onGroupOpen: (groupId: string) => void;
}

export default function TimelineTabBar({
  tabs,
  activeTabId,
  onTabChange,
  onTabClose,
  onTabRename,
  onGroupOpen
}: TimelineTabBarProps) {
  const [editingTab, setEditingTab] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleTabDoubleClick = (tab: TimelineTab) => {
    if (tab.type === 'group' && tab.parentId) {
      onGroupOpen(tab.parentId);
    } else {
      // Start editing the tab name
      setEditingTab(tab.id);
      setEditingName(tab.name);
    }
  };

  const handleRenameSubmit = () => {
    if (editingTab && editingName.trim()) {
      onTabRename(editingTab, editingName.trim());
    }
    setEditingTab(null);
    setEditingName('');
  };

  const handleRenameCancel = () => {
    setEditingTab(null);
    setEditingName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      handleRenameCancel();
    }
  };

  return (
    <div className="flex items-center border-b border-gray-200 bg-white">
      <div className="flex items-center space-x-1 p-2">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`
              flex items-center px-3 py-2 rounded-t-lg cursor-pointer transition-colors
              ${activeTabId === tab.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
            onClick={() => onTabChange(tab.id)}
            onDoubleClick={() => handleTabDoubleClick(tab)}
          >
            {/* Tab Icon */}
            <div className="mr-2">
              {tab.type === 'main' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              )}
            </div>

            {/* Tab Name */}
            {editingTab === tab.id ? (
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={handleKeyDown}
                className="bg-transparent border-none outline-none text-sm font-medium min-w-0 flex-1"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="text-sm font-medium truncate max-w-32">
                {tab.name}
              </span>
            )}

            {/* Close Button */}
            {tab.type === 'group' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
                className="ml-2 p-1 rounded hover:bg-gray-300 hover:bg-opacity-50"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
