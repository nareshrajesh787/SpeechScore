import React from 'react';

const Card = ({ children, className = '', padding = 'p-6' }) => {
    return (
        <div className={`bg-white rounded-2xl shadow-sm border border-indigo-50/50 hover:shadow-md transition-shadow duration-200 ${padding} ${className}`}>
            {children}
        </div>
    );
};

export default Card;
