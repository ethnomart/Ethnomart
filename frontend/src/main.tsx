import { createRoot } from 'react-dom/client';

import App from './App';
import { setBaseUrl } from '@workspace/api-client-react';
setBaseUrl(import.meta.env.BASE_URL.replace(/\/$/, '') || null);

import './index.css';
import './styles/ux.css';

createRoot(document.getElementById('root')!).render(<App />);
