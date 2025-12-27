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
        {/* <div className="node-preview">
         If {node.If || '...'} is true the worst thing that would happen would be...
        </div> */}
        <div className="node-preview">
          <strong>Previous Solution:</strong> {node.If || 'Double Click to edit'}
        </div>
        <hr />
        <div className="node-preview">
          <strong>Negative Belief:</strong> {node.then || 'Double Click to edit'}
        </div>
        <hr />
        <div className="node-preview">
          <strong>Solution:</strong> {node.Solution || 'Double Click to edit'}
        </div>
        {/* {node.Solution && <div className="node-solution-preview">Solution: {node.Solution}</div>} */}
      </div>
      <div className="node-actions-bottom">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddChild(node.ID);
          }}
          className="btn-add-circle"
          title="Add Child"
        >
          +
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleChildren(node.ID);
          }}
          className={`btn-toggle-circle ${isInactive ? 'inactive' : ''}`}
          title={isInactive ? "Unhide Children" : "Hide Children"}
        >
          -
        </button>
      </div>
    </div>
  );
};

export default ChildQuestion;
