import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';
import SimulationService from './services/simulationService.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// Socket.IO
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Broadcast helper attached to app
app.set('io', io);

// Database & Start
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_dashboard';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB Connected');
        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);

            // Start simulation service
            const simulation = new SimulationService(io);
            simulation.start();
            console.log('🎬 Real-time simulation started');
        });
    })
    .catch(err => console.error('❌ DB Connection Error:', err));
