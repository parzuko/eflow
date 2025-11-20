import { serve } from "@hono/node-server";
import { api } from "./routes/api.js";
import { Scalar } from "@scalar/hono-api-reference";
import { cors } from "hono/cors";
import { OpenAPIHono } from "@hono/zod-openapi";

const app = new OpenAPIHono();
const port = 9000;

app.use(
  "/*",
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
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
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "Ecomflow Integration API",
  },
});

console.log(`Server is running on http://localhost:${port}`);
console.log(`Swagger UI is available at http://localhost:${port}/doc`);

serve({
  fetch: app.fetch,
  port,
});
