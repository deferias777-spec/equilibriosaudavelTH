import HomeCommunityPromo from '../components/HomeCommunityPromo';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Heart,
  HeartHandshake,
  CheckCircle2,
  ClipboardList,
  Calculator,
  Instagram,
  Clock3,
  ShieldCheck,
  UtensilsCrossed,
  Activity,
  Search,
  ChevronRight
} from 'lucide-react';

import Hero from '../components/Hero';
import RecipeCard from '../components/RecipeCard';
import RecipeDetail from '../components/RecipeDetail';
import { recipes } from '../data/recipes';
import './Home.css';

const instagram = 'https://www.instagram.com/thaissfelicio/';

const modules = [
  {
    icon: BookOpen,
    title: '60 receitas do cotidiano',
    description: 'Preparações com ingredientes comuns: arroz, feijão, ovos, frango, batata, macarrão, legumes e frutas.'
  },
  {
    icon: CalendarDays,
    title: 'Planejamento semanal',
    description: 'Organize refeições, monte seu cardápio e prepare uma lista de compras prática.'
  },
  {
    icon: ClipboardList,
    title: 'Metas e atividades',
    description: 'Acompanhe hábitos, conclua tarefas e registre pequenas conquistas.'
  },
  {
    icon: Calculator,
    title: 'Composição corporal',
    description: 'Registre medidas e consulte estimativas com explicações sobre os métodos e suas limitações.'
  }
];

const everydayExamples = [
  'Arroz, feijão e frango',
  'Omelete com tomate',
  'Macarrão com carne moída',
  'Panqueca de banana',
  'Frango com batata',
  'Sanduíche de ovo'
];

function PhoneDashboard() {
  return (
    <div className="v5-phone v5-phone--dashboard" aria-label="Prévia ilustrativa do painel de membros">
      <div className="v5-phone__island" />
      <div className="v5-phone__screen">
        <div className="v5-phone__status"><span>9:41</span><span>●●● ▰</span></div>
        <div className="v5-phone__brand">
          <Heart size={16} />
          <span>equilíbrio.</span>
        </div>
        <div className="v5-phone__greeting">
          <small>MINHA ÁREA</small>
          <h3>Olá, bem-vinda!</h3>
          <p>Seu cuidado, no seu ritmo.</p>
        </div>
        <div className="v5-phone__summary">
          <span>MEU PROGRESSO</span>
          <strong>Minha semana</strong>
          <div className="v5-phone__progress"><i /></div>
          <small>Organize suas metas e atividades</small>
        </div>
        <div className="v5-phone__mini-title">Explore sua plataforma</div>
        <div className="v5-phone__tiles">
          <div><BookOpen size={18} /><span>Receitas</span></div>
          <div><CalendarDays size={18} /><span>Planejar</span></div>
          <div><Heart size={18} /><span>Favoritos</span></div>
          <div><Activity size={18} /><span>Evolução</span></div>
        </div>
        <div className="v5-phone__bottom">
          <span>Início</span><span>Receitas</span><span>Metas</span>
        </div>
      </div>
    </div>
  );
}

function PhoneCalculator() {
  return (
    <div className="v5-phone v5-phone--calculator" aria-label="Prévia ilustrativa da calculadora de composição corporal">
      <div className="v5-phone__island" />
      <div className="v5-phone__screen">
        <div className="v5-phone__status"><span>9:41</span><span>●●● ▰</span></div>
        <div className="v5-phone__back"><span>‹</span> Minha evolução</div>
        <div className="v5-phone__greeting">
          <small>ACOMPANHAMENTO</small>
          <h3>Composição corporal</h3>
          <p>Conheça melhor suas medidas.</p>
        </div>
        <div className="v5-phone__form">
          <span>EXEMPLO DE REGISTRO</span>
          <label>Altura <div>165 <small>cm</small></div></label>
          <label>Peso <div>68 <small>kg</small></div></label>
          <label>Cintura <div>78 <small>cm</small></div></label>
          <label>Quadril <div>98 <small>cm</small></div></label>
          <div className="v5-phone__calculate">Consultar estimativa <ArrowRight size={14} /></div>
          <p>Estimativas não substituem avaliação profissional.</p>
        </div>
        <div className="v5-phone__bottom">
          <span>Início</span><span>Medidas</span><span>Perfil</span>
        </div>
      </div>
    </div>
  );
}

