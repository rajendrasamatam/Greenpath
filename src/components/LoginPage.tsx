import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

interface LoginPageProps {
  onLoginSuccess: () => void;
  onNavigateToSignUp: () => void;
  onNavigateToLanding: () => void; // 🔹 New prop for going back to landing
}

const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onNavigateToSignUp,
  onNavigateToLanding
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful!');
      onLoginSuccess();
    } catch (err: any) {
      let errorMessage = 'An unexpected error occurred. Please try again.';
      if (err.code) {
        switch (err.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            errorMessage = 'Invalid email or password.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address.';
            break;
          case 'auth/user-disabled':
            errorMessage = 'Your account has been disabled.';
            break;
          default:
            errorMessage = `Login failed: ${err.message}`;
        }
      }
      console.error('Login error:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex items-center justify-center min-h-screen bg-black overflow-hidden"
      style={{ backgroundColor: '#000000' }}
    >
      <div className="absolute inset-0 hero-glow opacity-40"></div>

      <div className="relative z-10 w-full max-w-md p-8 space-y-8 border border-gray-800 bg-gray-900/50 backdrop-blur-sm rounded-2xl shadow-lg">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white">
            <span className="gradient-text">Welcome Back</span>
          </h1>
          <p className="mt-2 text-gray-400">Login to the SparkX Dashboard</p>
        </div>

        <form className="space-y-6" onSubmit={handleLogin}>
          {error && (
            <p className="text-red-400 text-center bg-red-500/10 p-3 rounded-lg">
              {error}
            </p>
          )}

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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 transition-colors duration-300 disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging In...' : 'Login'}
          </button>
        </form>

        <div className="flex justify-between items-center text-sm text-gray-400 mt-4">
          <button
            type="button"
            onClick={onNavigateToLanding} // 🔹 Back to landing
            className="font-semibold text-gray-400 hover:text-gray-200"
          >
            ← Back to Home
          </button>

          <button
            type="button"
            onClick={onNavigateToSignUp}
            className="font-semibold text-blue-400 hover:text-blue-300"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
