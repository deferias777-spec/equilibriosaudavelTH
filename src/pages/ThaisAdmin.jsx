import PremiumSelect from '../components/PremiumSelect';
import CommunityAdmin from '../components/CommunityAdmin';
import AdminRecipes from '../components/AdminRecipes';
import React,{useEffect,useState} from 'react';
import {api} from '../lib/api';
import './ThaisAdmin.css';

const money=n=>n===null||n===undefined?'Indisponível':
  new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n/100);
const date=d=>d?new Date(d).toLocaleDateString('pt-BR'):'—';
const labels={
  ATIVO:'Ativo',VENCENDO:'Vencendo',VENCIDO:'Vencido',
  SEM_ACESSO:'Sem acesso',APPROVED:'Aprovado',
  PENDING:'Pendente',REJECTED:'Recusado',
  FAILED:'Falhou',CANCELLED:'Cancelado'
};

function Status({value}){
  return <span className={'tp-status tp-'+String(value).toLowerCase()}>
    {labels[value]||value||'—'}
  </span>;
}

function CSV({rows,name}){
  function exportFile(){
    if(!rows.length)return;
    const keys=Object.keys(rows[0]);
    const quote=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
    const text='\ufeff'+[
      keys.join(';'),
      ...rows.map(r=>keys.map(k=>quote(r[k])).join(';'))
    ].join('\r\n');
    const url=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');
    a.href=url;a.download=name;a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  return <button onClick={exportFile} disabled={!rows.length}>Exportar CSV</button>;
}

export default function ThaisAdmin(){
  const [session,setSession]=useState(null);
  const [username,setUsername]=useState('ThaisFelicio');
  const [password,setPassword]=useState('');
  const [tab,setTab]=useState('overview');
  const [overview,setOverview]=useState(null);
  const [users,setUsers]=useState({items:[],total:0,take:25});
  const [payments,setPayments]=useState({items:[],total:0,take:25});
  const [expenses,setExpenses]=useState([]);
  const [detail,setDetail]=useState(null);
  const [q,setQ]=useState('');
  const [status,setStatus]=useState('ALL');
  const [page,setPage]=useState(1);
  const [days,setDays]=useState(30);
  const [refresh,setRefresh]=useState(0);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [expense,setExpense]=useState({
    description:'',category:'Operacional',amount:'',
    occurredAt:new Date().toLocaleDateString('en-CA')
  });

  const logged=!!session?.authenticated;
  const reload=()=>setRefresh(x=>x+1);

  useEffect(()=>{
    api('/admin/session').then(setSession)
      .catch(()=>setSession({authenticated:false}));
  },[]);

  useEffect(()=>{
    if(!logged)return;
    let live=true;
    api('/admin/overview?days='+days)
      .then(v=>{if(live)setOverview(v)})
      .catch(e=>{if(live)setError(e.message)});
    return()=>{live=false};
  },[logged,days,refresh]);

  useEffect(()=>{
    setQ('');setPage(1);setStatus('ALL');
  },[tab]);

  useEffect(()=>{
    if(!logged)return;
    let live=true;
    const load=async()=>{
      try{
        if(tab==='users'||tab==='expiry'){
          const v=await api('/admin/users?page='+page+'&q='+encodeURIComponent(q));
          if(live)setUsers(v);
        }
        if(tab==='payments'){
          const v=await api('/admin/payments?page='+page+
            '&q='+encodeURIComponent(q)+'&status='+status);
          if(live)setPayments(v);
        }
        if(tab==='finance'){
          const v=await api('/admin/expenses');
          if(live)setExpenses(v);
        }
      }catch(e){if(live)setError(e.message)}
    };
    load();
    return()=>{live=false};
  },[logged,tab,page,q,status,refresh]);

  async function login(e){
    e.preventDefault();setBusy(true);setError('');
    try{
      const v=await api('/admin/login',{
        method:'POST',body:JSON.stringify({username,password})
      });
      setSession({authenticated:true,username:v.username});
      setPassword('');
    }catch(e){setError(e.message)}
    finally{setBusy(false)}
  }

  async function logout(){
    try{
      await api('/admin/logout',{method:'POST'});
      setSession({authenticated:false});setOverview(null);
    }catch(e){setError(e.message)}
  }

  async function openUser(id){
    try{setDetail(await api('/admin/users/'+id))}
    catch(e){setError(e.message)}
  }

  async function addExpense(e){
    e.preventDefault();setBusy(true);setError('');
    const amount=Math.round(Number(expense.amount.replace(',','.'))*100);
    try{
      await api('/admin/expenses',{
        method:'POST',
        body:JSON.stringify({
          description:expense.description,category:expense.category,
          amount,occurredAt:new Date(expense.occurredAt+'T12:00:00').toISOString()
        })
      });
      setExpense({...expense,description:'',amount:''});
      reload();
    }catch(e){setError(e.message)}
    finally{setBusy(false)}
  }

  async function deleteExpense(id){
    if(!window.confirm('Excluir esta despesa?'))return;
    try{await api('/admin/expenses/'+id,{method:'DELETE'});reload()}
    catch(e){setError(e.message)}
  }

  const tabs=[
    ['overview','Visão geral'],['users','Usuários'],
    ['payments','Pagamentos'],['finance','Financeiro'],
    ['expiry','Vencimentos'],['community','Comunidade'],['recipes','Receitas']
  ];

  if(session===null)return <main className="tp-login">Verificando sessão...</main>;

  if(!logged)return <main className="tp-login">
    <form className="tp-login-card" onSubmit={login}>
      <span className="tp-overline">EQUILÍBRIO SAUDÁVEL</span>
      <h1>Painel da Thaís</h1>
      <p>Administração e gestão financeira</p>
      <label>Usuário<input required value={username}
        onChange={e=>setUsername(e.target.value)}/></label>
      <label>Senha<input required type="password" value={password}
        onChange={e=>setPassword(e.target.value)}/></label>
      {error&&<p className="tp-error">{error}</p>}
      <button className="tp-primary" disabled={busy}>
        {busy?'Entrando...':'Entrar no painel'}
      </button>
    </form>
  </main>;

  const rows=tab==='payments'?payments.items:users.items;
  const expiryRows=users.items.filter(u=>
    u.accessStatus==='VENCIDO'||u.accessStatus==='VENCENDO'
  );

  return <main className="tp-layout">
    <aside className="tp-sidebar">
      <div className="tp-brand">
  <img
    src="/images/logo.png"
    alt="Equilíbrio Saudável"
    className="tp-brand-logo"
  />
</div>
      <p className="tp-overline">MENU PRINCIPAL</p>
      <nav>{tabs.map(([id,label])=>
        <button key={id} className={tab===id?'active':''}
          onClick={()=>{setTab(id);setError('')}}>{label}</button>
      )}</nav>
      <div className="tp-bottom">
        <strong>{session.username||'Thaís'}</strong>
        <button onClick={logout}>Sair do painel</button>
      </div>
    </aside>

    <section className="tp-main">
      <header className="tp-header">
        <div>
          <span className="tp-overline">CENTRAL DE CONTROLE</span>
          <h1>{tabs.find(t=>t[0]===tab)?.[1]}</h1>
          <p>Gestão do Equilíbrio Saudável</p>
        </div>
        <div className="tp-actions">
          {tab==='overview'&&<PremiumSelect value={days}
            onChange={e=>setDays(Number(e.target.value))}>
            <option value="7">7 dias</option>
            <option value="30">30 dias</option>
            <option value="90">90 dias</option>
          </PremiumSelect>}
          <button onClick={reload}>Atualizar</button>
        </div>
      </header>

      {error&&<div className="tp-error">
        {error} <button onClick={()=>setError('')}>Fechar</button>
      </div>}

      {tab==='overview'&&<>
        <div className="tp-cards">
          {[
            ['Receita aprovada',money(overview?.income)],
            ['Despesas',money(overview?.outgoing)],
            ['Saldo operacional',money(overview?.balance)],
            ['Usuários',overview?.users??'—']
          ].map(([title,value])=><article key={title}>
            <span>{title}</span><strong>{value}</strong>
          </article>)}
        </div>
        <div className="tp-cards tp-cards-five">
          {[
            ['Ativos',overview?.statuses?.ATIVO],
            ['Vencendo',overview?.statuses?.VENCENDO],
            ['Vencidos',overview?.statuses?.VENCIDO],
            ['Aprovados',overview?.approved],
            ['Pendentes',overview?.pending]
          ].map(([title,value])=><article key={title}>
            <span>{title}</span><strong>{value??'—'}</strong>
          </article>)}
        </div>
        <article className="tp-panel">
          <h2>Pagamentos recentes</h2>
          <div className="tp-scroll"><table><thead><tr>
            <th>Cliente</th><th>Data</th><th>Valor</th><th>Status</th>
          </tr></thead><tbody>
            {(overview?.recent||[]).map(p=><tr key={p.id}>
              <td>{p.email}</td><td>{date(p.createdAt)}</td>
              <td>{money(p.amount)}</td><td><Status value={p.status}/></td>
            </tr>)}
          </tbody></table></div>
        </article>
        <p className="tp-note">
          Valores referentes aos pedidos registrados no período selecionado.
          Não representam necessariamente o saldo liquidado no Mercado Pago.
        </p>
      </>}

      {(tab==='users'||tab==='expiry')&&<article className="tp-panel">
        <div className="tp-panel-head">
          <h2>{tab==='users'?'Clientes cadastrados':'Controle de vencimentos'}</h2>
          <CSV name="usuarios.csv" rows={users.items.map(u=>({
            nome:u.name,email:u.email,cadastro:date(u.createdAt),
            vencimento:date(u.accessUntil),situacao:labels[u.accessStatus]
          }))}/>
        </div>
        <input className="tp-search" placeholder="Pesquisar nome ou e-mail"
          value={q} onChange={e=>{setQ(e.target.value);setPage(1)}}/>
        {tab==='expiry'&&<p className="tp-note">
          Exibindo vencidos e próximos do vencimento da página atual.
        </p>}
        <div className="tp-scroll"><table><thead><tr>
          <th>Cliente</th><th>Cadastro</th><th>Última compra</th>
          <th>Vencimento</th><th>Situação</th><th>Detalhes</th>
        </tr></thead><tbody>
          {(tab==='expiry'?expiryRows:users.items).map(u=><tr key={u.id}>
            <td><strong>{u.name}</strong><small>{u.email}</small></td>
            <td>{date(u.createdAt)}</td>
            <td>{date(u.lastPurchase?.createdAt)}</td>
            <td>{date(u.accessUntil)}</td>
            <td><Status value={u.accessStatus}/></td>
            <td><button onClick={()=>openUser(u.id)}>Visualizar</button></td>
          </tr>)}
        </tbody></table></div>
        <div className="tp-pagination">
          <span>{users.total} usuários • Página {page}</span>
          <button disabled={page===1} onClick={()=>setPage(page-1)}>Anterior</button>
          <button disabled={page*users.take>=users.total}
            onClick={()=>setPage(page+1)}>Próxima</button>
        </div>
      </article>}

      {tab==='payments'&&<article className="tp-panel">
        <div className="tp-panel-head">
          <h2>Histórico de pagamentos</h2>
          <CSV name="pagamentos.csv" rows={payments.items.map(p=>({
            email:p.email,valor:money(p.amount),
            data:date(p.createdAt),status:p.status,paymentId:p.paymentId
          }))}/>
        </div>
        <div className="tp-actions">
          <input className="tp-search" placeholder="Pesquisar e-mail"
            value={q} onChange={e=>{setQ(e.target.value);setPage(1)}}/>
          <PremiumSelect value={status} onChange={e=>{
            setStatus(e.target.value);setPage(1)
          }}>
            <option value="ALL">Todos</option>
            <option value="APPROVED">Aprovados</option>
            <option value="PENDING">Pendentes</option>
            <option value="REJECTED">Recusados</option>
            <option value="FAILED">Falhos</option>
            <option value="CANCELLED">Cancelados</option>
          </PremiumSelect>
        </div>
        <div className="tp-scroll"><table><thead><tr>
          <th>Cliente</th><th>Data</th><th>Valor</th>
          <th>Status</th><th>ID pagamento</th><th>Ativação</th>
        </tr></thead><tbody>
          {rows.map(p=><tr key={p.id}>
            <td><strong>{p.user?.name||'Cliente'}</strong><small>{p.email}</small></td>
            <td>{date(p.createdAt)}</td><td>{money(p.amount)}</td>
            <td><Status value={p.status}/></td>
            <td>{p.paymentId||'—'}</td><td>{date(p.activatedAt)}</td>
          </tr>)}
        </tbody></table></div>
        <div className="tp-pagination">
          <span>{payments.total} pagamentos • Página {page}</span>
          <button disabled={page===1} onClick={()=>setPage(page-1)}>Anterior</button>
          <button disabled={page*payments.take>=payments.total}
            onClick={()=>setPage(page+1)}>Próxima</button>
        </div>
      </article>}

      {tab==='finance'&&<>
        <div className="tp-cards">
          {[
            ['Receita aprovada',money(overview?.income)],
            ['Despesas',money(overview?.outgoing)],
            ['Saldo operacional',money(overview?.balance)]
          ].map(([title,value])=><article key={title}>
            <span>{title}</span><strong>{value}</strong>
          </article>)}
        </div>
        <div className="tp-columns">
          <article className="tp-panel">
            <h2>Registrar despesa</h2>
            <form className="tp-form" onSubmit={addExpense}>
              <label>Descrição<input required minLength="3"
                value={expense.description}
                onChange={e=>setExpense({...expense,description:e.target.value})}
                placeholder="Ex.: Hospedagem"/></label>
              <label>Categoria<PremiumSelect value={expense.category}
                onChange={e=>setExpense({...expense,category:e.target.value})}>
                {['Operacional','Marketing','Tecnologia','Serviços','Outros']
                  .map(c=><option key={c}>{c}</option>)}
              </PremiumSelect></label>
              <label>Valor em reais<input required placeholder="29,90"
                value={expense.amount}
                onChange={e=>setExpense({...expense,amount:e.target.value})}/></label>
              <label>Data<input type="date" required
                value={expense.occurredAt}
                onChange={e=>setExpense({...expense,occurredAt:e.target.value})}/></label>
              <button className="tp-primary" disabled={busy}>Registrar despesa</button>
            </form>
          </article>
          <article className="tp-panel">
            <h2>Resumo financeiro</h2>
            <p>Entradas: pedidos aprovados no período selecionado.</p>
            <p>Saídas: despesas cadastradas manualmente.</p>
            <p>Este saldo não inclui necessariamente taxas, estornos
              ou liquidação bancária.</p>
          </article>
        </div>
        <article className="tp-panel">
          <div className="tp-panel-head">
            <h2>Despesas cadastradas</h2>
            <CSV name="despesas.csv" rows={expenses.map(e=>({
              descricao:e.description,categoria:e.category,
              valor:money(e.amount),data:date(e.occurredAt)
            }))}/>
          </div>
          <div className="tp-scroll"><table><thead><tr>
            <th>Descrição</th><th>Categoria</th>
            <th>Data</th><th>Valor</th><th>Ação</th>
          </tr></thead><tbody>
            {expenses.map(e=><tr key={e.id}>
              <td>{e.description}</td><td>{e.category}</td>
              <td>{date(e.occurredAt)}</td><td>{money(e.amount)}</td>
              <td><button onClick={()=>deleteExpense(e.id)}>Excluir</button></td>
            </tr>)}
          </tbody></table></div>
        </article>
      </>}
      {tab==='recipes'&&<AdminRecipes/>}
      {tab==='community'&&<CommunityAdmin/>}
    </section>

    {detail&&<div className="tp-overlay" onClick={()=>setDetail(null)}>
      <article className="tp-modal" onClick={e=>e.stopPropagation()}>
        <button className="tp-close" onClick={()=>setDetail(null)}>Fechar ×</button>
        <span className="tp-overline">FICHA DO CLIENTE</span>
        <h2>{detail.name}</h2><p>{detail.email}</p>
        <p>Cadastro: {date(detail.createdAt)}</p>
        <p>Vencimento: {date(detail.accessUntil)}</p>
        <Status value={detail.accessStatus}/>
        <h3>Histórico de pagamentos</h3>
        <div className="tp-scroll"><table><thead><tr>
          <th>Data</th><th>Valor</th><th>Status</th><th>ID</th>
        </tr></thead><tbody>
          {detail.purchases.map(p=><tr key={p.id}>
            <td>{date(p.createdAt)}</td><td>{money(p.amount)}</td>
            <td><Status value={p.status}/></td><td>{p.paymentId||'—'}</td>
          </tr>)}
        </tbody></table></div>
      </article>
    </div>}
  </main>;
}