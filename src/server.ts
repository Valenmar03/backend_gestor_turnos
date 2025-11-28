import express from 'express'
import dotenv from 'dotenv'
import {connectDB} from './config/db'
import businessRoutes from './routes/businessRoutes'
import servicesRoutes from './routes/serviceRoutes'
import professionalRoutes from './routes/professionalRoutes'
import clientRoutes from './routes/clientRoutes';
import appointmentRoutes from './routes/appointmentRoutes'
import cors from 'cors';
import bodyParser from 'body-parser';

dotenv.config()

connectDB()
const app = express()



app.use(cors({
    origin: ['http://localhost:5173'], 
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false
}));

app.use(express.json());
app.use(bodyParser.json());


app.use(express.json())

// ROUTES
app.use('/api/business', businessRoutes)
app.use('/api/services', servicesRoutes)
app.use('/api/professionals', professionalRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/appointments', appointmentRoutes);

export default app