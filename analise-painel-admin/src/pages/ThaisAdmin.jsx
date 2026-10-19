import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {api} from '../lib/api';
import './ThaisAdmin.css';

export default function ThaisAdmin() {
  const [username,setUsername] = useState('ThaisFelicio');
  const [password,setPassword] = useState('');
  const [user,setUser] = useState(null);
  const [stats,setStats] = useState(null);
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(()=>{
    api('/me').then(u=>{
      if(u.role === 'ADMIN') setUser(u);
    }).catch(()=>{});
  },[]);

  useEffect(()=>{
    if(user?.role === 'ADMIN') {
      api('/admin/stats').then(setStats).catch(()=>{});
    }
  },[user]);

  async function login(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const u = await api('/admin/login',{
        method:'POST',
        body:JSON.stringify({username,password})
      });
      setUser(u);
      setPassword('');
    } catch(e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await api('/logout',{method:'POST'});
    setUser(null);
    setStats(null);
    navigate('/thais');
  }

  if(!user) return (
    <main className="thais-admin">
      <form className="thais-admin-card" onSubmit={login}>
        <h1>Painel da Thaís</h1>
        <p>Administração do Equilíbrio Saudável</p>
        <label>Usuário</label>
        <input value={username} onChange={e=>setUsername(e.target.value)} required/>
        <label>Senha</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/>
        {error && <p className="thais-error">{error}</p>}
        <button disabled={busy}>{busy?'Entrando...':'Entrar no painel'}</button>
      </form>
    </main>
  );

  return (
    <main className="thais-admin">
      <div className="thais-admin-card thais-admin-dashboard">
        <h1>Olá, Thaís!</h1>
        <p>Administração do Equilíbrio Saudável</p>
        <div className="thais-stats">
          <div><strong>{stats?.users ?? '...'}</strong><span>Usuários</span></div>
          <div><strong>{stats?.purchases ?? '...'}</strong><span>Pedidos</span></div>
          <div><strong>{stats?.approved ?? '...'}</strong><span>Pagamentos aprovados</span></div>
        </div>
        <button onClick={logout}>Sair do painel</button>
      </div>
    </main>
  );
}