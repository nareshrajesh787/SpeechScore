import React from 'react';

// `as` mirrors Card's escape hatch: several "buttons" in this app are really
// react-router <Link>s (Navbar's Analyze, Dashboard's Quick Analyze,
// ProjectView's New Recording), and they should share button styling without
// being rendered as <button>.
const Button = ({ children, variant = 'primary', size = 'md', className = '', onClick, as: Component = 'button', ...props }) => {
    const baseStyles = "font-semibold transition-all active:scale-95 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none";

    // `icon` is for icon-only, borderless affordances (e.g. a chat send
    // button overlaid on a textarea) that need tighter padding and a
    // smaller radius than the standard pill/rounded-rect sizing.
    const sizes = {
        md: "px-4 py-2 rounded-xl",
        icon: "p-2 rounded-lg",
    };

    const variants = {
        primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-card focus:ring-brand-500",
        secondary: "bg-white border border-paper-300 text-ink-700 hover:bg-paper-100 focus:ring-paper-400",
        ghost: "bg-transparent text-brand-600 hover:bg-brand-50 focus:ring-brand-300 disabled:text-ink-400 disabled:hover:bg-transparent",
        // Muted tertiary action (modal "Cancel" and similar). Distinct from
        // `ghost` because a className color override cannot reliably beat a
        // variant's own text color — Tailwind utilities share specificity, so
        // the winner is decided by stylesheet emission order, not class order.
        subtle: "bg-transparent text-ink-500 hover:text-ink-700 hover:bg-paper-200 focus:ring-paper-400",
        outline: "bg-transparent border-2 border-brand-600 text-brand-600 hover:bg-brand-50 focus:ring-brand-300",
        danger: "bg-needs-work-600 text-white hover:bg-needs-work-700 shadow-card focus:ring-needs-work-500",
        warning: "bg-caution-500 text-white hover:bg-caution-600 shadow-card focus:ring-caution-500",
        // For CTAs sitting on a dark/brand section, where the usual filled
        // indigo button would disappear into the background. Exists as a real
        // variant so consumers don't have to fight `bg-brand-600` with
        // `!important` overrides (Tailwind utilities share specificity, so
        // a plain `bg-white` in className would not reliably win).
        inverted: "bg-white text-brand-900 hover:bg-paper-100 shadow-card focus:ring-white"
    };

    const variantClasses = variants[variant] || variants.primary;
    const sizeClasses = sizes[size] || sizes.md;

    return (
        <Component
            className={`${baseStyles} ${sizeClasses} ${variantClasses} ${className}`}
            onClick={onClick}
            {...props}
        >
            {children}
        </Component>
    );
};

export default Button;
