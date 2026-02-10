import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Bayiler.css';
import { database } from '../firebase-config';
import { ref, onValue } from 'firebase/database';

function Bayiler() {
  const navigate = useNavigate();
  const [bayiler, setBayiler] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBayiler();
  }, []);

const fetchBayiler = () => {
  const ordersRef = ref(database, 'siparisler');
  onValue(ordersRef, (snapshot) => {
    const data = snapshot.val();
    
    if (data) {
      const orders = Object.values(data);
      const bayiMap = {};

      orders.forEach(order => {
        const bayiAdi = order.CARIADI;
        
        if (bayiAdi) {
          if (bayiMap[bayiAdi]) {
            bayiMap[bayiAdi].SIPARIS_SAYISI += 1;
          } else {
            bayiMap[bayiAdi] = {
              BAYI_ADI: bayiAdi,
              SIPARIS_SAYISI: 1
            };
          }
        }
      });

      const bayiList = Object.values(bayiMap).sort((a, b) => 
        a.BAYI_ADI.localeCompare(b.BAYI_ADI)
      );
      
      setBayiler(bayiList);
    } else {
      setBayiler([]);
    }
  });
};
  const handleBayiClick = (bayiAdi) => {
    navigate(`/bayiler/${encodeURIComponent(bayiAdi)}`);
  };

  const filteredBayiler = bayiler.filter(bayi =>
    bayi.BAYI_ADI?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bayiler">
      <div className="page-header">
        <h1>BAYİLER</h1>
      </div>

      <div className="content-wrapper">
        <div className="controls">
          <input
            type="text"
            placeholder="🔍 Bayi Ara..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="refresh-btn" onClick={fetchBayiler}>
            🔄 Yenile
          </button>
        </div>

        <div className="table-container">
          <table className="bayiler-table">
            <thead>
              <tr>
                <th>BAYİ ADI</th>
                <th>BAYİ SİPARİŞ</th>
              </tr>
            </thead>
            <tbody>
              {filteredBayiler.length === 0 ? (
                <tr>
                  <td colSpan="2" style={{textAlign: 'center', padding: '40px', color: '#999'}}>
                    {searchTerm ? 'Bayi bulunamadı' : 'Henüz bayi yok'}
                  </td>
                </tr>
              ) : (
                filteredBayiler.map((bayi, index) => (
                  <tr 
                    key={index} 
                    className="clickable-row"
                    onClick={() => handleBayiClick(bayi.BAYI_ADI)}
                  >
                    <td>{bayi.BAYI_ADI}</td>
                    <td>{bayi.SIPARIS_SAYISI}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Bayiler;