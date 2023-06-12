import express from 'express';
import { Request, Response } from 'express';
import * as cron from 'node-cron';
import { Service } from './utils/service';

const service = new Service();

//cron each 30 minutes
// cron.schedule('*/30 * * * *', async () => {
cron.schedule('*/30 * * * * *', async () => {
  await service.setDataResponse();
});

const PORT_NUMBER = 8080;
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