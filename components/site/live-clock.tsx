'use client';
import { useEffect, useState } from 'react';

// "Indore · 7:24 PM" that ticks quietly; renders nothing until mounted to avoid hydration mismatch.
export default function LiveClock() {
  const [now, setNow] = useState('');
  useEffect(() => {
    const format = () =>
      setNow(
        new Intl.DateTimeFormat('en-IN', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Asia/Kolkata'
        })
          .format(new Date())
          .toUpperCase()
      );
    format();
    const timer = window.setInterval(format, 15000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <span>
      Indore, India
      {now && (
        <>
          {' '}
          · <time className="live-time">{now}</time>
        </>
      )}
    </span>
  );
}
