import React from 'react';
import {Target, CalendarDays, Sparkles, CheckCircle2} from 'lucide-react';
import '../styles/GoalsPlanningPremium.css';

export function GoalsIntro({count=0}){
  return (
    <section className="gp-hero">
      <div className="gp-hero-copy">
        <span className="gp-eyebrow">SEU DESENVOLVIMENTO</span>
        <h2>Pequenos passos. <em>Grandes conquistas.</em></h2>
        <p>
          Organize suas metas e acompanhe cada etapa
          da sua jornada com mais clareza.
        </p>
        <div className="gp-hero-pill">
          <CheckCircle2 size={17}/>
          {count} {count===1?'meta cadastrada':'metas cadastradas'}
        </div>
      </div>
      <div className="gp-hero-art"><Target size={55}/></div>
    </section>
  );
}

export function PlanningIntro({count=0}){
  return (
    <section className="gp-hero gp-planning-hero">
      <div className="gp-hero-copy">
        <span className="gp-eyebrow">SUA ROTINA ORGANIZADA</span>
        <h2>Sua semana, <em>mais leve.</em></h2>
        <p>
          Planeje refeições de forma simples
          e tenha mais praticidade no dia a dia.
        </p>
        <div className="gp-hero-pill">
          <CalendarDays size={17}/>
          {count} {count===1?'refeição planejada':'refeições planejadas'}
        </div>
      </div>
      <div className="gp-hero-art"><CalendarDays size={55}/></div>
    </section>
  );
}