import React, { useEffect, useState } from 'react';
import { Smartphone, ArrowUpRight, X } from 'lucide-react';
import './InstallAppPromo.css';

export default function InstallAppPromo() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const onEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('keydown', onEscape);

    return () => window.removeEventListener('keydown', onEscape);
  }, [isOpen]);

  return (
    <>
      <div className="es-install-promo">
        <div className="es-install-promo-icon">
          <img
            src="/images/favicon.png"
            alt="Ícone Equilíbrio Saudável"
            loading="lazy"
          />
        </div>

        <div className="es-install-promo-copy">
          <span>SEU BEM-ESTAR SEMPRE POR PERTO</span>

          <h3>Equilíbrio Saudável no seu celular</h3>

          <p>
            Adicione à tela inicial e acesse sua área de membros
            com apenas um toque.
          </p>
        </div>

        <button
          type="button"
          className="es-install-promo-button"
          onClick={() => setIsOpen(true)}
        >
          <Smartphone size={17} />
          Como instalar
          <ArrowUpRight size={16} />
        </button>
      </div>

      {isOpen && (
        <div
          className="es-install-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <div
            className="es-install-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="es-install-heading"
          >
            <button
              type="button"
              className="es-install-close"
              aria-label="Fechar instruções"
              onClick={() => setIsOpen(false)}
            >
              <X size={20} />
            </button>

            <img
              src="/images/favicon.png"
              alt=""
              className="es-install-dialog-icon"
            />

            <span className="es-install-eyebrow">
              SEU ESPAÇO, SEMPRE POR PERTO
            </span>

            <h2 id="es-install-heading">
              Leve seu bem-estar com você.
            </h2>

            <p className="es-install-description">
              Adicione o Equilíbrio Saudável à tela inicial
              do celular e tenha acesso rápido à sua área de membros.
            </p>

            <div className="es-install-platforms">
              <section className="es-install-platform">
                <strong>iPhone · Safari</strong>

                <ol>
                  <li>Abra nosso site no Safari.</li>
                  <li>Toque no botão Compartilhar.</li>
                  <li>Escolha Adicionar à Tela de Início.</li>
                  <li>Confirme tocando em Adicionar.</li>
                </ol>
              </section>

              <section className="es-install-platform">
                <strong>Android · Chrome</strong>

                <ol>
                  <li>Abra nosso site no Chrome.</li>
                  <li>Toque no menu de três pontos.</li>
                  <li>Escolha Instalar app ou Adicionar à tela inicial.</li>
                  <li>Confirme a instalação.</li>
                </ol>
              </section>
            </div>

            <button
              type="button"
              className="es-install-confirm"
              onClick={() => setIsOpen(false)}
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
}