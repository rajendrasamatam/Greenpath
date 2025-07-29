import React, { useState } from 'react';
import { auth } from '../firebase'; // Ensure this path is correct
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Function to handle new user registration
  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (password.length < 6) {
      setError("Password should be at least 6 characters long.");
      setLoading(false);
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // The onAuthStateChanged listener in App.tsx will handle the redirect
    } catch (err) {
      console.error("Error during sign-up:", err.message);
      setError("Failed to create an account. The email might already be in use.");
    }
    setLoading(false);
  };

  // Function to handle existing user sign-in
  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // The onAuthStateChanged listener in App.tsx will handle the redirect
    } catch (err) {
      console.error("Error during sign-in:", err.message);
      setError("Failed to sign in. Please check your email and password.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-blue-50">
      <div className="bg-white p-8 sm:p-10 rounded-xl shadow-2xl text-center max-w-sm w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">VitalRoute</h1>
        <p className="text-gray-600 mb-8">Ambulance Dashboard Login</p>
        
        <form className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Address"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            autoComplete="email"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            autoComplete="current-password"
          />
          
          {error && <p className="text-red-500 text-sm text-left pt-1">{error}</p>}
          
          <div className="pt-4 space-y-3">
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:bg-blue-300"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
            <button
              onClick={handleSignUp}
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:bg-green-300"
            >
              {loading ? 'Signing Up...' : 'Sign Up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
