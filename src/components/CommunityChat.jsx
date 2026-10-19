import React,{useEffect,useRef,useState} from 'react';
import {api} from '../lib/api';
import {MessageCircle,Lock,Send,RefreshCw} from 'lucide-react';

export default function Community(){
  const [messages,setMessages]=useState([]);
  const [locked,setLocked]=useState(false);
  const [body,setBody]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [loaded,setLoaded]=useState(false);
  const end=useRef(null);

  async function refresh(){
    try{
      const result=await api('/community');
      setMessages(result.messages||[]);
      setLocked(!!result.locked);
      setLoaded(true);
    }catch(e){
      setError(e.message);
    }
  }

  useEffect(()=>{
    refresh();
    const interval=setInterval(refresh,4000);
    return()=>clearInterval(interval);
  },[]);

  async function send(e){
    e.preventDefault();

    if(!body.trim()||busy||locked)return;

    setBusy(true);
    setError('');

    try{
      await api('/community/messages',{
        method:'POST',
        body:JSON.stringify({body})
      });

      setBody('');
      await refresh();
      end.current?.scrollIntoView({behavior:'smooth'});
    }catch(e){
      setError(e.message);
      await refresh();
    }finally{
      setBusy(false);
    }
  }

  return <div style={{
    maxWidth:960,margin:'0 auto',display:'grid',gap:18
  }}>
    <div className="card-surface p-6">
      <div style={{
        display:'flex',alignItems:'center',
        justifyContent:'space-between',gap:12,flexWrap:'wrap'
      }}>
        <div>
          <h2 className="text-2xl" style={{
            display:'flex',alignItems:'center',gap:10
          }}>
            <MessageCircle size={24}/> Comunidade
          </h2>
          <p className="text-gray-500 mt-2">
            Compartilhe experiências e converse com outros membros.
          </p>
        </div>

        <span style={{
          padding:'8px 14px',borderRadius:20,
          background:locked?'#fff0f2':'#eef8f0',
          color:locked?'#9e344a':'#267a47',
          fontWeight:700,fontSize:13
        }}>
          {locked?'Conversa pausada':'Conversa liberada'}
        </span>
      </div>

      {locked&&<p style={{
        marginTop:16,padding:14,
        borderRadius:12,background:'#fff4f6',
        display:'flex',gap:9,alignItems:'center'
      }}>
        <Lock size={18}/>
        A administração pausou o chat para comunicados.
        Você pode continuar lendo as mensagens.
      </p>}
    </div>

    <div className="card-surface" style={{overflow:'hidden'}}>
      <div style={{
        padding:15,borderBottom:'1px solid #f0e4e8',
        display:'flex',justifyContent:'space-between'
      }}>
        <strong>Mensagens recentes</strong>
        <button type="button" onClick={refresh}
          aria-label="Atualizar mensagens">
          <RefreshCw size={17}/>
        </button>
      </div>

      <div style={{
        height:430,overflowY:'auto',padding:20,
        display:'flex',flexDirection:'column',gap:14
      }}>
        {!loaded&&<p>Carregando comunidade...</p>}

        {loaded&&!messages.length&&
          <p className="text-gray-500">
            Ainda não há mensagens. Comece uma conversa!
          </p>}

        {messages.map(m=><div key={m.id} style={{
          background:m.isAdmin?'#fff0f5':'#faf7f8',
          border:m.isAdmin?'1px solid #eac0d0':'1px solid #eee',
          borderRadius:14,padding:14
        }}>
          <div style={{
            display:'flex',justifyContent:'space-between',
            gap:12,flexWrap:'wrap'
          }}>
            <strong style={{color:m.isAdmin?'#a03b68':'#493c42'}}>
              {m.isAdmin?'📢 ':''}{m.author}
            </strong>
            <small className="text-gray-500">
              {new Date(m.createdAt).toLocaleString('pt-BR')}
            </small>
          </div>
          <p style={{
            marginTop:8,whiteSpace:'pre-wrap',
            overflowWrap:'anywhere'
          }}>
            {m.body}
          </p>
        </div>)}
        <div ref={end}/>
      </div>

      <form onSubmit={send} style={{
        borderTop:'1px solid #eee',
        padding:15,display:'flex',gap:10
      }}>
        <input className="field" maxLength={800}
          placeholder={locked?
            'Chat pausado pela administração':
            'Escreva sua mensagem...'}
          value={body}
          onChange={e=>setBody(e.target.value)}
          disabled={locked||busy}
        />
        <button className="btn"
          disabled={locked||busy||!body.trim()}>
          <Send size={17}/> Enviar
        </button>
      </form>
    </div>

    {error&&<p style={{color:'#b53952'}}>{error}</p>}

    <p className="text-xs text-gray-500">
      Respeite os demais participantes. Não compartilhe
      senhas, dados bancários ou informações pessoais sensíveis.
    </p>
  </div>;
}