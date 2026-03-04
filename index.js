import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { guid, z } from "zod";
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
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
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
      content: [{ type: "text", text: JSON.stringify(data, null, 2)}]
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
      content: [{ type: "text", text: JSON.stringify(data, null, 2)}]
    }
  },
);

//  get channel (guild or direct message)
server.registerTool(
  "getChannelList",
  {
    title: "Get channel list",
    description: "get the list of channel (guild or direct message) from discord (allows you to retrieve the channel ID, returned as id in the response).",
    inputSchema: {
      guildId: z.string().optional().describe("if you want channel from a guild")
    }
  },
  async ({ guildId }) => {
    console.log("channel list");
    
    const res = await fetch(guildId ? `https://discord.com/api/v9/guilds/${guildId}/channels` : `https://discord.com/api/v9/users/@me/channels`, {
      method: "GET",
      headers: {
        Authorization: process.env.DISCORD_TOKEN,
      },
    });
    const data = await res.json();
    
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2)}]
    }
  },
);

// send message
server.registerTool(
  "sendMessage",
  {
    title: "Send message",
    description: "allows you to send message on discord (guild or direct message).",
    inputSchema: z.object({
      channelId: z.string().describe("need to be recovered from direct message list"),
      content: z.string().describe("content of the message you will send")
    }),
  },
  async ({channelId, content}) => {
    console.log(channelId);
    
    const res = await fetch(`https://discord.com/api/v9/channels/${channelId}/messages`,{
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
      content: [{ type: "text", text: JSON.stringify(data, null, 2)}]
    }
  },
);


// get message history (guild or direct message)
server.registerTool(
  "getMessageHistory",
  {
    title: "get message history",
    description: "allows you to recover the message history from a conversation or a guild channel. Need channel's id (can be recovered using directMessage tool",
    inputSchema: z.object({
      channelId: z.string().describe("need to be recovered from direct message list"),
      beforeId: z.nullable(z.string().describe("you retrieve the message but before the specified id (by default you can't use this input)")),
      limit: z.number().describe("number of message you get (max 100)")
    }),
  },
  async ({channelId, beforeId, limit}) => {
    console.log(channelId);
    
    const res = await fetch(`https://discord.com/api/v9/channels/${channelId}/messages?limit=${limit}${beforeId ? `&before=${beforeId}` : ""}`, {
      method: "GET",
      headers: {
        "content-type": "application/json",
        Authorization: process.env.DISCORD_TOKEN,
      }
    });
    const data = await res.json();
    
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2)}]
    }
  },
);

//  get guilds list
server.registerTool(
  "guildsList",
  {
    title: "Get guilds list",
    description: "get the list of guilds from discord (allows you to retrieve the guild id, returned as id in the response).",
  },
  async () => {
    console.log("guilds list");
    
    const res = await fetch("https://discord.com/api/v9/users/@me/guilds", {
      method: "GET",
      headers: {
        Authorization: process.env.DISCORD_TOKEN,
      },
    });
    const data = await res.json();
    const guilds = data.map(guild => {
      return {id: guild.id, name: guild.name, owner: guild.owner}
    })
    
    return {
      content: [{ type: "text", text: JSON.stringify(guilds, null, 2)}]
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

const port = parseInt(3000);
app
  .listen(port, () => {
    console.log(`Demo MCP Server running on http://localhost:${port}/mcp`);
  })
  .on("error", (error) => {
    console.error("Server error:", error);
    process.exit(1);
  });
