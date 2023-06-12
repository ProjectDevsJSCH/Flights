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

const PORT_NUMBER = 80;
const app = express();

app.get('/', (req: Request, res: Response) => {
  res.send('Alive');
});

app.get('/last', (req: Request, res: Response) => {
  res.send(service.getData());
});

app.listen(PORT_NUMBER, () => console.log('Server running on por', PORT_NUMBER,new Date()));