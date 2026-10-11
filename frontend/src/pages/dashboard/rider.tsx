import {
  useListDeliveries,
  useGetRiderSummary,
  useAcceptDelivery,
  useCompleteDelivery,
} from '@workspace/api-client-react';
import { useAuthStore } from '../../store/auth';
import { Redirect } from 'wouter';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  MapPin,
  Bike,
  CheckCircle2,
  Navigation,
  PoundSterling,
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { format } from 'date-fns';

export default function RiderDashboard() {
  const { user } = useAuthStore();
  const { toast } = useToast();

  if (!user || user.role !== 'rider') {
    return <Redirect to="/login" />;
  }

  const { data: summary, refetch: refetchSummary } = useGetRiderSummary();
  const { data: availableDeliveries, refetch: refetchAvailable } =
    useListDeliveries({ status: 'pending' });
  const { data: myDeliveries, refetch: refetchMine } = useListDeliveries({
    riderId: user.id,
  });

  const acceptDelivery = useAcceptDelivery();
  const completeDelivery = useCompleteDelivery();

  const handleAccept = (id: number) => {
    acceptDelivery.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: 'Delivery accepted!' });
          refetchAvailable();
          refetchMine();
          refetchSummary();
        },
      },
    );
  };

  const handleComplete = (id: number) => {
    completeDelivery.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: 'Delivery completed!' });
          refetchMine();
          refetchSummary();
        },
      },
    );
  };

  const activeDeliveries =
    myDeliveries?.filter(
      (d) => d.status === 'accepted' || d.status === 'picked_up',
    ) || [];
  const completedDeliveries =
    myDeliveries?.filter((d) => d.status === 'delivered') || [];

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Rider Dashboard
          </h1>
          <p className="text-muted-foreground">Welcome back, {user.name}</p>
        </div>
        <div className="flex items-center gap-2 bg-secondary/10 text-secondary-foreground px-4 py-2 rounded-full border border-secondary/20">
          <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          <span className="text-sm font-medium">Online & Ready</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <PoundSterling className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Earnings This Week
                </p>
                <p className="text-2xl font-bold">
                  £{summary?.earningsThisWeek?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed Trips</p>
                <p className="text-2xl font-bold">
                  {summary?.completedDeliveries || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Bike className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Active Deliveries
                </p>
                <p className="text-2xl font-bold">{activeDeliveries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Navigation className="w-5 h-5 text-primary" /> Active Deliveries
          </h2>
          {activeDeliveries.length > 0 ? (
            activeDeliveries.map((d) => (
              <Card key={d.id} className="border-primary/30 shadow-md">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold">{d.storeName}</h3>
                    <span className="font-bold text-lg text-primary">
                      £{d.earningsGbp?.toFixed(2)}
                    </span>
                  </div>

                  <div className="space-y-3 mb-6 relative">
                    <div className="absolute left-2.5 top-3 bottom-3 w-px bg-border z-0" />
                    <div className="flex items-start gap-3 relative z-10">
                      <div className="w-5 h-5 rounded-full bg-background border-2 border-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Pickup</p>
                        <p className="text-sm">{d.pickupAddress}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 relative z-10">
                      <div className="w-5 h-5 rounded-full bg-background border-2 border-secondary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Dropoff</p>
                        <p className="text-sm">{d.deliveryAddress}</p>
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => handleComplete(d.id)}
                    disabled={completeDelivery.isPending}
                  >
                    Mark as Delivered
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-muted-foreground">
                <Bike className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No active deliveries.</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold">Available Jobs</h2>
          {availableDeliveries && availableDeliveries.length > 0 ? (
            availableDeliveries.map((d) => (
              <Card key={d.id}>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-sm">{d.storeName}</h3>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(d.createdAt), 'h:mm a')}
                      </p>
                    </div>
                    <span className="font-bold">
                      £{d.earningsGbp?.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm mb-4">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="truncate">{d.pickupAddress}</span>
                    <span className="text-muted-foreground mx-1">→</span>
                    <span className="truncate">{d.deliveryAddress}</span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => handleAccept(d.id)}
                    disabled={acceptDelivery.isPending}
                  >
                    Accept Delivery
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-muted-foreground">
                <p>No new jobs available right now.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
