'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Component } from '@/types';

interface HTMLRendererProps {
  component: Component;
  properties?: {
    [key: string]: any;
  };
  currentTime: number;
  isPlaying: boolean;
  mode?: 'preview' | 'fullscreen';
  onPropertyChange?: (property: string, value: any) => void;
}

// Salesforce theme system
const salesforceThemes = {
  lightning: {
    colors: { 
      primary: '#0176D3', 
      secondary: '#F3F3F3',
      text: '#181818',
      background: '#FFFFFF',
      border: '#DDDBDA'
    },
    fonts: { 
      primary: 'Salesforce Sans, Arial, sans-serif', 
      secondary: 'Arial, sans-serif' 
    },
    spacing: { 
      small: '8px', 
      medium: '16px', 
      large: '24px' 
    }
  },
  classic: {
    colors: { 
      primary: '#16325C', 
      secondary: '#F4F6F9',
      text: '#3E3E3C',
      background: '#FFFFFF',
      border: '#C9C7C5'
    },
    fonts: { 
      primary: 'Arial, sans-serif', 
      secondary: 'Helvetica, sans-serif' 
    },
    spacing: { 
      small: '4px', 
      medium: '8px', 
      large: '16px' 
    }
  }
};

// Component-specific renderers
const LeadFormRenderer = ({ properties, currentTime, isPlaying }: HTMLRendererProps) => {
  const theme = salesforceThemes[properties?.theme || 'lightning'];
  
  return (
    <div 
      className="w-full h-full bg-white rounded-lg shadow-lg overflow-hidden"
      style={{ fontFamily: theme.fonts.primary }}
    >
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4" style={{ color: theme.colors.text }}>
          New Lead
        </h2>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.text }}>
              First Name
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md"
              style={{ 
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.background
              }}
              value={properties?.firstName || 'John'}
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.text }}>
              Last Name
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md"
              style={{ 
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.background
              }}
              value={properties?.lastName || 'Doe'}
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.text }}>
              Company
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md"
              style={{ 
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.background
              }}
              value={properties?.company || 'Acme Corp'}
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.text }}>
              Email
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 border rounded-md"
              style={{ 
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.background
              }}
              value={properties?.email || 'john.doe@acme.com'}
              readOnly
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <button
              className="px-4 py-2 border rounded-md"
              style={{ 
                borderColor: theme.colors.border,
                color: theme.colors.text,
                backgroundColor: theme.colors.background
              }}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 text-white rounded-md"
              style={{ backgroundColor: theme.colors.primary }}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const OpportunityPipelineRenderer = ({ properties, currentTime, isPlaying }: HTMLRendererProps) => {
  const theme = salesforceThemes[properties?.theme || 'lightning'];
  const stages = properties?.stages || ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won'];
  const deals = properties?.deals || [
    { name: 'Acme Corp Deal', stage: 'Proposal', amount: '$50,000' },
    { name: 'TechStart Inc', stage: 'Qualification', amount: '$25,000' },
    { name: 'Global Systems', stage: 'Negotiation', amount: '$100,000' }
  ];

  return (
    <div 
      className="w-full h-full bg-white rounded-lg shadow-lg overflow-hidden"
      style={{ fontFamily: theme.fonts.primary }}
    >
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4" style={{ color: theme.colors.text }}>
          Opportunity Pipeline
        </h2>
        <div className="flex space-x-4 overflow-x-auto">
          {stages.map((stage: string, index: number) => (
            <div key={stage} className="flex-shrink-0 w-48">
              <div 
                className="p-3 rounded-t-lg text-center font-medium text-white"
                style={{ backgroundColor: theme.colors.primary }}
              >
                {stage}
              </div>
              <div 
                className="p-3 border-l border-r border-b rounded-b-lg min-h-32"
                style={{ 
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.secondary
                }}
              >
                {deals
                  .filter(deal => deal.stage === stage)
                  .map((deal, dealIndex) => (
                    <div
                      key={dealIndex}
                      className="p-2 mb-2 bg-white rounded border"
                      style={{ borderColor: theme.colors.border }}
                    >
                      <div className="font-medium text-sm" style={{ color: theme.colors.text }}>
                        {deal.name}
                      </div>
                      <div className="text-xs" style={{ color: theme.colors.primary }}>
                        {deal.amount}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const DashboardWidgetRenderer = ({ properties, currentTime, isPlaying }: HTMLRendererProps) => {
  const theme = salesforceThemes[properties?.theme || 'lightning'];
  const chartType = properties?.chartType || 'bar';
  const data = properties?.data || [65, 59, 80, 81, 56, 55, 40];

  return (
    <div 
      className="w-full h-full bg-white rounded-lg shadow-lg overflow-hidden"
      style={{ fontFamily: theme.fonts.primary }}
    >
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4" style={{ color: theme.colors.text }}>
          Sales Performance
        </h2>
        <div className="h-48 flex items-end justify-between space-x-2">
          {data.map((value: number, index: number) => (
            <div key={index} className="flex flex-col items-center">
              <div
                className="w-8 rounded-t"
                style={{ 
                  height: `${(value / 100) * 150}px`,
                  backgroundColor: theme.colors.primary
                }}
              />
              <div className="text-xs mt-2" style={{ color: theme.colors.text }}>
                {index + 1}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
              $2.4M
            </div>
            <div className="text-sm" style={{ color: theme.colors.text }}>
              Total Revenue
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
              127
            </div>
            <div className="text-sm" style={{ color: theme.colors.text }}>
              Deals Closed
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main HTML renderer component
export default function HTMLRenderer({ 
  component, 
  properties = {}, 
  currentTime, 
  isPlaying, 
  mode = 'preview',
  onPropertyChange 
}: HTMLRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Component-specific rendering
  const renderComponent = () => {
    switch (component.type) {
      case 'lead_form':
        return <LeadFormRenderer component={component} properties={properties} currentTime={currentTime} isPlaying={isPlaying} mode={mode} onPropertyChange={onPropertyChange} />;
      case 'opportunity_pipeline':
        return <OpportunityPipelineRenderer component={component} properties={properties} currentTime={currentTime} isPlaying={isPlaying} mode={mode} onPropertyChange={onPropertyChange} />;
      case 'dashboard_widget':
        return <DashboardWidgetRenderer component={component} properties={properties} currentTime={currentTime} isPlaying={isPlaying} mode={mode} onPropertyChange={onPropertyChange} />;
      default:
        return (
          <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p className="text-lg">Unknown component type: {component.type}</p>
              <p className="text-sm">HTML renderer not implemented</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full ${mode === 'preview' ? 'rounded-lg' : ''}`}
    >
      {renderComponent()}
    </div>
  );
}
