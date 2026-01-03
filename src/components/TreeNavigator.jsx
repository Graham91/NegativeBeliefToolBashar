import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

const TreeNavigator = forwardRef(({ projectData, nodePositions, pan, zoom, onNavigate, containerSize, revisitMap }, ref) => {
  const canvasRef = useRef(null);
  
  // Expose method to get canvas image
  useImperativeHandle(ref, () => ({
    getCanvasImage: () => {
      if (canvasRef.current) {
        return canvasRef.current.toDataURL('image/png');
      }
      return null;
    }
  }));
  
  // Calculate tree depth (number of layers)
  const getTreeDepth = () => {
    let maxDepth = 0;
    
    const traverse = (node, depth = 0) => {
      maxDepth = Math.max(maxDepth, depth);
      if (node.children && node.children.length > 0 && node.showChildren !== 'false') {
        node.children.forEach(child => traverse(child, depth + 1));
      }
    };
    
    if (projectData?.ProjectStructure?.MainQuestion) {
      traverse(projectData.ProjectStructure.MainQuestion);
    }
    
    return maxDepth + 1; // +1 because depth is 0-indexed
  };
  
  // Build consistent node-to-number mapping (ignores visibility)
  const getNodeNumbers = () => {
    const nodeToNumber = {};
    let nodeCounter = 0;
    
    const buildMapping = (node, isMain = false) => {
      if (!isMain) {
        nodeCounter++;
        nodeToNumber[node.ID] = nodeCounter;
      }
      // Visit ALL children to maintain consistent numbering
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => buildMapping(child, false));
      }
    };
    
    if (projectData?.ProjectStructure?.MainQuestion) {
      buildMapping(projectData.ProjectStructure.MainQuestion, true);
    }
    
    return nodeToNumber;
  };
  
  // Calculate bounds of the tree
  const getTreeBounds = () => {
    const positions = Object.values(nodePositions);
    if (positions.length === 0) return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };
    
    const xs = positions.map(p => p.x);
    const ys = positions.map(p => p.y);
    const minX = Math.min(...xs) - 100;
    const maxX = Math.max(...xs) + 100;
    const minY = Math.min(...ys) - 100;
    const maxY = Math.max(...ys) + 100;
    
    return {
      minX,
      maxX,
      minY,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const bounds = getTreeBounds();
    const treeDepth = getTreeDepth();
    const MAX_LAYERS = 23;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate scale to fit tree in minimap
    const padding = 10;
    const availableWidth = canvas.width - 2 * padding;
    const fixedHeight = 500; // Fixed height for up to 23 layers
    const availableHeight = fixedHeight - 2 * padding;
    
    // Calculate locked scale - what would fit 23 layers vertically
    // Vertical spacing is 350px per layer in actual tree
    const verticalSpacingPerLayer = 350;
    const lockedScale = availableHeight / (MAX_LAYERS * verticalSpacingPerLayer);
    
    // Calculate scale based on whether we're over the layer limit
    let scale;
    let canvasHeight;
    let canvasWidth;
    
    if (treeDepth <= MAX_LAYERS) {
      // Normal scaling behavior - fit to available space (both width and height)
      scale = Math.min(availableWidth / bounds.width, availableHeight / bounds.height);
      canvasHeight = fixedHeight;
      canvasWidth = 200;
    } else {
      // After MAX_LAYERS - lock scale completely, allow both scrolling
      scale = lockedScale;
      // Let canvas dimensions grow to accommodate all content at locked scale
      canvasHeight = bounds.height * scale + 2 * padding;
      canvasWidth = bounds.width * scale + 2 * padding;
      canvas.height = canvasHeight;
      canvas.width = canvasWidth;
    }
    
    // Center the tree in the minimap
    const currentCanvasWidth = treeDepth <= MAX_LAYERS ? availableWidth : (canvasWidth - 2 * padding);
    const offsetX = treeDepth <= MAX_LAYERS 
      ? padding + (availableWidth - bounds.width * scale) / 2
      : padding;
    // When canvas is taller than fixedHeight, start from padding instead of centering
    const currentHeight = treeDepth <= MAX_LAYERS ? availableHeight : (canvasHeight - 2 * padding);
    const offsetY = treeDepth <= MAX_LAYERS 
      ? padding + (availableHeight - bounds.height * scale) / 2 
      : padding;
    
    // Transform function
    const transform = (x, y) => ({
      x: offsetX + (x - bounds.minX) * scale,
      y: offsetY + (y - bounds.minY) * scale
    });
    
    // Draw connections
    const drawConnections = (node) => {
      if (node.children && node.children.length > 0 && node.showChildren !== 'false') {
        const parentPos = nodePositions[node.ID];
        if (parentPos) {
          node.children.forEach(child => {
            const childPos = nodePositions[child.ID];
            if (childPos) {
              const p1 = transform(parentPos.x, parentPos.y);
              const p2 = transform(childPos.x, childPos.y);
              
              ctx.strokeStyle = '#666';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
            drawConnections(child);
          });
        }
      }
    };
    
    if (projectData?.ProjectStructure?.MainQuestion) {
      drawConnections(projectData.ProjectStructure.MainQuestion);
    }
    
    // Draw nodes
    const nodeToNumber = getNodeNumbers();
    const drawNodes = (node, isMain = false) => {
      const pos = nodePositions[node.ID];
      if (pos) {
        const transformed = transform(pos.x, pos.y);
        
        // Check if node is marked for revisit
        const isRevisit = !isMain && revisitMap && revisitMap[node.ID];
        
        ctx.fillStyle = isMain ? '#667eea' : (isRevisit ? '#ff4757' : '#ffffff');
        ctx.strokeStyle = isMain ? '#ffd700' : (isRevisit ? '#ff4757' : '#4a90e2');
        ctx.lineWidth = isMain ? 2 : 1;
        
        const nodeWidth = isMain ? 16 : 12;
        const nodeHeight = isMain ? 12 : 10;
        
        // Draw rectangle
        ctx.fillRect(transformed.x - nodeWidth / 2, transformed.y - nodeHeight / 2, nodeWidth, nodeHeight);
        ctx.strokeRect(transformed.x - nodeWidth / 2, transformed.y - nodeHeight / 2, nodeWidth, nodeHeight);
        
        // Draw number for child nodes using consistent numbering
        if (!isMain) {
          const nodeNum = nodeToNumber[node.ID];
          if (nodeNum) {
            ctx.fillStyle = isRevisit ? '#ffffff' : '#333';
            ctx.font = 'bold 8px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(nodeNum.toString(), transformed.x, transformed.y);
          }
        }
      }
      
      if (node.children && node.children.length > 0 && node.showChildren !== 'false') {
        node.children.forEach(child => drawNodes(child, false));
      }
    };
    
    if (projectData?.ProjectStructure?.MainQuestion) {
      drawNodes(projectData.ProjectStructure.MainQuestion, true);
    }
    
    // Draw viewport rectangle
    if (containerSize) {
      const viewportWidth = containerSize.width / zoom;
      const viewportHeight = containerSize.height / zoom;
      const treeViewportX = -pan.x / zoom;
      const treeViewportY = -pan.y / zoom;
      // Shift the box down by half its height and right by half its width
      const topLeft = transform(
        treeViewportX - viewportWidth / 2,
        treeViewportY - viewportHeight / 2
      );
      const bottomRight = transform(
        treeViewportX + viewportWidth / 2,
        treeViewportY + viewportHeight / 2
      );
      const boxWidth = bottomRight.x - topLeft.x;
      const boxHeight = bottomRight.y - topLeft.y;
      const adjustedTopLeftX = topLeft.x + boxWidth / 2; // Shift right
      const adjustedTopLeftY = topLeft.y + boxHeight / 2 - boxHeight * 0.15; // Slightly less down
      ctx.strokeStyle = '#4a90e2';
      ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(74, 144, 226, 0.1)';
      ctx.fillRect(adjustedTopLeftX, adjustedTopLeftY, boxWidth, boxHeight);
      ctx.strokeRect(adjustedTopLeftX, adjustedTopLeftY, boxWidth, boxHeight);
    }
  }, [projectData, nodePositions, pan, zoom, containerSize]);

  const handleClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const container = canvas.parentElement; // The navigator-canvas-container
    const rect = canvas.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    // Calculate click position relative to canvas, accounting for scroll
    const clickX = e.clientX - rect.left;
    const clickY = (e.clientY - containerRect.top) + container.scrollTop;
    
    const bounds = getTreeBounds();
    const treeDepth = getTreeDepth();
    const MAX_LAYERS = 23;
    const padding = 10;
    const availableWidth = 200 - 2 * padding; // Default canvas width
    const fixedHeight = 500;
    const availableHeight = fixedHeight - 2 * padding;
    
    // Calculate locked scale (same as useEffect)
    const verticalSpacingPerLayer = 350;
    const lockedScale = availableHeight / (MAX_LAYERS * verticalSpacingPerLayer);
    
    let scale;
    if (treeDepth <= MAX_LAYERS) {
      scale = Math.min(availableWidth / bounds.width, availableHeight / bounds.height);
    } else {
      // After MAX_LAYERS - use locked scale
      scale = lockedScale;
    }
    
    const offsetX = treeDepth <= MAX_LAYERS 
      ? padding + (availableWidth - bounds.width * scale) / 2
      : padding;
    const offsetY = treeDepth <= MAX_LAYERS 
      ? padding + (availableHeight - bounds.height * scale) / 2 
      : padding;
    
    // Reverse transform
    const treeX = bounds.minX + (clickX - offsetX) / scale;
    const treeY = bounds.minY + (clickY - offsetY) / scale;
    
    if (onNavigate) {
      onNavigate(treeX, treeY);
    }
  };

  return (
    <div className="tree-navigator">
      <div className="navigator-header">Navigator</div>
      <div className="navigator-canvas-container">
        <canvas
          ref={canvasRef}
          width={200}
          height={500}
          onClick={handleClick}
          style={{ cursor: 'pointer' }}
        />
      </div>
    </div>
  );
});

export default TreeNavigator;
