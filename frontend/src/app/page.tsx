'use client';

import { useState, useEffect } from 'react';
import { apiEndpoints } from '@/lib/api';
import { Project, Template, Component } from '@/types';
import { PlusIcon, PlayIcon, DocumentTextIcon, CubeIcon, EyeIcon } from '@heroicons/react/24/outline';
import NewProjectModal from '@/components/NewProjectModal';
import TemplateDetailsModal from '@/components/TemplateDetailsModal';
import ComponentDetailsModal from '@/components/ComponentDetailsModal';

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [showComponentModal, setShowComponentModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template_id: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading data from backend...');
      
      const [projectsRes, templatesRes, componentsRes] = await Promise.all([
        apiEndpoints.getProjects(),
        apiEndpoints.getTemplates(),
        apiEndpoints.getComponents(),
      ]);
      
      console.log('API responses:', { projectsRes, templatesRes, componentsRes });
      
      setProjects(projectsRes.data.data || []);
      setTemplates(templatesRes.data.data || []);
      setComponents(componentsRes.data.data || []);
    } catch (err) {
      console.error('Detailed error:', err);
      setError(`Failed to load data from backend: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectCreated = () => {
    loadData(); // Refresh the data
  };

  const handleTemplateClick = (template: Template) => {
    setSelectedTemplate(template);
    setShowTemplateModal(true);
  };

  const handleUseTemplate = (template: Template) => {
    setFormData({
      name: `New ${template.name} Project`,
      description: `Project created from ${template.name} template`,
      template_id: template.id,
    });
    setShowTemplateModal(false);
    setShowNewProjectModal(true);
  };

  const handleComponentClick = (component: Component) => {
    setSelectedComponent(component);
    setShowComponentModal(true);
  };

  if (loading) {
  return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Video Automation Platform...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ {error}</div>
          <button 
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
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
              <h1 className="text-2xl font-bold text-gray-900">Vibe-Code</h1>
              <span className="ml-3 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                Video Automation Platform
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <nav className="flex space-x-4">
                <a
                  href="/components"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Components
                </a>
              </nav>
              <button 
                onClick={() => setShowNewProjectModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                New Project
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <PlayIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Projects</dt>
                    <dd className="text-lg font-medium text-gray-900">{projects.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DocumentTextIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Templates</dt>
                    <dd className="text-lg font-medium text-gray-900">{templates.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CubeIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Components</dt>
                    <dd className="text-lg font-medium text-gray-900">{components.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Projects */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Projects</h3>
            {projects.length === 0 ? (
              <div className="text-center py-8">
                <PlayIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No projects yet</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new project.</p>
                <div className="mt-6">
                  <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    New Project
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{project.name}</h4>
                      <p className="text-sm text-gray-500">{project.description || 'No description'}</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        project.status === 'completed' ? 'bg-green-100 text-green-800' :
                        project.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        project.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(project.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Templates Preview */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Available Templates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <div 
                  key={template.id} 
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleTemplateClick(template)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{template.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-gray-500">{template.category}</span>
                        {template.duration && (
                          <span className="text-xs text-gray-500">{template.duration}s</span>
                        )}
                      </div>
                    </div>
                    <EyeIcon className="h-4 w-4 text-gray-400 ml-2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Components Preview */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Available Components</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          </div>
        </div>
      </main>

      {/* Modals */}
      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onProjectCreated={handleProjectCreated}
        templates={templates}
      />

      <TemplateDetailsModal
        template={selectedTemplate}
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onUseTemplate={handleUseTemplate}
      />

      <ComponentDetailsModal
        component={selectedComponent}
        isOpen={showComponentModal}
        onClose={() => setShowComponentModal(false)}
      />
    </div>
  );
}