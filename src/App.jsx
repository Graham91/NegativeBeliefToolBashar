import React, { useState, useEffect, useRef, useCallback } from 'react';
import TreeView from './components/TreeView';
import ProjectManager from './components/ProjectManager';
import './App.css';

const App = () => {
  const [currentView, setCurrentView] = useState('projects'); // 'projects' or 'tree'
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [projectData, setProjectData] = useState({
    projectName: 'New Project',
    LastSaveTime: null,
    ProjectStructure: {
      MainQuestion: {
        QuestionInput: '',
        ID: 'main-0',
        solution: '',
        children: []
      }
    }
  });

  const projectDataRef = useRef(projectData);

  // Keep ref in sync with state
  useEffect(() => {
    projectDataRef.current = projectData;
  }, [projectData]);

  useEffect(() => {
    // Listen for file open events
    const handleFileOpened = (event, data) => {
      setProjectData(data);
    };

    // Listen for project loaded
    const handleProjectLoaded = (event, data) => {
      setProjectData(data.projectData);
      setCurrentProjectId(data.projectId);
      setCurrentView('tree');
    };

    // Listen for save requests
    const handleRequestSaveData = () => {
      if (currentProjectId) {
        window.electronAPI.saveProjectData(currentProjectId, projectDataRef.current);
      }
    };

    // Listen for file saved confirmation
    const handleFileSaved = (event, result) => {
      if (result.success) {
        console.log('File saved successfully:', result.filePath);
      }
    };

    window.electronAPI.onFileOpened(handleFileOpened);
    window.electronAPI.onProjectLoaded(handleProjectLoaded);
    window.electronAPI.onRequestSaveData(handleRequestSaveData);
    window.electronAPI.onFileSaved(handleFileSaved);

    return () => {
      window.electronAPI.removeListener('file-opened', handleFileOpened);
      window.electronAPI.removeListener('project-loaded', handleProjectLoaded);
      window.electronAPI.removeListener('request-save-data', handleRequestSaveData);
      window.electronAPI.removeListener('file-saved', handleFileSaved);
    };
  }, [currentProjectId]);

  // Auto-save every 60 seconds when in tree view
  useEffect(() => {
    if (currentView === 'tree' && currentProjectId) {
      const autoSaveInterval = setInterval(() => {
        window.electronAPI.saveProjectData(currentProjectId, projectDataRef.current);
        console.log('Auto-saved project');
      }, 60000); // 60 seconds

      return () => clearInterval(autoSaveInterval);
    }
  }, [currentView, currentProjectId]);

  const updateProjectData = useCallback((newData) => {
    setProjectData(newData);
  }, []);

  const handleSelectProject = useCallback((projectId) => {
    window.electronAPI.loadProject(projectId);
  }, []);

  const handleSaveProject = useCallback(() => {
    if (currentProjectId) {
      window.electronAPI.saveProjectData(currentProjectId, projectDataRef.current);
      console.log('Project saved manually');
    }
  }, [currentProjectId]);

  const handleBackToProjects = useCallback(() => {
    // Auto-save current project before going back
    if (currentProjectId) {
      window.electronAPI.saveProjectData(currentProjectId, projectDataRef.current);
    }
    setCurrentView('projects');
    setCurrentProjectId(null);
  }, [currentProjectId]);

  return (
    <div className="app">
      {currentView === 'projects' ? (
        <ProjectManager onSelectProject={handleSelectProject} />
      ) : (
        <TreeView 
          projectData={projectData} 
          updateProjectData={updateProjectData}
          onBackToProjects={handleBackToProjects}
          onSaveProject={handleSaveProject}
        />
      )}
    </div>
  );
};

export default App;
