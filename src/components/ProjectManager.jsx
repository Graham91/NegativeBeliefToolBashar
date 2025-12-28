import React, { useState, useEffect } from 'react';

const ProjectManager = ({ onSelectProject }) => {
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [editingProject, setEditingProject] = useState(null);
  const [editedName, setEditedName] = useState('');

  useEffect(() => {
    loadProjects();
    
    // Listen for project list updates
    const handleProjectsUpdated = (event, projectList) => {
      setProjects(projectList);
    };
    
    window.electronAPI.onProjectsUpdated(handleProjectsUpdated);
    
    return () => {
      window.electronAPI.removeListener('projects-updated', handleProjectsUpdated);
    };
  }, []);

  const loadProjects = () => {
    window.electronAPI.loadProjects();
  };

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      window.electronAPI.createProject(newProjectName.trim());
      setNewProjectName('');
    }
  };

  const handleDeleteProject = (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      window.electronAPI.deleteProject(projectId);
    }
  };

  const handleRenameProject = (projectId) => {
    if (editedName.trim() && editedName !== editingProject.name) {
      window.electronAPI.renameProject(projectId, editedName.trim());
    }
    setEditingProject(null);
    setEditedName('');
  };

  const startEditing = (project) => {
    setEditingProject(project);
    setEditedName(project.name);
  };

  return (
    <div className="project-manager">
      <div className="project-manager-header">
        <h1>Belief System Projects</h1>
        <p>Select a project to continue or create a new one</p>
      </div>

      <div className="create-project-section">
        <h2>Create New Project</h2>
        <div className="create-project-form">
          <input
            type="text"
            placeholder="Enter project name..."
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateProject();
            }}
          />
          <button onClick={handleCreateProject} className="btn-create-project">
            Create Project
          </button>
        </div>
      </div>

      <div className="projects-list-section">
        <h2>Your Projects</h2>
        {projects.length === 0 ? (
          <p className="no-projects">No projects yet. Create one to get started!</p>
        ) : (
          <div className="projects-grid">
            {projects.map((project) => (
              <div key={project.id} className="project-card">
                {editingProject?.id === project.id ? (
                  <div className="project-edit-mode">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameProject(project.id);
                        if (e.key === 'Escape') setEditingProject(null);
                      }}
                      autoFocus
                    />
                    <div className="edit-actions">
                      <button onClick={() => handleRenameProject(project.id)}>✓</button>
                      <button onClick={() => setEditingProject(null)}>✗</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="project-info">
                      <h3>{project.name}</h3>
                      <p className="project-meta">
                        Last modified: {new Date(project.lastModified).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="project-actions">
                      <button
                        onClick={() => onSelectProject(project.id)}
                        className="btn-open-project"
                      >
                        Open
                      </button>
                      <button
                        onClick={() => startEditing(project)}
                        className="btn-edit-project"
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="btn-delete-project"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectManager;
