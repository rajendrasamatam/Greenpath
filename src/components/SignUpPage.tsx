import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase'; // Assuming 'auth' and 'db' are exported from your firebase.ts/js
import { Loader2, Image as ImageIcon, User as UserIcon } from 'lucide-react'; // Added ImageIcon and UserIcon for placeholders

// Declare the global __app_id variable for TypeScript
declare const __app_id: string;

// Declare the ImportMetaEnv interface for TypeScript to recognize import.meta.env
// This tells TypeScript what properties to expect on import.meta.env
interface ImportMetaEnv {
  readonly VITE_IMGBB_API_KEY: string;
  // Add other VITE_ variables here if you use them in this file
}

// Declare the ImportMeta interface to extend the global ImportMeta
// This is crucial for TypeScript to understand import.meta.env
interface ImportMeta {
  readonly env: ImportMetaEnv;
}


// Define the props for the component
interface SignUpPageProps {
  onSignUpSuccess: () => void;
  onNavigateToLogin: () => void; // Function to switch back to the login page
}

// IMPORTANT: Replace with your actual ImgBB API Key in your .env.local file: VITE_IMGBB_API_KEY=YOUR_KEY_HERE
// Accessing the API key from .env.local via Vite's import.meta.env
const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

const SignUpPage: React.FC<SignUpPageProps> = ({ onSignUpSuccess, onNavigateToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [ambulanceNumber, setAmbulanceNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null); // State for image preview
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState(0); // For image upload feedback

  // Global variables provided by Canvas environment (for Firestore path construction)
  // Fallback for local development if __app_id is not injected
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file)); // Create URL for preview
    } else {
      setImageFile(null);
      setImagePreviewUrl(null); // Clear preview
    }
  };

  const uploadImageToImgBB = async (file: File): Promise<string> => {
    setLoading(true);
    setImageUploadProgress(0);
    setError('');

    // Check if the API key is available
    if (!IMGBB_API_KEY) {
      setError('ImgBB API key is not configured. Please add VITE_IMGBB_API_KEY to your .env.local file.');
      setLoading(false);
      throw new Error('ImgBB API key missing.');
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData,
        // No 'Content-Type' header needed for FormData; browser sets it automatically
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `ImgBB upload failed with status: ${response.status}`);
      }

      const data = await response.json();
      if (data.data && data.data.url) {
        setImageUploadProgress(100);
        return data.data.url;
      } else {
        throw new Error('ImgBB response did not contain image URL.');
      }
    } catch (err: any) {
      console.error('ImgBB upload error:', err);
      setError(`Image upload failed: ${err.message}`);
      throw err; // Re-throw to be caught by the main sign-up handler
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (!imageFile) {
      setError('Please upload a driver image.');
      setLoading(false);
      return;
    }

    try {
      let imageUrl = '';
      // 1. Upload image to ImgBB
      try {
        imageUrl = await uploadImageToImgBB(imageFile);
      } catch (imgErr) {
        // Error already set by uploadImageToImgBB
        return; // Stop execution if image upload fails
      }

      // 2. Create user with email and password in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 3. Update Firebase Auth profile with display name and photo URL
      await updateProfile(user, {
        displayName: name,
        photoURL: imageUrl,
      });

      // 4. Store additional user details in Firestore
      // Path: /artifacts/{appId}/users/{userId}/driverProfiles/{userId}
      const userProfileRef = doc(db, `artifacts/${appId}/users/${user.uid}/driverProfiles`, user.uid);
      await setDoc(userProfileRef, {
        name: name,
        email: email,
        mobileNumber: mobileNumber,
        ambulanceNumber: ambulanceNumber,
        photoURL: imageUrl,
        createdAt: new Date(),
      });

      console.log('Sign up successful!', user);
      onSignUpSuccess(); // Call the success callback
    } catch (err: any) {
      // Handle Firebase authentication/Firestore errors
      let errorMessage = 'An unexpected error occurred during sign up. Please try again.';
      if (err.code) {
        switch (err.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'This email address is already in use.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address.';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password should be at least 6 characters.';
            break;
          default:
            errorMessage = `Sign up failed: ${err.message}`;
        }
      }
      console.error('Sign up error:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
      setImageUploadProgress(0); // Reset progress
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-black overflow-hidden" style={{ backgroundColor: '#000000' }}>
      <div className="absolute inset-0 hero-glow opacity-40"></div>
      
      <div className="relative z-10 w-full max-w-2xl p-8 space-y-8 border border-gray-800 bg-gray-900/50 backdrop-blur-sm rounded-2xl shadow-lg">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white">
            <span className="gradient-text">Driver Sign Up</span>
          </h1>
          <p className="mt-2 text-gray-400">Register your ambulance and profile</p>
        </div>

        <form className="space-y-6" onSubmit={handleSignUp}>
          {error && <p className="text-red-400 text-center bg-red-500/10 p-3 rounded-lg">{error}</p>}
          
          {/* Driver Image Upload and Preview */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-32 h-32 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center overflow-hidden mb-4">
              {imagePreviewUrl ? (
                <img src={imagePreviewUrl} alt="Driver Preview" className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={64} className="text-gray-500" /> // Placeholder icon
              )}
            </div>
            <label htmlFor="driverImage" className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-300">
              {imageFile ? 'Change Image' : 'Upload Image'}
              <input
                type="file"
                id="driverImage"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden" // Hide the default file input
                required
              />
            </label>
            {imageFile && (
              <p className="text-gray-400 text-xs mt-2">Selected: {imageFile.name}</p>
            )}
            {loading && imageUploadProgress < 100 && (
              <div className="mt-2 text-blue-400 flex items-center">
                <Loader2 className="animate-spin mr-2" size={16} /> Uploading image...
              </div>
            )}
          </div>

          {/* Two-column input grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            {/* Email */}
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Mobile Number */}
            <div className="relative">
              <input
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="Mobile Number (e.g., +1234567890)"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Ambulance Number */}
            <div className="relative">
              <input
                type="text"
                value={ambulanceNumber}
                onChange={(e) => setAmbulanceNumber(e.target.value)}
                placeholder="Ambulance Number (e.g., TS-09-AB-1234)"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            {/* Password */}
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div> {/* End of two-column grid */}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 transition-colors duration-300 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={20} /> Signing Up...
              </>
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400">
          Already have an account?{' '}
          <button 
            type="button" 
            onClick={onNavigateToLogin} 
            className="font-semibold text-blue-400 hover:text-blue-300 focus:outline-none"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;
