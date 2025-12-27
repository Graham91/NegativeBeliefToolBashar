import React, { useState } from 'react';

const EditChildModal = ({ editingNode, closeEditModal, updateNode }) => {
    const [showHelp, setShowHelp] = useState(false);

    if (!editingNode) return null;

    return (
        <div className="edit-modal-overlay" onClick={closeEditModal}>
            <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
                <h2>Edit Child Question</h2>
                <button className="close-modal" onClick={closeEditModal}>×</button>

                <div className="form-group">
                    <p>
                        If{' "'}
                        <span
                            className="inline-input"
                            role="textbox"
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => updateNode(editingNode.ID, 'If', e.target.textContent)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    e.target.blur();
                                }
                            }}
                        >
                            {editingNode.If || ''}
                        </span>
                        {'" '}is true, the <strong>worst thing</strong> that would happen would be...
                    </p>
                </div>
                <div className="form-group">
                    <textarea
                        value={editingNode.then || ''}
                        onChange={(e) => updateNode(editingNode.ID, 'then', e.target.value)}
                        rows="3"
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
                                <li>Is that Actually True?</li>
                                <li>What is your heart telling you?</li>
                                <li>Sometimes the simplest 'Solution' is simply the opposite of the 'Negative Belief.'
                                </li>
                                <li>Remember there may be other beliefs keeping this one in place, so don't be afraid to write what you know to be true, even it's hard totally feel at the moment, the hesitancy is coming from the other unseen beliefs you will get to.</li>
                            </ul>
                        </div>
                    )}
                    <textarea
                        value={editingNode.Solution || ''}
                        onChange={(e) => updateNode(editingNode.ID, 'Solution', e.target.value)}
                        rows="3"
                    />
                </div>

                <button className="btn-close-modal" onClick={closeEditModal}>
                    Done
                </button>
            </div>
        </div>
    );
};

export default EditChildModal;
