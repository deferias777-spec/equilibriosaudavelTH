import React,{useState} from 'react';
import {Activity,Ruler,Info,RotateCcw,CheckCircle2} from 'lucide-react';
import './MemberToolsPremium.css';

function numeric(value){
  return Number(String(value).replace(',','.'));
}

export default function BodyFatCalculator(){
  const [sex,setSex]=useState('female');
  const [height,setHeight]=useState('');
  const [neck,setNeck]=useState('');
  const [waist,setWaist]=useState('');
  const [hip,setHip]=useState('');
  const [result,setResult]=useState(null);
  const [error,setError]=useState('');

  function calculate(event){
    event.preventDefault();
    setError('');
    setResult(null);

    const h=numeric(height);
    const n=numeric(neck);
    const w=numeric(waist);
    const hp=numeric(hip);

    if(![h,n,w].every(Number.isFinite) ||
       h<=0 || n<=0 || w<=0 ||
       (sex==='female' && (!Number.isFinite(hp)||hp<=0))){
      setError('Preencha todas as medidas obrigatórias com valores válidos.');
      return;
    }

    if(h<100||h>230||n<20||n>65||w<35||w>200||
       (sex==='female'&&(hp<45||hp>210))){
      setError('Confira as medidas. Algum valor está fora do intervalo esperado.');
      return;
    }

    const inches=2.54;
    const hi=h/inches;
    const ni=n/inches;
    const wi=w/inches;
    const hipi=hp/inches;

    let percentage;

    if(sex==='male'){
      const difference=wi-ni;

      if(difference<=0){
        setError('A cintura deve ser maior que o pescoço para este cálculo.');
        return;
      }

      percentage=86.010*Math.log10(difference)
        -70.041*Math.log10(hi)+36.76;
    }else{
      const difference=wi+hipi-ni;

      if(difference<=0){
        setError('Confira as medidas informadas.');
        return;
      }

      percentage=163.205*Math.log10(difference)
        -97.684*Math.log10(hi)-104.912;
    }

    if(!Number.isFinite(percentage)||percentage<2||percentage>75){
      setError('Não foi possível estimar. Confira as medidas.');
      return;
    }

    setResult(Number(percentage.toFixed(1)));
  }

  function reset(){
    setHeight('');
    setNeck('');
    setWaist('');
    setHip('');
    setResult(null);
    setError('');
  }

  return <div className="mt-premium">
    <section className="mt-hero">
      <span className="mt-eyebrow">FERRAMENTAS DE BEM-ESTAR</span>
      <h2>Conheça melhor <em>seu corpo.</em></h2>
      <p>
        Uma estimativa do percentual de gordura corporal
        a partir de medidas simples, sem equipamentos especiais.
      </p>
      <div className="mt-hero-icon"><Activity size={43}/></div>
    </section>

    <div className="mt-two-columns">
      <form className="mt-panel" onSubmit={calculate}>
        <div className="mt-heading">
          <span className="mt-round-icon"><Ruler size={21}/></span>
          <div>
            <h3>Suas medidas</h3>
            <p>Informe as circunferências em centímetros.</p>
          </div>
        </div>

        <label className="mt-field">
          <span>Sexo usado na fórmula</span>
          <select value={sex} onChange={e=>{
            setSex(e.target.value);
            setResult(null);
          }}>
            <option value="female">Feminino</option>
            <option value="male">Masculino</option>
          </select>
        </label>

        <div className="mt-fields-grid">
          <label className="mt-field">
            <span>Altura (cm)</span>
            <input type="number" inputMode="decimal"
              min="100" max="230" step="0.1"
              placeholder="Ex.: 165"
              value={height}
              onChange={e=>setHeight(e.target.value)}/>
          </label>

          <label className="mt-field">
            <span>Pescoço (cm)</span>
            <input type="number" inputMode="decimal"
              min="20" max="65" step="0.1"
              placeholder="Ex.: 34"
              value={neck}
              onChange={e=>setNeck(e.target.value)}/>
          </label>

          <label className="mt-field">
            <span>Cintura (cm)</span>
            <input type="number" inputMode="decimal"
              min="35" max="200" step="0.1"
              placeholder="Ex.: 78"
              value={waist}
              onChange={e=>setWaist(e.target.value)}/>
          </label>

          {sex==='female'&&
            <label className="mt-field">
              <span>Quadril (cm)</span>
              <input type="number" inputMode="decimal"
                min="45" max="210" step="0.1"
                placeholder="Ex.: 98"
                value={hip}
                onChange={e=>setHip(e.target.value)}/>
            </label>}
        </div>

        {error&&<p className="mt-error" role="alert">{error}</p>}

        <div className="mt-actions">
          <button type="submit" className="mt-primary">
            Calcular estimativa <Activity size={17}/>
          </button>
          <button type="button" className="mt-outline" onClick={reset}>
            <RotateCcw size={16}/> Limpar
          </button>
        </div>
      </form>

      <div className="mt-panel mt-result-panel">
        <div className="mt-heading">
          <span className="mt-round-icon"><Activity size={21}/></span>
          <div>
            <h3>Seu resultado</h3>
            <p>Estimativa pela fórmula da Marinha dos EUA.</p>
          </div>
        </div>

        <div className="mt-gauge"
          style={{'--mt-progress':`${result===null?0:Math.min(100,result/60*100)}%`}}>
          <div className="mt-gauge-inner">
            <span>{result===null?'—':`${result.toFixed(1).replace('.',',')}%`}</span>
            <small>gordura corporal estimada</small>
          </div>
        </div>

        <p className="mt-result-description">
          {result===null
            ?'Preencha suas medidas e calcule para visualizar a estimativa.'
            :'Resultado calculado. Utilize a mesma técnica de medição para acompanhar mudanças ao longo do tempo.'}
        </p>

        <div className="mt-disclaimer">
          <Info size={18}/>
          <span>
            Este cálculo é uma estimativa e não substitui
            avaliação profissional. O método tem limitações
            e não serve como diagnóstico de saúde.
          </span>
        </div>
      </div>
    </div>

    <section className="mt-panel mt-guide">
      <div className="mt-heading">
        <span className="mt-round-icon"><CheckCircle2 size={21}/></span>
        <div>
          <h3>Como medir corretamente</h3>
          <p>Pequenos cuidados fazem diferença no resultado.</p>
        </div>
      </div>

      <div className="mt-guide-grid">
        <div><strong>01 · Pescoço</strong><p>Meça logo abaixo da laringe, sem apertar a fita.</p></div>
        <div><strong>02 · Cintura</strong><p>Para mulheres, meça a cintura natural. Para homens, meça na altura do umbigo.</p></div>
        <div><strong>03 · Quadril</strong><p>Quando aplicável, meça na região de maior circunferência.</p></div>
        <div><strong>04 · Consistência</strong><p>Mantenha a fita nivelada, sem comprimir a pele, e repita sempre do mesmo modo.</p></div>
      </div>
    </section>
  </div>;
}