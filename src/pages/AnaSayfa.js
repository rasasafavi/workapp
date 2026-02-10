import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getWeekDates } from '../utils/weekHelpers';
import '../styles/AnaSayfa.css';
import { database } from '../firebase-config';
import { ref, onValue, set, get } from 'firebase/database';

function AnaSayfa() {
  const [orders, setOrders] = useState([]);
  const [showWeekMenu, setShowWeekMenu] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 20;

  useEffect(() => {
    fetchOrders();
  }, []);

  // Siparişin hangi haftada olduğunu ve güncel durumunu bul
  const getOrderWeekAndStatus = async (evrakNo) => {
    for (let week = 1; week <= 4; week++) {
      const weekRef = ref(database, `haftalar/week_${week}`);
      const snapshot = await get(weekRef);
      
      if (snapshot.exists()) {
        const weekData = snapshot.val();
        const orderInWeek = Object.values(weekData).find(o => o.EVRAKNO === evrakNo);
        
        if (orderInWeek) {
          return {
            week: week,
            durum: orderInWeek.DURUMU || 'BEKLEMEDE'
          };
        }
      }
    }
    return null;
  };

const fetchOrders = async () => {
  const ordersRef = ref(database, 'siparisler');
  const snapshot = await get(ordersRef);
  
  const data = snapshot.val();
  if (data) {
    const ordersArray = Object.values(data);
    
    // Her siparişin hafta ve durum bilgisini al
   const ordersWithWeek = await Promise.all(
  ordersArray.map(async (order) => {
    const weekInfo = await getOrderWeekAndStatus(order.EVRAKNO);
    return {
      ...order,
      weekNumber: weekInfo?.week,
      guncelDurum: weekInfo?.durum || order.DURUMU
    };
  })
);

// Tekrarlı siparişleri temizle (EVRAKNO'ya göre)
const uniqueOrders = ordersWithWeek.filter((order, index, self) =>
  index === self.findIndex((o) => o.EVRAKNO === order.EVRAKNO)
);

setOrders(uniqueOrders);
  } else {
    setOrders([]);
  }
};

const handleAddToWeek = async (order, week) => {
  const weekRef = ref(database, `haftalar/week_${week}`);
  const snapshot = await get(weekRef);
  const weekData = snapshot.exists() ? snapshot.val() : {};
  
  const exists = Object.values(weekData).find(o => o.EVRAKNO === order.EVRAKNO);
  if (exists) {
    setShowWeekMenu(null);
    return;
  }
  
  const weekDates = getWeekDates(week - 1);
  const weekEndDate = weekDates.bitis.toISOString().split('T')[0];
  
  // Sadece Excel'den gelen alanları al (weekNumber ve guncelDurum hariç)
  const cleanOrder = {
    SEHIR: order.SEHIR,
    TARIH: order.TARIH || weekEndDate,
    EVRAKNO: order.EVRAKNO,
    CARIADI: order.CARIADI || order['CARİADI'],
    STK: order.STK,
    STA: order.STA,
    ACIKLAMA: order.ACIKLAMA,
    AYAK_BILGISI: order.AYAK_BILGISI,
    MIKTAR: order.MIKTAR,
    STB: order.STB,
    DURUMU: order.DURUMU || 'BEKLEMEDE',
    week: week,
    addedDate: new Date().toISOString()
  };
  
  const newOrderKey = `order_${Date.now()}`;
  await set(ref(database, `haftalar/week_${week}/${newOrderKey}`), cleanOrder);
  
  setShowWeekMenu(null);
};

  // Arama filtresi
  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    return (
      (order.STK || '').toLowerCase().includes(search) ||
      (order.STA || '').toLowerCase().includes(search) ||
      (order.CARIADI || '').toLowerCase().includes(search) ||
      (order.EVRAKNO || '').toLowerCase().includes(search) ||
      (order.SEHIR || '').toLowerCase().includes(search)
    );
  });

  // Sayfalama hesaplamaları
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  return (
    <div className="ana-sayfa">
      <div className="page-header">
        <h1>ANA SAYFA - EXCEL</h1>
        <div className="header-controls">
          <input 
            type="text"
            placeholder="🔍 STK, STA, CARİADI, EVRAKNO, ŞEHİR Ara..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="refresh-btn" onClick={fetchOrders}>🔄 Yenile</button>
        </div>
      </div>

      <div className="table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th></th>
              <th>SEHIR</th>
              <th>TARIH</th>
              <th>EVRAKNO</th>
              <th>CARIADI</th>
              <th>STK</th>
              <th>STA</th>
              <th>ACIKLAMA</th>
              <th>AYAK_BİLGİSİ</th>
              <th>MIKTAR</th>
              <th>STB</th>
              <th>DURUMU</th>
            </tr>
          </thead>
          <tbody>
            {currentOrders.map((order, index) => (
              <tr key={indexOfFirstOrder + index}>
                <td>
                  <button 
                    className="add-btn"
                    onClick={() => setShowWeekMenu(showWeekMenu === (indexOfFirstOrder + index) ? null : (indexOfFirstOrder + index))}
                  >
                    ➕
                  </button>
                  {showWeekMenu === (indexOfFirstOrder + index) && (
                    <div className="week-menu">
                      <div className="week-option" onClick={() => handleAddToWeek(order, 1)}>1. Hafta</div>
                      <div className="week-option" onClick={() => handleAddToWeek(order, 2)}>2. Hafta</div>
                      <div className="week-option" onClick={() => handleAddToWeek(order, 3)}>3. Hafta</div>
                      <div className="week-option" onClick={() => handleAddToWeek(order, 4)}>4. Hafta</div>
                    </div>
                  )}
                </td>
                <td>{order.SEHIR || '-'}</td>
                <td>{order.TARIH || '-'}</td>
                <td>{order.EVRAKNO || '-'}</td>
                <td>{order.CARIADI || order['CARİADI'] || '-'}</td>
                <td>{order.STK || '-'}</td>
                <td>{order.STA || '-'}</td>
                <td>{order.ACIKLAMA || '-'}</td>
                <td>{order.AYAK_BILGISI || '-'}</td>
                <td>{order.MIKTAR || '-'}</td>
                <td>{order.STB || '-'}</td>
                <td>
                  {order.weekNumber && (
                    <span style={{
                      display: 'block',
                      fontSize: '11px',
                      color: '#666',
                      marginBottom: '4px'
                    }}>
                      {order.weekNumber}. Hafta
                    </span>
                  )}
                  <span style={{
                    padding: '4px 8px',
                    background: order.guncelDurum !== (order.DURUMU || 'BEKLEMEDE') ? '#4caf50' : '#999',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {order.guncelDurum || '-'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sayfalama */}
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
    </div>
  );
}

export default AnaSayfa;