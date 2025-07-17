"use client";

import { MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';

const GeoLocator = () => {
  const [status, setStatus] = useState('Checking location...');
  const [isLocating, setIsLocating] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus('Geolocation is not supported by your browser');
      setIsLocating(false);
    } else {
      navigator.geolocation.getCurrentPosition(
        () => {
          setStatus('Delivering to you');
          setIsLocating(false);
        },
        () => {
          setStatus('Unable to retrieve location');
          setIsLocating(false);
        }
      );
    }
  }, []);

  return (
    <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
      <MapPin className={`h-4 w-4 ${isLocating ? 'animate-pulse text-primary' : ''}`} />
      <span>{status}</span>
    </div>
  );
};

export default GeoLocator;
