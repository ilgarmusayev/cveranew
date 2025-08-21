'use client';

import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

export default function AOSProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize AOS with optimized settings
    AOS.init({
      duration: 800,
      offset: 50,
      easing: 'ease-out-cubic',
      once: true,
      mirror: false,
      anchorPlacement: 'top-bottom',
      disable: false,
    });

    // Refresh AOS when component mounts
    AOS.refresh();

    // Cleanup function
    return () => {
      AOS.refreshHard();
    };
  }, []);

  return <>{children}</>;
}
