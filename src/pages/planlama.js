import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { moveDelayedOrders } from '../utils/weekHelpers';
import '../styles/Planlama.css';
import { database } from '../firebase-config';
import { ref, get } from 'firebase/database';

function Planlama() {
  const navigate = useNavigate();
const [stats, setStats] = useState({
  toplam: 0,
  geciken: 0,
  uretimde: 0,
  tamamlanmis: 0,
  pakette: 0
});
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const handleMount = async () => {
      const movedCount = await moveDelayedOrders();
      if (movedCount > 0) {
        console.log(`✅ ${movedCount} gecikmiş sipariş sonraki haftaya taşındı`);
      }
      calculateStats();
    };
    
    handleMount();
  }, [startDate, endDate]);

  const calculateStats = async () => {
    try {
      // 1. TOPLAM SİPARİŞ: Firebase'den al
      const ordersRef = ref(database, 'siparisler');
      const ordersSnapshot = await get(ordersRef);
      
      let toplamSiparis = 0;
      if (ordersSnapshot.exists()) {
        const allOrders = Object.values(ordersSnapshot.val());
        
        // TARİH FİLTRESİ UYGULA
        let filteredOrders = allOrders;
        if (startDate || endDate) {
          filteredOrders = allOrders.filter(order => {
            const tarih = order.TARIH;
            if (!tarih) return true;
            
            if (startDate && endDate) {
              return tarih >= startDate && tarih <= endDate;
            }
            if (startDate) return tarih >= startDate;
            if (endDate) return tarih <= endDate;
            return true;
          });
        }
        
        toplamSiparis = filteredOrders.length;
      }

      // 2. HAFTALARDAKI SİPARİŞLERİ TOPLA
      let gecikenSayisi = 0;
      let uretimdeSayisi = 0;
      let tamamlanmisSayisi = 0;
      let paketteSayisi = 0;

      const bugun = new Date();
      const uretimDurumlari = ['DEMİRHANEDE', 'İSKELETHANEDE','SÜNGER', 'BOYADA', 'KESİMDE', 'DİKİMDE', 'DÖŞEME','PAKETTE'];

      for (let week = 1; week <= 4; week++) {
        const weekRef = ref(database, `haftalar/week_${week}`);
        const weekSnapshot = await get(weekRef);
        const weekData = weekSnapshot.exists() ? Object.values(weekSnapshot.val()) : [];
        
        weekData.forEach(order => {
          const durum = order.DURUMU || 'BEKLEMEDE';
          
      // GEÇİKEN: Tarihten 15 gün geçmiş + BEKLEMEDE
if (order.TARIH && (durum === 'BEKLEMEDE' || durum === 'Bekliyor' || !durum)) {
  const orderDate = new Date(order.TARIH);
  const gunFarki = Math.floor((bugun - orderDate) / (1000 * 60 * 60 * 24));
  
  if (gunFarki > 15) {
    gecikenSayisi++;
  }
}
          
          // ÜRETİMDE
          if (uretimDurumlari.includes(durum)) {
            uretimdeSayisi++;
          }
          
          // TAMAMLANMIŞ
          if (durum === 'SEVK EDİLDİ') {
            tamamlanmisSayisi++;
          }
          // PAKETTE
if (durum === 'PAKETTE') {
  paketteSayisi++;
}
        });
      }

      setStats({
        toplam: toplamSiparis,
        geciken: gecikenSayisi,
        uretimde: uretimdeSayisi,
        tamamlanmis: tamamlanmisSayisi,
        pakette: paketteSayisi
      });

    } catch (error) {
      console.error('İstatistik hesaplama hatası:', error);
    }
  };

  const handleWeekClick = (weekNumber) => {
    navigate(`/planlama/hafta/${weekNumber}`);
  };

const handleCardClick = (cardType) => {
  if (cardType === 'geciken') {
    navigate('/planlama/geciken');
  } else if (cardType === 'uretimde') {
    navigate('/planlama/uretimde');
  } else if (cardType === 'pakette') {
    navigate('/planlama/pakette');
  }
};

  return (
    <div className="planlama">
      <div className="page-header">
        <h1>PLANLAMA</h1>
      </div>

      {/* Hafta Butonları */}
      <div className="week-buttons">
        <button className="week-btn" onClick={() => handleWeekClick(1)}>1. Hafta</button>
        <button className="week-btn" onClick={() => handleWeekClick(2)}>2. Hafta</button>
        <button className="week-btn" onClick={() => handleWeekClick(3)}>3. Hafta</button>
        <button className="week-btn" onClick={() => handleWeekClick(4)}>4. Hafta</button>
      </div>

      {/* Kartlar ve Tarih Filtresi */}
      <div className="stats-container">
        <div className="stats-grid">
          <div className="stat-card">
  <div className="stat-label">TOPLAM SİPARİŞ</div>
  <div className="stat-number">{stats.toplam}</div>
</div>

<div className="stat-card clickable" onClick={() => handleCardClick('geciken')}>
  <div className="stat-label">GEÇİKEN</div>
  <div className="stat-number">{stats.geciken}</div>
</div>

<div className="stat-card clickable" onClick={() => handleCardClick('uretimde')}>
  <div className="stat-label">ÜRETİMDE</div>
  <div className="stat-number">{stats.uretimde}</div>
</div>

<div className="stat-card">
  <div className="stat-label">TAMAMLANMIŞ</div>
  <div className="stat-number">{stats.tamamlanmis}</div>
</div>
        </div>

        <div className="date-filters">
          <div className="date-group">
            <label>Tarih Başlangıcı</label>
            <input 
              type="date" 
              className="date-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="date-group">
            <label>Tarih Bitişi</label>
            <input 
              type="date" 
              className="date-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          
  <div className="pakette-card clickable" onClick={() => handleCardClick('pakette')}>
    <div className="stat-label">PAKETTE</div>
    <div className="stat-number">{stats.pakette}</div>
  </div>
</div>
        </div>
      </div>
  
  );
}

export default Planlama;