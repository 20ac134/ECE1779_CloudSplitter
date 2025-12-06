import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import users from './routes/users.js';
import groups from './routes/groups.js';
import expenses from './routes/expenses.js';
import settlements from './routes/settlements.js';
import { initWs } from './ws.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.APP_ORIGIN || '*', credentials: true }));

app.get('/health', (req,res)=>res.json({ ok: true }));

app.use('/api/users', users);

// inject io into req for realtime emits
const server = http.createServer(app);
const io = initWs(server, process.env.APP_ORIGIN || '*');
app.use((req, _res, next) => { req.io = io; next(); });

app.use('/api/groups', groups);
app.use('/api/expenses', expenses);
app.use('/api/settlements', settlements);

const port = process.env.API_PORT || 8080;
server.listen(port, () => console.log(`API listening on :${port}`));
