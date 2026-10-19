import React,{useState} from 'react';
import {Link} from 'react-router-dom';
import {api} from '../lib/api';
import './PixCheckout.css';

export default function PixCheckout(){
  const [name,setName]=useState('');
  const [email,setEmail]=useState('');
  const [cpf,setCpf]=useState('');
  const [pix,setPix]=useState(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [copied,setCopied]=useState(false);

  async function generate(e){
    e.preventDefault();
    setBusy(true);
    setError('');
    setPix(null);
    try{
      const data=await api('/pix/create',{
        method:'POST',
        body:JSON.stringify({name,email,cpf})
      });
      setPix(data);
    }catch(e){
      setError(e.message);
    }finally{
      setBusy(false);
    }
  }

  async function copy(){
    try{
      await navigator.clipboard.writeText(pix.copyPaste);
      setCopied(true);
    }catch{
      setError('Não foi possível copiar automaticamente. Selecione o código manualmente.');
    }
  }

  return <main className="pix-page">
    <div className="pix-card">
      <Link to="/membros">← Voltar</Link>
      <div className="es-auth-brand"><img src="/images/logo.png" alt="Equilíbrio Saudável" className="es-brand-mark es-brand-mark--checkout" /></div><h1>Seu acesso começa aqui</h1>
      <p>30 dias de receitas e ferramentas exclusivas.</p>
      <div className="pix-price">R$ 29,90</div>
      {!pix ? <form onSubmit={generate}>
        <label>Nome completo</label>
        <input value={name} onChange={e=>setName(e.target.value)} required minLength={2}/>
        <label>E-mail</label>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/>
        <label>CPF para emissão do Pix</label>
        <input value={cpf} onChange={e=>setCpf(e.target.value)} placeholder="Somente números" inputMode="numeric" maxLength={14} required/>
        <button disabled={busy}>{busy?'Gerando Pix...':'Gerar Pix de R$ 29,90'}</button>
      </form> : <div className="pix-result">
        <h2>Escaneie para pagar</h2>
        <img src={'data:image/png;base64,'+pix.qrBase64} alt="QR Code Pix Mercado Pago"/>
        <label>Pix Copia e Cola</label>
        <textarea readOnly value={pix.copyPaste} rows={4}/>
        <button onClick={copy}>{copied?'Código copiado!':'Copiar código Pix'}</button>
        <p>Após pagar, aguarde a confirmação oficial. A criação de conta será liberada somente depois da validação do pagamento.</p>
        <p>Pedido: {pix.orderId}</p>
      </div>}
      {error && <p className="pix-error">{error}</p>}
    </div>
  </main>;
}