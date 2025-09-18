'use client';

import { useState, useEffect } from 'react';
import { apiEndpoints } from '@/lib/api';
import { Component } from '@/types';
import { PlusIcon, EyeIcon, CubeIcon } from '@heroicons/react/24/outline';
import ComponentDetailsModal from '@/components/ComponentDetailsModal';
import LogoBlendComponent from '@/components/LogoBlendComponent';
import CustomerLogoSplit from '@/components/CustomerLogoSplit';

export default function ComponentsPage() {
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [showComponentModal, setShowComponentModal] = useState(false);
  const [showLogoBuilder, setShowLogoBuilder] = useState(false);
  const [showLottieBuilder, setShowLottieBuilder] = useState(false);

  useEffect(() => {
    loadComponents();
  }, []);

  const loadComponents = async () => {
    try {
      setLoading(true);
      const response = await apiEndpoints.getComponents();
      setComponents(response.data.data || []);
    } catch (err) {
      setError('Failed to load components');
      console.error('Error loading components:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleComponentClick = (component: Component) => {
    setSelectedComponent(component);
    setShowComponentModal(true);
  };

  const handleSaveComponent = async (componentData: any) => {
    try {
      await apiEndpoints.createComponent(componentData);
      loadComponents(); // Refresh the list
    } catch (error) {
      console.error('Error saving component:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading components...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Component Builder</h1>
              <span className="ml-3 px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                Video Components
              </span>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLogoBuilder(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Logo Blend
              </button>
              <button
                onClick={() => setShowLottieBuilder(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Lottie Animation
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <PlusIcon className="h-4 w-4 mr-2" />
                More Components
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-600">{error}</div>
          </div>
        )}

        {/* Component Types */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Component Types</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <CubeIcon className="h-5 w-5 text-purple-600 mr-2" />
                <h3 className="font-medium text-gray-900">Logo Blend</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Blend customer logos with Salesforce branding
              </p>
              <button
                onClick={() => setShowLogoBuilder(true)}
                className="text-sm text-purple-600 hover:text-purple-700"
              >
                Create Component →
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <CubeIcon className="h-5 w-5 text-green-600 mr-2" />
                <h3 className="font-medium text-gray-900">Lottie Animation</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                After Effects animations with merge fields
              </p>
              <button
                onClick={() => setShowLottieBuilder(true)}
                className="text-sm text-green-600 hover:text-green-700"
              >
                Create Component →
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 opacity-50">
              <div className="flex items-center mb-2">
                <CubeIcon className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="font-medium text-gray-900">Text Overlay</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Animated text with custom fonts and effects
              </p>
              <span className="text-sm text-gray-400">Coming Soon</span>
            </div>
          </div>
        </div>

        {/* Existing Components */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Your Components ({components.length})
            </h3>
            
            {components.length === 0 ? (
              <div className="text-center py-8">
                <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No components yet</h3>
                <p className="mt-1 text-sm text-gray-500">Create your first component to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {components.map((component) => (
                  <div
                    key={component.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleComponentClick(component)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{component.name}</h4>
                        <p className="text-xs text-gray-500 mt-1">{component.type}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-gray-500">{component.category}</span>
                          {component.duration && (
                            <span className="text-xs text-gray-500">{component.duration}s</span>
                          )}
                        </div>
                      </div>
                      <EyeIcon className="h-4 w-4 text-gray-400 ml-2" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <ComponentDetailsModal
        component={selectedComponent}
        isOpen={showComponentModal}
        onClose={() => setShowComponentModal(false)}
      />

      <LogoBlendComponent
        isOpen={showLogoBuilder}
        onClose={() => setShowLogoBuilder(false)}
        onSave={handleSaveComponent}
      />

      <CustomerLogoSplit
        isOpen={showLottieBuilder}
        onClose={() => setShowLottieBuilder(false)}
        onSave={handleSaveComponent}
      />
    </div>
  );
}
