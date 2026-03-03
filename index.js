import {
  McpServer,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "mcp-poc",
  version: "1.0.0",
});

server.registerTool(
  "add",
  {
    title: "Addition Tool",
    description: "Add two numbers",
    inputSchema: z.object({
      a: z.number(),
      b: z.number(),
    }),
  },
  async ({ a, b }) => {
    return {
      content: [{ type: "text", text: String(a + b) }],
    };
  },
);

server.registerTool(
  "joke",
  {
    title: "generate a joke",
    description: "generate a hilarious joke",
    inputSchema: z.object({
      amount: z.number(),
    }),
  },
  async ({ amount }) => {
    const res = await fetch(
      `https://v2.jokeapi.dev/joke/Any?lang=fr&blacklistFlags=nsfw,religious,political,racist,sexist,explicit&amount=${amount}`
    );

    const data = await res.json();

    return {
      content: [{ type: "text", text: JSON.stringify(data)}],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);