import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useRegister, RegisterInputRole } from '@workspace/api-client-react';
import { useAuthStore } from '../store/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function Register() {
  const [, setLocation] = useLocation();
  const { setUser } = useAuthStore();
  const { toast } = useToast();
  const register = useRegister();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<RegisterInputRole>('customer');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register.mutate(
      { data: { name, email, password, role } },
      {
        onSuccess: (user) => {
          setUser(user);
          toast({
            title: 'Account created!',
            description: 'Welcome to EthnoMart.',
          });
          switch (user.role) {
            case 'customer':
              setLocation('/orders');
              break;
            case 'store_owner':
              setLocation('/dashboard/store');
              break;
            case 'rider':
              setLocation('/dashboard/rider');
              break;
            case 'admin':
              setLocation('/dashboard/admin');
              break;
            default:
              setLocation('/');
          }
        },
        onError: () => {
          toast({
            variant: 'destructive',
            title: 'Registration failed',
            description: 'Please check your details and try again.',
          });
        },
      },
    );
  };

  return (
    <div className="container mx-auto px-4 py-24 flex justify-center items-center min-h-[calc(100vh-4rem)]">
      <Card className="w-full max-w-md border-border/50 shadow-xl">
        <CardHeader className="space-y-2 text-center pb-8">
          <CardTitle className="text-3xl text-primary">
            Create Account
          </CardTitle>
          <CardDescription>Join EthnoMart today.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password (min 6 characters)</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-3 pt-2">
              <Label>I want to...</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('customer')}
                  className={`border rounded-lg p-3 text-sm text-center transition-all ${
                    role === 'customer'
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-border hover:border-primary/50 text-muted-foreground'
                  }`}
                >
                  Shop
                </button>
                <button
                  type="button"
                  onClick={() => setRole('store_owner')}
                  className={`border rounded-lg p-3 text-sm text-center transition-all ${
                    role === 'store_owner'
                      ? 'border-secondary bg-secondary/10 text-secondary-foreground font-medium'
                      : 'border-border hover:border-secondary/50 text-muted-foreground'
                  }`}
                >
                  Sell
                </button>
                <button
                  type="button"
                  onClick={() => setRole('rider')}
                  className={`border rounded-lg p-3 text-sm text-center transition-all ${
                    role === 'rider'
                      ? 'border-accent bg-accent/10 text-accent font-medium'
                      : 'border-border hover:border-accent/50 text-muted-foreground'
                  }`}
                >
                  Ride
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-12 text-md mt-6"
              disabled={register.isPending}
            >
              {register.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Sign Up'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t p-6">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-primary hover:underline font-medium"
            >
              Log in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
