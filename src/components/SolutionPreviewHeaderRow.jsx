import React from 'react';

const SolutionPreviewHeaderRow = ({ number }) => (
  <div className="solution-preview-header-row">
    <div className={number !== null ? "solution-preview-number" : "solution-preview-number solution-preview-number-empty"}>
      {number !== null ? number : 'M'}
    </div>
    <div className="solution-preview-columns">
      <div className="solution-preview-col solution-preview-col-left" style={{ borderRight: '1px solid #b4b4b4' }}>Negative Belief</div>
      <div className="solution-preview-col solution-preview-col-right" style={{ borderRight: '1px solid #b4b4b4' }}>Solution</div>
      <div className="solution-preview-col solution-preview-col-revisit" style={{ minWidth: 100, maxWidth: 100, width: 100, textAlign: 'center' }}>Revisit</div>
    </div>
  </div>
);

export default SolutionPreviewHeaderRow;
