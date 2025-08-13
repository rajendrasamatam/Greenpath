import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import SignUpPage from './components/SignUpPage';
import { auth } from './firebase';
import { User, onAuthStateChanged } from 'firebase/auth';

type View = 'landing' | 'login' | 'dashboard' | 'signup';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);

      if (currentUser) {
        setCurrentView('dashboard');
      } else {
        if (currentView === 'dashboard') {
          setCurrentView('landing');
        }
      }
    });

    return () => unsubscribe();
  }, [currentView]);

  const handleNavigateToLogin = () => {
    setCurrentView('login');
  };

  const handleNavigateToLanding = () => {
    setCurrentView('landing');
  };

  const handleLoginSuccess = () => {
    console.log("Login success detected by App.tsx, waiting for auth state change.");
  };

  const handleSignUpSuccess = () => {
    console.log("Sign up success detected by App.tsx, navigating to login.");
    setCurrentView('login');
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setCurrentView('landing');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleNavigateToSignUp = () => {
    console.log("Attempting to navigate to Sign Up page.");
    setCurrentView('signup');
  };

  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        Loading authentication state...
      </div>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case 'login':
        return (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onNavigateToSignUp={handleNavigateToSignUp}
            onNavigateToLanding={handleNavigateToLanding} // 🔹 Added
          />
        );

      case 'signup':
        return (
          <SignUpPage
            onSignUpSuccess={handleSignUpSuccess}
            onNavigateToLogin={handleNavigateToLogin}
          />
        );

      case 'dashboard':
        if (user) {
          return <Dashboard user={user} onLogout={handleLogout} />;
        }
        return (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onNavigateToSignUp={handleNavigateToSignUp}
            onNavigateToLanding={handleNavigateToLanding} // 🔹 Added
          />
        );

      case 'landing':
      default:
        return <LandingPage onNavigateToLogin={handleNavigateToLogin} />;
    }
  };

  return <>{renderContent()}</>;
};

export default App;
