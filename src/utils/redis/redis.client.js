import { createClient } from "redis"

export const redisClient = createClient({
    // username: "default",
    // password: "cOoTNVLRItvT75r7s54CfZ97DdzTcgtE",
    // socket: {
    //     host: "redis-10672.crce174.ca-central-1-1.ec2.cloud.redislabs.com",
    //     port: 10670
    // }
    url: "redis://default:cOoTNVLRItvT75r7s54CfZ97DdzTcgtE@redis-10672.crce174.ca-central-1-1.ec2.cloud.redislabs.com:10672"
})



redisClient.on("error", (err) => {
    console.log("redis connection failed", err);
})
redisClient.on("connect", () => {
    console.log("redis connected successfully");
})