const homeFeaturedRecipes = [
  {
    id: 'home-arroz-feijao-frango',
    title: 'Arroz, feijão e frango grelhado',
    name: 'Arroz, feijão e frango grelhado',
    category: 'Almoço',
    time: 30,
    minutes: 30,
    image: '/images/home-arroz-frango.jpg',
    ingredients: [
      '3 colheres de sopa de arroz cozido',
      '1 concha pequena de feijão cozido',
      '1 filé de frango',
      '1 tomate',
      'Folhas de alface',
      '1 colher de chá de óleo ou azeite',
      'Alho, sal e temperos a gosto'
    ],
    instructions: [
      'Tempere o frango com alho e sal.',
      'Aqueça uma frigideira com o óleo e grelhe o frango dos dois lados até cozinhar completamente.',
      'Aqueça o arroz e o feijão já preparados.',
      'Lave o tomate e a alface.',
      'Monte o prato com arroz, feijão, frango e salada.'
    ],
    steps: [
      'Tempere o frango com alho e sal.',
      'Grelhe até cozinhar completamente.',
      'Aqueça o arroz e o feijão.',
      'Lave e corte os vegetais.',
      'Monte o prato e sirva.'
    ]
  },
  {
    id: 'home-omelete-tomate',
    title: 'Omelete com tomate',
    name: 'Omelete com tomate',
    category: 'Café da manhã',
    time: 15,
    minutes: 15,
    image: '/images/home-omelete.jpg',
    ingredients: [
      '2 ovos',
      '1 tomate pequeno',
      '1 colher de chá de óleo',
      'Sal e cheiro-verde a gosto'
    ],
    instructions: [
      'Lave e pique o tomate.',
      'Quebre os ovos em uma tigela e bata com um garfo.',
      'Misture o tomate, o sal e o cheiro-verde.',
      'Aqueça uma frigideira com o óleo.',
      'Despeje a mistura e cozinhe dos dois lados até os ovos ficarem firmes.'
    ],
    steps: [
      'Pique o tomate.',
      'Bata os ovos e misture os ingredientes.',
      'Aqueça a frigideira.',
      'Cozinhe a omelete até ficar firme.'
    ]
  },
  {
    id: 'home-macarrao-carne',
    title: 'Macarrão com carne moída',
    name: 'Macarrão com carne moída',
    category: 'Almoço',
    time: 30,
    minutes: 30,
    image: '/images/home-macarrao.jpg',
    ingredients: [
      '80 g de macarrão seco',
      '100 g de carne moída',
      '1 tomate picado',
      '2 colheres de sopa de molho de tomate',
      '1 dente de alho',
      '1 colher de chá de óleo',
      'Sal e temperos a gosto'
    ],
    instructions: [
      'Cozinhe o macarrão em água até ficar macio e escorra.',
      'Aqueça o óleo e refogue o alho.',
      'Adicione a carne moída e cozinhe completamente.',
      'Junte o tomate e o molho e deixe apurar por alguns minutos.',
      'Misture o macarrão ao molho e sirva.'
    ],
    steps: [
      'Cozinhe e escorra o macarrão.',
      'Refogue o alho e cozinhe a carne moída.',
      'Adicione tomate e molho.',
      'Misture ao macarrão e sirva.'
    ]
  }
];
export default function Home() {
  const [selected, setSelected] = useState(null);


  return (
    <div className="premium-home v5-home">
      <Hero />

      <section className="v5-platform" id="plataforma">
        <div className="v5-container v5-platform__layout">
          <div className="v5-platform__visual">
            <div className="v5-platform__halo" />
            <PhoneDashboard />
            <PhoneCalculator />
            <div className="v5-floating-note v5-floating-note--top">
              <span className="v5-floating-note__icon"><Heart size={15} /></span>
              <div><strong>Seu espaço pessoal</strong><small>Organize sua rotina com leveza</small></div>
            </div>
            <div className="v5-floating-note v5-floating-note--bottom">
              <span className="v5-floating-note__icon"><CheckCircle2 size={17} /></span>
              <div><strong>Tudo em um só lugar</strong><small>Receitas, metas e evolução</small></div>
            </div>
          </div>

          <div className="v5-platform__copy">
            <span className="v5-eyebrow">CONHEÇA A ÁREA DE MEMBROS</span>
            <h2>Sua rotina.<br /><em>Uma nova experiência.</em></h2>
            <p className="v5-lead">
              Um espaço para transformar pequenas escolhas em hábitos possíveis,
              com receitas simples e ferramentas para organizar o seu dia a dia.
            </p>

            <div className="v5-module-list">
              {modules.map(({ icon: Icon, title, description }) => (
                <div className="v5-module" key={title}>
                  <span className="v5-module__icon"><Icon size={20} strokeWidth={1.7} /></span>
                  <div>
                    <strong>{title}</strong>
                    <p>{description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/checkout-pix" className="v5-primary-button">
              Conhecer o acesso <ArrowUpRight size={18} />
            </Link>
            <p className="v5-availability-note">
              Prévia dos recursos planejados para a área de membros.
            </p>
          </div>
        </div>
      </section>

      <section className="v5-about" id="sobre">
        <div className="v5-container v5-about__layout">
          <div className="v5-about__portrait">
            <img
              src="/images/thais-felicio.webp"
              alt="Thaís Felício, criadora do Equilíbrio Saudável"
              loading="lazy"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
                event.currentTarget.nextElementSibling.style.display = 'flex';
              }}
            />
            <div className="v5-about__placeholder">
              <HeartHandshake size={42} strokeWidth={1.2} />
              <span>Thaís Felício</span>
              <small>Fotografia oficial</small>
            </div>
          </div>

          <div className="v5-about__copy">
            <span className="v5-eyebrow">POR TRÁS DO EQUILÍBRIO SAUDÁVEL</span>
            <h2>Prazer, sou a <em>Thaís!</em></h2>
            <p>
              Sou Thaís Felício, estudante do 8º período de Nutrição
              e criadora do Equilíbrio Saudável.
            </p>
            <p>
              Criei este espaço para compartilhar uma visão mais simples,
              acolhedora e possível da alimentação. Acredito que comer bem
              pode fazer parte da rotina sem ingredientes difíceis,
              regras extremas ou cobranças desnecessárias.
            </p>
            <p>
              Quero aproximar o conhecimento da vida real, com ideias
              práticas que respeitem a individualidade de cada pessoa.
            </p>
            <a href={instagram} target="_blank" rel="noopener noreferrer" className="v5-outline-button">
              <Instagram size={18} /> Conheça meu Instagram <ArrowUpRight size={16} />
            </a>
          </div>
        </div>
      </section>
      <HomeCommunityPromo />

      <section className="v5-food" id="receitas">
        <div className="v5-container">
          <div className="v5-section-heading">
            <span className="v5-eyebrow">COMIDA DE VERDADE</span>
            <h2>Receitas simples.<br /><em>Ingredientes de casa.</em></h2>
            <p>
              Nada de complicar o que pode ser fácil. Nossa proposta é
              reunir 60 receitas com alimentos conhecidos, acessíveis
              e presentes na mesa de muitas famílias brasileiras.
            </p>
          </div>

          <div className="v5-everyday">
            {everydayExamples.map((name, index) => (
              <span key={name}>
                <span className="v5-everyday__number">{String(index + 1).padStart(2, '0')}</span>
                {name}
              </span>
            ))}
          </div>

          <div className="v5-food__subheading">
            <h3>Uma amostra das receitas</h3>
            <span>Três ideias práticas para começar</span>
          </div>

          {homeFeaturedRecipes.length > 0 ? (
            <div className="v5-recipes-grid">
              {homeFeaturedRecipes.map(recipe => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onOpen={() => setSelected(recipe)}
                />
              ))}
            </div>
          ) : (
            <p className="v5-empty">As receitas serão disponibilizadas aqui em breve.</p>
          )}

          
        </div>
      </section>

      <section className="v5-mounjaro">
        <div className="v5-container v5-mounjaro__layout">
          <div className="v5-mounjaro__copy">
            <span className="v5-eyebrow">ACOLHIMENTO EM DIFERENTES ROTINAS</span>
            <h2>Alimentação prática em cada <em>fase do cuidado.</em></h2>
            <p>
              Também queremos oferecer conteúdos educativos para quem utiliza
              medicamentos como Mounjaro (tirzepatida), sempre valorizando
              refeições comuns, variedade alimentar e orientação profissional.
            </p>
            <div className="v5-mounjaro__points">
              <span><CheckCircle2 size={18} /> Refeições simples e porções adaptáveis</span>
              <span><CheckCircle2 size={18} /> Atenção à tolerância alimentar</span>
              <span><CheckCircle2 size={18} /> Ideias com alimentos do cotidiano</span>
            </div>
            <p className="v5-medical-note">
              Conteúdo educativo. Não substitui acompanhamento médico
              ou nutricional e não constitui prescrição individual.
            </p>
          </div>
          <div className="v5-mounjaro__visual">
            <div className="v5-mounjaro__photo">
  <img
    src="/images/home-cuidado-alimentar.jpg"
    alt="Refeição caseira equilibrada com alimentos do cotidiano"
    loading="lazy"
  />
</div>
            <div className="v5-mounjaro__tag"><Heart size={16} /> Cuidado sem extremos</div>
          </div>
        </div>
      </section>

      <section className="v5-final" id="assinar">
        <div className="v5-container">
          <div className="v5-final__card">
            <div className="v5-final__copy">
              <span className="v5-eyebrow">SEU PRÓXIMO PASSO</span>
              <h2>Comece a cuidar de você <em>com leveza.</em></h2>
              <p>
                Receitas acessíveis, organização e uma experiência
                criada para apoiar sua rotina.
              </p>
              <div className="v5-final__features">
                <span><BookOpen size={16} /> Receitas e conteúdos</span>
                <span><CalendarDays size={16} /> Planejamento e hábitos</span>
                <span><Clock3 size={16} /> Acesso por 30 dias</span>
              </div>
            </div>

            <div className="v5-final__price">
              <span>ACESSO DE 30 DIAS</span>
              <strong>R$ 29,90</strong>
              <p>Pagamento único, sem renovação automática.</p>
              <Link to="/checkout-pix" className="v5-primary-button">
                Quero ser membro <ArrowRight size={19} />
              </Link>
              <Link to="/membros?modo=login" className="v5-final__login">
                Já paguei — Fazer login
              </Link>
              <small><ShieldCheck size={15} /> Pagamento via Mercado Pago</small>
            </div>
          </div>
        </div>
      </section>

      <footer className="v5-footer">
        <div className="v5-container v5-footer__inner">
          <div className="v5-footer__brand">
  <a href="/" aria-label="Voltar ao início">
    <img
      src="/images/logo.png"
      alt="Equilíbrio Saudável por Thaís Felício"
      className="v5-footer__logo"
      loading="lazy"
    />
  </a>
</div>
          <p>© {new Date().getFullYear()} Equilíbrio Saudável. Conteúdo educativo.</p>
          <a href={instagram} target="_blank" rel="noopener noreferrer">
            <Instagram size={18} /> Instagram
          </a>
        </div>
      </footer>

      <RecipeDetail recipe={selected} onClose={() => setSelected(null)} />
    </div>
  );
}