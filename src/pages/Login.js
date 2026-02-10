import React, { useState } from 'react';
import '../styles/Login.css';

function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === '123') {
      onLogin();
    } else {
      setError('Şifre yanlış!');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="logo">WORKCONCEPT</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Şifre Gir"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="password-input"
          />
          {error && <p className="error">{error}</p>}
          <button type="submit" className="login-btn">Giriş Yap</button>
        </form>
      </div>
    </div>
  );
}

export default Login;