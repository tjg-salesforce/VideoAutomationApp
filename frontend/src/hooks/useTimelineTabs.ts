import { useState, useCallback } from 'react';
import { TimelineTab, TimelineGroup, TimelineItem, TimelineLayer } from '@/types/timeline';

interface UseTimelineTabsProps {
  initialTabs?: TimelineTab[];
  initialGroups?: TimelineGroup[];
  initialActiveTabId?: string;
}

export function useTimelineTabs({
  initialTabs = [],
  initialGroups = [],
  initialActiveTabId = 'main'
}: UseTimelineTabsProps = {}) {
  const [tabs, setTabs] = useState<TimelineTab[]>(() => {
    // Initialize with main tab if none exist
    if (initialTabs.length === 0) {
      return [{
        id: 'main',
        name: 'Main Video',
        type: 'main',
        items: [],
        layers: [],
        isActive: true
      }];
    }
    return initialTabs;
  });

  const [groups, setGroups] = useState<TimelineGroup[]>(initialGroups);
  const [activeTabId, setActiveTabId] = useState(initialActiveTabId);

  // Get the currently active tab
  const activeTab = tabs.find(tab => tab.id === activeTabId) || tabs[0];

  // Switch to a different tab
  const switchTab = useCallback((tabId: string) => {
    setTabs(prev => prev.map(tab => ({
      ...tab,
      isActive: tab.id === tabId
    })));
    setActiveTabId(tabId);
  }, []);

  // Close a tab (only group tabs can be closed)
  const closeTab = useCallback((tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab && tab.type === 'group') {
      setTabs(prev => prev.filter(t => t.id !== tabId));
      
      // Update group to remove tab reference
      setGroups(prev => prev.map(group => 
        group.tabId === tabId ? { ...group, tabId: undefined } : group
      ));

      // Switch to main tab if we're closing the active tab
      if (activeTabId === tabId) {
        const mainTab = tabs.find(t => t.type === 'main');
        if (mainTab) {
          switchTab(mainTab.id);
        }
      }
    }
  }, [tabs, activeTabId, switchTab]);

  // Rename a tab
  const renameTab = useCallback((tabId: string, newName: string) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId ? { ...tab, name: newName } : tab
    ));
  }, []);

  // Create a new group tab
  const createGroupTab = useCallback((groupId: string, groupName: string, items: TimelineItem[], layers: TimelineLayer[]) => {
    const tabId = `group-${groupId}`;
    
    // Check if tab already exists
    if (tabs.find(t => t.id === tabId)) {
      switchTab(tabId);
      return;
    }

    const newTab: TimelineTab = {
      id: tabId,
      name: groupName,
      type: 'group',
      parentId: groupId,
      items,
      layers,
      isActive: false
    };

    setTabs(prev => [...prev, newTab]);
    switchTab(tabId);

    // Update group to reference the tab
    setGroups(prev => prev.map(group => 
      group.id === groupId ? { ...group, tabId } : group
    ));
  }, [tabs, switchTab]);

  // Create a new group from selected items
  const createGroup = useCallback((itemIds: string[], groupName: string, allItems: TimelineItem[]) => {
    const groupId = `group-${Date.now()}`;
    const groupItems = allItems.filter(item => itemIds.includes(item.id));
    
    if (groupItems.length === 0) return;

    // Calculate group bounds
    const startTime = Math.min(...groupItems.map(item => item.startTime));
    const endTime = Math.max(...groupItems.map(item => item.startTime + item.duration));

    const newGroup: TimelineGroup = {
      id: groupId,
      name: groupName,
      items: itemIds,
      startTime,
      endTime,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`, // Random color
      collapsed: true
    };

    setGroups(prev => [...prev, newGroup]);

    // Create a group item for the main timeline
    const groupItem: TimelineItem = {
      id: `group-item-${groupId}`,
      type: 'group',
      assetType: 'group',
      name: groupName,
      startTime,
      duration: endTime - startTime,
      layer: 0, // Will be set by the timeline
      order: 0, // Will be set by the timeline
      asset: {
        id: groupId,
        name: groupName,
        type: 'group'
      },
      properties: {},
      renderer: {
        type: 'css'
      },
      isGroup: true,
      groupItems: itemIds
    };

    return { group: newGroup, groupItem };
  }, []);

  // Update tab items (when items are modified)
  const updateTabItems = useCallback((tabId: string, items: TimelineItem[]) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId ? { ...tab, items } : tab
    ));
  }, []);

  // Update tab layers
  const updateTabLayers = useCallback((tabId: string, layers: TimelineLayer[]) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId ? { ...tab, layers } : tab
    ));
  }, []);

  return {
    tabs,
    groups,
    activeTabId,
    activeTab,
    switchTab,
    closeTab,
    renameTab,
    createGroupTab,
    createGroup,
    updateTabItems,
    updateTabLayers
  };
}
