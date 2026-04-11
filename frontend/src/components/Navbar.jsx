import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const NAV = {
  ADMIN: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/facilities', label: 'Facilities' },
    { to: '/bookings', label: 'Bookings' },
    { to: '/tickets', label: 'Tickets' },
    { to: '/users', label: 'Users' },
    { to: '/map', label: 'Campus Map' },
    { to: '/chat', label: 'Chat' },
    { to: '/bookings/qr-check-in', label: 'QR Check-in' },
  ],
  USER: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/facilities', label: 'Facilities' },
    { to: '/my-bookings', label: 'My Bookings' },
    { to: '/my-tickets', label: 'My Tickets' },
    { to: '/map', label: 'Campus Map' },
    { to: '/chat', label: 'Chat' },
  ],
  TECHNICIAN: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/tickets', label: 'Tickets' },
    { to: '/facilities', label: 'Facilities' },
    { to: '/map', label: 'Campus Map' },
    { to: '/chat', label: 'Chat' },
    { to: '/bookings/qr-check-in', label: 'QR Check-in' },
  ],
};

const ROLE_LABEL = { ADMIN: 'Administrator', TECHNICIAN: 'Technician', USER: 'Student' };
const ROLE_COLOR = { ADMIN: '#e94560', TECHNICIAN: '#f5a623', USER: '#52c41a' };

const Navbar = () => {
  const { user, logout, isAuthenticated, isAdmin, isTechnician } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropRef = useRef(null);

  const role = isAdmin ? 'ADMIN' : isTechnician ? 'TECHNICIAN' : 'USER';
  const links = NAV[role] || NAV.USER;
  const roleLabel = ROLE_LABEL[role];
  const roleColor = ROLE_COLOR[role];
  const initials = `${user?.firstName?.charAt(0) ?? ''}${user?.lastName?.charAt(0) ?? ''}`.toUpperCase();

  const fetchUnreadCount = async () => {
    try {
      const res = await axios.get('/api/notifications/unread-count');
      setUnreadCount(res.data);
    } catch { /* empty */ }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      const id = setInterval(fetchUnreadCount, 5000);
      return () => clearInterval(id);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleNotificationsUpdated = () => {
      fetchUnreadCount();
    };
    
    window.addEventListener('notifications-updated', handleNotificationsUpdated);
    return () => window.removeEventListener('notifications-updated', handleNotificationsUpdated);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: '#1a1a2e',
      borderBottom: '3px solid #f5a623',
      boxShadow: '0 2px 12px rgba(0,0,0,0.22)',
      height: 'var(--nav-height, 60px)',
      display: 'flex', alignItems: 'center',
    }}>
      <div style={{
        width: '100%', maxWidth: 1400, margin: '0 auto',
        padding: '0 24px', display: 'flex', alignItems: 'center', gap: 0,
        height: '100%',
      }}>

        {/* ── Logo ── */}
        <Link to="/dashboard" style={{
          display: 'flex', alignItems: 'center',
          textDecoration: 'none', marginRight: 32, flexShrink: 0,
        }}>
          <img 
            src="/southwestern-campus-logo.png" 
            alt="Southwestern Campus Logo" 
            style={{
              height: 50,
              objectFit: 'contain'
            }}
          />
        </Link>

        {/* ── Nav Links ── */}
        {isAuthenticated && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            {links.map(({ to, label }) => {
              const active = location.pathname === to;
              return (
                <Link key={to} to={to} style={{
                  padding: '0 16px',
                  height: 'var(--nav-height, 60px)',
                  display: 'flex', alignItems: 'center',
                  textDecoration: 'none',
                  fontSize: 13, fontWeight: active ? 700 : 500,
                  color: active ? '#f5a623' : '#c5cfe0',
                  borderBottom: active ? '3px solid #f5a623' : '3px solid transparent',
                  marginBottom: -3,
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderBottom = '3px solid rgba(245,166,35,0.4)'; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.color = '#c5cfe0'; e.currentTarget.style.borderBottom = '3px solid transparent'; } }}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        )}

        {/* ── Right side ── */}
        {isAuthenticated && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>

            {/* Notifications */}
            <Link to="/notifications" style={{
              position: 'relative', width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 8, textDecoration: 'none',
              color: '#c5cfe0', transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#c5cfe0'; }}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
  {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: 4, right: 4,
                  background: '#e94560', color: '#fff',
                  fontSize: 9, fontWeight: 700, lineHeight: 1,
                  padding: '2px 4px', borderRadius: 8, minWidth: 16, textAlign: 'center',
                }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Profile Dropdown */}
            <div ref={dropRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdownOpen(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: dropdownOpen ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, padding: '5px 10px 5px 5px',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={e => { if (!dropdownOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: 6,
                  background: user?.profileImageUrl ? `url(${user.profileImageUrl}) center/cover no-repeat` : 'linear-gradient(135deg, #0f3460, #16213e)',
                  border: `2px solid ${roleColor}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, color: '#fff',
                  overflow: 'hidden',
                }}>
                  {!user?.profileImageUrl && (initials || user?.firstName?.charAt(0))}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div style={{ fontSize: 10, color: roleColor, fontWeight: 600 }}>{roleLabel}</div>
                </div>
                <svg width="12" height="12" fill="none" stroke="#a0aec0" strokeWidth="2" viewBox="0 0 24 24"
                  style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {dropdownOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  width: 240, background: '#fff', borderRadius: 10,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.18)', border: '1px solid #e8ecf0',
                  overflow: 'hidden', zIndex: 200,
                }}>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0f0f0', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 8,
                        background: user?.profileImageUrl ? `url(${user.profileImageUrl}) center/cover no-repeat` : 'linear-gradient(135deg, #0f3460, #16213e)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0,
                        overflow: 'hidden',
                      }}>
                        {!user?.profileImageUrl && initials}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#1a1a2e' }}>{user?.firstName} {user?.lastName}</div>
                        <div style={{ fontSize: 11, color: '#8896a4', marginTop: 1 }}>{user?.email}</div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                            background: roleColor + '18', color: roleColor, display: 'inline-block',
                          }}>
                            {roleLabel}
                          </span>
                          {!user?.enabled && (
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                              background: '#fff7e6', color: '#d46b08', border: '1px solid #ffd591', display: 'inline-block',
                            }}>
                              Pending Approval
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      style={{
                        width: '100%', textAlign: 'left', padding: '10px 16px',
                        display: 'flex', alignItems: 'center', gap: 8,
                        textDecoration: 'none', fontSize: 13, color: '#333', fontWeight: 500,
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      My Profile
                    </Link>
                  </div>
                  <div style={{ padding: '6px 0' }}>
                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%', textAlign: 'left', padding: '10px 16px',
                        border: 'none', background: 'transparent', cursor: 'pointer',
                        fontSize: 13, color: '#e94560', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: 8,
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fff1f0'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
