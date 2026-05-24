import { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import { useApp } from './context/AppContext';
import { loadStudentsFromExcel } from './data/loader';
import { loadCalendar } from './data/parseCalendar';
import Sidebar from './components/Sidebar';
import CalendarView from './components/Calendar';
import ChatBot from './components/Chat';

// Loads the real student schedule from the Excel file on first mount.
// Falls back gracefully to synthetic data if the fetch fails.
function ExcelLoader() {
  const { dispatch } = useApp();

  useEffect(() => {
    loadStudentsFromExcel(`${import.meta.env.BASE_URL}Fall_2026_Students.xlsx`)
      .then(students => dispatch({ type: 'SET_STUDENTS', students }))
      .catch(() => dispatch({ type: 'SET_DATA_ERROR' }));
  }, [dispatch]);

  return null;
}

function CalendarLoader() {
  const { dispatch } = useApp();
  useEffect(() => {
    loadCalendar(`${import.meta.env.BASE_URL}academic-calendar.ics`)
      .then(events => dispatch({ type: 'SET_ACADEMIC_EVENTS', events }))
      .catch(() => {}); // non-critical — silently skip if unavailable
  }, [dispatch]);
  return null;
}

function DesktopLayout() {
  return (
    <div className="flex h-screen min-w-[800px] overflow-x-auto font-sans">
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
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 960);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 960);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile ? <MobileLayout /> : <DesktopLayout />;
}

export default function App() {
  return (
    <AppProvider>
      <ExcelLoader />
      <CalendarLoader />
      <Layout />
    </AppProvider>
  );
}
