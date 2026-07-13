import express from "express";
import bootStrap from "./src/app.controller.js";
import dotenv from "dotenv";
import { resolve } from "node:path";
import { BadRequestException } from "./src/utils/response/error.response.js";
dotenv.config({
  path: resolve("./src/config/.env"),
  quiet: true,
});
import cors from 'cors';
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { auth } from "./src/middlewares/auth.middlware.js";
import RedisStore from "rate-limit-redis";
import { redisClient } from "./src/utils/redis/redis.client.js";



const app = express();
bootStrap(express, app);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("Server is running on port", port);
});
