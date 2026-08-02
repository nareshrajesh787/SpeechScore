import React, { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Modal from './Modal';
import Button from './Button';
import AuthButton from '../AuthButton.jsx';
import { openSignInGate, closeSignInGate } from '../../utils/signInGateStore';

/**
 * The app's single "you need to sign in" surface.
 *
 * Two modes:
 *  - Blocking (default): a page renders this instead of its content when there
 *    is no user. There is no way out except signing in, so onClose is a no-op.
 *  - Dismissible: pass `onClose` and the user can back out. The landing page
 *    uses this when a signed-out visitor clicks a protected CTA.
 *
 * Nothing else should build its own sign-in modal — the landing page used to
 * hand-roll a near-copy of this, which put a second competing "Login" button
 * on screen alongside the Navbar's.
 */
const SignInGate = ({ message, onClose = null }) => {
    const dismissible = typeof onClose === 'function';

    // Announce that a sign-in gate is showing so the Navbar can stand down its
    // own auth control — otherwise the user sees two "Sign in" buttons at once.
    useEffect(() => {
        openSignInGate();
        return closeSignInGate;
    }, []);

    return (
        <Modal
            isOpen
            onClose={dismissible ? onClose : () => { }}
            labelledBy="sign-in-gate-heading"
            className="p-10 flex flex-col gap-4 items-center max-w-md w-full text-center"
        >
            <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center">
                <FontAwesomeIcon icon="user-circle" className="text-brand-600 text-3xl" />
            </div>
            <h2 id="sign-in-gate-heading" className="font-display text-2xl font-semibold text-ink-900">
                Sign in Required
            </h2>
            <p className="text-ink-500 text-sm">{message}</p>
            <div className="flex flex-col w-full gap-2 mt-2">
                <AuthButton variant="primary" className="w-full justify-center" />
                {dismissible && (
                    <Button variant="subtle" className="w-full justify-center" onClick={onClose}>
                        Cancel
                    </Button>
                )}
            </div>
        </Modal>
    );
};

export default SignInGate;
