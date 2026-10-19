import React from 'react';
import { Heart, Instagram, ShieldCheck } from 'lucide-react';
import './MemberFooter.css';

export default function MemberFooter() {
  return (
    <footer className="member-lux-footer">
      <div className="member-lux-footer-main">
        <div>
          <span className="member-lux-footer-brand">
            EQUILÍBRIO <em>SAUDÁVEL</em>
          </span>
          <p>
            Uma jornada mais leve começa com pequenas escolhas.
            Seu espaço para evoluir no seu ritmo.
          </p>
        </div>

        <a
          href="https://www.instagram.com/thaissfelicio/"
          target="_blank"
          rel="noopener noreferrer"
          className="member-lux-footer-instagram"
        >
          <Instagram size={18} />
          Acompanhe a Thaís
        </a>
      </div>

      <div className="member-lux-footer-bottom">
        <span>
          © {new Date().getFullYear()} Equilíbrio Saudável
        </span>
        <span>
          <ShieldCheck size={15} />
          Seu espaço de bem-estar
        </span>
        <span>
          Feito com <Heart size={14} /> para sua jornada
        </span>
      </div>
    </footer>
  );
}