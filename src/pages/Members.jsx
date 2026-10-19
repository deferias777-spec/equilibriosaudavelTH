import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, LockKeyhole, Heart, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Members.css';

export default function Members() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [mode, setMode] = useState(
    params.get('modo') === 'login' ? 'login' : 'choice'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setMode(params.get('modo') === 'login' ? 'login' : 'choice');
    setError('');
  }, [params]);

  useEffect(() => {
    if (user) navigate('/painel', { replace: true });
  }, [user, navigate]);

  async function handleLogin(event) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      await login(email, password);
      navigate('/painel');
    } catch (err) {
      setError(err.message || 'Não foi possível entrar. Verifique seus dados.');
    } finally {
      setBusy(false);
    }
  }

  if (user) return null;

  return (
    <main className="members-page">
      <div className="members-glow members-glow--one" />
      <div className="members-glow members-glow--two" />

      <section className="members-card">
        <Link to="/" className="members-back">
          <ArrowLeft size={17} />
          Voltar ao início
        </Link>

        <div className="members-icon">
          {mode === 'login'
            ? <LockKeyhole size={26} strokeWidth={1.7} />
            : <Heart size={27} strokeWidth={1.7} />}
        </div>

        {mode === 'choice' ? (
          <>
            <img src="/images/logo.png" alt="Equilíbrio Saudável" className="es-brand-mark es-brand-mark--auth" /><span className="members-eyebrow">
              
              SUA JORNADA COMEÇA AQUI
            </span>

            <h1>Seu espaço <em>especial</em></h1>

            <p className="members-description">
              Um cantinho preparado para cuidar de você,
              com mais equilíbrio, leveza e bem-estar.
            </p>

            <div className="members-benefits">
              <span><CheckCircle2 size={16} /> Receitas exclusivas</span>
              <span><CheckCircle2 size={16} /> Conteúdos para membros</span>
              <span><CheckCircle2 size={16} /> Acesso por 30 dias</span>
            </div>

            <button
              type="button"
              className="members-primary"
              onClick={() => setMode('login')}
            >
              Já tenho conta
              <ArrowRight size={19} />
            </button>

            <Link className="members-secondary" to="/checkout-pix">
              Quero ser membro
              <strong>R$ 29,90</strong>
            </Link>

            <p className="members-footnote">
              Pagamento via Pix pelo Mercado Pago.
            </p>
          </>
        ) : (
          <>
            <img src="/images/logo.png" alt="Equilíbrio Saudável" className="es-brand-mark es-brand-mark--auth" /><span className="members-eyebrow">
              ÁREA EXCLUSIVA
            </span>

            <h1>Boas-vindas <em>de volta!</em></h1>

            <p className="members-description">
              Entre com o e-mail e a senha cadastrados
              para acessar seu espaço.
            </p>

            <form className="members-form" onSubmit={handleLogin}>
              <label htmlFor="members-email">E-mail</label>
              <input
                id="members-email"
                type="text"
                placeholder="seuemail@exemplo.com"
                autoComplete="username"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />

              <label htmlFor="members-password">Senha</label>
              <div className="members-password-field">
                <input
                  id="members-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword
                    ? <EyeOff size={19} />
                    : <Eye size={19} />}
                </button>
              </div>

              {error && (
                <p className="members-error" role="alert">{error}</p>
              )}

              <button
                className="members-primary"
                type="submit"
                disabled={busy}
              >
                {busy ? 'Entrando...' : 'Entrar na minha conta'}
                <ArrowRight size={19} />
              </button>
            </form>

            <button
              type="button"
              className="members-change"
              onClick={() => {
                setMode('choice');
                setError('');
              }}
            >
              Escolher outra opção
            </button>

            <p className="members-footnote">
              Ainda não é membro?{' '}
              <Link to="/checkout-pix">Conheça o acesso por R$ 29,90.</Link>
            </p>
          </>
        )}
      </section>

      <p className="members-signature">
        Feito com carinho por Thaís Felício
      </p>
    </main>
  );
}