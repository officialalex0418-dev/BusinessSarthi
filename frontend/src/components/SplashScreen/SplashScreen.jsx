import { useEffect, useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import './SplashScreen.css';

/**
 * Professional Splash Screen for BusinessSarthi
 * Handles the 3-5 second animated entrance experience.
 */
export default function SplashScreen({ isAppReady, onFinished }) {
  const { dark, branding } = useTheme();
  const [animationFinished, setAnimationFinished] = useState(false);
  const [shouldExit, setShouldExit] = useState(false);

  useEffect(() => {
    // Stage 1-5 takes approximately 3.6 seconds to complete visually.
    // We signal animation completion at 3.5 seconds.
    const timer = setTimeout(() => {
      setAnimationFinished(true);
    }, 3500);

    // Safety timeout to prevent infinite splash if initialization gets stuck.
    const safetyTimer = setTimeout(() => {
        setAnimationFinished(true);
    }, 8000);

    return () => {
        clearTimeout(timer);
        clearTimeout(safetyTimer);
    };
  }, []);

  useEffect(() => {
    // Concept: canEnterApplication = animationFinished && appInitialized;
    if (animationFinished && isAppReady) {
      setShouldExit(true);
      // Wait for the CSS opacity transition (0.6s) before fully unmounting/removing.
      const exitTimer = setTimeout(() => {
        onFinished();
      }, 600);
      return () => clearTimeout(exitTimer);
    }
  }, [animationFinished, isAppReady, onFinished]);

  return (
    <div className={`splash-screen ${dark ? 'dark' : ''} ${shouldExit ? 'exit' : ''}`}>
      <div className="splash-logo-container">
        {/* The Animated Logo */}
        <img
          src="/logo.png"
          alt={branding.appName || 'BusinessSarthi'}
          className="splash-logo"
        />

        {/* Shimmer overlay to simulate "road activity" on the 'S' */}
        <div className="splash-logo-shimmer" />

        <div className="splash-brand">
          <h1 className="splash-name">{branding.appName || 'BusinessSarthi'}</h1>
          <p className="splash-tagline">Driving your Business forward</p>
        </div>

        {/* Subtle loading indicator to show something is happening in background */}
        <div className="splash-loading-bar-container">
          <div className="splash-loading-bar" />
        </div>
      </div>
    </div>
  );
}
