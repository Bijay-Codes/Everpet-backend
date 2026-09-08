import '../loadEnv.js';
import { Pool } from "pg"

const pool = new Pool({
    connectionString: process.env.DB_URL,
})

export default pool;