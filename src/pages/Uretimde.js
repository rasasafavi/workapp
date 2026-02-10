import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { database } from '../firebase-config';
import { ref, get } from 'firebase/database';
import '../styles/Uretimde.css';

function Uretimde() {
  const navigate = useNavigate();
  const [uretimdeSiparisler, setUretimdeSiparisler] = useState([]);

  useEffect(() => {
    fetchUretimdeSiparisler();
  }, []);

  const fetchUretimdeSiparisler = async () => {
    const uretimDurumlari = ['DEMİRHANEDE', 'İSKELETHANEDE','SÜNGER' ,'BOYADA', 'KESİMDE', 'DİKİMDE', 'DÖŞEME','PAKETTE'];
    const allUretimde = [];

    for (let week = 1; week <= 4; week++) {
      const weekRef = ref(database, `haftalar/week_${week}`);
      const weekSnapshot = await get(weekRef);
      
      if (weekSnapshot.exists()) {
        const weekData = Object.values(weekSnapshot.val());
        
        weekData.forEach(order => {
          const durum = order.DURUMU || 'BEKLEMEDE';
          
          if (uretimDurumlari.includes(durum)) {
            allUretimde.push({...order, week});
          }
        });
      }
    }

    setUretimdeSiparisler(allUretimde);
  };

  return (
    <div className="uretimde-page">
      <div className="page-header">
        <h1>ÜRETİMDEKİ SİPARİŞLER</h1>
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
              <th>EVRAKNO</th>
              <th>CARİADI</th>
              <th>STK</th>
              <th>STA</th>
              <th>MİKTAR</th>
              <th>DURUM</th>
            </tr>
          </thead>
          <tbody>
            {uretimdeSiparisler.length === 0 ? (
              <tr>
                <td colSpan="8" style={{textAlign: 'center', padding: '40px'}}>
                  Üretimde sipariş yok!
                </td>
              </tr>
            ) : (
              uretimdeSiparisler.map((order, index) => (
                <tr key={index}>
                  <td>{order.week}. Hafta</td>
                  <td>{order.TARIH}</td>
                  <td>{order.EVRAKNO}</td>
                  <td>{order.CARIADI}</td>
                  <td>{order.STK}</td>
                  <td>{order.STA}</td>
                  <td>{order.MIKTAR}</td>
                  <td>
               <span style={{
  padding: '4px 8px',
  background: '#999',
  color: 'white',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: '600'
}}>
  {order.DURUMU}
</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Uretimde;