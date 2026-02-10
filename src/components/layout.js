import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Layout.css';

function Layout({ children }) {
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/ana-sayfa') return 'ANA SAYFA';
    if (path === '/planlama') return 'PLANLAMA';
    if (path.includes('/planlama/hafta/')) return 'HAFTA DETAY';
    if (path === '/planlama/geciken') return 'GECİKEN SİPARİŞLER';
    if (path === '/planlama/uretimde') return 'ÜRETİMDEKİ SİPARİŞLER';
if (path === '/planlama/pakette') return 'PAKETTEKİ SİPARİŞLER';
    if (path === '/fabrika-stok') return 'FABRİKA STOK';
    if (path === '/urun-detay') return 'ÜRÜN DETAY';
    if (path === '/bayiler') return 'BAYİLER';
    if (path.includes('/bayiler/')) return 'BAYİ DETAY';
    if (path === '/arsiv') return 'ARŞİV';
    return '';
  };

  const menuItems = [
    { name: 'ANA SAYFA-EXCEL', path: '/ana-sayfa' },
    { name: 'PLANLAMA', path: '/planlama' },
    { name: 'FABRİKA STOK', path: '/fabrika-stok' },
    { name: 'ÜRÜN DETAY', path: '/urun-detay' },
    { name: 'BAYİLER', path: '/bayiler' },
    { name: 'ARŞİV', path: '/arsiv' }
  ];

  return (
    <div className="layout">
      <div className="sidebar">
        <h2 className="sidebar-logo">WORKCONCEPT</h2>
        <nav className="menu">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={'menu-item ' + (location.pathname === item.path ? 'active' : '')}
            >
              <span className={'dot ' + (location.pathname === item.path ? 'active' : '')}></span>
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
      <div className="main-content">
        {children}
      </div>
    </div>
  );
}

export default Layout;