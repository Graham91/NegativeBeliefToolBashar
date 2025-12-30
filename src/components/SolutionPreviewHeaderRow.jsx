import React from 'react';

const SolutionPreviewHeaderRow = ({ number }) => (
  <div className="solution-preview-header-row">
    <div className={number !== null ? "solution-preview-number" : "solution-preview-number solution-preview-number-empty"}>
      {number !== null ? number : ''}
    </div>
    <div className="solution-preview-columns">
      <div className="solution-preview-col solution-preview-col-left">Negative Belief</div>
      <div className="solution-preview-col solution-preview-col-right">Solution</div>
    </div>
  </div>
);

export default SolutionPreviewHeaderRow;
