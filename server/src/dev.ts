import { resolve } from 'node:path';
import { createCatalogueApp } from './catalogue/app.ts';
process.env.ETHNOMART_BACKEND_MODE = 'local-catalogue';
const instance = createCatalogueApp({
  dataFile: resolve('.local/catalogue.sqlite3'),
  frontendOrigin: 'http://127.0.0.1:5174',
});
instance.app.listen(3002, '127.0.0.1', () =>
  console.log('Development API: http://127.0.0.1:3002'),
);
