import { useState } from 'react';
import {
  useGetAdminOverview,
  useListPendingStores,
  useApproveStore,
} from '@workspace/api-client-react';
import { useAuthStore } from '../../store/auth';
import { Redirect } from 'wouter';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Users, Store, DollarSign, Bike, Check, X } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const { toast } = useToast();

  if (!user || user.role !== 'admin') {
    return <Redirect to="/" />;
  }

  const { data: stats, isLoading: loadingStats } = useGetAdminOverview();
  const { data: pendingStores, refetch: refetchPending } =
    useListPendingStores();
  const approveStore = useApproveStore();

  const handleApprove = (id: number) => {
    approveStore.mutate(
      { id },
      {
        onSuccess: () => {
          toast({
            title: 'Store Approved',
            description: 'The store is now live on the marketplace.',
          });
          refetchPending();
        },
      },
    );
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">
          Admin Portal
        </h1>
        <p className="text-muted-foreground">
          Platform overview and management.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 mb-3">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-3xl font-bold mb-1">
                {stats?.totalUsers || 0}
              </p>
              <p className="text-sm text-muted-foreground uppercase tracking-wider">
                Total Users
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary mb-3">
                <Store className="w-6 h-6" />
              </div>
              <p className="text-3xl font-bold mb-1">
                {stats?.totalStores || 0}
              </p>
              <p className="text-sm text-muted-foreground uppercase tracking-wider">
                Active Stores
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
                <DollarSign className="w-6 h-6" />
              </div>
              <p className="text-3xl font-bold mb-1">
                £{stats?.totalRevenue?.toLocaleString() || '0'}
              </p>
              <p className="text-sm text-muted-foreground uppercase tracking-wider">
                Total GMV
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-3">
                <Bike className="w-6 h-6" />
              </div>
              <p className="text-3xl font-bold mb-1">
                {stats?.totalRiders || 0}
              </p>
              <p className="text-sm text-muted-foreground uppercase tracking-wider">
                Riders
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Pending Store Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingStores && pendingStores.length > 0 ? (
              <div className="divide-y">
                {pendingStores.map((store) => (
                  <div
                    key={store.id}
                    className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="font-bold text-lg">{store.name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {store.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs font-medium">
                        <Badge variant="outline">{store.communityName}</Badge>
                        <span className="text-muted-foreground">
                          {store.cityName}
                        </span>
                        <span className="text-muted-foreground">
                          {store.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive hover:text-white"
                      >
                        <X className="w-4 h-4 mr-1" /> Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(store.id)}
                        disabled={approveStore.isPending}
                      >
                        <Check className="w-4 h-4 mr-1" /> Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Check className="w-12 h-12 mx-auto mb-3 opacity-20 text-primary" />
                <p>No stores pending approval. You're all caught up!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
