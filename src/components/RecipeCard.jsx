import React from 'react';
import { Clock3, Heart, ArrowUpRight, ChefHat, Users } from 'lucide-react';
import './RecipesPremium.css';

export default function RecipeCard({
  recipe,
  onOpen,
  isFavorite = false,
  onFavorite
}) {
  return (
    <article className="rp-card">
      <button
        type="button"
        className="rp-card-image"
        onClick={() => onOpen?.(recipe)}
        aria-label={`Abrir receita ${recipe.name}`}
      >
        {recipe.image ? (
          <img
            src={recipe.image}
            alt={recipe.name}
            loading="lazy"
          />
        ) : (
          <div className="rp-photo-pending">
            <ChefHat size={34} />
            <span>Fotografia em preparação</span>
          </div>
        )}

        <span className="rp-category">
          {recipe.category || 'Receita'}
        </span>
      </button>

      <button
        type="button"
        className={`rp-favorite ${isFavorite ? 'active' : ''}`}
        onClick={() => onFavorite?.(recipe.id)}
        aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      >
        <Heart size={19} fill={isFavorite ? 'currentColor' : 'none'} />
      </button>

      <div className="rp-card-content">
        <h3>{recipe.name}</h3>

        <p className="rp-description">
          {recipe.description || 'Uma receita prática para sua rotina.'}
        </p>

        <div className="rp-meta">
          <span>
            <Clock3 size={15} />
            {recipe.time || '—'} min
          </span>

          <span>
            <Users size={15} />
            {recipe.servings || 1} porções
          </span>
        </div>

        <button
          type="button"
          className="rp-open"
          onClick={() => onOpen?.(recipe)}
        >
          Ver preparo
          <ArrowUpRight size={17} />
        </button>
      </div>
    </article>
  );
}