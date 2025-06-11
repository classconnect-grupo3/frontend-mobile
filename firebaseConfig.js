import { initializeApp, getApp, getApps } from 'firebase/app';

// Optionally import the services that you want to use
// import {...} from 'firebase/auth';
// import {...} from 'firebase/database';
// import {...} from 'firebase/firestore';
// import {...} from 'firebase/functions';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, listAll } from 'firebase/storage';

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
};

if (getApps().length === 0) {
  initializeApp(firebaseConfig);
}

const fbApp = getApp();
const fbStorage = getStorage();

const listFiles = async () => {
  const storage = getStorage();

  const listRef = ref(storage, 'profile_pictures');
  
  const listResp = await listAll(listRef);
  return listResp.items
}

const uploadProfilePicToFirebase = async (uri, name, onProgress) => {

  const fetchResponse = await fetch(uri);
  const theBlob = await fetchResponse.blob();
  
  const imageRef = ref(getStorage(), `profile_pictures/${name}`);

  const uploadTask = uploadBytesResumable(imageRef, theBlob);

  return new Promise((resolve, reject) => {
    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress && onProgress(progress);
      }, 
      (error) => {
        reject(error);
      }, 
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        resolve({
          downloadUrl,
          metadata: uploadTask.snapshot.metadata
        })
      }
    );
  });
}

import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

/**
 * Sube un archivo a Firebase Storage para una entrega específica.
 * 
 * @param {string} uri - URI local del archivo.
 * @param {Object} params - Parámetros necesarios para el path.
 * @param {string} params.courseId - ID del curso.
 * @param {string} params.assignmentId - ID del assignment.
 * @param {string} params.studentId - ID del estudiante.
 * @param {string} params.questionId - ID de la pregunta.
 * @param {(progress: number) => void} [onProgress] - Callback para el progreso.
 * @returns {Promise<{ downloadUrl: string, metadata: any }>}
 */
export const uploadFileToSubmission = async (
  uri, courseId, assignmentId, studentId, questionId, onProgress
) => {
  const fetchResponse = await fetch(uri);
  const blob = await fetchResponse.blob();

  const filePath = `submissions/${courseId}/${assignmentId}/${studentId}/${questionId}`;
  const fileRef = ref(getStorage(), filePath);

  const uploadTask = uploadBytesResumable(fileRef, blob);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(progress);
      },
      (error) => reject(error),
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        resolve({
          downloadUrl,
          metadata: uploadTask.snapshot.metadata,
        });
      }
    );
  });
};

const fetchProfileImage = async (userId) => {
  try {
    const imageRef = ref(getStorage(), `profile_pictures/${userId}.jpg`);
    const url = await getDownloadURL(imageRef);
    return url;
  } catch (e) {
    console.log('No profile image found, fallback to default:', e.message);
    return null;
  }
};

export {
  fbApp,
  fbStorage,
  uploadProfilePicToFirebase as uploadToFirebase,
  listFiles,
  fetchProfileImage
}
