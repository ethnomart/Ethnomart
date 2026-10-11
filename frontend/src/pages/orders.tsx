import { useListOrders, OrderStatus } from '@workspace/api-client-react';
import { useAuthStore } from '../store/auth';
import { Link, Redirect } from 'wouter';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  ChefHat,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react';
import { format } from 'date-fns';

export default function Orders() {
  const { user } = useAuthStore();

  if (!user) {
    return <Redirect to="/login" />;
  }

  const { data: orders, isLoading } = useListOrders({ role: 'customer' });

  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          color: 'text-amber-500',
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/20',
          label: 'Pending',
        };
      case 'confirmed':
        return {
          icon: CheckCircle2,
          color: 'text-blue-500',
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/20',
          label: 'Confirmed',
        };
      case 'preparing':
        return {
          icon: ChefHat,
          color: 'text-indigo-500',
          bg: 'bg-indigo-500/10',
          border: 'border-indigo-500/20',
          label: 'Preparing',
        };
      case 'ready':
        return {
          icon: Package,
          color: 'text-purple-500',
          bg: 'bg-purple-500/10',
          border: 'border-purple-500/20',
          label: 'Ready for Pickup',
        };
      case 'out_for_delivery':
        return {
          icon: Truck,
          color: 'text-secondary',
          bg: 'bg-secondary/10',
          border: 'border-secondary/20',
          label: 'Out for Delivery',
        };
      case 'delivered':
        return {
          icon: CheckCircle2,
          color: 'text-primary',
          bg: 'bg-primary/10',
          border: 'border-primary/20',
          label: 'Delivered',
        };
      case 'cancelled':
        return {
          icon: AlertCircle,
          color: 'text-destructive',
          bg: 'bg-destructive/10',
          border: 'border-destructive/20',
          label: 'Cancelled',
        };
      default:
        return {
          icon: Clock,
          color: 'text-muted-foreground',
          bg: 'bg-muted',
          border: 'border-border',
          label: status,
        };
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl min-h-screen">
      <h1 className="text-3xl md:text-4xl font-display font-bold mb-8 flex items-center gap-3">
        <ShoppingBag className="w-8 h-8 text-primary" />
        My Orders
      </h1>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-card rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : orders && orders.length > 0 ? (
        <div className="space-y-6">
          {orders.map((order) => {
            const statusConfig = getStatusConfig(order.status);
            const StatusIcon = statusConfig.icon;

            return (
              <Card
                key={order.id}
                className={`overflow-hidden border transition-shadow hover:shadow-md ${statusConfig.border}`}
              >
                <div
                  className={`px-6 py-3 flex items-center justify-between border-b ${statusConfig.bg}`}
                >
                  <div className="flex items-center gap-2 font-medium">
                    <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                    <span className={statusConfig.color}>
                      {statusConfig.label}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Order #{order.id} •{' '}
                    {format(new Date(order.createdAt), 'MMM d, h:mm a')}
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                      <h3 className="font-display font-bold text-xl mb-1">
                        {order.storeName}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {order.items?.length || 0} items • £
                        {order.totalGbp.toFixed(2)}
                      </p>
                      {order.items && order.items.length > 0 && (
                        <div className="mt-4 text-sm max-w-md truncate text-muted-foreground">
                          {order.items
                            .map((i) => `${i.quantity}x ${i.productName}`)
                            .join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-2xl font-display font-bold">
                        £{order.totalGbp.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-24 bg-card rounded-3xl border border-dashed">
          <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-30" />
          <h3 className="text-xl font-display font-semibold mb-2">
            No orders yet
          </h3>
          <p className="text-muted-foreground mb-6">
            Looks like you haven't placed any orders.
          </p>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            Start Shopping
          </Link>
        </div>
      )}
    </div>
  );
}
