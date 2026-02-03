import { doc, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';

/**
 * Deletes a recording from both Firestore and Firebase Storage
 * @param {string} userId - The user's UID
 * @param {string} projectId - The project ID
 * @param {string} recordingId - The recording ID
 * @param {string} audioUrl - Optional audio URL in Firebase Storage
 * @returns {Promise<void>}
 */
export async function deleteRecording(userId, projectId, recordingId, audioUrl = null) {
    try {
        // Delete Firestore document
        const recordingRef = doc(db, `users/${userId}/projects/${projectId}/recordings/${recordingId}`);
        await deleteDoc(recordingRef);

        // Delete audio file from Storage if URL is provided
        if (audioUrl) {
            try {
                // Extract the storage path from the URL
                // Firebase Storage URLs are in format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token=...
                // We need to decode the path
                let decodedPath = null;
                
                try {
                    const urlObj = new URL(audioUrl);
                    const pathMatch = urlObj.pathname.match(/\/o\/(.+?)(\?|$)/);
                    
                    if (pathMatch) {
                        // Decode the path (it's URL encoded)
                        const encodedPath = pathMatch[1];
                        decodedPath = decodeURIComponent(encodedPath.replace(/%2F/g, '/'));
                    }
                } catch (urlError) {
                    // If URL parsing fails, try to extract path directly
                    // Sometimes the URL might be in a different format
                    console.warn('Error parsing Storage URL, attempting direct path extraction:', urlError);
                }
                
                if (decodedPath) {
                    // Create storage reference and delete
                    const storageRef = ref(storage, decodedPath);
                    await deleteObject(storageRef);
                } else {
                    console.warn('Could not extract storage path from URL:', audioUrl);
                }
            } catch (storageError) {
                // If file doesn't exist or deletion fails, log but don't throw
                // The Firestore document is already deleted, so we continue
                // This is expected if the file was already deleted or doesn't exist
                if (storageError.code !== 'storage/object-not-found') {
                    console.warn('Error deleting audio file from Storage:', storageError);
                }
            }
        }
    } catch (error) {
        console.error('Error deleting recording:', error);
        throw error;
    }
}
