import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Arsiv.css';
import { database } from '../firebase-config';
import { ref, onValue, get, remove } from 'firebase/database';

function Arsiv() {
  const [archivedOrders, setArchivedOrders] = useState([]);
  const [filterDate, setFilterDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 20;

  useEffect(() => {
    fetchArchivedOrders();
  }, []);

 const fetchArchivedOrders = () => {
  const arsivRef = ref(database, 'arsiv');
  onValue(arsivRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const ordersArray = Object.values(data);
      setArchivedOrders(ordersArray);
    } else {
      setArchivedOrders([]);
    }
  });
};

const handleDelete = async (evrakNo) => {
  if (window.confirm('Bu siparişi arşivden silmek istediğinize emin misiniz?')) {
    const arsivRef = ref(database, 'arsiv');
    const snapshot = await get(arsivRef);
    
    if (snapshot.exists()) {
      const arsivData = snapshot.val();
      const orderKey = Object.keys(arsivData).find(key => arsivData[key].EVRAKNO === evrakNo);
      
      if (orderKey) {
        await remove(ref(database, `arsiv/${orderKey}`));
      }
    }
  }
};

  const filteredOrders = archivedOrders.filter(order => {
    if (!filterDate) return true;
    return order.TARIH === filterDate;
  });

  // Sayfalama
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  return (
    <div className="arsiv">
      <div className="page-header">
        <h1>ARŞİV</h1>
        <input 
          type="date" 
          className="date-filter"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />
      </div>

      <div className="table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>ŞEHİR</th>
              <th>TARİH</th>
              <th>EVRAKNO</th>
              <th>CARİADI</th>
              <th>STK</th>
              <th>STA</th>
              <th>AÇIKLAMA</th>
              <th>MİKTAR</th>
              <th>DURUM</th>
              <th>İŞLEM</th>
            </tr>
          </thead>
          <tbody>
            {currentOrders.length === 0 ? (
              <tr>
                <td colSpan="10" style={{textAlign: 'center', padding: '40px', color: '#999'}}>
                  {filterDate ? 'Bu tarihte arşiv bulunamadı' : 'Henüz arşivlenmiş sipariş yok'}
                </td>
              </tr>
            ) : (
              currentOrders.map((order, index) => (
                <tr key={index}>
                  <td>{order.SEHIR || '-'}</td>
                  <td>{order.TARIH || '-'}</td>
                  <td>{order.EVRAKNO || '-'}</td>
                  <td>{order.CARIADI || '-'}</td>
                  <td>{order.STK || '-'}</td>
                  <td>{order.STA || '-'}</td>
                  <td>{order.ACIKLAMA || '-'}</td>
                  <td>{order.MIKTAR || '-'}</td>
                  <td>
                    <span className="arsiv-badge">Arşiv - Tamamlandı</span>
                  </td>
                  <td>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDelete(order.EVRAKNO)}
                      title="Arşivden Sil"
                    >
                      🗑️
                    </button>
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

export default Arsiv;