import bodyParser from 'body-parser';
import express from 'express';
import { InversifyExpressServer } from 'inversify-express-utils';

import { container } from './ioc/container';
import './controllers/health.controller';
import './controllers/closures.controller';
import './controllers/mapbox.token.controller';

const server = new InversifyExpressServer(container);
server.setConfig((app) => {
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(express.static('web'));
});

const PORT = process.env.PORT || 9300;

const app = server.build();
app.listen(PORT, () => console.info(`Server is listening on port ${PORT}`));
