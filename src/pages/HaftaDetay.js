import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatWeekDate } from '../utils/weekHelpers';
import '../styles/HaftaDetay.css';
import { database } from '../firebase-config';
import { ref, onValue, set, get, update, remove } from 'firebase/database';

function HaftaDetay() {
  const { weekNumber } = useParams();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [showStatusMenu, setShowStatusMenu] = useState(null);
  const [showStagesMenu, setShowStagesMenu] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterAyak, setFilterAyak] = useState('');
  const [showCityFilter, setShowCityFilter] = useState(false);
  const [showAyakFilter, setShowAyakFilter] = useState(false);

  const statusOptions = ['BEKLEMEDE', 'ÜRETİMDE', 'PAKETTE','SEVK EDİLDİ'];

  const allStages = [
    'DEMİRHANEDE',
    'İSKELETHANEDE',
    'SÜNGER',
    'BOYADA',
    'KESİMDE',
    'DİKİMDE',
    'DÖŞEME',
    'PAKETTE'
  ];

  useEffect(() => {
    fetchWeekOrders();
  }, [weekNumber]);

  const fetchWeekOrders = () => {
    const weekRef = ref(database, `haftalar/week_${weekNumber}`);
    onValue(weekRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const ordersArray = Object.values(data);
        setOrders(ordersArray);
      } else {
        setOrders([]);
      }
    });
  };

  const handleRemoveFromWeek = async (order) => {
    const weekRef = ref(database, `haftalar/week_${weekNumber}`);
    const snapshot = await get(weekRef);
    
    if (snapshot.exists()) {
      const weekData = snapshot.val();
      const orderKey = Object.keys(weekData).find(key => weekData[key].EVRAKNO === order.EVRAKNO);
      
      if (orderKey) {
        await remove(ref(database, `haftalar/week_${weekNumber}/${orderKey}`));
      }
    }
  };

  const handleToggleStage = async (order, stage) => {
    const weekRef = ref(database, `haftalar/week_${weekNumber}`);
    const snapshot = await get(weekRef);
    
    if (!snapshot.exists()) return;
    
    const weekData = snapshot.val();
    const orderKey = Object.keys(weekData).find(key => weekData[key].EVRAKNO === order.EVRAKNO);
    
    if (!orderKey) return;
    
    const currentStages = weekData[orderKey].completedStages || {};
    
    const newStages = {
      ...currentStages,
      [stage]: !currentStages[stage]
    };
    
    await update(ref(database, `haftalar/week_${weekNumber}/${orderKey}`), {
      completedStages: newStages
    });
    
    fetchWeekOrders();
  };

  const handleStatusChange = async (order, status) => {
    console.log('🔄 Durum değiştiriliyor:', order.EVRAKNO, 'Yeni durum:', status);
    let isStockInsufficient = false;
    const weekRef = ref(database, `haftalar/week_${weekNumber}`);
    const snapshot = await get(weekRef);
    
    if (!snapshot.exists()) return;
    
    const weekData = snapshot.val();
    const orderKey = Object.keys(weekData).find(key => weekData[key].EVRAKNO === order.EVRAKNO);
    
    if (!orderKey) return;
    
    const oldOrder = weekData[orderKey];
    const oldStatus = oldOrder.DURUMU || 'BEKLEMEDE';
    
    console.log('📋 Eski durum:', oldStatus);
    
    if ((oldStatus === 'BEKLEMEDE' || oldStatus === 'Bekliyor' || !oldStatus) && status !== 'BEKLEMEDE' && status !== 'Bekliyor') {
      const stk = order.STK;
      const miktar = parseInt(order.MIKTAR) || 0;
      
      console.log('🔍 Stok kontrol:', 'STK:', stk, 'Miktar:', miktar);
      
      if (stk && miktar > 0) {
        const stockRef = ref(database, 'stoklar');
        const stockSnapshot = await get(stockRef);
        
        if (stockSnapshot.exists()) {
          const stockData = stockSnapshot.val();
          const stockKey = Object.keys(stockData).find(key => stockData[key].STK === stk);
          
          if (!stockKey) {
            alert(`⚠️ STOK YETERSİZ!\n\n"${stk}" stokta bulunamadı!\nLütfen önce Fabrika Stok'a ekleyin.\n\nSipariş yine de durumu değiştirilecek ama KIRMIZI işaretlenecek!`);
            isStockInsufficient = true;
          } else {
            const currentStock = parseInt(stockData[stockKey].URUN_ADET) || 0;
            
            if (currentStock < miktar) {
              alert(`⚠️ STOK YETERSİZ!\n\nÜrün: ${stk}\nGerekli: ${miktar} adet\nMevcut Stok: ${currentStock} adet\n\nEksik: ${miktar - currentStock} adet\n\nSipariş yine de durumu değiştirilecek ama KIRMIZI işaretlenecek!`);
              isStockInsufficient = true;
            } else {
              const newStock = Math.max(0, currentStock - miktar);
              await update(ref(database, `stoklar/${stockKey}`), {
                URUN_ADET: newStock
              });
              console.log(`✅ Stok düştü: ${stk} | Eski: ${currentStock} → Yeni: ${newStock}`);
            }
          }
        }
      }
    }
    
    await update(ref(database, `haftalar/week_${weekNumber}/${orderKey}`), {
      DURUMU: status,
      stokYetersiz: isStockInsufficient
    });
    
    if (status === 'SEVK EDİLDİ') {
      const arsivRef = ref(database, 'arsiv');
      const arsivSnapshot = await get(arsivRef);
      const arsivData = arsivSnapshot.exists() ? arsivSnapshot.val() : {};
      
      const exists = Object.values(arsivData).find(o => o.EVRAKNO === order.EVRAKNO);
      
      if (!exists) {
        const newArsivKey = `arsiv_${Date.now()}`;
        await set(ref(database, `arsiv/${newArsivKey}`), {
          ...order,
          DURUMU: status
        });
        console.log('📁 Arşive eklendi:', order.EVRAKNO);
      }
    }
    
    setShowStatusMenu(null);
  };

  const handleExport = () => {
    if (orders.length === 0) {
      alert('Bu haftada sipariş yok!');
      return;
    }
    window.print();
  };

  // Filtreleme
  const filteredOrders = orders.filter(order => {
    // Arama
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matches = (
        (order.CARIADI || '').toLowerCase().includes(search) ||
        (order.EVRAKNO || '').toLowerCase().includes(search) ||
        (order.STA || '').toLowerCase().includes(search)
      );
      if (!matches) return false;
    }
    
    // Şehir filtresi
    if (filterCity && order.SEHIR !== filterCity) return false;
    
    // Ayak filtresi
    if (filterAyak && order.AYAK_BILGISI !== filterAyak) return false;
    
    return true;
  });

  // Unique şehirler ve ayaklar
  const uniqueCities = [...new Set(orders.map(o => o.SEHIR).filter(Boolean))].sort();
  const uniqueAyaklar = [...new Set(orders.map(o => o.AYAK_BILGISI).filter(Boolean))].sort();

  return (
    <div className="hafta-detay">
      <div className="page-header">
        <h1>{weekNumber}. Hafta ({formatWeekDate(parseInt(weekNumber))})</h1>
        <div className="header-buttons">
          <button className="btn-secondary" onClick={() => navigate('/planlama')}>
            ← Geri Dön
          </button>
          <button className="btn-primary" onClick={() => navigate('/ana-sayfa')}>
            + Sipariş Ekle
          </button>
          <button className="btn-export" onClick={handleExport}>
            📄 Çıktı Al
          </button>
        </div>
      </div>

      <div className="search-container">
        <input 
          type="text"
          placeholder="🔍 CARİADI, EVRAKNO, STA Ara..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th></th>
              <th>
                ŞEHİR
                <button 
                  className="filter-icon-btn"
                  onClick={() => setShowCityFilter(!showCityFilter)}
                >
                  🔽
                </button>
                {showCityFilter && (
                  <div className="mini-filter-menu">
                    <div className="mini-filter-option" onClick={() => { setFilterCity(''); setShowCityFilter(false); }}>
                      Tümü
                    </div>
                    {uniqueCities.map(city => (
                      <div 
                        key={city}
                        className="mini-filter-option"
                        onClick={() => { setFilterCity(city); setShowCityFilter(false); }}
                      >
                        {city}
                      </div>
                    ))}
                  </div>
                )}
              </th>
              <th>TARİH</th>
              <th>EVRAKNO</th>
              <th>CARİADI</th>
              <th>STK</th>
              <th>STA</th>
              <th>AÇIKLAMA</th>
              <th>
                AYAK BİLGİSİ
                <button 
                  className="filter-icon-btn"
                  onClick={() => setShowAyakFilter(!showAyakFilter)}
                >
                  🔽
                </button>
                {showAyakFilter && (
                  <div className="mini-filter-menu">
                    <div className="mini-filter-option" onClick={() => { setFilterAyak(''); setShowAyakFilter(false); }}>
                      Tümü
                    </div>
                    {uniqueAyaklar.map(ayak => (
                      <div 
                        key={ayak}
                        className="mini-filter-option"
                        onClick={() => { setFilterAyak(ayak); setShowAyakFilter(false); }}
                      >
                        {ayak}
                      </div>
                    ))}
                  </div>
                )}
              </th>
              <th>MİKTAR</th>
              <th>STB</th>
              <th>DURUM</th>
              <th>ÜRETİM DURUMU</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="13" style={{textAlign: 'center', padding: '40px', color: '#999'}}>
                  {orders.length === 0 ? 'Bu haftaya henüz sipariş eklenmemiş' : 'Filtre sonucu bulunamadı'}
                </td>
              </tr>
            ) : (
              filteredOrders.map((order, index) => (
                <tr key={index} className={`${order.gecikme ? 'delayed-row' : ''} ${order.stokYetersiz ? 'stock-insufficient-row' : ''}`}>
                  <td>
                    <button 
                      className="remove-btn"
                      onClick={() => handleRemoveFromWeek(order)}
                      title="Haftadan Çıkar"
                    >
                      ➖
                    </button>
                  </td>
                  <td>
                    {order.SEHIR || '-'}
                    {order.gecikme && <span className="delayed-badge">🔴 GECİKEN</span>}
                  </td>
                  <td>{order.TARIH || '-'}</td>
                  <td>{order.EVRAKNO || '-'}</td>
                  <td>{order.CARIADI || '-'}</td>
                  <td>{order.STK || '-'}</td>
                  <td>{order.STA || '-'}</td>
                  <td>{order.ACIKLAMA || '-'}</td>
                  <td>{order.AYAK_BILGISI || '-'}</td>
                  <td>{order.MIKTAR || '-'}</td>
                  <td>{order.STB || '-'}</td>
                  <td>
                    <div className="status-cell">
                      <span className="status-text">{order.DURUMU || 'BEKLEMEDE'}</span>
                      <button 
                        className="status-btn"
                        onClick={() => setShowStatusMenu(showStatusMenu === index ? null : index)}
                      >
                        D
                      </button>
                      {showStatusMenu === index && (
                        <div className="status-menu">
                          {statusOptions.map((status) => (
                            <div 
                              key={status}
                              className="status-option"
                              onClick={() => handleStatusChange(order, status)}
                            >
                              {status}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="status-cell">
                      <button 
                        className="stages-btn"
                        onClick={() => setShowStagesMenu(showStagesMenu === index ? null : index)}
                      >
                        ⚙
                      </button>
                      {showStagesMenu === index && (
                        <div className="stages-menu">
                          <div className="stages-header">Tamamlanan Aşamalar:</div>
                          {allStages.map((stage) => (
                            <div 
                              key={stage}
                              className="stage-option"
                              onClick={() => handleToggleStage(order, stage)}
                            >
                              <span className={order.completedStages?.[stage] ? 'checkbox checked' : 'checkbox'}>
                                {order.completedStages?.[stage] ? '✓' : ''}
                              </span>
                              {stage}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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

export default HaftaDetay;