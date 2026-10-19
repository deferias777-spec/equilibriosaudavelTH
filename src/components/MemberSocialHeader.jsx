import '../styles/VerifiedProfilePremium.css';
import React,{useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {api} from '../lib/api';
import {
  Instagram,BookOpen,MessageCircle,Heart,
  Camera,LogOut,ChefHat
} from 'lucide-react';
import './Social.css';

const INSTA = 'https://www.instagram.com/thaissfelicio/';

export default function MemberSocialHeader({user,logout,onCommunity}) {
  const isThais = user?.role==='PREMIUM_ADMIN';
  const [posts,setPosts] = useState([]);

  useEffect(()=>{
    api('/social/feed').then(setPosts).catch(()=>{});
  },[user?.id]);

  const myPosts = posts.filter(p=>p.userId===user?.id);
  const highlights = myPosts.slice(0,4);

  return <>
    <div className="es-member-top">
      <Link to="/" className="es-member-brand">
        <img src="/images/logo.png" alt="Equilíbrio Saudável"/>
        <span>Espaço de membros</span>
      </Link>
      <div className="es-member-top-actions">
        <button onClick={onCommunity}>
          <MessageCircle size={18}/> Comunidade
        </button>
        <button onClick={logout}>
          <LogOut size={18}/> Sair
        </button>
      </div>
    </div>

    <section className="es-member-profile">
      <div className="es-member-profile-main">
        <div className="es-member-photo">
          {isThais
            ? <img src="/images/thais-felicio.webp" alt="Thaís Felicio"/>
            : <span>{String(user?.name||'M').charAt(0).toUpperCase()}</span>}
        </div>
        <div className="es-member-profile-info">
          <span className="es-eyebrow">
            {isThais?'Perfil oficial · Nutrição':'Meu espaço saudável'}
          </span>
          <h2>{isThais?'@thaissfelicio':user?.name}{isThais&&(
  <span
    className="es-official-verified"
    title="Perfil oficial da Thaís"
    aria-label="Perfil oficial"
  >
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 2.3 14.7 4l3.2-.1 1.2 3 2.7 1.8-.8 3.1.8 3.1-2.7 1.8-1.2 3-3.2-.1L12 21.3l-2.7-1.7-3.2.1-1.2-3-2.7-1.8.8-3.1-.8-3.1L4.9 7l1.2-3 3.2.1L12 2.3Z"
        fill="#2489ED"
      />
      <path
        d="m8 12.1 2.5 2.5 5.5-5.5"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </span>
)}</h2>
          <p>{isThais?'Thaís Felicio':'Membro da comunidade'}</p>
          <div className="es-profile-stats">
            <span><b>{myPosts.length}</b> publicações</span>
            <span><b>{posts.length}</b> receitas na comunidade</span>
          </div>
          <div className="es-profile-buttons">
            {isThais &&
              <a href={INSTA} target="_blank" rel="noopener noreferrer">
                <Instagram size={18}/> Instagram da Thaís
              </a>}
            <button onClick={onCommunity}>
              <Camera size={18}/> Compartilhar receita
            </button>
          </div>
        </div>
      </div>

      <div className="es-highlights">
        {highlights.length ? highlights.map(p=>
          <button key={p.id} onClick={onCommunity}>
            <div className="es-highlight-circle">
              {p.imageUrl
                ? <img src={p.imageUrl} alt={p.recipe}/>
                : <ChefHat size={28}/>}
            </div>
            <span>{p.recipe}</span>
          </button>
        ) : <div className="es-highlights-empty">
          <div className="es-highlight-circle">
            <ChefHat size={28}/>
          </div>
          <span>Suas receitas publicadas aparecerão aqui.</span>
          <button onClick={onCommunity}>Criar primeiro destaque</button>
        </div>}
      </div>
    </section>
  </>;
}