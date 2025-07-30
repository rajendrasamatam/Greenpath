import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import SignUpPage from './components/SignUpPage'; // Ensure this import is correct
import { auth } from './firebase'; // Assuming firebase.ts exports 'auth'
import { User, onAuthStateChanged } from 'firebase/auth';

// Define the possible views for type safety
type View = 'landing' | 'login' | 'dashboard' | 'signup'; // Make sure 'signup' is in this type

const App: React.FC = () => {
  // State to manage which component/view is currently active
  const [currentView, setCurrentView] = useState<View>('landing');
  // State to store the authenticated user object
  const [user, setUser] = useState<User | null>(null);
  // State to indicate if Firebase auth state has been initially checked
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Effect to listen for Firebase authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // Set the user state
      setIsAuthReady(true); // Mark auth as ready

      // If user is logged in, navigate to dashboard
      if (currentUser) {
        setCurrentView('dashboard');
      } else {
        // If no user, and we were previously on dashboard, go to landing/login
        // Only change if not already on login/signup page
        if (currentView === 'dashboard') { // This condition prevents redirect loop if already on login/signup
          setCurrentView('landing'); // Or 'login' depending on desired flow
        }
      }
    });

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, [currentView]); // Depend on currentView to react if user logs out while on dashboard

  // Handler to switch from LandingPage to LoginPage
  const handleNavigateToLogin = () => {
    setCurrentView('login');
  };

  // Handler for a successful login, switches to the Dashboard
  // onAuthStateChanged will actually set the user and navigate to dashboard
  const handleLoginSuccess = () => {
    console.log("Login success detected by App.tsx, waiting for auth state change.");
    // The useEffect with onAuthStateChanged will handle setting the user and navigating to 'dashboard'
  };

  // Handler for a successful sign-up, typically navigates to login or directly to dashboard
  const handleSignUpSuccess = () => {
    console.log("Sign up success detected by App.tsx, navigating to login.");
    setCurrentView('login'); // After successful sign-up, go to login page
  };

  // Handler for logging out, returns to the LandingPage
  const handleLogout = async () => {
    try {
      await auth.signOut(); // Firebase signOut will trigger onAuthStateChanged to nullify user
      setCurrentView('landing'); // Navigate to landing page immediately
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  
  // Handler to navigate to the sign-up page
  const handleNavigateToSignUp = () => {
    console.log("Attempting to navigate to Sign Up page."); // Add this log to confirm it's called
    setCurrentView('signup'); // This is the crucial line that changes the view
  };

  // Show a loading indicator while Firebase auth state is being determined
  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        Loading authentication state...
      </div>
    );
  }

  // Conditionally render the component based on the currentView state
  const renderContent = () => {
    switch (currentView) {
      case 'login':
        return <LoginPage onLoginSuccess={handleLoginSuccess} onNavigateToSignUp={handleNavigateToSignUp} />;
      
      case 'signup': // This case must exist and correctly render SignUpPage
        return <SignUpPage onSignUpSuccess={handleSignUpSuccess} onNavigateToLogin={handleNavigateToLogin} />;
      
      case 'dashboard':
        // Ensure user exists before rendering Dashboard
        if (user) {
          return <Dashboard user={user} onLogout={handleLogout} />;
        }
        // Fallback if user is somehow null but view is dashboard (shouldn't happen with useEffect)
        return <LoginPage onLoginSuccess={handleLoginSuccess} onNavigateToSignUp={handleNavigateToSignUp} />;
      
      case 'landing':
      default:
        return <LandingPage onNavigateToLogin={handleNavigateToLogin} />;
    }
  };

  return (
    <>
      {renderContent()}
    </>
  );
};

export default App;
