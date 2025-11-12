'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FolderIcon, ChevronRightIcon, ChevronDownIcon, PlusIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  ownerId: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  children?: Folder[];
}

interface FolderTreeProps {
  folders: Folder[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder: (parentId: string | null) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onMoveFolder?: (folderId: string, newParentId: string | null) => void;
  onDropProject?: (projectId: string, folderId: string | null) => void;
  newlyCreatedFolderId?: string | null;
}

interface FolderNodeProps {
  folder: Folder;
  level: number;
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder: (parentId: string | null) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onMoveFolder?: (folderId: string, newParentId: string | null) => void;
  onDropProject?: (projectId: string, folderId: string | null) => void;
  isNewFolder?: boolean;
  newlyCreatedFolderId?: string | null;
  searchTerm?: string;
}

const FolderNode: React.FC<FolderNodeProps> = ({
  folder,
  level,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveFolder,
  onDropProject,
  isNewFolder = false,
  newlyCreatedFolderId,
  searchTerm = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(isNewFolder);
  const [editName, setEditName] = useState(folder.name);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasChildren = folder.children && folder.children.length > 0;
  
  // Auto-expand if folder matches search
  useEffect(() => {
    if (searchTerm && folder.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      setIsExpanded(true);
    }
  }, [searchTerm, folder.name]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editName.trim()) {
      onRenameFolder(folder.id, editName.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (isNewFolder) {
      // If it's a new folder and we cancel, delete it
      onDeleteFolder(folder.id);
    } else {
      setEditName(folder.name);
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('application/project-id')) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const projectId = e.dataTransfer.getData('application/project-id');
    if (projectId && onDropProject) {
      onDropProject(projectId, folder.id);
    }
  };

  // Highlight if folder name matches search
  const matchesSearch = searchTerm && folder.name.toLowerCase().includes(searchTerm.toLowerCase());

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer group ${
          selectedFolderId === folder.id
            ? 'bg-blue-100 text-blue-700'
            : isDragOver
            ? 'bg-green-200 border-2 border-green-500'
            : matchesSearch
            ? 'bg-yellow-50 border border-yellow-300'
            : 'hover:bg-gray-100 text-gray-700'
        }`}
        style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => !isEditing && onSelectFolder(folder.id)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 hover:bg-gray-200 rounded"
          >
            {isExpanded ? (
              <ChevronDownIcon className="w-4 h-4" />
            ) : (
              <ChevronRightIcon className="w-4 h-4" />
            )}
          </button>
        ) : (
          <div className="w-4 h-4" />
        )}
        
        <FolderIcon className="w-4 h-4 flex-shrink-0" />
        
        {isEditing ? (
          <div className="flex-1 flex items-center gap-1">
            <input
              ref={inputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              className="flex-1 px-1 py-0.5 text-sm border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSave();
              }}
              className="p-0.5 hover:bg-green-200 rounded text-green-600"
              title="Save"
            >
              <CheckIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCancel();
              }}
              className="p-0.5 hover:bg-red-200 rounded text-red-600"
              title="Cancel"
            >
              <XMarkIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <>
            <span className="flex-1 text-sm truncate">{folder.name}</span>
            
            {isHovered && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateFolder(folder.id);
                  }}
                  className="p-1 hover:bg-blue-200 rounded"
                  title="Create subfolder"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  className="p-1 hover:bg-blue-200 rounded"
                  title="Rename folder"
                >
                  <PencilIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFolder(folder.id);
                  }}
                  className="p-1 hover:bg-red-200 rounded"
                  title="Delete folder"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
      
      {hasChildren && isExpanded && (
        <div>
          {folder.children!.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              level={level + 1}
              selectedFolderId={selectedFolderId}
              onSelectFolder={onSelectFolder}
              onCreateFolder={onCreateFolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              onMoveFolder={onMoveFolder}
              onDropProject={onDropProject}
              isNewFolder={newlyCreatedFolderId === child.id}
              newlyCreatedFolderId={newlyCreatedFolderId}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FolderTree: React.FC<FolderTreeProps> = ({
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveFolder,
  onDropProject,
  newlyCreatedFolderId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDragOverRoot, setIsDragOverRoot] = useState(false);

  // Filter folders based on search (show all matching folders and their parents)
  const filteredFolders = useMemo(() => {
    if (!searchTerm) return folders;

    const searchLower = searchTerm.toLowerCase();
    const filterFolderTree = (folderList: Folder[]): Folder[] => {
      return folderList
        .map(folder => {
          const matches = folder.name.toLowerCase().includes(searchLower);
          const filteredChildren = folder.children ? filterFolderTree(folder.children) : [];
          const hasMatchingChildren = filteredChildren.length > 0;

          if (matches || hasMatchingChildren) {
            return {
              ...folder,
              children: filteredChildren.length > 0 ? filteredChildren : folder.children
            };
          }
          return null;
        })
        .filter((f): f is Folder => f !== null);
    };

    return filterFolderTree(folders);
  }, [folders, searchTerm]);

  const handleRootDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('application/project-id')) {
      setIsDragOverRoot(true);
    }
  };

  const handleRootDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverRoot(false);
  };

  const handleRootDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverRoot(false);
    
    const projectId = e.dataTransfer.getData('application/project-id');
    if (projectId && onDropProject) {
      onDropProject(projectId, null);
    }
  };

  return (
    <div className="space-y-1">
      {/* Search box */}
      <div className="mb-2">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search folders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-8 pr-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Root level - "All Projects" */}
      <div
        className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer ${
          selectedFolderId === null
            ? 'bg-blue-100 text-blue-700'
            : isDragOverRoot
            ? 'bg-green-200 border-2 border-green-500'
            : 'hover:bg-gray-100 text-gray-700'
        }`}
        onClick={() => onSelectFolder(null)}
        onDragOver={handleRootDragOver}
        onDragLeave={handleRootDragLeave}
        onDrop={handleRootDrop}
      >
        <span className="text-sm font-medium">All Projects</span>
      </div>
      
      {/* Folder tree */}
      {filteredFolders.length === 0 && searchTerm ? (
        <div className="px-2 py-1.5 text-sm text-gray-500">No folders match "{searchTerm}"</div>
      ) : (
        filteredFolders.map((folder) => {
          // Recursively check if this folder or any child is newly created
          const isNew = newlyCreatedFolderId === folder.id;
          return (
            <FolderNode
              key={folder.id}
              folder={folder}
              level={0}
              selectedFolderId={selectedFolderId}
              onSelectFolder={onSelectFolder}
              onCreateFolder={onCreateFolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              onMoveFolder={onMoveFolder}
              onDropProject={onDropProject}
              isNewFolder={isNew}
              newlyCreatedFolderId={newlyCreatedFolderId}
              searchTerm={searchTerm}
            />
          );
        })
      )}
    </div>
  );
};

export default FolderTree;
