import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

  const menuItems = [
    {
      category: 'HR Management',
      items: [
        { path: '/hr/dashboard', icon: 'fas fa-tachometer-alt', label: 'Dashboard' },
        { path: '/hr/resume-upload', icon: 'fas fa-file-upload', label: 'Resume Upload' },
        { path: '/hr/candidates', icon: 'fas fa-users', label: 'Candidates' },
        { path: '/hr/job-generator', icon: 'fas fa-magic', label: 'Job Generator' },
      ]
    },
    {
      category: 'Travel Management',
      items: [
        { path: '/travel/search', icon: 'fas fa-plane', label: 'Flight Search' },
        { path: '/travel/dashboard', icon: 'fas fa-map-marked-alt', label: 'Travel Dashboard' },
      ]
    },
    {
      category: 'Analytics',
      items: [
        { path: '/analytics', icon: 'fas fa-chart-bar', label: 'HR Metrics' },
      ]
    }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-16 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6">
          <nav className="space-y-6">
            {menuItems.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {category.category}
                </h3>
                <div className="space-y-1">
                  {category.items.map((item, itemIndex) => (
                    <Link
                      key={itemIndex}
                      to={item.path}
                      onClick={onClose}
                      className={`
                        flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                        ${location.pathname === item.path
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }
                      `}
                    >
                      <i className={`${item.icon} w-5 text-center mr-3`}></i>
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <i className="fas fa-robot text-white"></i>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">AI Assistant</p>
              <p className="text-xs text-gray-500">Ready to help</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;