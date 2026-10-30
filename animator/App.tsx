import { useEffect, useRef } from 'react';
import studioMarkup from './studio.html?raw';
import { initializeStudio } from './studio';

export default function App() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => { initializeStudio(); }, []);
  return <div ref={host} dangerouslySetInnerHTML={{ __html: studioMarkup }} />;
}
