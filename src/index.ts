import express from 'express';
import { Request, Response } from 'express';
import { Service } from './services/WService';

const service = new Service();
const DEFAULT_PORT = 8080;
const PORT_NUMBER = process.env.PORT || DEFAULT_PORT;
const app = express();

app.get('/', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
  res.send('Alive');
});

app.get('/last', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
  res.send(service.getData());
});

app.listen(PORT_NUMBER, () => console.log('Server running on por', PORT_NUMBER,new Date()));

module.exports = app;