import React, { useMemo, useState } from 'react';
import {
  Search, ArrowUpRight, ArrowRight, Clock3,
  Heart, Trophy, CalendarDays, Target,
  ChefHat, MessageCircle, Activity
} from 'lucide-react';
import './PremiumMemberHome.css';

const sections = [
  { key: 'receitas', title: 'Receitas', Icon: ChefHat },
  { key: 'jornada', title: 'Minha Jornada', Icon: Trophy },
  { key: 'planejamento', title: 'Planejamento', Icon: CalendarDays },
  { key: 'metas', title: 'Minhas Metas', Icon: Target },
  { key: 'favoritos', title: 'Favoritos', Icon: Heart },
  { key: 'comunidade', title: 'Comunidade', Icon: MessageCircle },
  { key: 'calculadora', title: 'Calculadora', Icon: Activity }
];

export default function PremiumMemberHome({
  user,
  recipes = [],
  onNavigate,
  onOpen
}) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todas');

  const categories = [
    'Todas',
    ...new Set(recipes.map(r => r.category).filter(Boolean))
  ];

  const filtered = useMemo(() => recipes.filter(recipe => {
    const content = [
      recipe.name,
      recipe.category,
      recipe.description
    ].filter(Boolean).join(' ').toLocaleLowerCase('pt-BR');

    return (
      (category === 'Todas' || recipe.category === category) &&
      content.includes(search.toLocaleLowerCase('pt-BR'))
    );
  }), [recipes, search, category]);

  const featured = recipes.find(r => r.image) || recipes[0];

  return (
    <div className="premium-member-home">

      <section className="pmh-hero">
        <div className="pmh-hero-content">
          <span className="pmh-eyebrow">
            SEU ESPAÇO PREMIUM DE BEM-ESTAR
          </span>

          <h1>
            Olá, {user?.name?.split(' ')[0] || 'bem-vinda'}!
            <br />
            <em>Seu momento de cuidar de você.</em>
          </h1>

          <p>
            Receitas com ingredientes do dia a dia,
            hábitos saudáveis e pequenas conquistas
            para transformar sua rotina.
          </p>

          <div className="pmh-hero-actions">
            <button
              className="pmh-primary"
              onClick={() => onNavigate('jornada')}
            >
              Minha Jornada <ArrowUpRight size={18} />
            </button>

            <button
              className="pmh-secondary"
              onClick={() => onNavigate('receitas')}
            >
              Explorar receitas <ArrowRight size={17} />
            </button>
          </div>
        </div>

        <div className="pmh-hero-art">
          <div className="pmh-hero-photo">
            {featured?.image ? (
              <img src={featured.image} alt={featured.name} />
            ) : (
              <ChefHat size={60} />
            )}
          </div>
          <span className="pmh-hero-sticker">
            Comida de verdade ♡
          </span>
        </div>
      </section>

      <section className="pmh-quick-access">
        {sections.map(({ key, title, Icon }) => (
          <button
            key={key}
            className="pmh-quick-card"
            onClick={() => onNavigate(key)}
          >
            <span className="pmh-quick-icon">
              <Icon size={23} />
            </span>
            <strong>{title}</strong>
            <ArrowUpRight size={16} className="pmh-arrow" />
          </button>
        ))}
      </section>

      <section className="pmh-recipes">
        <div className="pmh-section-heading">
          <div>
            <span className="pmh-eyebrow">
              RECEITAS PARA A VIDA REAL
            </span>
            <h2>
              O que vamos preparar <em>hoje?</em>
            </h2>
            <p>
              Refeições práticas, saborosas e acessíveis.
            </p>
          </div>

          <span className="pmh-count">
            {recipes.length} receitas
          </span>
        </div>

        <label className="pmh-search">
          <Search size={20} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar receita ou ingrediente..."
          />
        </label>

        <div className="pmh-categories">
          {categories.map(item => (
            <button
              key={item}
              className={category === item ? 'active' : ''}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="pmh-recipe-grid">
          {filtered.slice(0, 8).map(recipe => (
            <button
              key={recipe.id}
              className="pmh-recipe-card"
              onClick={() => onOpen(recipe)}
            >
              <div className="pmh-recipe-image">
                {recipe.image ? (
                  <img
                    src={recipe.image}
                    alt={recipe.name}
                    loading="lazy"
                  />
                ) : (
                  <div className="pmh-placeholder">
                    <ChefHat size={32} />
                    <small>Imagem em revisão</small>
                  </div>
                )}

                <span>{recipe.category}</span>
              </div>

              <div className="pmh-recipe-info">
                <h3>{recipe.name}</h3>

                <div className="pmh-recipe-meta">
                  <span>
                    <Clock3 size={14} />
                    {recipe.time} min
                  </span>
                  <span>{recipe.servings} porções</span>
                </div>

                <div className="pmh-recipe-link">
                  Ver receita <ArrowUpRight size={16} />
                </div>
              </div>
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="pmh-empty">
            Nenhuma receita encontrada.
          </p>
        )}

        <button
          className="pmh-view-all"
          onClick={() => onNavigate('receitas')}
        >
          Ver catálogo completo <ArrowRight size={18} />
        </button>
      </section>
    </div>
  );
}