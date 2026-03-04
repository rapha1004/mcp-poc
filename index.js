import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const server = new McpServer({
  name: "mcp-poc",
  version: "1.0.0",
});

// hello world
server.registerTool(
  "hello",
  {
    title: "Welcome !",
    description: "Test your connexion with the mcp server",
  },
  async () => {
    return {
      content: [{ type: "text", text: "Hello world !" }],
    };
  },
);

// joke
server.registerTool(
  "joke",
  {
    title: "Generate a joke",
    description: "generate a hilarious joke",
    inputSchema: z.object({
      amount: z.number(),
    }),
  },
  async ({ amount }) => {
    const res = await fetch(
      `https://v2.jokeapi.dev/joke/Any?lang=fr&blacklistFlags=nsfw,religious,political,racist,sexist,explicit&amount=${amount}`,
    );

    const data = await res.json();

    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
    };
  },
);

// get profil
server.registerTool(
  "profil",
  {
    title: "Get profile",
    description: "get discord profile information",
  },
  async () => {
    console.log("profil");
    
    const res = await fetch("https://discord.com/api/v9/users/@me", {
      method: "GET",
      headers: {
        Authorization: process.env.DISCORD_TOKEN,
      },
    });
    const data = await res.json();
    
    return {
      content: [{ type: "text", text: JSON.stringify(data)}]
    }
  },
);

//  get relationship
server.registerTool(
  "relationships",
  {
    title: "Get relationships",
    description: "get discord relationships of the user",
  },
  async () => {
    console.log("relationships");
    
    const res = await fetch("https://discord.com/api/v9/users/@me/relationships", {
      method: "GET",
      headers: {
        Authorization: process.env.DISCORD_TOKEN,
      },
    });
    const data = await res.json();
    
    return {
      content: [{ type: "text", text: JSON.stringify(data)}]
    }
  },
);

//  get direct message
server.registerTool(
  "directMessage",
  {
    title: "Get direct message",
    description: "get the list of direct message from discord (allows you to retrieve the channel ID, returned as id in the response).",
  },
  async () => {
    console.log("direct message");
    
    const res = await fetch("https://discord.com/api/v9/users/@me/channels", {
      method: "GET",
      headers: {
        Authorization: process.env.DISCORD_TOKEN,
      },
    });
    const data = await res.json();
    
    return {
      content: [{ type: "text", text: JSON.stringify(data)}]
    }
  },
);

// send direct message
server.registerTool(
  "sendMessage",
  {
    title: "Send a direct message",
    description: "allows you to send a direct message on discord. Need channel's id (can be recovered using directMessage tool",
    inputSchema: z.object({
      channelId: z.string().describe("need to be recovered from direct message list"),
      content: z.string().describe("content of the message you will send")
    }),
  },
  async ({channelId, content}) => {
    console.log(channelId);
    
    const res = await fetch(`https://discord.com/api/v9/channels/${channelId}/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: process.env.DISCORD_TOKEN,
      },
      body: JSON.stringify({
        content: content
      })
    });
    const data = await res.json();
    
    return {
      content: [{ type: "text", text: JSON.stringify(data)}]
    }
  },
);



// Set up Express and HTTP transport
const app = express();
app.use(express.json());

app.post("/mcp", async (req, res) => {
  console.log("/mcp");
  
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  res.on("close", () => {
    transport.close();
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

const port = parseInt(process.env.PORT || "3000");
app
  .listen(port, () => {
    console.log(`Demo MCP Server running on http://localhost:${port}/mcp`);
  })
  .on("error", (error) => {
    console.error("Server error:", error);
    process.exit(1);
  });
