import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

const TreeNavigator = forwardRef(({ projectData, nodePositions, pan, zoom, onNavigate, containerSize }, ref) => {
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
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate scale to fit tree in minimap
    const padding = 10;
    const availableWidth = canvas.width - 2 * padding;
    const availableHeight = canvas.height - 2 * padding;
    const scale = Math.min(availableWidth / bounds.width, availableHeight / bounds.height);
    
    // Center the tree in the minimap
    const offsetX = padding + (availableWidth - bounds.width * scale) / 2;
    const offsetY = padding + (availableHeight - bounds.height * scale) / 2;
    
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
    let nodeNumber = 0;
    const drawNodes = (node, isMain = false) => {
      const pos = nodePositions[node.ID];
      if (pos) {
        const transformed = transform(pos.x, pos.y);
        
        ctx.fillStyle = isMain ? '#667eea' : '#ffffff';
        ctx.strokeStyle = isMain ? '#ffd700' : '#4a90e2';
        ctx.lineWidth = isMain ? 2 : 1;
        
        const nodeWidth = isMain ? 16 : 12;
        const nodeHeight = isMain ? 12 : 10;
        
        // Draw rectangle
        ctx.fillRect(transformed.x - nodeWidth / 2, transformed.y - nodeHeight / 2, nodeWidth, nodeHeight);
        ctx.strokeRect(transformed.x - nodeWidth / 2, transformed.y - nodeHeight / 2, nodeWidth, nodeHeight);
        
        // Draw number for child nodes
        if (!isMain) {
          nodeNumber++;
          ctx.fillStyle = '#333';
          ctx.font = 'bold 8px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(nodeNumber.toString(), transformed.x, transformed.y);
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
    
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    const bounds = getTreeBounds();
    const padding = 10;
    const availableWidth = canvas.width - 2 * padding;
    const availableHeight = canvas.height - 2 * padding;
    const scale = Math.min(availableWidth / bounds.width, availableHeight / bounds.height);
    
    const offsetX = padding + (availableWidth - bounds.width * scale) / 2;
    const offsetY = padding + (availableHeight - bounds.height * scale) / 2;
    
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
      <canvas
        ref={canvasRef}
        width={200}
        height={400}
        onClick={handleClick}
        style={{ cursor: 'pointer' }}
      />
    </div>
  );
});

export default TreeNavigator;
