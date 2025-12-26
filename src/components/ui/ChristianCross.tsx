import React from 'react';

const ChristianCross = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        {/* Vertical beam */}
        <path d="M12 2V22" />
        {/* Horizontal beam - positioned for a traditional Latin cross look (higher than center) */}
        <path d="M7 8H17" />
    </svg>
);

export default ChristianCross;
