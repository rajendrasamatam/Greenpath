import React, { useState } from 'react';
import DemoModal from './DemoModal';

// Define the props for the component, including the new navigation function
interface LandingPageProps {
  onNavigateToLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToLogin }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Function to handle smooth scrolling to a section
  const handleScroll = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <div className="antialiased">
        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-10 py-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">🚨 SparkX</h1>
            {/* This button now calls the onNavigateToLogin function when clicked */}
            <button 
              onClick={onNavigateToLogin}
              className="bg-blue-600 text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Dashboard Login
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <main className="relative overflow-hidden">
          <div className="min-h-screen flex items-center justify-center pt-20 pb-10 px-4 sm:px-6 lg:px-8">
            <div className="absolute inset-0 hero-glow opacity-50"></div>
            <div className="relative text-center z-10">
              <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white">
                Paving the Way for <span className="gradient-text">Life-Savers</span>
              </h2>
              <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-gray-300">
                SparkX is a smart traffic management system that reduces ambulance response time by dynamically controlling traffic lights with geofencing and live GPS tracking.
              </p>
              <div className="mt-10 flex justify-center gap-4">
                {/* This button now uses the handleScroll function for smooth scrolling */}
                <button
                  onClick={() => handleScroll('overview')}
                  className="bg-white text-gray-900 font-semibold px-8 py-3 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Learn More
                </button>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="border border-gray-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  View Demo
                </button>
              </div>
            </div>
          </div>

          {/* Project Overview */}
          <section id="overview" className="py-20 sm:py-32">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <h2 className="text-base font-semibold text-blue-400 tracking-wider uppercase">Project Overview</h2>
                <p className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
                  Intelligent Traffic Flow for Critical Moments
                </p>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">
                  Our system ensures a clear, uninterrupted path for ambulances, drastically cutting down travel time during emergencies. By integrating GPS, geofencing, and cloud technology, we turn every traffic light into a life-saving checkpoint.
                </p>
              </div>
            </div>
          </section>

          {/* Key Features Section */}
          <section id="features" className="py-20 sm:py-24 bg-black">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-base font-semibold text-blue-400 tracking-wider uppercase">Smart Features</h2>
                <p className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
                  A Future-Ready Solution
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Feature 1 */}
                <div className="feature-card p-8 rounded-2xl text-center">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-500/20 mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">Dynamic Signal Switching</h3>
                  <p className="mt-2 text-gray-400">Traffic lights automatically turn green for ambulances in real-time as they approach a junction.</p>
                </div>
                {/* Feature 2 */}
                <div className="feature-card p-8 rounded-2xl text-center">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-red-500/20 mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">Live Geofencing</h3>
                  <p className="mt-2 text-gray-400">Junctions create a 500-meter virtual boundary, detecting ambulance approach with high precision.</p>
                </div>
                {/* Feature 3 */}
                <div className="feature-card p-8 rounded-2xl text-center">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-green-500/20 mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">Admin Dashboard</h3>
                  <p className="mt-2 text-gray-400">Monitor all assets on a live map, track ambulances, and manually override signals when needed.</p>
                </div>
              </div>
            </div>
          </section>
          
          {/* System Architecture Section */}
          <section id="architecture" className="py-20 sm:py-32">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-base font-semibold text-blue-400 tracking-wider uppercase">How It Works</h2>
                <p className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
                  A Seamless Four-Step Process
                </p>
              </div>
              <div className="relative">
                {/* The connecting line */}
                <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-700 -translate-y-1/2"></div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
                  <div className="relative p-4">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-800 border-2 border-blue-500 rounded-full text-blue-400 font-bold text-2xl">1</div>
                    <h3 className="font-bold text-white">Ambulance Unit</h3>
                    <p className="text-gray-400">ESP32 & GPS module send live coordinates to the cloud.</p>
                  </div>
                  <div className="relative p-4">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-800 border-2 border-blue-500 rounded-full text-blue-400 font-bold text-2xl">2</div>
                    <h3 className="font-bold text-white">Firebase Cloud</h3>
                    <p className="text-gray-400">Receives location data and processes geofencing logic.</p>
                  </div>
                  <div className="relative p-4">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-800 border-2 border-blue-500 rounded-full text-blue-400 font-bold text-2xl">3</div>
                    <h3 className="font-bold text-white">Web Dashboard</h3>
                    <p className="text-gray-400">Admins monitor the system and can send manual commands.</p>
                  </div>
                  <div className="relative p-4">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-800 border-2 border-blue-500 rounded-full text-blue-400 font-bold text-2xl">4</div>
                    <h3 className="font-bold text-white">Traffic Light Node</h3>
                    <p className="text-gray-400">ESP32 controller receives commands and switches the lights.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Technology Stack */}
          <section className="py-20 sm:py-24 bg-black">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-extrabold text-white">Technology Stack</h2>
                <p className="mt-4 text-lg text-gray-400">Built with modern, reliable, and scalable technologies.</p>
              </div>
              <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                <div className="p-4">
                  <h3 className="text-xl font-bold text-white">React.js</h3>
                  <p className="text-gray-400">Frontend</p>
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-bold text-white">Firebase</h3>
                  <p className="text-gray-400">Backend & DB</p>
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-bold text-white">ESP32</h3>
                  <p className="text-gray-400">Hardware</p>
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-bold text-white">Google Maps API</h3>
                  <p className="text-gray-400">Geolocation</p>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-800">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-gray-400">&copy; 2025 SparkX Project. All Rights Reserved.</p>
            <p className="text-gray-500 mt-2">A Smart Solution for a Safer Tomorrow.</p>
          </div>
        </footer>
      </div>

      {/* The DemoModal component is rendered here */}
      <DemoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default LandingPage;
