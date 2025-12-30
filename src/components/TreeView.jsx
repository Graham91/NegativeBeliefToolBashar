import React, { useState, useEffect, useRef, useMemo } from 'react';
import MainQuestion from './MainQuestion';
import ChildQuestion from './ChildQuestion';
import EditMainModal from './EditMainModal';
import EditChildModal from './EditChildModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import TreeNavigator from './TreeNavigator';
import { jsPDF } from 'jspdf';

const TreeView = ({ projectData, updateProjectData, onBackToProjects, onSaveProject }) => {
  const [zoom, setZoomState] = useState(1);
  const [pan, setPan] = useState({ x: 600, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [editingNode, setEditingNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, nodeId: null });
  const containerRef = useRef(null);
  const navigatorRef = useRef(null);
  const [nodePositions, setNodePositions] = useState({});
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);

  // Keep zoom ref in sync
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);
  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  // Calculate positions for all visible nodes using layer-based layout
  useEffect(() => {
    const positions = {};
    const layers = {}; // Track nodes at each depth level

    // First pass: collect all visible nodes by layer
    const collectNodesByLayer = (node, depth = 0, parentId = null) => {
      if (!layers[depth]) {
        layers[depth] = [];
      }

      layers[depth].push({
        id: node.ID,
        node: node,
        parentId: parentId
      });

      if (node.children && node.children.length > 0 && node.showChildren !== 'false') {
        node.children.forEach(child => {
          collectNodesByLayer(child, depth + 1, node.ID);
        });
      }
    };

    if (projectData?.ProjectStructure?.MainQuestion) {
      collectNodesByLayer(projectData.ProjectStructure.MainQuestion);
    }

    // Second pass: calculate positions layer by layer
    const horizontalSpacing = 230; // Space between siblings
    const verticalSpacing = 350; // Space between layers

    Object.keys(layers).forEach(depth => {
      const layerNodes = layers[depth];
      const depthNum = parseInt(depth);

      if (depthNum === 0) {
        // Main question at center
        positions[layerNodes[0].id] = { x: 0, y: 0, depth: 0 };
      } else {
        // Group nodes by parent
        const nodesByParent = {};
        layerNodes.forEach(nodeInfo => {
          if (!nodesByParent[nodeInfo.parentId]) {
            nodesByParent[nodeInfo.parentId] = [];
          }
          nodesByParent[nodeInfo.parentId].push(nodeInfo);
        });

        // Position each group under its parent, avoiding overlaps
        let currentX = 0;
        const sortedParentIds = Object.keys(nodesByParent).sort((a, b) => {
          const posA = positions[a];
          const posB = positions[b];
          return (posA?.x || 0) - (posB?.x || 0);
        });

        const tempPositions = [];

        sortedParentIds.forEach((parentId, parentIndex) => {
          const siblings = nodesByParent[parentId];
          const parentPos = positions[parentId];

          if (parentPos) {
            const groupWidth = (siblings.length - 1) * horizontalSpacing;
            const groupStartX = parentPos.x - groupWidth / 2;

            // Adjust if this would overlap with previous group
            if (parentIndex > 0) {
              const lastSiblingX = tempPositions[tempPositions.length - 1].x;
              const minX = lastSiblingX + horizontalSpacing;
              currentX = Math.max(groupStartX, minX);
            } else {
              currentX = groupStartX;
            }

            siblings.forEach((nodeInfo, index) => {
              tempPositions.push({
                id: nodeInfo.id,
                x: currentX + index * horizontalSpacing,
                y: depthNum * verticalSpacing,
                depth: depthNum
              });
            });
          }
        });

        // Find the midpoint of parent nodes that have visible children
        const parentsWithVisibleChildren = sortedParentIds.map(parentId => {
          const parent = layers[depthNum - 1].find(n => n.id === parentId);
          return {
            id: parentId,
            pos: positions[parentId],
            hasVisibleChildren: parent.node.showChildren !== 'false' && parent.node.children && parent.node.children.length > 0
          };
        }).filter(p => p.hasVisibleChildren);

        let centerPoint = 0;
        if (parentsWithVisibleChildren.length > 0) {
          const parentXPositions = parentsWithVisibleChildren.map(p => p.pos.x);
          const minParentX = Math.min(...parentXPositions);
          const maxParentX = Math.max(...parentXPositions);
          centerPoint = (minParentX + maxParentX) / 2;
        }

        // Center the layer around the midpoint of parents with visible children
        if (tempPositions.length > 0) {
          const minX = Math.min(...tempPositions.map(p => p.x));
          const maxX = Math.max(...tempPositions.map(p => p.x));
          const layerMidpoint = (minX + maxX) / 2;
          const offset = centerPoint - layerMidpoint;

          tempPositions.forEach(pos => {
            positions[pos.id] = {
              x: pos.x + offset,
              y: pos.y,
              depth: pos.depth
            };
          });
        }
      }
    });

    setNodePositions(positions);
  }, [projectData]);

  // Add wheel event listener with passive: false to allow preventDefault
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let accumulatedDelta = 0;
    let rafId = null;
    let debounceTimer = null;

    const handleWheel = (e) => {
      e.preventDefault();

      // Lower sensitivity (requires more scrolling)
      const sensitivity = e.deltaMode === 0 ? -0.0005 : -0.001; // DOM_DELTA_PIXEL vs DOM_DELTA_LINE
      accumulatedDelta += e.deltaY * sensitivity;

      // Clear existing timers
      if (debounceTimer) clearTimeout(debounceTimer);
      if (rafId) cancelAnimationFrame(rafId);

      // Wait 150ms after last scroll event before applying zoom
      debounceTimer = setTimeout(() => {
        rafId = requestAnimationFrame(() => {
          // Apply zoom multiplier for bigger steps
          const zoomAmount = accumulatedDelta * 4;
          const newZoom = Math.min(Math.max(0.1, zoomRef.current + zoomAmount), 3);
          setZoom(newZoom);
          accumulatedDelta = 0;
          rafId = null;
        });
      }, 100);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      if (rafId) cancelAnimationFrame(rafId);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, []); // Remove zoom dependency

  // Helper to set zoom and keep center stable
  const setZoom = (newZoom) => {
    if (!containerRef.current) {
      setZoomState(newZoom);
      return;
    }
    const rect = containerRef.current.getBoundingClientRect();
    // Find the current center in tree coordinates
    const centerX = (rect.width / 2 - panRef.current.x) / zoomRef.current;
    const centerY = (rect.height / 2 - panRef.current.y) / zoomRef.current;
    // Calculate new pan to keep center fixed
    const newPan = {
      x: rect.width / 2 - centerX * newZoom,
      y: rect.height / 2 - centerY * newZoom
    };
    setPan(newPan);
    setZoomState(newZoom);
  };

  // Track container size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleNavigate = (treeX, treeY) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPan({
        x: rect.width / 2 - treeX * zoom,
        y: rect.height / 2 - treeY * zoom
      });
    }
  };

  const handleMouseDown = (e) => {
    if (e.button === 0 && !e.target.closest('.node') && !editingNode) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && !editingNode) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const addChild = (parentId) => {
    // Find parent node to get its Solution
    let parentNode = null;
    const findParent = (node) => {
      if (node.ID === parentId) {
        parentNode = node;
        return;
      }
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => findParent(child));
      }
    };
    findParent(projectData.ProjectStructure.MainQuestion);

    const newChild = {
      ID: `child-${Date.now()}`,
      If: parentNode?.Solution || parentNode?.solution || '',
      then: '',
      Solution: '',
      parentId: parentId,
      showChildren: 'true',
      children: []
    };

    const addChildToNode = (node) => {
      if (node.ID === parentId) {
        return {
          ...node,
          children: [...(node.children || []), newChild]
        };
      }
      if (node.children && node.children.length > 0) {
        return {
          ...node,
          children: node.children.map(child => addChildToNode(child))
        };
      }
      return node;
    };

    const updatedMainQuestion = addChildToNode(projectData.ProjectStructure.MainQuestion);
    updateProjectData({
      ...projectData,
      ProjectStructure: {
        MainQuestion: updatedMainQuestion
      }
    });
  };

  const toggleChildren = (nodeId) => {
    const toggleNode = (node) => {
      if (node.ID === nodeId) {
        return {
          ...node,
          showChildren: node.showChildren === 'true' ? 'false' : 'true'
        };
      }
      if (node.children && node.children.length > 0) {
        return {
          ...node,
          children: node.children.map(child => toggleNode(child))
        };
      }
      return node;
    };

    const updatedMainQuestion = toggleNode(projectData.ProjectStructure.MainQuestion);
    updateProjectData({
      ...projectData,
      ProjectStructure: {
        MainQuestion: updatedMainQuestion
      }
    });
  };

  const deleteChild = (childId) => {
    setDeleteConfirm({ isOpen: true, nodeId: childId });
  };

  const confirmDelete = () => {
    const childId = deleteConfirm.nodeId;
    const removeChildFromNode = (node) => {
      if (node.children && node.children.length > 0) {
        // Filter out the child with the given ID
        const filteredChildren = node.children.filter(child => child.ID !== childId);
        // Recursively check children's children
        const updatedChildren = filteredChildren.map(child => removeChildFromNode(child));
        return {
          ...node,
          children: updatedChildren
        };
      }
      return node;
    };

    const updatedMainQuestion = removeChildFromNode(projectData.ProjectStructure.MainQuestion);
    updateProjectData({
      ...projectData,
      ProjectStructure: {
        MainQuestion: updatedMainQuestion
      }
    });
    setDeleteConfirm({ isOpen: false, nodeId: null });
  };

  const cancelDelete = () => {
    setDeleteConfirm({ isOpen: false, nodeId: null });
  };

  const printSolutions = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Title
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(projectData?.projectName || 'Project Solutions', margin, yPosition);
    yPosition += 10;

    // Add date
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.text(`Generated: ${currentDate}`, margin, yPosition);
    yPosition += 15;

    // Add navigator tree image
    if (navigatorRef.current) {
      const navImage = navigatorRef.current.getCanvasImage();
      if (navImage) {
        const imgWidth = 60; // Width in mm
        const imgHeight = 90; // Height in mm (200x300 aspect ratio)
        const imgX = (pageWidth - imgWidth) / 2; // Center horizontally
        
        doc.addImage(navImage, 'PNG', imgX, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 15;
      }
    }

    // Build node-to-number mapping (same order as TreeNavigator)
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
      // Find the node by ID in the project tree
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

    // Print each unique (then, solution) pair in a two-column box styled as in the reference image
    solutions.forEach((item) => {
      // Box and layout dimensions
      const boxPadding = 4;
      const headerHeight = 8;
      const numberBoxWidth = 36;
      const colDividerWidth = 0.5; // Super thin
      const colHeaderBg = [41, 47, 107]; // #292f6bff
      const colHeaderTextColor = [255, 255, 255];
      const numberBoxColor = [180, 180, 180]; // light grey for number box
      const dividerColor = [200, 200, 200]; // light grey
      const boxBorderColor = [180, 180, 180]; // main box border grey
      const solutionHighlightColor = [210, 230, 255]; // light blue
      const textBoxWidth = (maxWidth - numberBoxWidth - colDividerWidth) / 2;
      const textFontSize = 9;
      const headerFontSize = 10;
      // Prepare text lines
      doc.setFontSize(textFontSize);
      const thenLines = doc.splitTextToSize(item.then || '', textBoxWidth - 2 * boxPadding);
      const solutionLines = doc.splitTextToSize(item.solution || '', textBoxWidth - 2 * boxPadding);
      const lineSpacing = 4.5; // reduced line spacing
      const maxLines = Math.max(thenLines.length, solutionLines.length);
      const textHeight = maxLines * lineSpacing;
      const contentHeight = textHeight;
      const boxHeight = headerHeight + contentHeight + 2 * boxPadding;

      // Page break if needed
      if (yPosition + boxHeight + 5 > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }

      // Draw outer box (sharp corners, grey)
      doc.setDrawColor(...boxBorderColor);
      doc.setLineWidth(0.6);
      doc.rect(margin, yPosition, maxWidth, boxHeight);

      // Draw header background
      doc.setFillColor(...colHeaderBg);
      doc.rect(margin + numberBoxWidth, yPosition, maxWidth - numberBoxWidth, headerHeight, 'F');

      // Draw number box (left, light grey)
      if (item.number !== null) {
        doc.setFillColor(...numberBoxColor);
        doc.rect(margin, yPosition, numberBoxWidth, headerHeight, 'F');
        doc.setTextColor(51, 51, 51);
        doc.setFont(undefined, 'bold');
        doc.setFontSize(headerFontSize);
        doc.text(String(item.number), margin + numberBoxWidth / 2, yPosition + headerHeight / 2 + 1, { align: 'center', baseline: 'middle' });
      }

      // Draw header text (centered in columns)
      doc.setTextColor(...colHeaderTextColor);
      doc.setFont(undefined, 'bold');
      doc.setFontSize(headerFontSize);
      const leftHeader = 'Negative Belief';
      const rightHeader = 'Solution';
      doc.text(leftHeader, margin + numberBoxWidth + textBoxWidth / 2, yPosition + headerHeight / 2 + 1, { align: 'center', baseline: 'middle' });
      doc.text(rightHeader, margin + numberBoxWidth + textBoxWidth + colDividerWidth + textBoxWidth / 2, yPosition + headerHeight / 2 + 1, { align: 'center', baseline: 'middle' });

      // Draw vertical divider (thin, light grey, not full height)
      doc.setDrawColor(...dividerColor);
      const dividerX = margin + numberBoxWidth + textBoxWidth + colDividerWidth / 2;
      doc.setLineWidth(colDividerWidth);
      // Only from just below header to just above bottom
      doc.line(dividerX, yPosition + headerHeight + 4, dividerX, yPosition + boxHeight - 4);

      // Highlight solution column if this is a leaf child
      if (item.number !== null && isLeafNode(item.nodeId)) {
        doc.setFillColor(...solutionHighlightColor);
        doc.rect(
          margin + numberBoxWidth + colDividerWidth + textBoxWidth,
          yPosition + headerHeight,
          textBoxWidth,
          boxHeight - headerHeight,
          'F'
        );
      }

      // Draw then and solution columns
      doc.setFont(undefined, 'normal');
      doc.setFontSize(textFontSize);
      doc.setTextColor(0, 0, 0);
      let leftX = margin + numberBoxWidth + boxPadding;
      let rightX = margin + numberBoxWidth + colDividerWidth + textBoxWidth + boxPadding;
      let textY = yPosition + headerHeight + boxPadding + 2;
      // Left column: then
      thenLines.forEach((line, idx) => {
        doc.text(line, leftX, textY + idx * lineSpacing);
      });
      // Right column: solution
      solutionLines.forEach((line, idx) => {
        doc.text(line, rightX, textY + idx * lineSpacing);
      });

      yPosition += boxHeight;
    });

    // Generate PDF as blob
    const pdfBlob = doc.output('blob');
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Send to main process to save
    if (window.electronAPI && window.electronAPI.savePDF) {
      const projectName = projectData?.projectName || 'solutions';
      window.electronAPI.savePDF(uint8Array, `${projectName}_solutions.pdf`);
    }
  };

  const updateNode = (nodeId, field, value) => {
    const updateNodeData = (node) => {
      if (node.ID === nodeId) {
        return {
          ...node,
          [field]: value
        };
      }
      if (node.children && node.children.length > 0) {
        return {
          ...node,
          children: node.children.map(child => updateNodeData(child))
        };
      }
      return node;
    };

    const updatedMainQuestion = updateNodeData(projectData.ProjectStructure.MainQuestion);
    updateProjectData({
      ...projectData,
      ProjectStructure: {
        MainQuestion: updatedMainQuestion
      }
    });

    // Update editingNode state so controlled inputs reflect changes
    if (editingNode && editingNode.ID === nodeId) {
      setEditingNode({
        ...editingNode,
        [field]: value
      });
    }
  };

  const handleNodeClick = (node) => {
    setSelectedNode(node.ID);
  };

  const handleNodeDoubleClick = (node) => {
    setEditingNode(node);
    // Center on the node
    const pos = nodePositions[node.ID];
    if (pos && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      setPan({
        x: containerRect.width / 2 - pos.x * zoom,
        y: containerRect.height / 2 - pos.y * zoom
      });
    }
  };

  // Build a map of child ID to parent ID
  const buildParentMap = () => {
    const parentMap = {};

    const mapNode = (node, parentId = null) => {
      if (parentId) {
        parentMap[node.ID] = parentId;
      }
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => mapNode(child, node.ID));
      }
    };

    if (projectData?.ProjectStructure?.MainQuestion) {
      mapNode(projectData.ProjectStructure.MainQuestion);
    }

    return parentMap;
  };

  // Get all ancestor IDs for a given node
  const getAncestorPath = (nodeId) => {
    const parentMap = buildParentMap();
    const path = [];
    let currentId = nodeId;

    while (parentMap[currentId]) {
      path.push(currentId);
      currentId = parentMap[currentId];
    }

    return path;
  };

  const closeEditModal = () => {
    setEditingNode(null);
  };

  const renderLines = () => {
    const lineSegments = [];

    // First pass: collect all line information
    const collectLines = (node) => {
      if (node.children && node.children.length > 0 && node.showChildren !== 'false') {
        const parentPos = nodePositions[node.ID];
        const numChildren = node.children.length;

        node.children.forEach((child, index) => {
          const childPos = nodePositions[child.ID];
          if (parentPos && childPos) {
            // Spread connection points along the bottom of parent
            const nodeWidth = 200;
            const spacing = Math.min(nodeWidth / (numChildren + 1), 40);
            const startOffset = -(numChildren - 1) * spacing / 2;
            const parentStartX = parentPos.x + startOffset + (index * spacing);

            // Calculate parent bottom based on node type (main nodes are auto-height, children are 250px)
            const parentNodeHeight = node.ID === projectData?.ProjectStructure?.MainQuestion?.ID ? 85 : 195;
            const parentBottom = parentPos.y + parentNodeHeight;
            const childTop = childPos.y;
            const idealMidY = parentBottom + (childTop - parentBottom) / 2;

            lineSegments.push({
              nodeId: node.ID,
              childId: child.ID,
              parentX: parentStartX,
              childX: childPos.x,
              parentBottom,
              childTop,
              idealMidY,
              minX: Math.min(parentStartX, childPos.x),
              maxX: Math.max(parentStartX, childPos.x),
              depth: parentPos.depth
            });
          }
        });

        node.children.forEach(child => collectLines(child));
      }
    };

    if (projectData?.ProjectStructure?.MainQuestion) {
      collectLines(projectData.ProjectStructure.MainQuestion);
    }

    // Second pass: assign Y positions to avoid conflicts

    // Configuration
    const lineSpacing = 16; // Minimum vertical distance between lines
    const padding = 30; // Minimum horizontal distance between line segments

    // Storage for all placed segments
    const placedSegments = [];

    // Sort segments: process by depth first, then by ideal Y position, then by direction (right first), then by position
    lineSegments.sort((a, b) => {
      if (a.depth !== b.depth) return a.depth - b.depth; // Higher levels first
      if (Math.abs(a.idealMidY - b.idealMidY) > 1) return a.idealMidY - b.idealMidY; // By Y position

      // Process right-going lines before left-going lines
      const aGoesRight = a.childX > a.parentX;
      const bGoesRight = b.childX > b.parentX;
      if (aGoesRight !== bGoesRight) return aGoesRight ? -1 : 1;

      // For lines going the same direction, sort by position
      return a.minX - b.minX;
    });

    // Pre-calculate how many segments go in each direction at each ideal Y position
    const leftCountByY = {};
    const rightCountByY = {};
    lineSegments.forEach(segment => {
      const goesRight = segment.childX > segment.parentX;
      const key = `${segment.depth}-${Math.round(segment.idealMidY)}`;
      if (goesRight) {
        rightCountByY[key] = (rightCountByY[key] || 0) + 1;
      } else {
        leftCountByY[key] = (leftCountByY[key] || 0) + 1;
      }
    });

    // Track how many segments we've processed at each Y
    const leftProcessedByY = {};
    const rightProcessedByY = {};

    // Process each segment
    const assignedSegments = lineSegments.map(segment => {
      // Determine if this line goes right or left
      const goesRight = segment.childX > segment.parentX;
      const key = `${segment.depth}-${Math.round(segment.idealMidY)}`;

      // Pre-offset based on how many lines go in the same direction at this Y
      let testY = segment.idealMidY;
      if (goesRight) {
        const totalRight = rightCountByY[key] || 0;
        const processedRight = rightProcessedByY[key] || 0;
        // Start below idealMidY: first line at bottom, moving up
        testY = segment.idealMidY + (totalRight - 1 - processedRight) * lineSpacing;
        rightProcessedByY[key] = processedRight + 1;
      } else {
        const totalLeft = leftCountByY[key] || 0;
        const processedLeft = leftProcessedByY[key] || 0;
        // Start at idealMidY and move down based on how many we've already processed
        testY = segment.idealMidY + (processedLeft * lineSpacing);
        leftProcessedByY[key] = processedLeft + 1;
      }

      let foundPosition = false;
      let attempts = 0;
      const maxAttempts = 200;

      // Keep trying Y positions until we find one that doesn't conflict
      while (!foundPosition && attempts < maxAttempts) {
        let hasConflict = false;

        // Check this Y position against all previously placed segments
        for (const placed of placedSegments) {
          // Are the Y positions too close? (use < for strict spacing)
          const yTooClose = Math.abs(placed.actualMidY - testY) < lineSpacing;

          if (yTooClose) {
            // Do the X ranges overlap (with padding)?
            const xOverlaps = !(segment.maxX + padding < placed.minX ||
              segment.minX - padding > placed.maxX);

            if (xOverlaps) {
              hasConflict = true;
              break; // Found a conflict, no need to check more
            }
          }
        }

        if (hasConflict) {
          // This Y position doesn't work, try the next one
          if (goesRight) {
            // Lines going right: move UP
            testY -= lineSpacing;
          } else {
            // Lines going left or straight: move DOWN
            testY += lineSpacing;
          }
          attempts++;
        } else {
          // This Y position works!
          foundPosition = true;
        }
      }

      // Create the final segment with its assigned Y position
      const finalSegment = {
        ...segment,
        actualMidY: testY,
        direction: goesRight ? 'right' : 'left'
      };

      // Add to our list of placed segments
      placedSegments.push(finalSegment);

      return finalSegment;
    });

    // Store for debugging
    window.debugLineSegments = assignedSegments;

    // Get ancestor path for highlighting
    const ancestorPath = selectedNode ? getAncestorPath(selectedNode) : [];

    // Third pass: create the actual path elements
    return assignedSegments.map(seg => {
      // Check if child is directly below parent (X ranges overlap significantly)
      const childCenterX = seg.childX;
      const parentConnectionX = seg.parentX;

      // If the parent connection point is within the child node's bounds, draw straight down
      const childNodeWidth = 200; // Approximate child node width
      const childLeftEdge = childCenterX - childNodeWidth / 2;
      const childRightEdge = childCenterX + childNodeWidth / 2;
      const isDirectlyBelow = parentConnectionX >= childLeftEdge && parentConnectionX <= childRightEdge;

      // Check if this line is part of the selected path
      const isHighlighted = ancestorPath.includes(seg.childId);

      let pathData;
      if (isDirectlyBelow) {
        // Draw straight down from parent to child at the parent's X position
        pathData = [
          `M ${parentConnectionX} ${seg.parentBottom}`,
          `L ${parentConnectionX} ${seg.childTop}`
        ].join(' ');
      } else {
        // Draw the normal orthogonal path
        pathData = [
          `M ${seg.parentX} ${seg.parentBottom}`,
          `L ${seg.parentX} ${seg.actualMidY}`,
          `L ${seg.childX} ${seg.actualMidY}`,
          `L ${seg.childX} ${seg.childTop}`
        ].join(' ');
      }

      return (
        <path
          key={`line-${seg.nodeId}-${seg.childId}`}
          d={pathData}
          stroke={isHighlighted ? "#4a90e2" : "#666"}
          strokeWidth={isHighlighted ? "4" : "2"}
          fill="none"
        />
      );
    });
  };

  // Memoize line rendering to avoid recalculating on every zoom change
  const memoizedLines = useMemo(() => renderLines(), [projectData, nodePositions, selectedNode]);

  const renderNode = (node, isMain = false) => {
    const pos = nodePositions[node.ID];

    if (isMain) {
      return (
        <MainQuestion
          key={node.ID}
          node={node}
          position={pos}
          onAddChild={addChild}
          onClick={handleNodeClick}
          onDoubleClick={handleNodeDoubleClick}
        />
      );
    } else {
      return (
        <ChildQuestion
          key={node.ID}
          node={node}
          position={pos}
          onAddChild={addChild}
          onToggleChildren={toggleChildren}
          onClick={handleNodeClick}
          onDoubleClick={handleNodeDoubleClick}
          onDelete={deleteChild}
        />
      );
    }
  };

  const renderNodes = () => {
    const nodes = [];

    const collectNodes = (node, isMain = false) => {
      nodes.push(renderNode(node, isMain));

      if (node.children && node.children.length > 0 && node.showChildren !== 'false') {
        node.children.forEach((child) => {
          collectNodes(child, false);
        });
      }
    };

    if (projectData?.ProjectStructure?.MainQuestion) {
      collectNodes(projectData.ProjectStructure.MainQuestion, true);
    }

    return nodes;
  };

  return (
    <div
      className="tree-container"
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >

      <div
        className="tree-canvas"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        <svg className="connection-lines">
          {memoizedLines}
        </svg>
        <div className="nodes-layer">
          {renderNodes()}
        </div>
      </div>

      {editingNode && (
        editingNode.ID.startsWith('main') ? (
          <EditMainModal
            editingNode={editingNode}
            closeEditModal={closeEditModal}
            updateNode={updateNode}
          />
        ) : (
          <EditChildModal
            editingNode={editingNode}
            closeEditModal={closeEditModal}
            updateNode={updateNode}
          />
        )
      )}

      <ConfirmDeleteModal
        isOpen={deleteConfirm.isOpen}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        message="Are you sure you want to delete this question? This will also delete all of its child questions. This action cannot be undone."
      />

      <TreeNavigator
        ref={navigatorRef}
        projectData={projectData}
        nodePositions={nodePositions}
        pan={pan}
        zoom={zoom}
        onNavigate={handleNavigate}
        containerSize={containerSize}
      />

      <div className="top-controls">
        <button onClick={onBackToProjects} className="btn-back-to-projects">
          ← Back to Projects
        </button>
        <button onClick={onSaveProject} className="btn-save-project">
          💾 Save
        </button>
        <button onClick={printSolutions} className="btn-print-solutions">
          📄 Print Solutions
        </button>
      </div>

      <div className="zoom-controls">
        <button onClick={() => setZoom(Math.min(zoom + 0.2, 3))}>+</button>
        <span>{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(Math.max(zoom - 0.2, 0.1))}>-</button>
        <button id="ResetButton" onClick={() => { setZoom(1); setPan({ x: 600, y: 100 }); }}>Reset</button>
        {/* <button onClick={() => console.log('Line Segments:', window.debugLineSegments)}>Debug Lines</button> */}
      </div>
    </div>
  );
};

export default TreeView;
