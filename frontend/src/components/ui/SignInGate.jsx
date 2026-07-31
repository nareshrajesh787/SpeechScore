import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Modal from './Modal';
import Card from './Card';
import AuthButton from '../AuthButton.jsx';

// A non-dismissible "you must sign in" wall, unconditionally rendered by
// pages when there is no authenticated user. There is no close affordance in
// any of the current designs, so onClose is intentionally a no-op — the only
// way out is signing in via AuthButton.
const SignInGate = ({ message }) => {
    return (
        <Modal isOpen onClose={() => {}} labelledBy="sign-in-gate-heading">
            <Card className="flex flex-col gap-4 items-center max-w-md w-full shadow-2xl" padding="p-10">
                <FontAwesomeIcon icon="user-circle" className="text-indigo-400 text-6xl mb-2" />
                <h2 id="sign-in-gate-heading" className="font-bold text-2xl text-gray-800 text-center mb-1">
                    Sign in Required
                </h2>
                <p className="text-gray-500 text-center mb-3">{message}</p>
                <div className="flex flex-col items-center w-full gap-2">
                    <AuthButton />
                </div>
            </Card>
        </Modal>
    );
};

export default SignInGate;
