import { useSyncExternalStore } from 'react';

/**
 * Tracks whether a SignInGate is currently on screen.
 *
 * Why a module-level store rather than context: SignInGate renders through a
 * portal from wherever a page happens to gate itself, so there is no reliable
 * common provider between it and the Navbar. A tiny external store keeps the
 * two in sync without threading a provider through the whole tree.
 *
 * The counter (rather than a boolean) keeps mount/unmount ordering safe if two
 * gates ever overlap during a transition.
 */
let openCount = 0;
const listeners = new Set();

const emit = () => {
    listeners.forEach((listener) => listener());
};

export const openSignInGate = () => {
    openCount += 1;
    emit();
};

export const closeSignInGate = () => {
    openCount = Math.max(0, openCount - 1);
    emit();
};

const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

const getSnapshot = () => openCount > 0;

/**
 * True while a sign-in gate is showing. The Navbar uses this to hide its own
 * auth control, so the user never sees two competing "Sign in" buttons.
 */
export const useSignInGateOpen = () => useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
