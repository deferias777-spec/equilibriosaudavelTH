import React from 'react';
import {
  Trophy,
  TrendingUp,
  ShieldCheck,
  Heart,
  CalendarCheck
} from 'lucide-react';
import Journey from './Journey';
import '../styles/JourneyPremium.css';

export default function JourneyPremiumShell() {
  return (
    <div className="es-journey-premium">
      <section className="es-journey-hero">
        <div className="es-journey-hero-copy">
          <span className="es-journey-eyebrow">
            SUA EVOLUÇÃO · SUA HISTÓRIA
          </span>

          <h2>
            Cada conquista <em>merece ser celebrada.</em>
          </h2>

          <p>
            Acompanhe seus registros, celebre suas vitórias
            e descubra o quanto você já evoluiu.
            O importante é continuar.
          </p>
        </div>

        <div className="es-journey-hero-art">
          <Trophy size={54} strokeWidth={1.5}/>
        </div>
      </section>

      <div className="es-journey-intro-cards">
        <div className="es-journey-intro-card">
          <TrendingUp size={22}/>
          <div>
            <strong>Evolução pessoal</strong>
            <p>Visualize seu progresso no seu próprio ritmo.</p>
          </div>
        </div>

        <div className="es-journey-intro-card">
          <CalendarCheck size={22}/>
          <div>
            <strong>Constância</strong>
            <p>Pequenas ações criam hábitos duradouros.</p>
          </div>
        </div>

        <div className="es-journey-intro-card">
          <ShieldCheck size={22}/>
          <div>
            <strong>Privacidade</strong>
            <p>Seus registros pessoais continuam protegidos pelas regras existentes.</p>
          </div>
        </div>
      </div>

      <div className="es-journey-content">
        <Journey/>
      </div>
    </div>
  );
}