import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDown, Check, Heart, ShieldCheck } from 'lucide-react';
import './Hero.css';

export default function Hero() {
  return (
    <section className="lux-hero" id="inicio">
      <div className="lux-hero__ambient lux-hero__ambient--one" />
      <div className="lux-hero__ambient lux-hero__ambient--two" />

      <div className="lux-hero__container">
        <div className="lux-hero__content">
          <div className="lux-hero__eyebrow">
            <span className="lux-hero__eyebrow-line" />
            NUTRIÇÃO, LEVEZA E BEM-ESTAR
          </div>

          <div className="lux-hero__signature">
            
            Uma experiência feita para você
          </div>

          <h1>
            Seu bem-estar merece
            <span> um cuidado </span>
            <em>extraordinário.</em>
          </h1>

          <p className="lux-hero__description">
            Descubra uma forma mais leve de cuidar da sua alimentação.
            Reunimos receitas práticas, conteúdos exclusivos e
            ferramentas para ajudar você a construir uma rotina
            equilibrada, com mais autonomia, prazer e simplicidade.
          </p>

          <div className="lux-hero__checks">
            <span><Check size={15} /> Receitas para sua rotina</span>
            <span><Check size={15} /> Conteúdos exclusivos</span>
            <span><Check size={15} /> Mais organização alimentar</span>
          </div>

          <div className="lux-hero__actions">
            <Link to="/checkout-pix" className="lux-hero__primary">
              Quero começar minha jornada
              <ArrowUpRight size={19} />
            </Link>

            <a href="#beneficios" className="lux-hero__secondary">
              Conhecer os benefícios
              <ArrowDown size={17} />
            </a>
          </div>

          <div className="lux-hero__membership">
            <div className="lux-hero__membership-price">
              <strong>R$ 29,90</strong>
              <span>30 dias de acesso</span>
            </div>

            <span className="lux-hero__membership-divider" />

            <div className="lux-hero__membership-trust">
              <ShieldCheck size={20} />
              <span>
                Pagamento via Pix
                <small>Processado pelo Mercado Pago</small>
              </span>
            </div>
          </div>
        </div>

        <div className="lux-hero__visual">
          <div className="lux-hero__visual-frame">
            <img
              src="/images/hero-premium.jpg"
              alt="Composição de alimentos frescos e saudáveis"
              className="lux-hero__image"
              onError={event => {
                event.currentTarget.style.display = 'none';
              }}
            />

            <div className="lux-hero__visual-fallback">
              <Heart size={52} strokeWidth={1} />
              <span>O equilíbrio começa com pequenas escolhas.</span>
            </div>
          </div>

          <div className="lux-hero__floating-card">
            <div className="lux-hero__floating-icon">
              <Heart size={21} strokeWidth={1.6} />
            </div>
            <div>
              <strong>Bem-estar com leveza</strong>
              <span>Um passo de cada vez.</span>
            </div>
          </div>

          <div className="lux-hero__vertical-text">
            EQUILÍBRIO SAUDÁVEL · THAÍS FELÍCIO
          </div>
        </div>
      </div>

      <div className="lux-hero__bottom">
        <span>ALIMENTAÇÃO CONSCIENTE</span>
        <span className="lux-hero__bottom-dot" />
        <span>ROTINA EQUILIBRADA</span>
        <span className="lux-hero__bottom-dot" />
        <span>BEM-ESTAR REAL</span>
      </div>
    </section>
  );
}