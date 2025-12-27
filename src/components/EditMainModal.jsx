import React, { useState } from 'react';

const EditMainModal = ({ editingNode, closeEditModal, updateNode }) => {
  const [showHelp, setShowHelp] = useState(false);

  if (!editingNode) return null;

  return (
    <div className="edit-modal-overlay" onClick={closeEditModal}>
      <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
        <h2>What Must I Believe is true to feel like this?</h2>
        <button className="close-modal" onClick={closeEditModal}>×</button>

        <div className="form-group">
          <label>Negative Belief:</label>
          <textarea
            value={editingNode.QuestionInput || ''}
            onChange={(e) => updateNode(editingNode.ID, 'QuestionInput', e.target.value)}
            rows="4"
          />
        </div>
        <div className="form-group">
          <label>
            Solution:
            <span
              className="help-icon"
              onClick={() => setShowHelp(!showHelp)}
              title="Click for help"
            >
              ❓
            </span>
          </label>
          {showHelp && (
            <div className="help-section">
              <h4>Tips for Writing Solutions:</h4>
              <ul>
                <ul>
                  <li>Is that Actually True?</li>
                  <li>What is your heart telling you?</li>
                  <li>Sometimes the simplest 'Solution' is simply the opposite of the 'Negative Belief.'</li>
                  <li>Remember there may be other beliefs keeping this one in place, so don't be afraid to write what you know to be true, even it's hard totally feel at the moment, the hesitancy is coming from the other unseen beliefs you will get to.</li>
                </ul>
              </ul>
            </div>
          )}
          <textarea
            value={editingNode.solution || ''}
            onChange={(e) => updateNode(editingNode.ID, 'solution', e.target.value)}
            rows="4"
          />
        </div>

        <button className="btn-close-modal" onClick={closeEditModal}>
          Done
        </button>
      </div>
    </div>
  );
};

export default EditMainModal;
