import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(', ');

const Modal = ({ isOpen, onClose, children, className = '', labelledBy }) => {
    const dialogRef = useRef(null);
    const previousActiveElementRef = useRef(null);

    // Focus management: capture the previously-focused element on open, move
    // focus into the dialog, and restore focus to that element on close.
    useEffect(() => {
        if (!isOpen) return undefined;

        previousActiveElementRef.current = document.activeElement;

        const focusableElements = dialogRef.current
            ? dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR)
            : [];

        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        } else if (dialogRef.current) {
            dialogRef.current.focus();
        }

        return () => {
            if (previousActiveElementRef.current && previousActiveElementRef.current.focus) {
                previousActiveElementRef.current.focus();
            }
        };
    }, [isOpen]);

    // Escape-to-close and Tab focus trap, scoped to this modal instance only
    // while it is open.
    useEffect(() => {
        if (!isOpen) return undefined;

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose?.();
                return;
            }

            if (event.key === 'Tab' && dialogRef.current) {
                const focusableElements = Array.from(
                    dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR)
                );

                if (focusableElements.length === 0) {
                    event.preventDefault();
                    return;
                }

                const first = focusableElements[0];
                const last = focusableElements[focusableElements.length - 1];

                if (event.shiftKey) {
                    if (document.activeElement === first || !dialogRef.current.contains(document.activeElement)) {
                        event.preventDefault();
                        last.focus();
                    }
                } else {
                    if (document.activeElement === last || !dialogRef.current.contains(document.activeElement)) {
                        event.preventDefault();
                        first.focus();
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                ref={dialogRef}
                className={`bg-white rounded-2xl shadow-2xl ${className}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={labelledBy}
                tabIndex={-1}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>,
        document.body
    );
};

export default Modal;
