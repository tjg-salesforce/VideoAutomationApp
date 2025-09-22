// BACKUP: Sidebar implementation with sticky behavior and collapse functionality
// This contains the working sidebar code that should be restored after media files are fixed

// Key sidebar state variables:
const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
const [sidebarSticky, setSidebarSticky] = useState(false);

// Sidebar sticky effect:
useEffect(() => {
  const handleScroll = () => {
    const scrollY = window.scrollY;
    const headerHeight = 64; // 4rem = 64px
    
    if (scrollY > headerHeight) {
      setSidebarSticky(true);
    } else {
      setSidebarSticky(false);
    }
  };

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);

// Main container with conditional margin:
<div className={`flex-1 flex flex-col ${!sidebarCollapsed && sidebarSticky ? 'mr-96' : ''}`}>

// Sidebar with conditional positioning:
{!sidebarCollapsed && (
  <div 
    className={`w-96 border-l border-gray-200 overflow-y-auto bg-white z-10 flex-shrink-0 ${
      sidebarSticky 
        ? 'fixed top-0 right-0 h-screen' 
        : 'sticky top-16 h-[calc(100vh-4rem)] relative'
    }`}
  >
    {/* Close button */}
    <button
      onClick={() => setSidebarCollapsed(true)}
      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center z-20"
    >
      <XMarkIcon className="w-4 h-4" />
    </button>
    
    {/* Sidebar content */}
    {/* ... rest of sidebar content ... */}
  </div>
)}

// Floating toggle button when collapsed:
{sidebarCollapsed && (
  <div className="fixed top-20 right-4 z-20">
    <button
      onClick={() => setSidebarCollapsed(false)}
      className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg"
    >
      <ChevronLeftIcon className="w-6 h-6" />
    </button>
  </div>
)}
