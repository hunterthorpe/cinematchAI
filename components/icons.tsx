import React from 'react';

export const FilmIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
    <line x1="7" y1="2" x2="7" y2="22"></line>
    <line x1="17" y1="2" x2="17" y2="22"></line>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <line x1="2" y1="7" x2="7" y2="7"></line>
    <line x1="2" y1="17" x2="7" y2="17"></line>
    <line x1="17" y1="17" x2="22" y2="17"></line>
    <line x1="17" y1="7" x2="22" y2="7"></line>
  </svg>
);

export const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    viewBox="0 0 24 24" 
    fill="currentColor"
  >
    <path d="M12 2.25c.41 0 .75.34.75.75v3c0 .41-.34.75-.75.75s-.75-.34-.75-.75v-3c0-.41.34-.75.75-.75Zm0 15c.41 0 .75.34.75.75v3c0 .41-.34.75-.75.75s-.75-.34-.75-.75v-3c0-.41.34-.75.75-.75ZM5.25 12c0-.41-.34-.75-.75-.75h-3c-.41 0-.75.34-.75.75s.34.75.75.75h3c.41 0 .75-.34.75-.75ZM21 12c0-.41-.34-.75-.75-.75h-3c-.41 0-.75.34-.75.75s.34.75.75.75h3c.41 0 .75-.34.75-.75ZM6.1 6.1a.75.75 0 0 0-1.06-1.06l-2.12 2.12a.75.75 0 0 0 1.06 1.06l2.12-2.12Zm13.86 13.86a.75.75 0 0 0-1.06-1.06l-2.12 2.12a.75.75 0 0 0 1.06 1.06l2.12-2.12Zm-12.8 0a.75.75 0 0 0 1.06-1.06l-2.12-2.12a.75.75 0 0 0-1.06 1.06l2.12 2.12Zm13.86-12.8a.75.75 0 0 0-1.06 1.06l-2.12-2.12a.75.75 0 0 0 1.06-1.06l2.12 2.12Z" />
  </svg>
);
