import React from 'react';

const SolutionPreviewContentRow = ({ thenText, solutionText, isLeaf }) => (
  <div className="solution-preview-content-row">
    <div className="solution-preview-number solution-preview-number-empty" />
    <div className="solution-preview-content solution-preview-content-left">
      {thenText || <span className="solution-preview-none">(none)</span>}
    </div>
    <div className={isLeaf ? "solution-preview-content solution-preview-content-right solution-preview-leaf" : "solution-preview-content solution-preview-content-right"}>
      {solutionText || <span className="solution-preview-none">(none)</span>}
    </div>
  </div>
);

export default SolutionPreviewContentRow;
