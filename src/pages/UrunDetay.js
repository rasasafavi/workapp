import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/UrunDetay.css';
import { database } from '../firebase-config';
import { ref, onValue } from 'firebase/database';

function UrunDetay() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 20;

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = () => {
  const ordersRef = ref(database, 'siparisler');
  onValue(ordersRef, (snapshot) => {
    const data = snapshot.val();
    
    if (data) {
      const orders = Object.values(data);
      const productMap = {};

      orders.forEach(order => {
        const sta = order.STA;
        const stk = order.STK;
        const miktar = parseInt(order.MIKTAR) || 0;

        if (stk) {
          const key = stk;
          if (productMap[key]) {
            productMap[key].ADET += miktar;
          } else {
            productMap[key] = {
              STA: sta,
              STK: stk,
              ADET: miktar
            };
          }
        }
      });

      const productList = Object.values(productMap).sort((a, b) => {
        const staA = (a.STA || '').toLowerCase();
        const staB = (b.STA || '').toLowerCase();
        return staA.localeCompare(staB);
      });
      
      setProducts(productList);
    } else {
      setProducts([]);
    }
  });
};

  const filteredProducts = products.filter(product =>
    product.STA?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.STK?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sayfalama hesaplamaları
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  return (
    <div className="urun-detay">
      <div className="page-header">
        <h1>ÜRÜN DETAY</h1>
      </div>

      <div className="content-wrapper">
        <div className="search-container">
          <input
            type="text"
            placeholder="🔍 Ürün Ara..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="table-container">
          <table className="product-table">
            <thead>
              <tr>
                <th>STA</th>
                <th>STK</th>
                <th>ADET</th>
              </tr>
            </thead>
            <tbody>
              {currentProducts.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{textAlign: 'center', padding: '40px', color: '#999'}}>
                    {searchTerm ? 'Ürün bulunamadı' : 'Henüz sipariş yok'}
                  </td>
                </tr>
              ) : (
                currentProducts.map((product, index) => (
                  <tr key={index}>
                    <td>{product.STA || '-'}</td>
                    <td>{product.STK || '-'}</td>
                    <td>{product.ADET}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredProducts.length > productsPerPage && (
          <div className="pagination">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="page-btn"
            >
              ← Önceki
            </button>
            
            <span className="page-info">
              Sayfa {currentPage} / {totalPages}
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

        <div className="total-info">
          Toplam {filteredProducts.length} farklı ürün
        </div>
      </div>
    </div>
  );
}

export default UrunDetay;