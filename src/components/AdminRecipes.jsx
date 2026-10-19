import PremiumSelect from './PremiumSelect';
import React,{useEffect,useState} from 'react';
import {api} from '../lib/api';

const empty={
  name:'',category:'Almoço',description:'',
  image:'',time:25,servings:2,difficulty:'Fácil',
  ingredients:[],steps:[],tip:'',allergens:'',published:true
};

const inputStyle={
  width:'100%',padding:12,border:'1px solid #ead9e0',
  borderRadius:10,background:'#fff',color:'#493c42'
};

const buttonStyle={
  padding:'11px 16px',borderRadius:10,
  border:'1px solid #e8d7df',background:'#fff',
  color:'#88546a',cursor:'pointer'
};

function Lines({label,value,onChange}) {
  return <label style={{display:'grid',gap:7}}>
    <strong>{label}</strong>
    <textarea
      rows={5}
      style={inputStyle}
      value={(value||[]).join('\n')}
      onChange={e=>onChange(
        e.target.value.split('\n').map(x=>x.trim()).filter(Boolean)
      )}
      placeholder="Um item por linha"
    />
  </label>;
}

async function processImage(file) {
  if (!file || !file.type.startsWith('image/'))
    throw Error('Selecione uma imagem válida.');

  if(file.size > 12*1024*1024)
    throw Error('A imagem original deve ter até 12 MB.');

  const image=await createImageBitmap(file);

  try {
    const canvas=document.createElement('canvas');
    const ctx=canvas.getContext('2d');

    if(!ctx)throw Error('Não foi possível processar a imagem.');

    let width=Math.min(image.width,700);
    let height=Math.round(image.height*width/image.width);

    for(let attempt=0;attempt<10;attempt++){
      canvas.width=Math.max(100,Math.round(width));
      canvas.height=Math.max(100,Math.round(height));

      ctx.drawImage(image,0,0,canvas.width,canvas.height);

      const result=canvas.toDataURL(
        'image/jpeg',Math.max(.35,.78-attempt*.055)
      );

      if(result.length<=55000)return result;

      width*=.83;
      height*=.83;
    }

    throw Error('Imagem muito grande para armazenamento.');
  } finally {
    image.close();
  }
}

