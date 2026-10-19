import React,{useEffect,useState} from 'react';
import {
  Trophy,CheckCircle2,Circle,Camera,Scale,
  Activity,Medal,CalendarDays,Trash2,RefreshCw
} from 'lucide-react';
import {api} from '../lib/api';
import './Journey.css';

export default function Journey(){
  const [data,setData]=useState(null);
  const [weight,setWeight]=useState('');
  const [photo,setPhoto]=useState(null);
  const [busy,setBusy]=useState(false);
  const [shareAchievements,setShareAchievements]=useState(null);
  const [shareBusy,setShareBusy]=useState(false);
  const [error,setError]=useState('');
  const [success,setSuccess]=useState('');

  async function load(){
    try{
      setData(await api('/journey'));
    }catch(e){
      setError(e.message);
    }
  }

  useEffect(()=>{load()},[]);

  useEffect(()=>{
    let active=true;

    fetch('/api/journey/feed-settings',{
      credentials:'include'
    })
      .then(async r=>{
        if(!r.ok)throw Error('Preferência indisponível');
        return r.json();
      })
      .then(result=>{
        if(active)setShareAchievements(result.enabled===true);
      })
      .catch(()=>{
        if(active)setShareAchievements(null);
      });

    return ()=>{active=false};
  },[]);

  async function changeSharing(){
    if(shareBusy||shareAchievements===null)return;

    setShareBusy(true);
    setError('');

    try{
      const response=await fetch('/api/journey/feed-settings',{
        method:'PUT',
        credentials:'include',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({enabled:!shareAchievements})
      });

      const result=await response.json().catch(()=>({}));

      if(!response.ok){
        throw Error(result.error||'Não foi possível atualizar a preferência.');
      }

      setShareAchievements(result.enabled===true);
      setSuccess('Preferência de compartilhamento atualizada.');
    }catch(e){
      setError(e.message);
    }finally{
      setShareBusy(false);
    }
  }

  async function run(action){
    setBusy(true);
    setError('');
    setSuccess('');

    try{
      await action();
    }catch(e){
      setError(e.message);
    }finally{
      setBusy(false);
    }
  }

  function toggle(challenge){
    const completed=data.activities.some(
      a=>a.challengeId===challenge.id&&a.day===data.today
    );

    run(async()=>{
      const updated=completed
        ?await api('/journey/activity/'+challenge.id,{
            method:'DELETE'
          })
        :await api('/journey/activity',{
            method:'POST',
            body:JSON.stringify({challengeId:challenge.id})
          });

      setData(updated);
    });
  }

  function saveWeight(e){
    e.preventDefault();

    run(async()=>{
      let updated=await api('/journey/weigh-in',{
        method:'POST',
        body:JSON.stringify({weight:Number(weight)})
      });

      if(photo){
        const response=await fetch('/api/journey/weigh-in/photo',{
          method:'POST',
          credentials:'include',
          headers:{'Content-Type':photo.type},
          body:photo
        });

        const result=await response.json().catch(()=>({}));

        if(!response.ok){
          throw Error(result.error||'Erro ao enviar fotografia');
        }

        updated=await api('/journey');
      }

      setData(updated);
      setWeight('');
      setPhoto(null);
      setSuccess('Check-in salvo na sua conta.');
    });
  }

  function removeWeighIn(id){
    if(!window.confirm('Excluir este registro e sua fotografia?'))return;

    run(async()=>{
      const updated=await api('/journey/weigh-in/'+id,{
        method:'DELETE'
      });
      setData(updated);
    });
  }

  if(!data){
    return <div className="es-journey-loading">
      <RefreshCw size={22}/>
      Carregando sua jornada...
      {error&&<p role="alert">{error}</p>}
    </div>;
  }

  const todayDone=data.activities.filter(a=>a.day===data.today);
  const count=todayDone.length;
  const percentage=Math.round(count/data.challenges.length*100);
  const weights=data.weighIns;
  const first=weights[0];
  const last=weights[weights.length-1];
  const change=first&&last&&weights.length>1
    ?last.weight-first.weight:null;

  return <div className="es-journey">
    <div className="es-journey-privacy">
      <div>
        <strong>Compartilhar minhas conquistas no feed</strong>
        <small>
          Atividades, pontos e troféus podem aparecer na comunidade.
          Peso, medidas e fotos da balança permanecem privados.
        </small>
      </div>
      <button
        type="button"
        disabled={shareBusy||shareAchievements===null}
        aria-pressed={shareAchievements===true}
        onClick={changeSharing}
      >
        {shareBusy
          ?'Salvando...'
          :shareAchievements===null
            ?'Indisponível'
            :shareAchievements
              ?'Ativado'
              :'Desativado'}
      </button>
    </div>
    <header className="es-journey-hero">
      <span className="es-journey-eyebrow">
        <Activity size={15}/> Seu espaço de evolução
      </span>
      <h2>Minha Jornada</h2>
      <p>
        Pequenas escolhas, feitas com constância.
        Acompanhe seus hábitos no seu próprio ritmo.
      </p>

      <div className="es-journey-summary">
        <div>
          <strong>{data.points}</strong>
          <span>Pontos conquistados</span>
        </div>
        <div>
          <strong>{data.badges.filter(b=>b.earned).length}</strong>
          <span>Troféus desbloqueados</span>
        </div>
        <div>
          <strong>{weights.length}</strong>
          <span>Check-ins registrados</span>
        </div>
      </div>
    </header>

    {error&&<p className="es-journey-alert" role="alert">{error}</p>}
    {success&&<p className="es-journey-success" role="status">{success}</p>}

    <section className="es-journey-panel">
      <div className="es-journey-section-title">
        <div>
          <span className="es-journey-eyebrow">Atividades de hoje</span>
          <h3>Desafios do dia a dia</h3>
          <p>Marque apenas o que você realmente realizou.</p>
        </div>
        <strong>{count}/{data.challenges.length}</strong>
      </div>

      <div className="es-journey-progress" role="progressbar"
        aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
        <span style={{width:percentage+'%'}}/>
      </div>

      <div className="es-journey-challenges">
        {data.challenges.map(challenge=>{
          const done=todayDone.some(
            a=>a.challengeId===challenge.id
          );

          return <button
            key={challenge.id}
            type="button"
            disabled={busy}
            className={'es-journey-challenge '+(done?'done':'')}
            onClick={()=>toggle(challenge)}
            aria-pressed={done}
          >
            {done
              ?<CheckCircle2 size={25}/>
              :<Circle size={25}/>}
            <span>
              <strong>{challenge.title}</strong>
              <small>{challenge.description}</small>
            </span>
            <b>+{challenge.points}</b>
          </button>;
        })}
      </div>
    </section>

    <section className="es-journey-panel">
      <div className="es-journey-section-title">
        <div>
          <span className="es-journey-eyebrow">Conquistas</span>
          <h3>Minha coleção de troféus</h3>
          <p>Recompensas por participação e consistência.</p>
        </div>
        <Trophy size={25}/>
      </div>

      <div className="es-journey-badges">
        {data.badges.map(badge=>
          <div key={badge.id}
            className={'es-journey-badge '+(badge.earned?'earned':'')}>
            <div><Medal size={27}/></div>
            <strong>{badge.name}</strong>
            <small>{badge.earned?'Conquistado':'A conquistar'}</small>
          </div>
        )}
      </div>
    </section>

    <section className="es-journey-panel">
      <div className="es-journey-section-title">
        <div>
          <span className="es-journey-eyebrow">
            <CalendarDays size={14}/> Toda sexta-feira
          </span>
          <h3>Acompanhamento de peso</h3>
          <p>Seu histórico é privado e não aparece na comunidade.</p>
        </div>
        <Scale size={26}/>
      </div>

      {data.friday
        ?<form onSubmit={saveWeight} className="es-journey-weigh-form">
          <label>
            <span>Peso atual (kg)</span>
            <input
              type="number"
              min="20"
              max="400"
              step="0.1"
              required
              value={weight}
              onChange={e=>setWeight(e.target.value)}
              placeholder="Ex.: 72,5"
            />
          </label>

          <label className="es-journey-photo">
            <Camera size={21}/>
            <span>{photo?photo.name:'Adicionar foto da balança (opcional)'}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={e=>{
                const file=e.target.files?.[0]||null;
                if(file&&file.size>3*1024*1024){
                  setError('A foto deve ter no máximo 3 MB.');
                  setPhoto(null);
                  return;
                }
                setError('');
                setPhoto(file);
              }}
            />
          </label>

          <button className="es-journey-primary" disabled={busy}>
            {busy?'Salvando...':'Salvar check-in'}
          </button>
        </form>
        :<div className="es-journey-friday-notice">
          <CalendarDays size={23}/>
          <div>
            <strong>Seu próximo check-in é na sexta-feira.</strong>
            <p>
              Nesse dia você poderá registrar o peso e,
              se desejar, enviar uma foto da balança.
            </p>
          </div>
        </div>}

      {weights.length>0&&<>
        <div className="es-journey-weight-summary">
          <div>
            <span>Primeiro registro</span>
            <strong>{first.weight.toLocaleString('pt-BR')} kg</strong>
          </div>
          <div>
            <span>Registro mais recente</span>
            <strong>{last.weight.toLocaleString('pt-BR')} kg</strong>
          </div>
          <div>
            <span>Variação registrada</span>
            <strong>
              {change===null?'—':
                (change>0?'+':'')+
                change.toFixed(1).replace('.',',')+' kg'}
            </strong>
          </div>
        </div>

        <div className="es-journey-history">
          <h4>Histórico de check-ins</h4>
          {[...weights].reverse().map(item=>
            <div className="es-journey-history-row" key={item.id}>
              <div>
                <strong>
                  {new Date(item.day+'T12:00:00')
                    .toLocaleDateString('pt-BR')}
                </strong>
                <span>
                  {item.weight.toLocaleString('pt-BR')} kg
                  {item.hasPhoto?' · Foto registrada':''}
                </span>
              </div>
              <div className="es-journey-history-actions">
                {item.hasPhoto&&
                  <button type="button"
                    onClick={async()=>{
                      try{
                        const res=await fetch(
                          '/api/journey/weigh-in/'+item.id+'/photo',
                          {credentials:'include'}
                        );
                        if(!res.ok)throw Error('Não foi possível abrir a foto.');
                        const blob=await res.blob();
                        const url=URL.createObjectURL(blob);
                        const win=window.open(url,'_blank');
                        if(!win){
                          const a=document.createElement('a');
                          a.href=url;
                          a.download='check-in.'+
                            (blob.type==='image/png'?'png':
                            blob.type==='image/webp'?'webp':'jpg');
                          a.click();
                        }
                        setTimeout(()=>URL.revokeObjectURL(url),60000);
                      }catch(e){setError(e.message)}
                    }}>
                    <Camera size={18}/> Ver foto
                  </button>}
                <button type="button"
                  disabled={busy}
                  onClick={()=>removeWeighIn(item.id)}
                  aria-label="Excluir check-in">
                  <Trash2 size={18}/>
                </button>
              </div>
            </div>
          )}
        </div>
      </>}

      <p className="es-journey-disclaimer">
        O peso é apenas um indicador e pode variar por hidratação,
        horário e outros fatores. Os registros não substituem
        acompanhamento profissional.
      </p>
    </section>
  </div>;
}