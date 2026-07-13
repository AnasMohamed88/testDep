import helmet from "helmet";
import connectDB from "./db/db-connection.js";
import userRouter from "./modules/auth/auth.controller.js";
import messageRouter from "./modules/message/message.controller.js";
import { generateHtml } from "./utils/Email/html.tmplate.js";
import { sendEmail } from "./utils/Email/sendEmail.js";
import { redisClient } from "./utils/redis/redis.client.js";
import { globalErrorHandler } from "./utils/response/error.response.js";
import cors from 'cors'
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
const bootStrap = async (express, app) => {
  await connectDB();

  await redisClient.connect()
    .catch(() => {
    })
  // CORS=> cross origin resource sharing
  app.use(cors())
  app.use(helmet())
  app.use(rateLimit({
    windowMs: 5 * 60 * 1000,
    limit: 10,
    store: new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args)
    })
  }))
  app.use(express.json());
  app.get("/", (req, res, next) => {
    return res
      .status(200)
      .json({ success: true, message: "Hello from Saraha App" });
  });

  app.use("/api/v1/message", messageRouter)
  app.use("/api/v1/auth", userRouter);

  app.all("/*ay7aga", (req, res, next) => {
    return res
      .status(404)
      .json({ success: false, message: "This Route Is Not Exist" });
  });

  app.use(globalErrorHandler);
};

export default bootStrap;


