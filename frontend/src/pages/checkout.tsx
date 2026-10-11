import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useCreateOrder, type OrderInput } from '@workspace/api-client-react';
import { useBasketStore } from '../store/basket';
import { useAuthStore } from '../store/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '../components/ui/card';
import {
  ShoppingBasket,
  MapPin,
  CreditCard,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

export default function Checkout() {
  const { items, storeId, storeName, clearBasket, updateQuantity, removeItem } =
    useBasketStore();
  const totalGbp = useBasketStore((state) => state.totalGbp());
  const { user } = useAuthStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createOrder = useCreateOrder();

  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-lg text-center">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
          <ShoppingBasket className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-display font-bold mb-4">
          Your basket is empty
        </h2>
        <p className="text-muted-foreground mb-8">
          Looks like you haven't added anything to your basket yet.
        </p>
        <Button size="lg" className="rounded-full" asChild>
          <Link href="/">Discover Stores</Link>
        </Button>
      </div>
    );
  }

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to place an order.',
      });
      setLocation('/login');
      return;
    }

    if (!storeId) return;

    const orderInput: OrderInput = {
      storeId: storeId,
      deliveryAddress: address,
      notes: notes || undefined,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    };

    createOrder.mutate(
      { data: orderInput },
      {
        onSuccess: () => {
          clearBasket();
          toast({
            title: 'Order Placed!',
            description: 'Your order has been successfully placed.',
          });
          setLocation('/orders');
        },
        onError: () => {
          toast({
            variant: 'destructive',
            title: 'Order Failed',
            description:
              'There was a problem placing your order. Please try again.',
          });
        },
      },
    );
  };

  const deliveryFee = 2.99;
  const grandTotal = totalGbp + deliveryFee;

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <h1 className="text-3xl md:text-4xl font-display font-bold mb-8">
        Checkout
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBasket className="w-5 h-5 text-primary" />
                Order from {storeName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center gap-4 py-3 border-b last:border-0"
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="w-16 h-16 object-cover rounded-md bg-muted"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center text-muted-foreground/30">
                      <ShoppingBasket className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium">{item.productName}</h4>
                    <div className="text-sm text-muted-foreground">
                      £{item.priceGbp.toFixed(2)} each
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      className="bg-background border rounded-md px-2 py-1 text-sm"
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(item.productId, Number(e.target.value))
                      }
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="font-semibold text-right w-16">
                    £{(item.priceGbp * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Delivery Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                id="checkout-form"
                onSubmit={handleCheckout}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="address">Delivery Address</Label>
                  <Input
                    id="address"
                    placeholder="123 High St, London, SW1A 1AA"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Delivery Notes (Optional)</Label>
                  <Input
                    id="notes"
                    placeholder="E.g. Leave at front door"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24 border-primary/20 shadow-xl bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>£{totalGbp.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery Fee</span>
                <span>£{deliveryFee.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-display font-bold text-xl">
                <span>Total</span>
                <span>£{grandTotal.toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-3">
              <Button
                type="submit"
                form="checkout-form"
                className="w-full h-12 text-lg rounded-full"
                disabled={createOrder.isPending}
              >
                {createOrder.isPending ? (
                  'Processing...'
                ) : (
                  <>
                    Place Order <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground w-full">
                <CreditCard className="w-4 h-4" /> Secure checkout (Test Mode)
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
