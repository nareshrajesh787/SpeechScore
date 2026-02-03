import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

/**
 * Uploads an audio file/Blob to Firebase Storage
 * @param {File|Blob} audioFile - The audio file or Blob to upload
 * @param {string} userId - The user's UID
 * @param {string} projectId - The project ID (optional, for project-based storage)
 * @param {string} recordingId - The recording ID (optional, will generate if not provided)
 * @returns {Promise<string>} The download URL of the uploaded audio
 */
export async function uploadAudioToStorage(audioFile, userId, projectId = null, recordingId = null) {
    try {
        // Determine file extension
        let fileExtension = 'webm';
        if (audioFile instanceof File) {
            const fileName = audioFile.name;
            const extensionMatch = fileName.match(/\.([^.]+)$/);
            if (extensionMatch) {
                fileExtension = extensionMatch[1];
            }
        }

        // Generate recording ID if not provided
        if (!recordingId) {
            recordingId = `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }

        // Construct storage path
        let storagePath;
        if (projectId) {
            // Path format: users/{uid}/projects/{projectId}/{recordingId}.webm
            storagePath = `users/${userId}/projects/${projectId}/${recordingId}.${fileExtension}`;
        } else {
            // Fallback path for non-project recordings
            storagePath = `users/${userId}/recordings/${recordingId}.${fileExtension}`;
        }

        // Create storage reference
        const storageRef = ref(storage, storagePath);

        // Upload the file
        await uploadBytes(storageRef, audioFile);

        // Get download URL
        const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
    } catch (error) {
        console.error('Error uploading audio to Firebase Storage:', error);
        throw error;
    }
}
