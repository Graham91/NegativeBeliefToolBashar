import React from 'react';

const ChildQuestion = ({ node, position, onAddChild, onToggleChildren, onDoubleClick, onDelete, onClick }) => {
  if (!position) return null;

  const isInactive = node.showChildren === 'false';

  return (
    <div
      className={`node child-node ${isInactive ? 'inactive' : ''}`}
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, 0)',
      }}
      onClick={() => onClick(node)}
      onDoubleClick={() => onDoubleClick(node)}
    >
      <button 
        className="btn-delete" 
        onClick={(e) => {
          e.stopPropagation();
          onDelete(node.ID);
        }}
        title="Delete this question"
      >
        🗑
      </button>
      <div className="node-content">
        <div className="node-label">If-Then</div>
        <div className="node-preview">
          <strong>If:</strong> {node.If || 'Empty'}
        </div>
        <div className="node-preview">
          <strong>Then:</strong> {node.then || 'Empty'}
        </div>
        {node.Solution && <div className="node-solution-preview">Solution: {node.Solution}</div>}
      </div>
      <div className="node-actions">
        <button onClick={() => onAddChild(node.ID)} className="btn-add">
          + Add Child
        </button>
        <button 
          onClick={() => onToggleChildren(node.ID)} 
          className={`btn-toggle ${isInactive ? 'inactive' : ''}`}
        >
          {isInactive ? 'Show' : 'Hide'} Children
        </button>
      </div>
    </div>
  );
};

export default ChildQuestion;
