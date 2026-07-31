import React from 'react';

// `as` mirrors Card's escape hatch: several "buttons" in this app are really
// react-router <Link>s (Navbar's Analyze, Dashboard's Quick Analyze,
// ProjectView's New Recording), and they should share button styling without
// being rendered as <button>.
const Button = ({ children, variant = 'primary', className = '', onClick, as: Component = 'button', ...props }) => {
    const baseStyles = "px-4 py-2 rounded-xl font-semibold transition-all active:scale-95 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-1";

    const variants = {
        primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm focus:ring-indigo-500",
        secondary: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-200",
        ghost: "bg-transparent text-indigo-600 hover:bg-indigo-50 focus:ring-indigo-300",
        // Muted tertiary action (modal "Cancel" and similar). Distinct from
        // `ghost` because a className color override cannot reliably beat a
        // variant's own text color — Tailwind utilities share specificity, so
        // the winner is decided by stylesheet emission order, not class order.
        subtle: "bg-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:ring-gray-300",
        outline: "bg-transparent border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 focus:ring-indigo-300",
        danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm focus:ring-red-500",
        warning: "bg-amber-500 text-white hover:bg-amber-600 shadow-sm focus:ring-amber-400",
        // For CTAs sitting on a dark/indigo section, where the usual filled
        // indigo button would disappear into the background. Exists as a real
        // variant so consumers don't have to fight `bg-indigo-600` with
        // `!important` overrides (Tailwind utilities share specificity, so
        // a plain `bg-white` in className would not reliably win).
        inverted: "bg-white text-indigo-900 hover:bg-gray-50 shadow-sm focus:ring-white"
    };

    const variantClasses = variants[variant] || variants.primary;

    return (
        <Component
            className={`${baseStyles} ${variantClasses} ${className}`}
            onClick={onClick}
            {...props}
        >
            {children}
        </Component>
    );
};

export default Button;
