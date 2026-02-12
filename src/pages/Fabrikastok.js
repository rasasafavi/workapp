import React, { useState, useEffect } from 'react';
import '../styles/FabrikaStok.css';
import { database } from '../firebase-config';
import { ref, onValue, set, get, update, remove } from 'firebase/database';

function FabrikaStok() {
  const [stocks, setStocks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newRows, setNewRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
const stocksPerPage = 20;

  useEffect(() => {
    loadStocks();
  }, []);
const handleStockUpdate = async (stk, newValue) => {
  const stockRef = ref(database, 'stoklar');
  const snapshot = await get(stockRef);
  
  if (snapshot.exists()) {
    const stockData = snapshot.val();
    const stockKey = Object.keys(stockData).find(key => stockData[key].STK === stk);
    
    if (stockKey) {
      await update(ref(database, `stoklar/${stockKey}`), {
        URUN_ADET: newValue
      });
    }
  }
};

const loadStocks = () => {
  const stockRef = ref(database, 'stoklar');
  onValue(stockRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const stocksArray = Object.values(data).sort((a, b) => {
        const stkA = (a.STK || '').toLowerCase();
        const stkB = (b.STK || '').toLowerCase();
        return stkA.localeCompare(stkB);
      });
      setStocks(stocksArray);
    } else {
      setStocks([]);
    }
  });
};

  const handleAddStock = () => {
    setIsAdding(true);
    setNewRows([
      { URUN_ADI: '', STK: '', URUN_ADET: '' },
      { URUN_ADI: '', STK: '', URUN_ADET: '' },
      { URUN_ADI: '', STK: '', URUN_ADET: '' }
    ]);
  };

  const handleNewRowChange = (index, field, value) => {
    const updated = [...newRows];
    updated[index][field] = value;
    setNewRows(updated);
  };

const handleSaveNewRows = async () => {
  const validRows = newRows.filter(row => row.STK && row.URUN_ADET);
  
  if (validRows.length === 0) {
    alert('En az bir satır doldurun!');
    return;
  }

  const stockRef = ref(database, 'stoklar');
  const snapshot = await get(stockRef);
  const stockData = snapshot.exists() ? snapshot.val() : {};
  
  for (const newRow of validRows) {
    const existingKey = Object.keys(stockData).find(key => stockData[key].STK === newRow.STK);
    
    if (existingKey) {
      const currentStock = parseInt(stockData[existingKey].URUN_ADET || 0);
      await update(ref(database, `stoklar/${existingKey}`), {
        URUN_ADET: currentStock + parseInt(newRow.URUN_ADET || 0)
      });
    } else {
      const newStockKey = `stock_${Date.now()}`;
      await set(ref(database, `stoklar/${newStockKey}`), newRow);
    }
  }
  
  setIsAdding(false);
  setNewRows([]);
};

  const handleCancelAdd = () => {
    setIsAdding(false);
    setNewRows([]);
  };
const handleDeleteStock = async (stk) => {
  if (window.confirm(`"${stk}" stoktan silinecek. Emin misiniz?`)) {
    const stockRef = ref(database, 'stoklar');
    const snapshot = await get(stockRef);
    
    if (snapshot.exists()) {
      const stockData = snapshot.val();
      const stockKey = Object.keys(stockData).find(key => stockData[key].STK === stk);
      
      if (stockKey) {
        await remove(ref(database, `stoklar/${stockKey}`));
      }
    }
  }
};

  const filteredStocks = stocks.filter(stock =>
    stock.URUN_ADI?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.STK?.toLowerCase().includes(searchTerm.toLowerCase())
  );


// BURAYA EKLE:
// Sayfalama hesaplamaları
const indexOfLastStock = currentPage * stocksPerPage;
const indexOfFirstStock = indexOfLastStock - stocksPerPage;
const currentStocks = filteredStocks.slice(indexOfFirstStock, indexOfLastStock);
const totalPages = Math.ceil(filteredStocks.length / stocksPerPage);

  return (
    <div className="fabrika-stok">
      <div className="page-header">
        <h1>FABRİKA STOK</h1>
      </div>

      <div className="controls">
        <input
          type="text"
          placeholder="🔍 Ürün Ara..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {!isAdding && (
          <button className="add-stock-btn" onClick={handleAddStock}>
            + Stok Ekle
          </button>
        )}
      </div>

      <div className="table-container">
        <table className="stock-table">
          <thead>
  <tr>
    <th>ÜRÜN ADI</th>
    <th>STK</th>
    <th>ÜRÜN ADET</th>
    <th>İŞLEM</th>
  </tr>
</thead>
          <tbody>
            {isAdding && newRows.map((row, index) => (
              <tr key={`new-${index}`} className="new-row">
                <td>
                  <input
                    type="text"
                    placeholder="Ürün adı girin"
                    value={row.URUN_ADI}
                    onChange={(e) => handleNewRowChange(index, 'URUN_ADI', e.target.value)}
                    className="editable-input"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    placeholder="STK kodu girin"
                    value={row.STK}
                    onChange={(e) => handleNewRowChange(index, 'STK', e.target.value)}
                    className="editable-input"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    placeholder="Adet girin"
                    value={row.URUN_ADET}
                    onChange={(e) => handleNewRowChange(index, 'URUN_ADET', e.target.value)}
                    className="editable-input"
                  />
                </td>
              </tr>
            ))}
            {currentStocks.map((stock, index) => (
  <tr key={index}>
    <td>{stock.URUN_ADI || '-'}</td>
    <td>{stock.STK || '-'}</td>
    <td>
      <input
        type="number"
        value={stock.URUN_ADET || '0'}
        onChange={(e) => handleStockUpdate(stock.STK, e.target.value)}
        className="stock-edit-input"
        min="0"
      />
    </td>
    <td>
      <button 
        className="delete-stock-btn"
        onClick={() => handleDeleteStock(stock.STK)}
        title="Stoktan Sil"
      >
        🗑️
      </button>
    </td>
  </tr>
))}

            {!isAdding && currentStocks.length === 0 && (
              <tr>
                <td colSpan="3" style={{textAlign: 'center', padding: '40px', color: '#999'}}>
                  {searchTerm ? 'Ürün bulunamadı' : 'Henüz stok eklenmemiş'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    

    {/* BURAYA EKLE: */}
    {filteredStocks.length > stocksPerPage && (
      <div className="pagination">
        <button 
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="page-btn"
        >
          ← Önceki
        </button>
        
        <span className="page-info">
          Sayfa {currentPage} / {totalPages} (Toplam {filteredStocks.length} ürün)
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

  

      {isAdding && (
        <div className="action-buttons">
          <button className="save-btn" onClick={handleSaveNewRows}>
            ✓ Kaydet
          </button>
          <button className="cancel-btn" onClick={handleCancelAdd}>
            ✕ İptal
          </button>
        </div>
      )}
    </div>
  );
}

export default FabrikaStok;