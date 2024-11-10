import { InversifyExpressServer } from 'inversify-express-utils';
import { container } from './ioc/container';
import bodyParser from 'body-parser';

import './controllers/health.controller';
import './controllers/gipod.controller';

const server = new InversifyExpressServer(container);
server.setConfig((app) => {
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
});

const app = server.build();
app.listen(6000, () => console.info('Server is listening on port 6000'));
