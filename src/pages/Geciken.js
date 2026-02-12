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
    try {
      const ordersRef = ref(database, 'siparisler');
      const snapshot = await get(ordersRef);
      
      if (!snapshot.exists()) {
        setGecikenSiparisler([]);
        return;
      }
      
      const allOrders = Object.values(snapshot.val());
      const bugun = new Date();
      const gecikenList = [];
      
      allOrders.forEach(order => {
        const durum = order.DURUMU || 'BEKLEMEDE';
        
        // Sadece BEKLEMEDE olanları kontrol et
        if (durum === 'BEKLEMEDE' || durum === 'Bekliyor' || durum === '') {
          const tarihStr = (order.TARIH || '').toString().split(' ')[0];
          
          if (tarihStr.includes('.') || tarihStr.includes('/')) {
  const parts = tarihStr.split(/[./]/); // Nokta veya slash ile ayır
  if (parts.length === 3) {
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const year = parseInt(parts[2]); // 2026 gibi zaten 4 haneli
    
    const orderDate = new Date(year, month, day);
              const gunFarki = Math.floor((bugun - orderDate) / (1000 * 60 * 60 * 24));
              
              if (gunFarki > 15) {
                gecikenList.push({
                  ...order,
                  gunFarki: gunFarki
                });
              }
            }
          }
        }
      });
      
      setGecikenSiparisler(gecikenList);
    } catch (error) {
      console.error('Geciken siparişler yüklenirken hata:', error);
      setGecikenSiparisler([]);
    }
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
              <th>TARİH</th>
              <th>GÜN FARKI</th>
              <th>EVRAKNO</th>
              <th>CARİADI</th>
              <th>STK</th>
              <th>STA</th>
              <th>ŞEHİR</th>
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
                  <td>{order.TARIH}</td>
                  <td style={{color: '#d32f2f', fontWeight: 'bold'}}>{order.gunFarki} gün</td>
                  <td>{order.EVRAKNO}</td>
                  <td>{order.CARIADI}</td>
                  <td>{order.STK}</td>
                  <td>{order.STA}</td>
                  <td>{order.SEHIR || '-'}</td>
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