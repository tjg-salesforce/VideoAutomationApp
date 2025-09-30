'use client';

import { useState, useEffect } from 'react';
import { apiEndpoints } from '@/lib/api';
import { Project } from '@/types';
import { PlusIcon, PlayIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import NewProjectModal from '@/components/NewProjectModal';
import UseTemplateModal from '@/components/UseTemplateModal';
import DeleteTemplateModal from '@/components/DeleteTemplateModal';
import Toast from '@/components/Toast';

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showUseTemplateModal, setShowUseTemplateModal] = useState(false);
  const [showDeleteTemplateModal, setShowDeleteTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [templateToDelete, setTemplateToDelete] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'projects' | 'templates'>('projects');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template_id: '',
  });
  
  // Template usage states
  const [usingTemplate, setUsingTemplate] = useState<string | null>(null);
  
  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      console.log('Loading data from backend...');
      
      const [projectsRes, templatesRes] = await Promise.all([
        apiEndpoints.getProjects('default-user').catch(err => {
          console.error('Projects API error:', err);
          return { data: { data: [] } }; // Return empty array on error
        }),
        apiEndpoints.getTemplates(true).catch(err => {
          console.error('Templates API error:', err);
          return { data: { data: [] } }; // Return empty array on error
        })
      ]);
      
      console.log('API responses:', { projectsRes, templatesRes });
      
      setProjects(projectsRes.data.data || []);
      setTemplates(templatesRes.data.data || []);
    } catch (err) {
      console.error('Detailed error:', err);
      setError(`Failed to load data from backend: ${err.message}`);
      // Set empty arrays to prevent undefined errors
      setProjects([]);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectCreated = () => {
    loadData(); // Refresh the data
  };

  const handleUseTemplate = (template: any) => {
    setSelectedTemplate(template);
    setShowUseTemplateModal(true);
  };

  const handleCreateProjectFromTemplate = async (template: any, projectData: { name: string; description: string }) => {
    setUsingTemplate(template.id);
    try {
      // Get the full template data to copy timeline and settings
      const templateResponse = await apiEndpoints.getTemplate(template.id);
      const fullTemplate = templateResponse.data.data;
      
      // Create project with template data copied over
      const newProjectData = {
        name: projectData.name,
        description: projectData.description,
        template_id: template.id,
        // Copy timeline and settings from template
        timeline: fullTemplate.timeline || [],
        settings: fullTemplate.settings || {
          resolution: '1920x1080',
          frame_rate: 30,
          duration: 0
        },
        // Copy any additional template data
        merge_fields: fullTemplate.merge_fields || {},
        render_settings: {
          quality: 'high',
          format: 'mp4',
          codec: 'h264'
        }
      };

      console.log('Creating project from template with data:', newProjectData);

      const response = await apiEndpoints.createProject(newProjectData);
      const newProject = response.data.data;
      
      // Refresh the data
      loadData();
      
      // Navigate to the new project
      window.location.href = `/projects/${newProject.id}/edit`;
    } catch (err: any) {
      console.error('Error creating project from template:', err);
      setError(err.response?.data?.error || 'Failed to create project from template');
    } finally {
      setUsingTemplate(null);
    }
  };

  const handleDeleteTemplate = (template: any) => {
    setTemplateToDelete(template);
    setShowDeleteTemplateModal(true);
  };

  const confirmDeleteTemplate = async () => {
    if (!templateToDelete) return;

    try {
      await apiEndpoints.deleteTemplate(templateToDelete.id);
      setToast({ message: 'Template deleted successfully!', type: 'success' });
      loadData(); // Refresh the data
    } catch (err: any) {
      console.error('Error deleting template:', err);
      setError(err.response?.data?.error || 'Failed to delete template');
    } finally {
      setShowDeleteTemplateModal(false);
      setTemplateToDelete(null);
    }
  };

  // Filter projects based on search term
  const filteredProjects = projects.filter(project => {
    const searchLower = searchTerm.toLowerCase();
    return (
      project.name.toLowerCase().includes(searchLower) ||
      (project.description && project.description.toLowerCase().includes(searchLower))
    );
  });



  const handleEditProject = (project: Project) => {
    // Navigate to the project editor page
    window.location.href = `/projects/${project.id}/edit`;
  };

  const handleDeleteProject = async (project: Project) => {
    if (window.confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      try {
        await apiEndpoints.deleteProject(project.id);
        loadData(); // Refresh the data
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
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

        {/* Projects and Templates Tabs */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                <button 
                  onClick={() => setActiveTab('projects')}
                  className={`py-2 px-1 text-sm font-medium border-b-2 ${
                    activeTab === 'projects' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  My Projects ({searchTerm ? `${filteredProjects.length}/${projects.length}` : projects.length})
                </button>
                <button 
                  onClick={() => setActiveTab('templates')}
                  className={`py-2 px-1 text-sm font-medium border-b-2 ${
                    activeTab === 'templates' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Video Templates ({templates.length})
                </button>
              </nav>
            </div>
            
            {/* My Projects Tab Content */}
            <div className={activeTab === 'projects' ? 'block' : 'hidden'}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">My Projects</h3>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            {filteredProjects.length === 0 ? (
              <div className="text-center py-8">
                <PlayIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {searchTerm ? 'No projects found' : 'No projects yet'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm 
                    ? `No projects match "${searchTerm}". Try a different search term.`
                    : 'Get started by creating a new project.'
                  }
                </p>
                {!searchTerm && (
                  <div className="mt-6">
                    <button 
                      onClick={() => setShowNewProjectModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      New Project
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProjects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{project.name}</h4>
                      <p className="text-sm text-gray-500">{project.description || 'No description'}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          project.status === 'completed' ? 'bg-green-100 text-green-800' :
                          project.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          project.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {project.status}
                        </span>
                        {project.timeline && project.timeline.length > 0 && (
                          <span className="text-xs text-gray-500">
                            {project.timeline.length} component{project.timeline.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-sm text-gray-500">
                        {project.created_at ? new Date(project.created_at).toLocaleDateString() : 'Unknown'}
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleEditProject(project)}
                          className="p-1 text-gray-400 hover:text-blue-600"
                          title="Edit project"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Delete project"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
            
            {/* Video Templates Tab Content */}
            <div className={activeTab === 'templates' ? 'block' : 'hidden'}>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Video Templates</h3>
              {templates.length === 0 ? (
                <div className="text-center py-8">
                  <PlayIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No templates yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Create a project and save it as a template to get started.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <div key={template.id} className="border border-gray-200 rounded-lg p-4 bg-white hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{template.name}</h4>
                          <p className="text-sm text-gray-500 mt-1">{template.description || 'No description'}</p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs text-gray-400">Template</span>
                            <span className="text-xs text-gray-400">
                              {template.created_at ? new Date(template.created_at).toLocaleDateString() : 'Unknown'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4 flex flex-col space-y-2">
                          <button
                            onClick={() => handleUseTemplate(template)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
                            Use Template
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template)}
                            className="inline-flex items-center px-3 py-2 border border-red-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <TrashIcon className="h-4 w-4 mr-1" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </main>

      {/* Modals */}
      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onProjectCreated={handleProjectCreated}
        templates={[]}
      />
      
      <UseTemplateModal
        template={selectedTemplate}
        isOpen={showUseTemplateModal}
        onClose={() => {
          setShowUseTemplateModal(false);
          setSelectedTemplate(null);
        }}
        onUseTemplate={handleCreateProjectFromTemplate}
      />
      
      <DeleteTemplateModal
        template={templateToDelete}
        isOpen={showDeleteTemplateModal}
        onClose={() => {
          setShowDeleteTemplateModal(false);
          setTemplateToDelete(null);
        }}
        onConfirm={confirmDeleteTemplate}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

    </div>
  );
}