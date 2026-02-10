import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { database } from '../firebase-config';
import { ref, get } from 'firebase/database';
import '../styles/Geciken.css';

function Geciken() {
  const navigate = useNavigate();
  const [gecikenSiparisler, setGecikenSiparisler] = useState([]);

  useEffect(() => {
    fetchGecikenSiparisler();
  }, []);

  const fetchGecikenSiparisler = async () => {
    const bugun = new Date();
    const allGeciken = [];

    for (let week = 1; week <= 4; week++) {
      const weekRef = ref(database, `haftalar/week_${week}`);
      const weekSnapshot = await get(weekRef);
      
      if (weekSnapshot.exists()) {
        const weekData = Object.values(weekSnapshot.val());
        
        weekData.forEach(order => {
          const durum = order.DURUMU || 'BEKLEMEDE';
          
          if (order.TARIH && (durum === 'BEKLEMEDE' || durum === 'Bekliyor' || !durum)) {
            const orderDate = new Date(order.TARIH);
            const gunFarki = Math.floor((bugun - orderDate) / (1000 * 60 * 60 * 24));
            
            if (gunFarki > 15) {
              allGeciken.push({...order, gunFarki, week});
            }
          }
        });
      }
    }

    setGecikenSiparisler(allGeciken);
  };

  return (
    <div className="geciken-page">
      <div className="page-header">
        <h1>GEÇİKEN SİPARİŞLER</h1>
        <button className="btn-secondary" onClick={() => navigate('/planlama')}>
          ← Geri Dön
        </button>
      </div>

      <div className="table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>HAFTA</th>
              <th>TARİH</th>
              <th>GÜN FARKI</th>
              <th>EVRAKNO</th>
              <th>CARİADI</th>
              <th>STK</th>
              <th>STA</th>
              <th>MİKTAR</th>
              <th>DURUM</th>
            </tr>
          </thead>
          <tbody>
            {gecikenSiparisler.length === 0 ? (
              <tr>
                <td colSpan="9" style={{textAlign: 'center', padding: '40px'}}>
                  Geciken sipariş yok! 🎉
                </td>
              </tr>
            ) : (
              gecikenSiparisler.map((order, index) => (
                <tr key={index}>
                  <td>{order.week}. Hafta</td>
                  <td>{order.TARIH}</td>
                  <td style={{color: '#d32f2f', fontWeight: 'bold'}}>{order.gunFarki} gün</td>
                  <td>{order.EVRAKNO}</td>
                  <td>{order.CARIADI}</td>
                  <td>{order.STK}</td>
                  <td>{order.STA}</td>
                  <td>{order.MIKTAR}</td>
                  <td>{order.DURUMU || 'BEKLEMEDE'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Geciken;