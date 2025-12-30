import React from 'react';

const switchTrackStyle = (on) => ({
  width: 48,
  height: 28,
  borderRadius: 16,
  background: on ? '#ffb3b3' : '#b6fcb6',
  border: `2px solid ${on ? '#ff2222' : '#4caf50'}`,
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  transition: 'background 0.2s, border 0.2s',
  position: 'relative',
  boxSizing: 'border-box',
});

const switchThumbStyle = (on) => ({
  width: 22,
  height: 22,
  borderRadius: '50%',
  background: '#fff',
  boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
  position: 'absolute',
  left: on ? 22 : 2,
  top: 2,
  transition: 'left 0.2s',
  border: `1.5px solid ${on ? '#ff2222' : '#4caf50'}`,
});

const SolutionPreviewContentRow = ({ thenText, solutionText, isLeaf, revisitOn, onToggleRevisit }) => (
  <div className="solution-preview-content-row">
    <div className="solution-preview-number solution-preview-number-empty1" />
    <div className="solution-preview-content solution-preview-content-left">
      {thenText || <span className="solution-preview-none">(none)</span>}
    </div>
    <div className={isLeaf ? "solution-preview-content solution-preview-content-right solution-preview-leaf" : "solution-preview-content solution-preview-content-right"} style={{ borderRight: '1px solid #e0e0e0' }}>
      {solutionText || <span className="solution-preview-none">(none)</span>}
    </div>
    <div className="solution-preview-revisit-toggle-col" style={{ minWidth: 100, maxWidth: 100, width: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: '100%' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: revisitOn ? '#ff2222' : '#388e3c', marginBottom: 2 }}>
          {revisitOn ? 'Revisit' : 'Resolved'}
        </span>
        <span
          style={switchTrackStyle(revisitOn)}
          onClick={onToggleRevisit}
        >
          <input
            type="checkbox"
            checked={!!revisitOn}
            onChange={onToggleRevisit}
            style={{ display: 'none' }}
            tabIndex={-1}
          />
          <span style={switchThumbStyle(revisitOn)} />
        </span>
      </label>
    </div>
  </div>
);

export default SolutionPreviewContentRow;
