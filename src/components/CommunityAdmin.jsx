import React,{useEffect,useState} from 'react';
import {api} from '../lib/api';

export default function CommunityAdmin(){
  const [locked,setLocked]=useState(false);
  const [messages,setMessages]=useState([]);
  const [body,setBody]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');

  async function load(){
    try{
      const data=await api('/admin/community');
      setLocked(data.locked);
      setMessages(data.messages||[]);
    }catch(e){setError(e.message)}
  }

  useEffect(()=>{
    load();
    const timer=setInterval(load,5000);
    return()=>clearInterval(timer);
  },[]);

  async function changeLock(){
    setBusy(true);setError('');setNotice('');

    try{
      const result=await api('/admin/community',{
        method:'PATCH',
        body:JSON.stringify({locked:!locked})
      });

      setLocked(result.locked);
      setNotice(result.locked?
        'Chat travado. Somente a administração pode publicar.':
        'Chat liberado para os membros.');
    }catch(e){setError(e.message)}
    finally{setBusy(false)}
  }

  async function announce(e){
    e.preventDefault();
    setBusy(true);setError('');setNotice('');

    try{
      await api('/admin/community/messages',{
        method:'POST',
        body:JSON.stringify({body})
      });

      setBody('');
      setNotice('Comunicado publicado!');
      await load();
    }catch(e){setError(e.message)}
    finally{setBusy(false)}
  }

  async function remove(id){
    if(!confirm('Excluir esta mensagem para todos os membros?'))
      return;

    try{
      await api('/admin/community/messages/'+id,{
        method:'DELETE'
      });
      await load();
    }catch(e){setError(e.message)}
  }

  return <div style={{display:'grid',gap:20}}>
    <article className="tp-panel">
      <h2>Controle da comunidade</h2>
      <p style={{margin:'12px 0'}}>
        {locked?
          'O chat está travado. Membros podem ler, mas não enviar.':
          'O chat está aberto para todos os membros ativos.'}
      </p>

      <button className="tp-primary" disabled={busy}
        onClick={changeLock}>
        {locked?'Liberar conversa':'Travar conversa'}
      </button>

      {notice&&<p style={{color:'#247b47',marginTop:12}}>
        {notice}
      </p>}
      {error&&<p style={{color:'#b53952',marginTop:12}}>
        {error}
      </p>}
    </article>

    <article className="tp-panel">
      <h2>Publicar comunicado</h2>
      <p style={{margin:'10px 0'}}>
        Seus comunicados aparecem em destaque mesmo
        quando o chat está travado.
      </p>

      <form onSubmit={announce}
        style={{display:'grid',gap:12}}>
        <textarea
          required
          maxLength={800}
          rows={4}
          style={{
            width:'100%',padding:14,
            border:'1px solid #e7d6de',
            borderRadius:12
          }}
          placeholder="Escreva seu comunicado..."
          value={body}
          onChange={e=>setBody(e.target.value)}
        />
        <button className="tp-primary"
          disabled={busy||!body.trim()}>
          Publicar comunicado
        </button>
      </form>
    </article>

    <article className="tp-panel">
      <h2>Moderação das mensagens</h2>
      <div style={{display:'grid',gap:12,marginTop:18}}>
        {messages.map(m=><div key={m.id} style={{
          border:'1px solid #eee',
          borderRadius:12,padding:14
        }}>
          <div style={{
            display:'flex',justifyContent:'space-between',
            gap:12,alignItems:'center'
          }}>
            <strong>{m.author}{m.isAdmin?' • Administração':''}</strong>
            <button onClick={()=>remove(m.id)}>Excluir</button>
          </div>
          <p style={{
            marginTop:9,whiteSpace:'pre-wrap',
            overflowWrap:'anywhere'
          }}>
            {m.body}
          </p>
          <small>
            {new Date(m.createdAt).toLocaleString('pt-BR')}
          </small>
        </div>)}
      </div>
    </article>
  </div>;
}