export default function AdminRecipes(){
  const [items,setItems]=useState([]);
  const [current,setCurrent]=useState(null);
  const [search,setSearch]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');

  async function load(){
    try{
      const result=await api('/admin/recipes');
      setItems(result);
    }catch(e){setError(e.message)}
  }

  useEffect(()=>{load()},[]);

  const update=(key,value)=>
    setCurrent(old=>({...old,[key]:value}));

  function edit(recipe){
    setError('');setNotice('');
    setCurrent({
      ...empty,...recipe,
      ingredients:[...(recipe.ingredients||[])],
      steps:[...(recipe.steps||[])]
    });
  }

  async function save(e){
    e.preventDefault();
    setBusy(true);setError('');setNotice('');

    try{
      if(!current.image)
        throw Error('Adicione uma foto principal.');

      if(!current.ingredients.length||!current.steps.length)
        throw Error('Preencha ingredientes e preparo.');

      const existing=Number.isInteger(current.id);
      const url=existing
        ? '/admin/recipes/'+current.id
        : '/admin/recipes';

      await api(url,{
        method:existing?'PUT':'POST',
        body:JSON.stringify(current)
      });

      await load();
      setCurrent(null);
      setNotice('Receita salva com sucesso!');
    }catch(e){
      setError(e.message);
    }finally{
      setBusy(false);
    }
  }

  async function remove(recipe){
    if(!window.confirm('Ocultar esta receita da área de membros?'))
      return;

    try{
      await api('/admin/recipes/'+recipe.id,{method:'DELETE'});
      await load();
      setNotice('Receita ocultada.');
    }catch(e){setError(e.message)}
  }

  const visible=items.filter(r=>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return <div style={{display:'grid',gap:20}}>
    <div style={{
      display:'flex',justifyContent:'space-between',
      gap:12,alignItems:'center',flexWrap:'wrap'
    }}>
      <div>
        <h2 style={{margin:0}}>Gerenciar receitas</h2>
        <p style={{color:'#987e8b'}}>
          Cadastre, edite e publique receitas sem mexer no código.
        </p>
      </div>
      <button
        style={{...buttonStyle,background:'#a66b82',color:'white'}}
        onClick={()=>edit(empty)}
      >
        + Nova receita
      </button>
    </div>

    {error&&<p style={{color:'#b53952'}}>{error}</p>}
    {notice&&<p style={{color:'#287c51'}}>{notice}</p>}

    {current ? <form onSubmit={save} style={{
      display:'grid',gap:18,padding:22,
      border:'1px solid #ecdde4',borderRadius:18,
      background:'white'
    }}>
      <div style={{display:'flex',justifyContent:'space-between'}}>
        <h3>{current.id?'Editar receita':'Nova receita'}</h3>
        <button type="button" style={buttonStyle}
          onClick={()=>setCurrent(null)}>Voltar</button>
      </div>

      <label style={{display:'grid',gap:7}}>
        <strong>Nome da receita</strong>
        <input required minLength={3} maxLength={150}
          style={inputStyle} value={current.name}
          onChange={e=>update('name',e.target.value)}/>
      </label>

      <label style={{display:'grid',gap:7}}>
        <strong>Categoria</strong>
        <PremiumSelect style={inputStyle} value={current.category}
          onChange={e=>update('category',e.target.value)}>
          {['Café da manhã','Almoço','Jantar','Lanche','Sobremesa']
            .map(x=><option key={x}>{x}</option>)}
        </PremiumSelect>
      </label>

      <label style={{display:'grid',gap:7}}>
        <strong>Descrição</strong>
        <textarea rows={3} style={inputStyle}
          value={current.description}
          onChange={e=>update('description',e.target.value)}/>
      </label>

      <div style={{
        border:'1px dashed #dcb7c8',borderRadius:14,
        padding:18,display:'grid',gap:12
      }}>
        <strong>Foto principal da receita — somente uma</strong>

        {current.image&&<img
          src={current.image}
          alt="Prévia da receita"
          style={{
            width:'100%',maxWidth:360,height:210,
            objectFit:'cover',borderRadius:12
          }}
        />}

        <input type="file" accept="image/*"
          onChange={async e=>{
            const file=e.target.files?.[0];
            if(!file)return;
            try{
              setBusy(true);
              update('image',await processImage(file));
              setError('');
            }catch(err){setError(err.message)}
            finally{setBusy(false)}
          }}/>

        <span style={{fontSize:12,color:'#987e8b'}}>
          A foto escolhida substitui a anterior. Ela aparecerá
          no cartão e nos detalhes da receita.
        </span>

        <label>
          Ou use o endereço HTTPS de uma imagem:
          <input style={inputStyle}
            placeholder="https://..."
            value={current.image.startsWith('data:')?'':current.image}
            onChange={e=>update('image',e.target.value)}/>
        </label>
      </div>

      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',
        gap:12
      }}>
        <label>Tempo (minutos)
          <input type="number" min="1" max="1440"
            style={inputStyle} value={current.time}
            onChange={e=>update('time',Number(e.target.value))}/>
        </label>

        <label>Porções
          <input type="number" min="1" max="100"
            style={inputStyle} value={current.servings}
            onChange={e=>update('servings',Number(e.target.value))}/>
        </label>

        <label>Dificuldade
          <PremiumSelect style={inputStyle} value={current.difficulty}
            onChange={e=>update('difficulty',e.target.value)}>
            <option>Fácil</option>
            <option>Média</option>
            <option>Avançada</option>
          </PremiumSelect>
        </label>
      </div>

      <Lines label="Ingredientes — um por linha"
        value={current.ingredients}
        onChange={value=>update('ingredients',value)}/>

      <Lines label="Modo de preparo — uma etapa por linha"
        value={current.steps}
        onChange={value=>update('steps',value)}/>

      <label>Dica
        <textarea style={inputStyle} rows={2}
          value={current.tip}
          onChange={e=>update('tip',e.target.value)}/>
      </label>

      <label>Alérgenos
        <input style={inputStyle} value={current.allergens}
          onChange={e=>update('allergens',e.target.value)}/>
      </label>

      <label style={{display:'flex',gap:10,alignItems:'center'}}>
        <input type="checkbox" checked={current.published}
          onChange={e=>update('published',e.target.checked)}/>
        Publicar na área de membros
      </label>

      <button type="submit" disabled={busy}
        style={{
          ...buttonStyle,background:'#a66b82',
          color:'white',padding:15
        }}>
        {busy?'Salvando...':'Salvar receita'}
      </button>
    </form> : <>
      <input style={inputStyle}
        placeholder="Pesquisar receitas..."
        value={search}
        onChange={e=>setSearch(e.target.value)}/>

      <div style={{display:'grid',gap:12}}>
        {visible.map(recipe=><div key={recipe.id}
          style={{
            display:'flex',gap:14,alignItems:'center',
            padding:14,background:'white',
            border:'1px solid #f0e1e8',
            borderRadius:14,flexWrap:'wrap'
          }}>
          <img src={recipe.image} alt=""
            style={{
              width:88,height:75,objectFit:'cover',
              borderRadius:10
            }}/>
          <div style={{flex:1,minWidth:160}}>
            <strong>{recipe.name}</strong>
            <p style={{margin:'5px 0',fontSize:12,color:'#9b8290'}}>
              {recipe.category} • {recipe.published?'Publicada':'Oculta'}
            </p>
          </div>
          <button style={buttonStyle}
            onClick={()=>edit(recipe)}>Editar</button>
          <button style={buttonStyle}
            onClick={()=>remove(recipe)}>Ocultar</button>
        </div>)}
      </div>
    </>}
  </div>;
}