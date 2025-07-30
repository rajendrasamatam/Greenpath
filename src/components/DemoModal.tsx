import React, { useState, useEffect } from 'react';
import './DemoModal.css';

// Define the props for the component
interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DemoModal: React.FC<DemoModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(0);

  // This effect runs the animation sequence
  useEffect(() => {
    if (isOpen) {
      // Reset animation on open
      setStep(0);
      const timers = [
        setTimeout(() => setStep(1), 500),   // Ambulance starts moving
        setTimeout(() => setStep(2), 2500),  // Geofence appears
        setTimeout(() => setStep(3), 3000),  // Light turns green
        setTimeout(() => setStep(4), 5000),  // Ambulance passes
        setTimeout(() => setStep(5), 6000),  // Light turns red again
        setTimeout(() => setStep(6), 7000),  // Show "Completed" text
      ];
      // Cleanup timers when the component unmounts or modal closes
      return () => timers.forEach(clearTimeout);
    }
  }, [isOpen]);

  // If the modal is not open, render nothing
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>&times;</button>
        <h2 className="text-2xl font-bold text-center text-white mb-4">How SparkX Works</h2>
        <div className="demo-container">
          {/* Road */}
          <div className="road"></div>

          {/* Ambulance: CSS classes are applied based on the current 'step' */}
          <div className={`ambulance ${step >= 1 ? 'moving' : ''} ${step >= 4 ? 'passed' : ''}`}>
            🚑
          </div>

          {/* Traffic Light: The 'active' class is toggled based on the step */}
          <div className="traffic-light-pole">
            <div className="traffic-light">
              <div className={`light red ${step < 3 || step >= 5 ? 'active' : ''}`}></div>
              <div className={`light green ${step >= 3 && step < 5 ? 'active' : ''}`}></div>
            </div>
          </div>

          {/* Geofence: The 'active' class is toggled based on the step */}
          <div className={`geofence ${step >= 2 ? 'active' : ''}`}></div>

          {/* Text Description */}
          <div className="demo-text">
            {step === 0 && 'An ambulance is en route...'}
            {step === 1 && 'The ambulance is approaching the junction.'}
            {step === 2 && 'It enters the 500m geofence.'}
            {step === 3 && 'SparkX turns the light green automatically!'}
            {step === 4 && 'A clear path is created, saving precious time.'}
            {step >= 5 && 'The system returns to normal after the ambulance passes.'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoModal;
