// import React from 'react';

// interface HeaderProps {
//   onMenuClick: () => void;
// }

// const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
//   return (
//     <header className="bg-white shadow-sm border-b border-gray-200 fixed w-full top-0 z-40">
//       <div className="flex items-center justify-between px-6 py-4">
//         <div className="flex items-center">
//           <button
//             onClick={onMenuClick}
//             className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
//           >
//             <i className="fas fa-bars text-xl"></i>
//           </button>
          
//           <div className="flex items-center ml-4 lg:ml-0">
//             <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
//               <i className="fas fa-rocket text-white text-sm"></i>
//             </div>
//             <h1 className="text-xl font-bold text-gray-900">
//               NaviHire
//             </h1>
//           </div>
//         </div>

//         <div className="flex items-center space-x-4">
//           <div className="hidden md:flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1">
//             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
//             <span className="text-sm text-gray-600">AI Active</span>
//           </div>
          
//           <button className="p-2 text-gray-600 hover:text-gray-900 relative">
//             <i className="fas fa-bell text-lg"></i>
//             <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
//           </button>
          
//           <div className="flex items-center space-x-2">
//             <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
//               <i className="fas fa-user text-gray-600 text-sm"></i>
//             </div>
//             <span className="hidden md:block text-sm font-medium text-gray-700">HR Manager</span>
//           </div>
//         </div>
//       </div>
//     </header>
//   );
// };

// export default Header;

import React, { useState, useRef, useEffect } from 'react';
import ConnectionStatus from './ConnectionStatus';
import { useWebSocket } from '../../hooks/useWebSocket';

interface User {
  name: string;
  email: string;
  avatar?: string;
}

interface HeaderProps {
  user: User;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [userId] = useState(() => `user_${Date.now()}`);

  const {
    socket,
    isConnected,
    connectionStatus,
    sendMessage,
    messages,
    reconnect,
    lastActivity,
  } = useWebSocket(userId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('navihire_token');
    localStorage.removeItem('navihire_user');
    setIsDropdownOpen(false);
    onLogout();
  };

  const getInitials = (name: string) => {
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return 'NA';
    }

    const words = name.trim().split(' ').filter(word => word.length > 0);

    if (words.length === 0) {
      return 'NA';
    }

    return words
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-content">
          {/* Logo Section - Left Side */}
          <div className="header-logo-section">
            <img
              className="header-logo"
              src="/images/navihire-logo.svg"
              alt="NaviHire"
            />
          </div>

          {/* Right Side - Connection Status & User Menu */}
          <div className="header-right-section">
            {/* Connection Status */}
            <div className="header-connection-status">
              <ConnectionStatus
                status={connectionStatus}
                onReconnect={reconnect}
                lastActivity={lastActivity}
              />
            </div>

            {/* User Menu */}
            <div className="header-user-menu" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="user-menu-button"
              >
                {/* User Avatar */}
                <div className="user-avatar-container">
                  {user.avatar ? (
                    <img
                      className="user-avatar"
                      src={user.avatar}
                      alt={user.name}
                    />
                  ) : (
                    <div className="user-avatar-initials">
                      {getInitials(user?.name || user?.email || 'User')}
                    </div>
                  )}
                  {/* Online indicator */}
                  <div className="online-indicator"></div>
                </div>

                {/* User Info */}
                <div className="user-info">
                  <div className="user-name">{user.name}</div>
                  <div className="user-email">{user.email}</div>
                </div>

                {/* Dropdown Arrow */}
                <svg
                  className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="dropdown-menu">
                  {/* User Info in Dropdown (Mobile) */}
                  <div className="dropdown-mobile-user-info">
                    <div className="dropdown-mobile-name">{user.name}</div>
                    <div className="dropdown-mobile-email">{user.email}</div>
                  </div>

                  {/* Menu Items */}
                  <div className="dropdown-menu-section">
                    <button className="dropdown-menu-item">
                      <svg className="dropdown-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profile
                    </button>

                    <button className="dropdown-menu-item">
                      <svg className="dropdown-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Settings
                    </button>

                    <button className="dropdown-menu-item">
                      <svg className="dropdown-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Help & Support
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="dropdown-divider"></div>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="dropdown-menu-item logout"
                  >
                    <svg className="dropdown-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
