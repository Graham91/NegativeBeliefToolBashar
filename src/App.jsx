import React, { useState, useEffect, useRef, useCallback } from 'react';
import TreeView from './components/TreeView';
import ProjectManager from './components/ProjectManager';
import SolutionPreview from './components/SolutionPreview';
import './App.css';

const App = () => {
  const [currentView, setCurrentView] = useState('projects'); // 'projects', 'tree', or 'preview'
  const [activeTab, setActiveTab] = useState('tree'); // 'tree' or 'preview'
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [projectData, setProjectData] = useState({
    projectName: 'New Project',
    LastSaveTime: null,
    RevisitNodes: [], // Array of node IDs marked for revisit
    ProjectStructure: {
      MainQuestion: {
        QuestionInput: '',
        ID: 'main-0',
        solution: '',
        children: []
      }
    }
  });

  // Global revisit state for solution toggles
  const [revisitMap, setRevisitMap] = useState({});

  // Reference for revisitMap to use in event listeners
  const revisitMapRef = useRef(revisitMap);
  
  // Keep ref in sync with state
  useEffect(() => {
    revisitMapRef.current = revisitMap;
  }, [revisitMap]);

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
      const loadedData = data.projectData;
      // Ensure backward compatibility - add RevisitNodes if it doesn't exist
      if (!loadedData.RevisitNodes) {
        loadedData.RevisitNodes = [];
      }
      setProjectData(loadedData);
      setCurrentProjectId(data.projectId);
      
      // Convert RevisitNodes array to revisitMap object
      const newRevisitMap = {};
      (loadedData.RevisitNodes || []).forEach(nodeId => {
        newRevisitMap[nodeId] = true;
      });
      setRevisitMap(newRevisitMap);
      
      setCurrentView('tree');
      setActiveTab('tree');
    };

    // Listen for save requests
    const handleRequestSaveData = () => {
      if (currentProjectId) {
        // Convert revisitMap to array of node IDs before saving
        const revisitNodes = Object.keys(revisitMapRef.current).filter(nodeId => revisitMapRef.current[nodeId]);
        const dataToSave = {
          ...projectDataRef.current,
          RevisitNodes: revisitNodes
        };
        window.electronAPI.saveProjectData(currentProjectId, dataToSave);
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
        // Convert revisitMap to array of node IDs before saving
        const revisitNodes = Object.keys(revisitMapRef.current).filter(nodeId => revisitMapRef.current[nodeId]);
        const dataToSave = {
          ...projectDataRef.current,
          RevisitNodes: revisitNodes
        };
        window.electronAPI.saveProjectData(currentProjectId, dataToSave);
        console.log('Auto-saved project');
      }, 60000); // 60 seconds

      return () => clearInterval(autoSaveInterval);
    }
  }, [currentView, currentProjectId]);

  const updateProjectData = useCallback((newData) => {
    setProjectData(newData);
  }, []);

  const handleSelectProject = useCallback((projectId) => {
    setActiveTab('tree');
    window.electronAPI.loadProject(projectId);
  }, []);

  const handleSaveProject = useCallback(() => {
    if (currentProjectId) {
      // Convert revisitMap to array of node IDs before saving
      const revisitNodes = Object.keys(revisitMap).filter(nodeId => revisitMap[nodeId]);
      const dataToSave = {
        ...projectDataRef.current,
        RevisitNodes: revisitNodes
      };
      window.electronAPI.saveProjectData(currentProjectId, dataToSave);
      console.log('Project saved manually');
    }
  }, [currentProjectId, revisitMap]);

  const handleBackToProjects = useCallback(() => {
    // Auto-save current project before going back
    if (currentProjectId) {
      // Convert revisitMap to array of node IDs before saving
      const revisitNodes = Object.keys(revisitMap).filter(nodeId => revisitMap[nodeId]);
      const dataToSave = {
        ...projectDataRef.current,
        RevisitNodes: revisitNodes
      };
      window.electronAPI.saveProjectData(currentProjectId, dataToSave);
    }
    setCurrentView('projects');
    setCurrentProjectId(null);
    setActiveTab('tree'); // Ensure tab resets to TreeView
    setRevisitMap({}); // Clear revisit map when leaving project
  }, [currentProjectId, revisitMap]);

  return (
    <div className="app">
      {currentView === 'projects' ? (
        <ProjectManager onSelectProject={handleSelectProject} />
      ) : (
        <>
          <div className="tab-bar">
            <button
              className={activeTab === 'tree' ? 'tab active' : 'tab'}
              onClick={() => {
                // console.log('Switching to Tree View');
                setActiveTab('tree');
              }}
            >
              Tree View
            </button>
            <button
              className={activeTab === 'preview' ? 'tab active' : 'tab'}
              onClick={() => {
                // console.log('Switching to Solution Preview');
                setActiveTab('preview');
              }}
            >
              Solution Preview
            </button>
          </div>

          {activeTab === 'tree' ? (
            <TreeView
              projectData={projectData}
              updateProjectData={updateProjectData}
              onBackToProjects={handleBackToProjects}
              onSaveProject={handleSaveProject}
              revisitMap={revisitMap}
              setRevisitMap={setRevisitMap}
            />
          ) : (
            <SolutionPreview
              projectData={projectData}
              revisitMap={revisitMap}
              setRevisitMap={setRevisitMap}
            />
          )}

        </>
      )}
    </div>
  );
};

export default App;
