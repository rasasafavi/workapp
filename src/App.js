import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/layout';
import AnaSayfa from './pages/AnaSayfa';
import Planlama from './pages/planlama';
import HaftaDetay from './pages/HaftaDetay';
import FabrikaStok from './pages/Fabrikastok';
import UrunDetay from './pages/UrunDetay';
import Bayiler from './pages/Bayiler';
import Geciken from './pages/Geciken';
import Uretimde from './pages/Uretimde';
import BayiDetay from './pages/BayiDetay';
import Arsiv from './pages/Arsiv';
import Pakette from './pages/Pakette';

import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/ana-sayfa" />} />
          <Route path="/ana-sayfa" element={<AnaSayfa />} />
          <Route path="/planlama" element={<Planlama />} />
          <Route path="/planlama/geciken" element={<Geciken />} />
<Route path="/planlama/uretimde" element={<Uretimde />} />
<Route path="/planlama/pakette" element={<Pakette />} />
          <Route path="/planlama/hafta/:weekNumber" element={<HaftaDetay />} />
         <Route path="/fabrika-stok" element={<FabrikaStok />} />
          <Route path="/urun-detay" element={<UrunDetay />} />
         <Route path="/bayiler" element={<Bayiler />} />
        <Route path="/bayiler/:bayiAdi" element={<BayiDetay />} />
          <Route path="/arsiv" element={<Arsiv />} />
          
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;