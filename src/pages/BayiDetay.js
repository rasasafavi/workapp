import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/BayiDetay.css';
import { database } from '../firebase-config';
import { ref, onValue } from 'firebase/database';

function BayiDetay() {
  const { bayiAdi } = useParams();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
 const [filterDate, setFilterDate] = useState('');
 const [currentPage, setCurrentPage] = useState(1);
const ordersPerPage = 20;

  useEffect(() => {
    fetchBayiOrders();
  }, [bayiAdi]);

const fetchBayiOrders = () => {
  const ordersRef = ref(database, 'siparisler');
  onValue(ordersRef, (snapshot) => {
    const data = snapshot.val();
    
    if (data) {
      const allOrders = Object.values(data);
      const bayiOrders = allOrders.filter(order => 
        order.CARIADI === decodeURIComponent(bayiAdi)
      );
      setOrders(bayiOrders);
    } else {
      setOrders([]);
    }
  });
};

const filteredOrders = orders.filter(order => {
  if (!filterDate) return true;
  return order.TARIH === filterDate;
});

// BURAYA EKLE:
const indexOfLastOrder = currentPage * ordersPerPage;
const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  return (
    <div className="bayi-detay">
      <div className="page-header">
        <h1>{decodeURIComponent(bayiAdi)}</h1>
        
      </div>
<div className="header-controls">
  <input 
    type="date" 
    className="date-filter"
    value={filterDate}
    onChange={(e) => setFilterDate(e.target.value)}
  />
  <button className="back-btn" onClick={() => navigate('/bayiler')}>
    ← Geri Dön
  </button>
</div>
      <div className="table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>ŞEHİR</th>
              <th>TARİH</th>
              <th>EVRAKNO</th>
              <th>STK</th>
              <th>STA</th>
              <th>AÇIKLAMA</th>
              <th>MİKTAR</th>
              <th>DURUM</th>
            </tr>
          </thead>
         <tbody>
  {currentOrders.length === 0 ? (
    <tr>
      <td colSpan="8" style={{textAlign: 'center', padding: '40px', color: '#999'}}>
        Bu bayinin siparişi bulunamadı
      </td>
    </tr>
  ) : (
    currentOrders.map((order, index) => (
                <tr key={index}>
                  <td>{order.SEHIR || '-'}</td>
                  <td>{order.TARIH || '-'}</td>
                  <td>{order.EVRAKNO || '-'}</td>
                  <td>{order.STK || '-'}</td>
                  <td>{order.STA || '-'}</td>
                  <td>{order.ACIKLAMA || '-'}</td>
                  <td>{order.MIKTAR || '-'}</td>
                  <td>
                    {order.DURUMU === 'SEVK EDİLDİ' ? (
                      <span className="arsiv-badge">Arşiv - Tamamlandı</span>
                    ) : (
                      order.DURUMU || 'BEKLEMEDE'
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {filteredOrders.length > ordersPerPage && (
      <div className="pagination">
        <button 
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="page-btn"
        >
          ← Önceki
        </button>
        
        <span className="page-info">
          Sayfa {currentPage} / {totalPages} (Toplam {filteredOrders.length} sipariş)
        </span>

        <button 
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="page-btn"
        >
          Sonraki →
        </button>
      </div>
    )}
    </div>
  );
}

export default BayiDetay;