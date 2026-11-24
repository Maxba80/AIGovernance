import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { errorMessage, isStatus } from '../lib/api';
import { useAuth } from '../lib/auth';
import { getRoleView, landingFor } from '../lib/prefs';
import { Button } from '../components/ui/Button';
import { Field, Input } from '../components/ui/Field';
import { Notice } from '../components/ui/Feedback';

interface LocationState {
  from?: string;
}

export function LoginPage() {
  const { token, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const from = (location.state as LocationState | null)?.from;
  // Deep links are honoured; otherwise the role view decides the landing page.
  const target = from && from !== '/' && from !== '/login' ? from : landingFor(getRoleView());

  if (token) return <Navigate to={target} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate(target, { replace: true });
    } catch (err) {
      setError(isStatus(err, 401) ? errorMessage(err, 'Incorrect email or password') : errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-fg">AI Governance, Risk &amp; Compliance</h1>
          <p className="mt-1 text-sm text-muted">Sign in to your account</p>
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-lg border border-line bg-surface p-6 shadow-sm">
          <Field label="Email" htmlFor="email">
            <Input id="email" type="email" autoComplete="username" autoFocus required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Password" htmlFor="password">
            <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          {error && <Notice tone="error">{error}</Notice>}
          <Button type="submit" variant="primary" className="w-full" loading={busy} disabled={!email || !password}>
            Sign in
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-muted">Every action is recorded in a tamper-evident audit trail.</p>
      </div>
    </div>
  );
}
