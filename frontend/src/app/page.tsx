'use client';

import { useState, useEffect } from 'react';
import { apiEndpoints } from '@/lib/api';
import { Project } from '@/types';
import { PlusIcon, PlayIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import NewProjectModal from '@/components/NewProjectModal';

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'projects' | 'templates'>('projects');
  const [searchTerm, setSearchTerm] = useState('');
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
      
      const projectsRes = await apiEndpoints.getProjects();
      
      console.log('API responses:', { projectsRes });
      
      setProjects(projectsRes.data.data || []);
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
                  Video Templates (2)
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
                        {new Date(project.created_at).toLocaleDateString()}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Roadmap Placeholder Items */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-500">Template 1</h4>
                      <p className="text-sm text-gray-400 mt-1">Templates are roadmap items comprised of components and media files for easy re-use of popular videos</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-gray-400">Roadmap</span>
                        <span className="text-xs text-gray-400">Coming Soon</span>
                      </div>
                    </div>
                    <div className="h-4 w-4 bg-gray-300 rounded ml-2" />
                  </div>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-500">Template 2</h4>
                      <p className="text-sm text-gray-400 mt-1">Templates are roadmap items comprised of components and media files for easy re-use of popular videos</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-gray-400">Roadmap</span>
                        <span className="text-xs text-gray-400">Coming Soon</span>
                      </div>
                    </div>
                    <div className="h-4 w-4 bg-gray-300 rounded ml-2" />
                  </div>
                </div>
              </div>
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


    </div>
  );
}