import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

let redis: Redis;

if (!(global as any).redis) {
  (global as any).redis = new Redis(redisUrl);
}
redis = (global as any).redis;

export default redis;