
import React, { useMemo, useState } from 'react';
import SolutionPreviewBox from './SolutionPreviewBox';
import SolutionPreviewHeaderRow from './SolutionPreviewHeaderRow';
import SolutionPreviewContentRow from './SolutionPreviewContentRow';

// Helper to find a node by ID
function findNodeById(node, id) {
  if (!node) return null;
  if (node.ID === id) return node;
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }
  return null;
}

const SolutionPreview = ({ projectData, revisitMap, setRevisitMap }) => {
  // Build node-to-number mapping (same as PDF export)
  const { solutions, isLeafNode } = useMemo(() => {
    const nodeToNumber = {};
    let nodeCounter = 0;
    const buildNodeMapping = (node, isMain = false) => {
      if (!isMain) {
        nodeCounter++;
        nodeToNumber[node.ID] = nodeCounter;
      }
      if (node.children && node.children.length > 0 && node.showChildren !== 'false') {
        node.children.forEach(child => buildNodeMapping(child, false));
      }
    };
    if (projectData?.ProjectStructure?.MainQuestion) {
      buildNodeMapping(projectData.ProjectStructure.MainQuestion, true);
    }

    // Collect all unique (then, solution) pairs with their numbers
    const solutionsMap = new Map();
    const collectSolutions = (node) => {
      if (node.ID.startsWith('main')) {
        // Main question
        const solution = node.solution || node.Solution;
        const then = node.QuestionInput || '';
        if (solution && !solutionsMap.has(solution + '|' + then)) {
          solutionsMap.set(solution + '|' + then, { then, solution, number: null, nodeId: node.ID });
        }
      } else {
        // Child question
        if (node.Solution && !solutionsMap.has(node.Solution + '|' + (node.then || ''))) {
          solutionsMap.set(node.Solution + '|' + (node.then || ''), {
            then: node.then || '',
            solution: node.Solution,
            number: nodeToNumber[node.ID],
            nodeId: node.ID
          });
        }
      }
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
          collectSolutions(child);
        });
      }
    };
    if (projectData?.ProjectStructure?.MainQuestion) {
      collectSolutions(projectData.ProjectStructure.MainQuestion);
    }
    // Convert to array and sort by number (nulls first for main node)
    const solutions = Array.from(solutionsMap.values()).sort((a, b) => {
      if (a.number === null) return -1;
      if (b.number === null) return 1;
      return a.number - b.number;
    });
    // Helper to check if a node is a leaf (no children)
    const isLeafNode = (nodeId) => {
      let found = null;
      const findNode = (node) => {
        if (node.ID === nodeId) {
          found = node;
          return;
        }
        if (node.children && node.children.length > 0) {
          node.children.forEach(findNode);
        }
      };
      if (projectData?.ProjectStructure?.MainQuestion) {
        findNode(projectData.ProjectStructure.MainQuestion);
      }
      return found && (!found.children || found.children.length === 0);
    };
    return { solutions, isLeafNode };
  }, [projectData]);

  // Styling for the preview boxes
  // These should visually match the PDF export
  return (
    <div className="solution-preview">
      <h2 className="solution-preview-title">{projectData?.projectName || 'Project Solutions'}</h2>
      <div className="solution-preview-container">
        {solutions.length === 0 && (
          <div className="solution-preview-empty">No solutions to display.</div>
        )}
        {solutions.map((item, idx) => {
          const isLeaf = item.number !== null && isLeafNode(item.nodeId);
          const revisitOn = !!revisitMap[item.nodeId];
          return (
            <SolutionPreviewBox key={item.nodeId + '|' + idx}>
              <SolutionPreviewHeaderRow number={item.number} />
              <SolutionPreviewContentRow
                thenText={item.then}
                solutionText={item.solution}
                isLeaf={isLeaf}
                revisitOn={revisitOn}
                onToggleRevisit={() => {
                  setRevisitMap(prev => ({ ...prev, [item.nodeId]: !prev[item.nodeId] }));
                }}
              />
            </SolutionPreviewBox>
          );
        })}
      </div>
    </div>
  );
};

export default SolutionPreview;
