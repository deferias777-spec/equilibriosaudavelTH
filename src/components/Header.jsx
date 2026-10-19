import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, LogIn, ArrowUpRight } from 'lucide-react';
import './Header.css';

export default function Header() {
  return (
    <header className="official-site-header">
      <div className="official-site-header__inner">

        <Link to="/" className="official-site-header__brand" aria-label="Ir para o início">
          <img
            src="/images/logo.png"
            alt="Equilíbrio Saudável"
            className="official-site-header__logo"
          />
        </Link>

        <nav className="official-site-header__nav" aria-label="Navegação principal">
          <Link to="/">Início</Link>
          <a href="/#plataforma">Benefícios</a>
          <a href="/#receitas">Receitas</a>
          <a href="/#sobre">Sobre a Thaís</a>
        </nav>

        <div className="official-site-header__actions">
          <a
            href="https://www.instagram.com/thaissfelicio/"
            target="_blank"
            rel="noopener noreferrer"
            className="official-site-header__instagram"
            aria-label="Instagram da Thaís"
          >
            <Instagram size={21} />
          </a>

          <Link to="/membros?modo=login" className="official-site-header__login">
            <LogIn size={18} />
            <span>Entrar</span>
          </Link>

          <Link to="/checkout-pix" className="official-site-header__subscribe">
            <span>Seja membro</span>
            <small>R$ 29,90</small>
            <ArrowUpRight size={18} />
          </Link>
        </div>

      </div>
    </header>
  );
}