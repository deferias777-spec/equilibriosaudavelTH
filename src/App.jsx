import { useLocation } from 'react-router-dom';
import ThaisAdmin from './pages/ThaisAdmin';
import PixCheckout from './pages/PixCheckout';
import React from 'react';import{Routes,Route}from'react-router-dom';import{AuthProvider}from'./context/AuthContext';import Header from'./components/Header';import Home from'./pages/Home';import Members from'./pages/Members';import Dashboard from'./pages/Dashboard';import Payment from'./pages/Payment';function ConditionalHeader() {
  const { pathname } = useLocation();

  if (pathname === '/thais' || pathname.startsWith('/thais/')) {
    return null;
  }

  return <Header />;
}
export default function App(){return <AuthProvider><ConditionalHeader/><Routes><Route path='/' element={<Home/>}/><Route path='/membros' element={<Members/>}/><Route path='/painel' element={<Dashboard/>}/><Route path='/pagamento' element={<Payment/>}/><Route path='/thais' element={<ThaisAdmin/>}/><Route path='/checkout-pix' element={<PixCheckout/>}/><Route path='*' element={<Home/>}/></Routes></AuthProvider>}