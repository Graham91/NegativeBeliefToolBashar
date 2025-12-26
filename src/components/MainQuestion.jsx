import React from 'react';

const MainQuestion = ({ node, position, onAddChild, onDoubleClick, onClick }) => {
  if (!position) return null;

  return (
    <div
      className="node main-node"
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, 0)',
      }}
      onClick={() => onClick(node)}
      onDoubleClick={() => onDoubleClick(node)}
    >
      <div className="node-content">
        <div className="node-label">Main Question</div>
        <div className="node-preview">{node.QuestionInput || 'Empty'}</div>
        {node.solution && <div className="node-solution-preview">Solution: {node.solution}</div>}
      </div>
      <div className="node-actions">
        <button onClick={() => onAddChild(node.ID)} className="btn-add">
          + Add Child
        </button>
      </div>
    </div>
  );
};

export default MainQuestion;
