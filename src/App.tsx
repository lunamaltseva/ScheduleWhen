import { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import Sidebar from './components/Sidebar';
import CalendarView from './components/Calendar';
import ChatBot from './components/Chat';
import { useApp } from './context/AppContext';

function DesktopLayout() {
  return (
    <div className="flex h-screen overflow-hidden font-sans">
      <Sidebar />
      <CalendarView />
      <ChatBot />
    </div>
  );
}

function MobileLayout() {
  const { state } = useApp();
  const { mobileView } = state;

  return (
    <div className="flex flex-col h-screen font-sans overflow-hidden">
      {mobileView === 'sidebar' && <Sidebar mobileMode />}
      {mobileView === 'calendar' && <CalendarView showBackButton />}
      {mobileView === 'chat' && <ChatBot mobileMode />}
    </div>
  );
}

function Layout() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile ? <MobileLayout /> : <DesktopLayout />;
}

export default function App() {
  return (
    <AppProvider>
      <Layout />
    </AppProvider>
  );
}
