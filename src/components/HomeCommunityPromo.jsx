import React from 'react';
import { Link } from 'react-router-dom';
import {
  MessageCircle,
  Bell,
  ChefHat,
  Heart,
  ArrowUpRight,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import './HomeCommunityPromo.css';

export default function HomeCommunityPromo() {
  return (
    <section className="hcp-section" id="comunidade">
      <div className="hcp-container">

        <div className="hcp-heading">
          <span className="hcp-eyebrow">
            <span className="hcp-eyebrow-line" />
            MUITO ALÉM DE UM CATÁLOGO DE RECEITAS
          </span>

          <h2>
            Uma comunidade que evolui
            <em> junto com você.</em>
          </h2>

          <p>
            No Equilíbrio Saudável, sua experiência continua
            crescendo. Compartilhe sua jornada, acompanhe
            as novidades e descubra novas possibilidades
            para tornar sua rotina mais leve e saborosa.
          </p>
        </div>

        <div className="hcp-grid">

          <article className="hcp-card hcp-card-community">
            <div className="hcp-card-top">
              <span className="hcp-icon">
                <MessageCircle size={25} strokeWidth={1.7} />
              </span>
              <span className="hcp-tag">EXCLUSIVO PARA MEMBROS</span>
            </div>

            <div className="hcp-chat-preview">
              <div className="hcp-chat-header">
                <span className="hcp-online-dot" />
                <span>Comunidade Equilíbrio Saudável</span>
              </div>

              <div className="hcp-message hcp-message-admin">
                <div className="hcp-avatar">T</div>
                <div className="hcp-message-content">
                  <strong>Thaís • Administração</strong>
                  <p>
                    Olá, comunidade! Temos novidades especiais
                    chegando para vocês.
                  </p>
                </div>
              </div>

              <div className="hcp-message hcp-message-member">
                <div className="hcp-message-content">
                  <p>
                    Adoro acompanhar as novidades e trocar
                    experiências por aqui!
                  </p>
                </div>
              </div>

              <div className="hcp-chat-footer">
                <MessageCircle size={16} />
                Um espaço para conversar e se conectar
              </div>
            </div>

            <div className="hcp-card-content">
              <h3>Mais perto da Thaís. Mais perto de todos.</h3>
              <p>
                Participe da comunidade, converse com outros
                membros e acompanhe os comunicados da Thaís
                em um só lugar.
              </p>

              <div className="hcp-benefits">
                <span>
                  <CheckCircle2 size={17} />
                  Interação com a comunidade
                </span>
                <span>
                  <CheckCircle2 size={17} />
                  Comunicados da Thaís
                </span>
                <span>
                  <CheckCircle2 size={17} />
                  Avisos de novas receitas e atividades
                </span>
              </div>
            </div>
          </article>

          <article className="hcp-card hcp-card-recipes">
            <div className="hcp-card-top">
              <span className="hcp-icon">
                <ChefHat size={25} strokeWidth={1.7} />
              </span>
              <span className="hcp-tag">CONTEÚDO EM EVOLUÇÃO</span>
            </div>

            <div className="hcp-recipe-visual">
              <img
                src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1000&q=85"
                alt="Refeição colorida com vegetais frescos"
                loading="lazy"
              />

              <div className="hcp-floating-note">
                <span className="hcp-note-icon">
                  <Sparkles size={18} />
                </span>
                <div>
                  <strong>Sempre novas ideias</strong>
                  <small>Mais variedade para sua rotina</small>
                </div>
              </div>
            </div>

            <div className="hcp-card-content">
              <h3>Receitas que não param de surpreender.</h3>
              <p>
                Nossa biblioteca é renovada frequentemente,
                com novas receitas, opções práticas e ideias
                para diferentes momentos do seu dia.
              </p>

              <div className="hcp-benefits">
                <span>
                  <CheckCircle2 size={17} />
                  Novas opções quase todos os dias
                </span>
                <span>
                  <CheckCircle2 size={17} />
                  Receitas atualizadas e variadas
                </span>
                <span>
                  <CheckCircle2 size={17} />
                  Novas atividades e desafios
                </span>
              </div>
            </div>
          </article>
        </div>

        <div className="hcp-bottom">
          <div className="hcp-bottom-copy">
            <span className="hcp-bottom-icon">
              <Bell size={24} />
            </span>
            <div>
              <strong>Fique por dentro de cada novidade.</strong>
              <p>
                Uma experiência com novos conteúdos,
                interação e inspiração para o seu dia a dia.
              </p>
            </div>
          </div>

          <div className="hcp-actions">
            <Link to="/membros?modo=login" className="hcp-secondary">
              Já sou membro
            </Link>

            <Link to="/checkout-pix" className="hcp-primary">
              Fazer parte da comunidade
              <ArrowUpRight size={19} />
            </Link>
          </div>
        </div>

        <div className="hcp-footnote">
          <Heart size={14} />
          Equilíbrio Saudável — cuidado, conexão e novidades.
        </div>
      </div>
    </section>
  );
}