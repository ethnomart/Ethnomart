import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from './components/ui/toaster';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Layout } from './components/layout';

// Pages
import Home from './pages/home';
import NotFound from './pages/not-found';
import Login from './pages/login';
const PilotApplicationPage = lazy(() => import('./pages/pilot-application'));
const MerchantInvitationPage = lazy(
  () => import('./pages/merchant-invitation'),
);
const ManagerAccessPage = lazy(() => import('./pages/manager-access'));
const ManagerPilotPage = lazy(() => import('./pages/manager-pilot'));
const ManagerShopPage = lazy(() => import('./pages/manager-shop'));
import CommunityPage from './pages/community';
import StorePage from './pages/store';
import ProductPage from './pages/product';
import CatalogueScopePage from './pages/catalogue-scope';
const ExplorePage = lazy(() => import('./pages/explore'));
const ContentDetail = lazy(() => import('./pages/content-detail'));
const Contribute = lazy(() => import('./pages/contribute'));
const Saved = lazy(() => import('./pages/saved'));
const Information = lazy(() => import('./pages/information'));
const ManagerCommunity = lazy(() => import('./pages/manager-community'));
import MerchantPage from './pages/merchant';
import MerchantProductPage from './pages/merchant-product';
import StoreDashboard from './pages/dashboard/store';
import ForBusinessesPage from './pages/for-businesses';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Suspense
        fallback={
          <div className="em-pilot-page" role="status">
            Loading EthnoMart…
          </div>
        }
      >
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/shops" component={ExplorePage} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={CatalogueScopePage} />
          <Route path="/community/:slug">
            <CommunityPage />
          </Route>
          <Route path="/community/:slug/forum">
            {(params) => <CommunityPage legacySlug={params.slug} />}
          </Route>
          <Route
            path="/store/:storeId/product/:productId"
            component={ProductPage}
          />
          <Route path="/store/:id" component={StorePage} />
          <Route path="/checkout" component={CatalogueScopePage} />
          <Route path="/orders" component={CatalogueScopePage} />
          <Route path="/pilot/apply" component={PilotApplicationPage} />
          <Route
            path="/merchant/invitation"
            component={MerchantInvitationPage}
          />
          <Route path="/admin/access" component={ManagerAccessPage} />
          <Route path="/admin/merchant-pilot" component={ManagerPilotPage} />
          <Route
            path="/admin/merchant-pilot/shops/:id"
            component={ManagerShopPage}
          />
          <Route path="/merchant" component={MerchantPage} />
          <Route
            path="/merchant/products/new"
            component={MerchantProductPage}
          />
          <Route
            path="/merchant/products/:id/edit"
            component={MerchantProductPage}
          />
          <Route path="/dashboard/store" component={StoreDashboard} />
          <Route path="/dashboard/rider" component={CatalogueScopePage} />
          <Route path="/dashboard/admin" component={ManagerPilotPage} />
          <Route path="/explore" component={ExplorePage} />
          <Route path="/clothing" component={ExplorePage} />
          <Route path="/communities">
            <CommunityPage />
          </Route>
          <Route path="/events" component={ExplorePage} />
          <Route path="/events/:slug" component={ContentDetail} />
          <Route path="/jobs" component={ExplorePage} />
          <Route path="/jobs/:slug" component={ContentDetail} />
          <Route path="/contribute" component={Contribute} />
          <Route path="/saved" component={Saved} />
          <Route path="/about" component={Information} />
          <Route path="/how-it-works" component={Information} />
          <Route path="/contact" component={Information} />
          <Route path="/privacy" component={Information} />
          <Route path="/terms" component={Information} />
          <Route path="/admin/community" component={ManagerCommunity} />
          <Route path="/for-shops" component={ForBusinessesPage} />
          <Route path="/for-businesses" component={ForBusinessesPage} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Router />
      </WouterRouter>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
