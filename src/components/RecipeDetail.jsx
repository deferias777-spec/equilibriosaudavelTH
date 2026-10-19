import React, { useEffect, useState } from 'react';
import {
  X, Clock3, Users, ChefHat, Check,
  Minus, Plus, Lightbulb, AlertCircle
} from 'lucide-react';
import './RecipesPremium.css';

function formatAmount(value) {
  return Number(value.toFixed(2)).toLocaleString('pt-BR', {
    maximumFractionDigits: 2
  });
}

function scaleIngredient(item, factor) {
  if (factor === 1) return item;

  if (typeof item !== 'string') return String(item ?? '');

  const match = item.match(
    /^(\s*)(\d+(?:[.,]\d+)?)(\s+)(.*)$/
  );

  if (!match) return item;

  const original = Number(match[2].replace(',', '.'));

  if (!Number.isFinite(original)) return item;

  return (
    match[1] +
    formatAmount(original * factor) +
    match[3] +
    match[4]
  );
}

export default function RecipeDetail({ recipe, onClose }) {
  const [portions, setPortions] = useState(2);
  const [checked, setChecked] = useState([]);

  const basePortions = Math.max(1, Number(recipe?.servings) || 1);

  useEffect(() => {
    if (!recipe) return;

    setPortions(Math.min(8, basePortions));
    setChecked([]);
  }, [recipe?.id]);

  useEffect(() => {
    if (!recipe) return;

    function onKeyDown(event) {
      if (event.key === 'Escape') onClose?.();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [recipe, onClose]);

  if (!recipe) return null;

  const factor = portions / basePortions;
  const ingredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients
    : [];
  const steps = Array.isArray(recipe.steps)
    ? recipe.steps
    : [];

  return (
    <div
      className="rp-modal-backdrop"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <section
        className="rp-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Receita ${recipe.name}`}
      >
        <button
          type="button"
          className="rp-close"
          onClick={onClose}
          aria-label="Fechar receita"
        >
          <X size={22} />
        </button>

        <div className="rp-detail-hero">
          <div className="rp-detail-photo">
            {recipe.image ? (
              <img src={recipe.image} alt={recipe.name} />
            ) : (
              <div className="rp-photo-pending">
                <ChefHat size={50} />
                <span>Fotografia em preparação</span>
              </div>
            )}
          </div>

          <div className="rp-detail-intro">
            <span className="rp-detail-eyebrow">
              {recipe.category || 'RECEITA'}
            </span>

            <h2>{recipe.name}</h2>

            <p>{recipe.description}</p>

            <div className="rp-detail-facts">
              <span>
                <Clock3 size={17} />
                {recipe.time || '—'} min
              </span>
              <span>
                <Users size={17} />
                {portions} {portions === 1 ? 'porção' : 'porções'}
              </span>
            </div>

            <div className="rp-portions">
              <div>
                <strong>Quantas pessoas?</strong>
                <small>Adapte os ingredientes à sua mesa.</small>
              </div>

              <div className="rp-stepper">
                <button
                  type="button"
                  onClick={() => setPortions(p => Math.max(1, p - 1))}
                  disabled={portions <= 1}
                  aria-label="Diminuir porções"
                >
                  <Minus size={17} />
                </button>

                <span>{portions}</span>

                <button
                  type="button"
                  onClick={() => setPortions(p => Math.min(8, p + 1))}
                  disabled={portions >= 8}
                  aria-label="Aumentar porções"
                >
                  <Plus size={17} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rp-detail-content">
          <div className="rp-ingredients">
            <div className="rp-section-title">
              <span>01</span>
              <h3>Ingredientes</h3>
            </div>

            <p className="rp-section-subtitle">
              Marque os ingredientes conforme separar.
            </p>

            <div className="rp-ingredient-list">
              {ingredients.map((ingredient, index) => {
                const selected = checked.includes(index);

                return (
                  <label
                    key={index}
                    className={`rp-ingredient ${selected ? 'checked' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => setChecked(previous =>
                        selected
                          ? previous.filter(i => i !== index)
                          : [...previous, index]
                      )}
                    />

                    <span className="rp-ingredient-check">
                      {selected && <Check size={13} />}
                    </span>

                    <span>
                      {scaleIngredient(
                        typeof ingredient === 'string'
                          ? ingredient
                          : ingredient?.name || JSON.stringify(ingredient),
                        factor
                      )}
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="rp-portion-note">
              <AlertCircle size={17} />
              <span>
                O ajuste automático funciona para quantidades numéricas
                no início do ingrediente. Medidas como frações,
                unidades inteiras e temperos devem ser conferidas.
              </span>
            </div>
          </div>

          <div className="rp-preparation">
            <div className="rp-section-title">
              <span>02</span>
              <h3>Modo de preparo</h3>
            </div>

            <p className="rp-section-subtitle">
              Um passo de cada vez, sem complicação.
            </p>

            <div className="rp-steps">
              {steps.map((step, index) => (
                <div className="rp-step" key={index}>
                  <span className="rp-step-number">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <p>
                    {typeof step === 'string'
                      ? step
                      : step?.text || String(step)}
                  </p>
                </div>
              ))}
            </div>

            {recipe.tip && (
              <div className="rp-tip">
                <Lightbulb size={21} />
                <div>
                  <strong>Dica especial</strong>
                  <p>{recipe.tip}</p>
                </div>
              </div>
            )}

            {recipe.allergens?.length > 0 && (
              <p className="rp-allergens">
                <strong>Atenção aos alergênicos:</strong>{' '}
                {Array.isArray(recipe.allergens)
                  ? recipe.allergens.join(', ')
                  : recipe.allergens}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}