import React from 'react';

const PageMargins = ({ size, color }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill={color} viewBox="-2 -2 20 20">
    <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm10-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1z" />
    <path d="M 5,-10 v 30" stroke={color} strokeDasharray="1.1" />
    <path d="M -10,3 h 30" stroke={color} strokeDasharray="1.1" />
    <path d="M 11,-10 v 30" stroke={color} strokeDasharray="1.1" />
    <path d="M -10,13 h 30" stroke={color} strokeDasharray="1.1" />
  </svg>
);

export default PageMargins;
