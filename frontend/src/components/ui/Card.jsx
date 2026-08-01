import React from 'react';

const Card = ({ children, className = '', padding = 'p-6', variant = 'default', as: Component = 'div', ...props }) => {
    const variants = {
        default: "bg-white rounded-2xl shadow-sm border border-indigo-50/50 hover:shadow-md transition-shadow duration-200",
        // For content sitting on the app's own indigo gradient backgrounds
        // (the analyzer form, result panel): a flat `bg-white` fights the
        // page gradient instead of blending into it.
        surface: "bg-gradient-to-br from-white to-indigo-50/20 rounded-2xl border border-indigo-100",
    };

    return (
        <Component className={`${variants[variant] || variants.default} ${padding} ${className}`} {...props}>
            {children}
        </Component>
    );
};

export default Card;
