import React, { useState, useEffect, useRef } from 'react';
import TreeView from './components/TreeView';
import './App.css';

const App = () => {
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

    // Listen for save requests
    const handleRequestSaveData = () => {
      window.electronAPI.saveData(projectDataRef.current);
    };

    // Listen for file saved confirmation
    const handleFileSaved = (event, result) => {
      if (result.success) {
        console.log('File saved successfully:', result.filePath);
      }
    };

    window.electronAPI.onFileOpened(handleFileOpened);
    window.electronAPI.onRequestSaveData(handleRequestSaveData);
    window.electronAPI.onFileSaved(handleFileSaved);

    return () => {
      window.electronAPI.removeListener('file-opened', handleFileOpened);
      window.electronAPI.removeListener('request-save-data', handleRequestSaveData);
      window.electronAPI.removeListener('file-saved', handleFileSaved);
    };
  }, []);

  const updateProjectData = (newData) => {
    setProjectData(newData);
  };

  return (
    <div className="app">
      <TreeView 
        projectData={projectData} 
        updateProjectData={updateProjectData}
      />
    </div>
  );
};

export default App;
