import React from 'react';

const Card = ({ children, className = '', padding = 'p-6', variant = 'default', as: Component = 'div', ...props }) => {
    const variants = {
        default: "bg-white rounded-2xl shadow-card border border-paper-300 hover:shadow-raised transition-shadow duration-200",
        // For content sitting on the app's own warm gradient backgrounds
        // (the analyzer form, result panel): a flat `bg-white` fights the
        // page canvas instead of settling onto it.
        surface: "bg-gradient-to-br from-white to-paper-100 rounded-2xl border border-paper-300 shadow-card",
    };

    return (
        <Component className={`${variants[variant] || variants.default} ${padding} ${className}`} {...props}>
            {children}
        </Component>
    );
};

export default Card;
