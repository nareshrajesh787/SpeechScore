import React from 'react';

const Button = ({ children, variant = 'primary', className = '', onClick, ...props }) => {
    const baseStyles = "px-4 py-2 rounded-xl font-semibold transition-all active:scale-95 flex items-center justify-center gap-2";

    const variants = {
        primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1",
        secondary: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-200",
        ghost: "bg-transparent text-indigo-600 hover:bg-indigo-50"
    };

    const variantClasses = variants[variant] || variants.primary;

    return (
        <button
            className={`${baseStyles} ${variantClasses} ${className}`}
            onClick={onClick}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
