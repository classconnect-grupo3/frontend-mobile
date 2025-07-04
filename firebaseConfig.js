import { initializeApp, getApp, getApps } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getStorage, ref, uploadBytesResumable, getDownloadURL, listAll } from "firebase/storage"

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
}

if (getApps().length === 0) {
  initializeApp(firebaseConfig)
}

const fbApp = getApp()
const fbStorage = getStorage()
const auth = getAuth(fbApp)

const listFiles = async () => {
  const storage = getStorage()

  const listRef = ref(storage, "profile_pictures")

  const listResp = await listAll(listRef)
  return listResp.items
}

const uploadProfilePicToFirebase = async (uri, name, onProgress) => {
  const fetchResponse = await fetch(uri)
  const theBlob = await fetchResponse.blob()

  const imageRef = ref(getStorage(), `profile_pictures/${name}`)

  const uploadTask = uploadBytesResumable(imageRef, theBlob)

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        onProgress && onProgress(progress)
      },
      (error) => {
        reject(error)
      },
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref)
        resolve({
          downloadUrl,
          metadata: uploadTask.snapshot.metadata,
        })
      },
    )
  })
}

export const uploadFileToSubmission = async (fileUri, courseId, assignmentId, studentId, questionId) => {
  try {
    // Create a reference to the file in Firebase Storage
    const fileName = fileUri.split("/").pop()
    const fileExtension = fileName.split(".").pop()

    // Create a unique file path
    const storagePath = `courses/${courseId}/assignments/${assignmentId}/submissions/${studentId}/${questionId}.${fileExtension}`
    const storageRef = ref(getStorage(), storagePath)

    // Convert file URI to blob
    const response = await fetch(fileUri)
    const blob = await response.blob()

    // Upload the file
    const uploadTask = uploadBytesResumable(storageRef, blob)

    // Return a promise that resolves when the upload is complete
    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // You can use this to track upload progress if needed
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          console.log(`Upload progress: ${progress}%`)
        },
        (error) => {
          // Handle unsuccessful uploads
          console.error("Upload failed:", error)
          reject(error)
        },
        async () => {
          // Handle successful uploads
          try {
            // Get download URL
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref)

            resolve({
              downloadUrl,
              fileName,
              fileSize: blob.size,
              contentType: blob.type,
            })
          } catch (error) {
            reject(error)
          }
        },
      )
    })
  } catch (error) {
    console.error("Error preparing file upload:", error)
    throw error
  }
}

export const uploadFileToModuleResource = async (fileUri, courseId, moduleId, teacherId) => {
  try {
    const fileName = fileUri.split("/").pop()
    const fileExtension = fileName?.split(".").pop() ?? "bin"

    const storagePath = `courses/${courseId}/modules/${moduleId}/resources/${teacherId}_${Date.now()}.${fileExtension}`
    const storageRef = ref(getStorage(), storagePath)

    const response = await fetch(fileUri)
    const blob = await response.blob()

    const uploadTask = uploadBytesResumable(storageRef, blob)

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          console.log(`Upload progress: ${progress}%`)
        },
        (error) => {
          console.error("Upload failed:", error)
          reject(error)
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref)
            resolve({
              downloadUrl,
              fileName,
              fileSize: blob.size,
              contentType: blob.type,
            })
          } catch (error) {
            console.error("get download URL error: ", error)
            reject(error)
          }
        },
      )
    })
  } catch (error) {
    console.error("Error preparing module resource upload:", error)
    throw error
  }
}

const fetchProfileImage = async (userId) => {
  try {
    const imageRef = ref(getStorage(), `profile_pictures/${userId}.jpg`)
    const url = await getDownloadURL(imageRef)
    return url
  } catch (e) {
    console.log("No profile image found, fallback to default:", e.message)
    return null
  }
}

export { fbApp, fbStorage, auth, uploadProfilePicToFirebase as uploadToFirebase, listFiles, fetchProfileImage }
