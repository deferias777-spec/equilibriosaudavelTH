import '../styles/CommunityPremium.css';
import React,{useEffect,useState} from 'react';
import {api} from '../lib/api';
import {useAuth} from '../context/AuthContext';
import {
  MessageCircle,Newspaper,Heart,Plus,Trash2,
  Instagram,Camera,RefreshCw
} from 'lucide-react';
import CommunityChat from './CommunityChat';
import './Social.css';

const THAIS = 'thaisfelicio@equilibriosaudavel.local';
const INSTA = 'https://www.instagram.com/thaissfelicio/';

function isThais(name) {
  return String(name || '').toLowerCase().includes('thaissfelicio');
}

export default function Community() {
  const {user} = useAuth();
  const [section,setSection] = useState('feed');
  const [posts,setPosts] = useState([]);
  const [recipe,setRecipe] = useState('');
  const [caption,setCaption] = useState('');
  const [imageUrl,setImageUrl] = useState('');
  const [selectedPhoto,setSelectedPhoto] = useState(null);
  const [preview,setPreview] = useState('');
  const [sendingPhoto,setSendingPhoto] = useState(false);

  function choosePhoto(file) {
    if (preview) URL.revokeObjectURL(preview);

    if (!file) {
      setSelectedPhoto(null);
      setPreview('');
      return;
    }

    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) {
      setError('Escolha uma imagem JPG, PNG ou WebP.');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setError('A foto deve ter no maximo 4 MB.');
      return;
    }

    setError('');
    setSelectedPhoto(file);
    setPreview(URL.createObjectURL(file));
  }

  async function uploadPhoto() {
    if (!selectedPhoto) return '';

    setSendingPhoto(true);

    const response = await fetch('/api/social/upload-photo', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': selectedPhoto.type
      },
      body: selectedPhoto
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Falha ao enviar a foto.');
    }

    return result.url;
  }
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);

  async function refresh() {
    try {
      setPosts(await api('/social/feed'));
      setError('');
    } catch(e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    if(section !== 'feed') return;
    refresh();
  },[section]);

  async function publish(e) {
    e.preventDefault();
    setBusy(true);
    setError('');

    try {
      const uploadedPhoto = await uploadPhoto();

      await api('/social/feed',{
        method:'POST',
        body:JSON.stringify({
          recipe,
          caption,
          imageUrl: uploadedPhoto
        })
      });
      setRecipe('');
      setCaption('');
      setImageUrl('');
      choosePhoto(null);
      await refresh();
    } catch(e) {
      setError(e.message);
    } finally {
      setBusy(false);
      setSendingPhoto(false);
    }
  }

  async function like(id) {
    try {
      await api('/social/feed/'+encodeURIComponent(id)+'/like',{
        method:'POST'
      });
      await refresh();
    } catch(e) {
      setError(e.message);
    }
  }

  async function remove(id) {
    if(!window.confirm('Excluir sua publicação?')) return;
    try {
      await api('/social/feed/'+encodeURIComponent(id),{
        method:'DELETE'
      });
      await refresh();
    } catch(e) {
      setError(e.message);
    }
  }

  return <div className="es-social">
    <div className="es-social-intro">
      <div>
        <span className="es-eyebrow">Nossa comunidade</span>
        <h2>Receitas, histórias e conexões</h2>
        <p>Compartilhe o que preparou e inspire outras pessoas.</p>
      </div>
    </div>

    <div className="es-social-switch">
      <button
        className={section==='feed'?'selected':''}
        onClick={()=>setSection('feed')}
      >
        <Newspaper size={18}/> Feed de receitas
      </button>
      <button
        className={section==='chat'?'selected':''}
        onClick={()=>setSection('chat')}
      >
        <MessageCircle size={18}/> Chat da comunidade
      </button>
    </div>

    {section==='chat' ? <CommunityChat/> : <>
      <form className="es-compose" onSubmit={publish}>
        <div className="es-compose-title">
          <Camera size={22}/>
          <div>
            <strong>Mostre sua receita!</strong>
            <span>O que você preparou hoje?</span>
          </div>
        </div>

        <input
          required minLength={2} maxLength={120}
          placeholder="Nome da receita"
          value={recipe}
          onChange={e=>setRecipe(e.target.value)}
        />

        <textarea
          required minLength={3} maxLength={1200}
          rows={3}
          placeholder="Conte como ficou, o que mudou e suas dicas..."
          value={caption}
          onChange={e=>setCaption(e.target.value)}
        />

        <div className="es-upload-area">
          <label className="es-upload-picker">
            <span className="es-upload-icon">
              <Camera size={24}/>
            </span>

            <span className="es-upload-description">
              <strong>
                {selectedPhoto ? 'Trocar foto' : 'Adicionar foto da receita'}
              </strong>
              <small>Escolher do celular ou computador</small>
              <small>JPG, PNG ou WebP · ate 4 MB</small>
            </span>

            <span className="es-upload-action">
              {selectedPhoto ? 'Trocar' : 'Escolher foto'}
            </span>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="es-upload-native"
              onChange={e => {
                choosePhoto(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </label>

          {preview && (
            <div className="es-upload-preview">
              <img src={preview} alt="Previa da receita"/>

              <div className="es-upload-preview-footer">
                <span>Foto pronta para publicar</span>

                <button
                  type="button"
                  onClick={() => choosePhoto(null)}
                >
                  <Trash2 size={16}/>
                  Remover foto
                </button>
              </div>
            </div>
          )}
        </div>

        <button className="es-publish" disabled={busy}>
          <Plus size={18}/>
          {busy?(sendingPhoto?'Enviando foto...':'Publicando...'):'Publicar minha receita'}
        </button>
      </form>

      <div className="es-feed-heading">
        <h3>Timeline da comunidade</h3>
        <button onClick={refresh} title="Atualizar">
          <RefreshCw size={18}/>
        </button>
      </div>

      {error && <p className="es-social-error">{error}</p>}

      {!posts.length && <div className="es-empty">
        <Camera size={35}/>
        <h3>As primeiras receitas começam aqui</h3>
        <p>Publique a sua e inaugure o feed da comunidade.</p>
      </div>}

      {posts.map(post=><article className="es-post" key={post.id}>
        <div className="es-post-head">
          <div className="es-avatar">
            {isThais(post.author)
              ? <img src="/images/thais-felicio.webp" alt="Thaís"/>
              : String(post.author||'M').charAt(0).toUpperCase()}
          </div>
          <div className="es-post-author">
            <strong>{post.author}</strong>
            <span>{new Date(post.createdAt).toLocaleDateString('pt-BR')}</span>
          </div>
          {isThais(post.author) &&
            <a href={INSTA} target="_blank" rel="noopener noreferrer"
              title="Instagram da Thaís">
              <Instagram size={19}/>
            </a>}
          {post.userId===user?.id &&
            <button onClick={()=>remove(post.id)} title="Excluir">
              <Trash2 size={18}/>
            </button>}
        </div>

        <h3>{post.recipe}</h3>
        <p className="es-post-caption">{post.caption}</p>

        {post.imageUrl &&
          <img className="es-post-photo"
            src={post.imageUrl}
            alt={'Receita: '+post.recipe}
            loading="lazy"
            referrerPolicy="no-referrer"/>}

        <div className="es-post-actions">
          <button onClick={()=>like(post.id)}
            className={post.liked?'liked':''}>
            <Heart size={19} fill={post.liked?'currentColor':'none'}/>
            {post.likes} {post.likes===1?'curtida':'curtidas'}
          </button>
          <span>Feito com carinho</span>
        </div>
      </article>)}
    </>}
  </div>;
}