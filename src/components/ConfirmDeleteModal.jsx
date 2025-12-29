import React from 'react';

const ConfirmDeleteModal = ({ isOpen, onConfirm, onCancel, message }) => {
  if (!isOpen) return null;

  return (
    <div className="edit-modal-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <h2>⚠️ Confirm Delete</h2>
        <p className="confirm-message">{message || 'Are you sure you want to delete this question? This action cannot be undone.'}</p>
        <div className="confirm-actions">
          <button className="btn-confirm-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-confirm-delete" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
