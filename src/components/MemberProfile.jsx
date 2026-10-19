import React,{useEffect,useState} from 'react';
import {Camera,CheckCircle2,Instagram,Save,UserRound,ShieldCheck} from 'lucide-react';
import './MemberToolsPremium.css';

const THAIS_PHOTO='/images/thais-felicio.webp';

function isThais(user){
  const name=String(user?.name||'').toLowerCase();
  const email=String(user?.email||'').toLowerCase();

  return (
    email==='thaisfelicio@equilibriosaudavel.local' ||
    name==='@thaissfelicio'
  );
}

export default function MemberProfile({user}){
  const verified=isThais(user);
  const key=`equilibrio-profile-${user?.id||user?.email||'member'}`;

  const [displayName,setDisplayName]=useState(user?.name||'');
  const [bio,setBio]=useState('');
  const [photo,setPhoto]=useState('');
  const [saved,setSaved]=useState(false);

  useEffect(()=>{
    setDisplayName(user?.name||'');
    setBio('');
    setPhoto('');

    try{
      const data=JSON.parse(localStorage.getItem(key)||'{}');
      if(typeof data.displayName==='string')setDisplayName(data.displayName);
      if(typeof data.bio==='string')setBio(data.bio);
      if(typeof data.photo==='string')setPhoto(data.photo);
    }catch(e){}
  },[key,user?.name]);

  function uploadPhoto(event){
    const file=event.target.files?.[0];
    if(!file)return;

    if(!['image/jpeg','image/png','image/webp'].includes(file.type)){
      alert('Escolha uma imagem JPG, PNG ou WebP.');
      return;
    }

    if(file.size>1.5*1024*1024){
      alert('Escolha uma imagem de até 1,5 MB.');
      return;
    }

    const reader=new FileReader();
    reader.onload=()=>setPhoto(String(reader.result||''));
    reader.readAsDataURL(file);
    setSaved(false);
  }

  function save(event){
    event.preventDefault();

    if(!displayName.trim()){
      alert('Informe um nome de exibição.');
      return;
    }

    try{
      localStorage.setItem(key,JSON.stringify({
        displayName:displayName.trim(),
        bio:bio.trim(),
        photo
      }));
      setSaved(true);
    }catch(e){
      alert('Não foi possível salvar. Tente uma imagem menor.');
    }
  }

  return <div className="mt-premium">
    <section className="mt-hero">
      <span className="mt-eyebrow">SUA IDENTIDADE NA COMUNIDADE</span>
      <h2>Um espaço com <em>a sua cara.</em></h2>
      <p>Personalize sua apresentação e mantenha suas informações organizadas.</p>
      <div className="mt-hero-icon"><UserRound size={43}/></div>
    </section>

    <div className="mt-two-columns mt-profile-columns">
      <div className="mt-panel mt-profile-preview">
        <div className="mt-avatar-wrap">
          <img
            src={photo||(verified?THAIS_PHOTO:'')}
            alt="Foto do perfil"
            onError={e=>{e.currentTarget.style.visibility='hidden';}}
          />
          {!photo&&!verified&&<UserRound size={50}/>}
        </div>

        <div className="mt-profile-name">
          <h3>{displayName||user?.name}</h3>
          {verified&&<CheckCircle2 size={22} fill="#5d9df5" color="#fff"/>}
        </div>

        {verified&&<span className="mt-verified">
          <ShieldCheck size={15}/> Perfil verificado
        </span>}

        <p>{bio||'Sua história de bem-estar começa aqui.'}</p>

        {verified&&<a className="mt-outline"
          href="https://www.instagram.com/thaissfelicio/"
          target="_blank" rel="noopener noreferrer">
          <Instagram size={17}/> @thaissfelicio
        </a>}

        <div className="mt-profile-note">
          <ShieldCheck size={17}/>
          <span>
            A Thaís utiliza a mesma área de membros que todos.
            O selo apenas identifica seu perfil oficial.
          </span>
        </div>
      </div>

      <form className="mt-panel" onSubmit={save}>
        <div className="mt-heading">
          <span className="mt-round-icon"><UserRound size={21}/></span>
          <div>
            <h3>Editar apresentação</h3>
            <p>Escolha como seu perfil será exibido nesta tela.</p>
          </div>
        </div>

        <label className="mt-field">
          <span>Nome de exibição</span>
          <input
            maxLength={60}
            value={displayName}
            onChange={e=>{setDisplayName(e.target.value);setSaved(false);}}
            placeholder="Seu nome"
          />
        </label>

        <label className="mt-field">
          <span>Sobre você</span>
          <textarea
            rows={5}
            maxLength={300}
            value={bio}
            onChange={e=>{setBio(e.target.value);setSaved(false);}}
            placeholder="Conte um pouco sobre você e sua jornada..."
          />
        </label>

        <label className="mt-upload">
          <Camera size={19}/>
          <span>Escolher foto de perfil</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={uploadPhoto}
          />
        </label>

        <p className="mt-small-note">JPG, PNG ou WebP, até 1,5 MB.</p>

        <button type="submit" className="mt-primary">
          <Save size={17}/> Salvar apresentação
        </button>

        {saved&&<p className="mt-success">
          <CheckCircle2 size={17}/> Alterações salvas neste navegador.
        </p>}

        <div className="mt-disclaimer">
          <ShieldCheck size={18}/>
          <span>
            Nesta etapa, as alterações são locais:
            não atualizam seu nome, foto ou biografia
            na conta do servidor nem no feed.
          </span>
        </div>
      </form>
    </div>
  </div>;
}