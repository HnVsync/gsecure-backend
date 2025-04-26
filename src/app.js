import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";
import { ApiResponse } from "./utils/ApiResponse.js";

const app = express();

// middlewares
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true, limit: "10kb" }))
app.use(express.static("public"))

app.use(cookieParser())

// routes  import

import userRouter from "./routes/user.route.js"
import coreFunctions from "./routes/core.route.js"
import vaultRouter from "./routes/vault.route.js"

// routes declaration 
app.use("/gs/api/v1/users", userRouter) // standard route configuration
// localhost:3000/
// secure route login required
app.use("/gs/api/v1/vault", vaultRouter);
// app.use("/gs/")

app.use("/gs/api/v1/core", coreFunctions);

const healthCheck = async (req, res) => {
    try {
        // Check database connection
        const dbState = mongoose.connection.readyState;
        const dbStatus = {
            0: 'Disconnected',
            1: 'Connected',
            2: 'Connecting',
            3: 'Disconnecting'
        };

        // Collect system information
        const healthData = {
            status: 'UP',
            timestamp: new Date().toISOString(),
            uptime: `${Math.floor(process.uptime())} seconds`,
            database: {
                status: dbStatus[dbState],
                connected: dbState === 1
            },
            environment: process.env.NODE_ENV || 'development',
            memory: {
                rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
                heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
                heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`
            }
        };

        // Determine overall health status
        const isHealthy = healthData.database.connected;
        const statusCode = isHealthy ? 200 : 503; // 503 Service Unavailable

        return res.status(statusCode).json(
            new ApiResponse(
                statusCode,
                healthData,
                isHealthy ? "Service is healthy" : "Service is degraded"
            )
        );

    } catch (error) {
        return res.status(500).json(
            new ApiResponse(
                500,
                { status: 'DOWN', error: error.message },
                "Health check failed"
            )
        );
    }
};

app.get('/health', healthCheck); 

export { app };