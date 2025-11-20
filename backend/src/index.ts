import { serve } from "@hono/node-server";
import { api } from "./routes/api.js";
import { Scalar } from "@scalar/hono-api-reference";
import { cors } from "hono/cors";
import { OpenAPIHono } from "@hono/zod-openapi";

const app = new OpenAPIHono();
const PORT = 9000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

app.use(
  "/*",
  cors({
    origin: [FRONTEND_URL, "http://localhost:3001"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  })
);

// Mount API
app.route("/", api);

// Mount Swagger UI
app.get("/doc", Scalar({ url: "/api/doc" }));
app.doc("/api/doc", {
  openapi: "1.0.0",
  info: {
    version: "1.0.0",
    title: "Ecomflow Integration API",
  },
});

console.log(`Server is running on http://localhost:${PORT}`);
console.log(`Swagger UI is available at http://localhost:${PORT}/doc`);

serve({
  fetch: app.fetch,
  port: PORT,
});
