
import React,{
  useState,
  useRef,
  useEffect,
  useMemo
} from 'react';

import {ChevronDown,Check} from 'lucide-react';
import './PremiumSelect.css';

export default function PremiumSelect({
  children,
  value,
  defaultValue,
  onChange,
  disabled=false,
  required=false,
  name,
  id,
  className='',
  style,
  'aria-label':ariaLabel,
  ...rest
}) {
  const [open,setOpen] = useState(false);
  const [internalValue,setInternalValue] = useState(defaultValue);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const optionRefs = useRef([]);

  const options = useMemo(()=>{
    const result=[];

    function collect(nodes) {
      React.Children.forEach(nodes,child=>{
        if (!React.isValidElement(child)) return;

        if (child.type === 'option') {
          result.push({
            value:String(
              child.props.value ??
              child.props.children ??
              ''
            ),
            label:child.props.children,
            disabled:!!child.props.disabled
          });
        } else if (child.type === 'optgroup') {
          collect(child.props.children);
        }
      });
    }

    collect(children);
    return result;
  },[children]);

  const controlled = value !== undefined;
  const selected = String(
    controlled ? (value ?? '') : (internalValue ?? options[0]?.value ?? '')
  );

  const selectedOption = options.find(o=>o.value===selected);

  useEffect(()=>{
    function close(e) {
      if (!rootRef.current?.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener('pointerdown',close);
    return ()=>document.removeEventListener('pointerdown',close);
  },[]);

  function choose(option) {
    if (option.disabled) return;

    if (!controlled) setInternalValue(option.value);

    onChange?.({
      target:{
        value:option.value,
        name,
        id
      },
      currentTarget:{
        value:option.value,
        name,
        id
      }
    });

    setOpen(false);
    buttonRef.current?.focus();
  }

  function onKeyDown(e) {
    if (disabled) return;

    if (e.key==='Escape') {
      setOpen(false);
      buttonRef.current?.focus();
      return;
    }

    if (e.key==='Enter' || e.key===' ') {
      e.preventDefault();

      if (!open) {
        setOpen(true);
      } else {
        const active = document.activeElement;
        const index = optionRefs.current.indexOf(active);

        if (index>=0) choose(options[index]);
      }
      return;
    }

    if (e.key==='ArrowDown' || e.key==='ArrowUp') {
      e.preventDefault();

      if (!open) setOpen(true);

      const enabled = options
        .map((o,i)=>({...o,index:i}))
        .filter(o=>!o.disabled);

      if (!enabled.length) return;

      const current = enabled.findIndex(o=>o.value===selected);
      const direction = e.key==='ArrowDown'?1:-1;

      const next = enabled[
        (current+direction+enabled.length)%enabled.length
      ];

      optionRefs.current[next.index]?.focus();
    }
  }

  return <div
    ref={rootRef}
    className={'es-premium-select '+className}
    style={style}
    onKeyDown={onKeyDown}
  >
    <button
      ref={buttonRef}
      type="button"
      id={id}
      aria-label={ariaLabel}
      aria-haspopup="listbox"
      aria-expanded={open}
      disabled={disabled}
      className={'es-premium-select-trigger '+(open?'open':'')}
      onClick={()=>setOpen(v=>!v)}
    >
      <span>{selectedOption?.label || 'Selecione uma opção'}</span>
      <ChevronDown size={18}/>
    </button>

    {name && <input
      type="hidden"
      name={name}
      value={selected}
      required={required}
    />}

    {open && <div
      className="es-premium-select-menu"
      role="listbox"
      aria-label={ariaLabel}
    >
      {options.map((option,index)=>
        <button
          key={option.value+'-'+index}
          ref={el=>optionRefs.current[index]=el}
          type="button"
          role="option"
          aria-selected={selected===option.value}
          disabled={option.disabled}
          className={
            'es-premium-select-option '+
            (selected===option.value?'selected':'')
          }
          onClick={()=>choose(option)}
        >
          <span>{option.label}</span>
          {selected===option.value && <Check size={16}/>}
        </button>
      )}
    </div>}
  </div>;
}
