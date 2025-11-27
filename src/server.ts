import express from 'express'
import dotenv from 'dotenv'
import {connectDB} from './config/db'
import businessRoutes from './routes/businessRoutes'
import servicesRoutes from './routes/serviceRoutes'
import professionalRoutes from './routes/professionalRoutes'
import clientRoutes from './routes/clientRoutes';


dotenv.config()

connectDB()
const app = express()

app.use(express.json())

// ROUTES
app.use('/api/business', businessRoutes)
app.use('/api/services', servicesRoutes)
app.use('/api/professionals', professionalRoutes);
app.use('/api/clients', clientRoutes);

export default app