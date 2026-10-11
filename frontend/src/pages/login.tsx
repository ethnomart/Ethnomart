import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { type User } from '@workspace/api-client-react';
import { ArrowRight } from 'lucide-react';
import { onboardingRequest, usePilotSignIn } from '@/lib/onboarding-api';
import '@/styles/pilot-onboarding.css';

export default function Login() {
  const [, navigate] = useLocation(),
    signIn = usePilotSignIn();
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState('');
  useEffect(() => {
    document.title = 'Merchant sign in | EthnoMart';
  }, []);
  const login = useMutation({
    mutationFn: (sample: boolean) =>
      sample
        ? onboardingRequest<User>('/auth/demo-login', 'POST', {})
        : onboardingRequest<User>('/auth/login', 'POST', { email, password }),
    onSuccess: (user) => {
      setPassword('');
      signIn(user);
      navigate(
        user.role === 'admin'
          ? '/admin/merchant-pilot'
          : user.role === 'store_owner'
            ? '/merchant'
            : '/shops',
      );
    },
  });
  return (
    <div className="em-pilot-page em-pilot-sign-in">
      <div className="em-pilot-demo">
        Catalogue preview · Sample accounts only
      </div>
      <section className="em-pilot-invitation-panel">
        <p className="em-pilot-eyebrow">Your catalogue workspace</p>
        <h1>
          Welcome
          <br />
          back.
        </h1>
        <p>
          Sign in with the sample account created from your approved invitation.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!login.isPending) login.mutate(false);
          }}
        >
          <fieldset disabled={login.isPending}>
            <div className="em-pilot-field">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                autoComplete="username"
                value={email}
                maxLength={254}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="grocer@example.invalid"
                required
              />
            </div>
            <div className="em-pilot-field">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                maxLength={128}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            {login.isError && (
              <p className="em-pilot-error" role="alert">
                {login.error.message}
              </p>
            )}
            <button className="em-pilot-button" type="submit">
              {login.isPending ? 'Signing in…' : 'Sign in'}
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </fieldset>
        </form>
        {import.meta.env.DEV && (
          <div className="em-pilot-sign-in-sample">
            <button
              className="em-pilot-text-link"
              type="button"
              disabled={login.isPending}
              onClick={() => login.mutate(true)}
            >
              Try the existing sample workspace{' '}
              <ArrowRight size={17} aria-hidden="true" />
            </button>
            <p className="em-pilot-small">
              This opens the fictional starter shop. It doesn’t approve requests
              or grant manager access.
            </p>
          </div>
        )}
        <p className="em-pilot-small">
          Need a sample invitation?{' '}
          <Link className="em-pilot-text-link" href="/pilot/apply">
            Submit a trial request
          </Link>
        </p>
        <p className="em-pilot-small">
          Password recovery is not connected in this sample preview. The
          project’s real email service is still required before enrolment opens.
        </p>
      </section>
    </div>
  );
}
