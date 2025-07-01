const fetch = require("node-fetch");
global.fetch = fetch;

const express = require("express");
const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const {
  SSEServerTransport,
} = require("@modelcontextprotocol/sdk/server/sse.js");
const { z } = require("zod");
const MongoDBService = require("./services/mcp-service.js");

const server = new McpServer({
  name: "example-server",
  version: "1.0.0",
});

// Initialize MongoDB service
const mongoService = new MongoDBService();

// Connect to MongoDB when starting the server
(async () => {
  try {
    await mongoService.connect();
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
})();

const app = express();

// MongoDB Find Documents Tool
server.tool(
  "findDocuments",
  "Find documents in a MongoDB collection",
  {
    collection: z.string().describe("The collection name to query"),
    query: z
      .record(z.any())
      .describe("The query filter")
      .optional()
      .default({}),
    options: z
      .object({
        limit: z
          .number()
          .optional()
          .describe("Maximum number of documents to return"),
        skip: z.number().optional().describe("Number of documents to skip"),
        sort: z
          .record(z.number())
          .optional()
          .describe(
            "Sort criteria (e.g. {field: 1} for ascending, {field: -1} for descending)"
          ),
        projection: z
          .record(z.number())
          .optional()
          .describe("Fields to include or exclude"),
      })
      .optional()
      .default({}),
  },
  async (arg) => {
    try {
      const { collection, query, options } = arg;
      const results = await mongoService.find(collection, query, options);

      return {
        content: [
          {
            type: "text",
            text: `Found ${results.length} documents in collection '${collection}'`,
          },
          {
            type: "text",
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error finding documents: ${error.message}`,
          },
        ],
      };
    }
  }
);

// MongoDB Find One Document Tool
server.tool(
  "findOneDocument",
  "Find a single document in a MongoDB collection",
  {
    collection: z.string().describe("The collection name to query"),
    query: z.record(z.any()).describe("The query filter"),
    options: z
      .object({
        projection: z
          .record(z.number())
          .optional()
          .describe("Fields to include or exclude"),
      })
      .optional()
      .default({}),
  },
  async (arg) => {
    try {
      const { collection, query, options } = arg;
      const result = await mongoService.findOne(collection, query, options);
      return {
        content: [
          {
            type: "text",
            text: result
              ? `Found document in collection '${collection}'`
              : `No document found in collection '${collection}' matching the query`,
          },
          {
            type: "text",
            text: result ? JSON.stringify(result, null, 2) : "null",
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error finding document: ${error.message}`,
          },
        ],
      };
    }
  }
);

// MongoDB Insert One Document Tool
server.tool(
  "insertOneDocument",
  "Insert a single document into a MongoDB collection",
  {
    collection: z.string().describe("The collection name"),
    document: z.record(z.any()).describe("The document to insert"),
  },
  async (arg) => {
    try {
      const { collection, document } = arg;
      const result = await mongoService.insertOne(collection, document);

      return {
        content: [
          {
            type: "text",
            text: `Document inserted into collection '${collection}'`,
          },
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error inserting document: ${error.message}`,
          },
        ],
      };
    }
  }
);

// MongoDB Insert Many Documents Tool
server.tool(
  "insertManyDocuments",
  "Insert multiple documents into a MongoDB collection",
  {
    collection: z.string().describe("The collection name"),
    documents: z.array(z.record(z.any())).describe("The documents to insert"),
  },
  async (arg) => {
    try {
      const { collection, documents } = arg;
      const result = await mongoService.insertMany(collection, documents);

      return {
        content: [
          {
            type: "text",
            text: `${result.insertedCount} documents inserted into collection '${collection}'`,
          },
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error inserting documents: ${error.message}`,
          },
        ],
      };
    }
  }
);

// MongoDB Update One Document Tool
server.tool(
  "updateOneDocument",
  "Update a single document in a MongoDB collection",
  {
    collection: z.string().describe("The collection name"),
    filter: z
      .record(z.any())
      .describe("The filter to find the document to update"),
    update: z.record(z.any()).describe("The update operations to apply"),
    options: z
      .object({
        upsert: z
          .boolean()
          .optional()
          .describe("Create a document if no documents match the filter"),
      })
      .optional()
      .default({}),
  },
  async (arg) => {
    try {
      const { collection, filter, update, options } = arg;
      const result = await mongoService.updateOne(
        collection,
        filter,
        update,
        options
      );

      return {
        content: [
          {
            type: "text",
            text: `Document update in collection '${collection}': matched ${result.matchedCount}, modified ${result.modifiedCount}`,
          },
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error updating document: ${error.message}`,
          },
        ],
      };
    }
  }
);

// MongoDB Update Many Documents Tool
server.tool(
  "updateManyDocuments",
  "Update multiple documents in a MongoDB collection",
  {
    collection: z.string().describe("The collection name"),
    filter: z
      .record(z.any())
      .describe("The filter to find documents to update"),
    update: z.record(z.any()).describe("The update operations to apply"),
    options: z
      .object({
        upsert: z
          .boolean()
          .optional()
          .describe("Create a document if no documents match the filter"),
      })
      .optional()
      .default({}),
  },
  async (arg) => {
    try {
      const { collection, filter, update, options } = arg;
      const result = await mongoService.updateMany(
        collection,
        filter,
        update,
        options
      );

      return {
        content: [
          {
            type: "text",
            text: `Documents updated in collection '${collection}': matched ${result.matchedCount}, modified ${result.modifiedCount}`,
          },
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error updating documents: ${error.message}`,
          },
        ],
      };
    }
  }
);

// MongoDB Delete One Document Tool
server.tool(
  "deleteOneDocument",
  "Delete a single document from a MongoDB collection",
  {
    collection: z.string().describe("The collection name"),
    filter: z
      .record(z.any())
      .describe("The filter to find the document to delete"),
  },
  async (arg) => {
    try {
      const { collection, filter } = arg;
      const result = await mongoService.deleteOne(collection, filter);

      return {
        content: [
          {
            type: "text",
            text: `Deleted ${result.deletedCount} document from collection '${collection}'`,
          },
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error deleting document: ${error.message}`,
          },
        ],
      };
    }
  }
);

// MongoDB Delete Many Documents Tool
server.tool(
  "deleteManyDocuments",
  "Delete multiple documents from a MongoDB collection",
  {
    collection: z.string().describe("The collection name"),
    filter: z
      .record(z.any())
      .describe("The filter to find documents to delete"),
  },
  async (arg) => {
    try {
      const { collection, filter } = arg;
      const result = await mongoService.deleteMany(collection, filter);

      return {
        content: [
          {
            type: "text",
            text: `Deleted ${result.deletedCount} documents from collection '${collection}'`,
          },
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error deleting documents: ${error.message}`,
          },
        ],
      };
    }
  }
);

// MongoDB Aggregate Tool
server.tool(
  "aggregateDocuments",
  "Run an aggregation pipeline on a MongoDB collection",
  {
    collection: z.string().describe("The collection name"),
    pipeline: z
      .array(z.record(z.any()))
      .describe("The aggregation pipeline stages"),
  },
  async (arg) => {
    try {
      const { collection, pipeline } = arg;
      const results = await mongoService.aggregate(collection, pipeline);

      return {
        content: [
          {
            type: "text",
            text: `Aggregation on collection '${collection}' returned ${results.length} results`,
          },
          {
            type: "text",
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error running aggregation: ${error.message}`,
          },
        ],
      };
    }
  }
);

// MongoDB Count Documents Tool
server.tool(
  "countDocuments",
  "Count documents in a MongoDB collection",
  {
    collection: z.string().describe("The collection name"),
    query: z.record(z.any()).describe("The query filter").default({}),
  },
  async (arg) => {
    try {
      const { collection, query } = arg;
      const count = await mongoService.countDocuments(collection, query);

      return {
        content: [
          {
            type: "text",
            text: `Count of documents in collection '${collection}': ${count}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error counting documents: ${error.message}`,
          },
        ],
      };
    }
  }
);

// MongoDB List Collections Tool
server.tool(
  "listCollections",
  "List all collections in the database",
  {},
  async () => {
    try {
      const collections = await mongoService.listCollections();

      return {
        content: [
          {
            type: "text",
            text: `Found ${collections.length} collections in the database`,
          },
          {
            type: "text",
            text: JSON.stringify(collections, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error listing collections: ${error.message}`,
          },
        ],
      };
    }
  }
);

// MongoDB Create Collection Tool
server.tool(
  "createCollection",
  "Create a new collection in the database",
  {
    collection: z.string().describe("The collection name to create"),
  },
  async (arg) => {
    try {
      const { collection } = arg;
      const result = await mongoService.createCollection(collection);

      return {
        content: [
          {
            type: "text",
            text: result.message,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error creating collection: ${error.message}`,
          },
        ],
      };
    }
  }
);

const transports = {};

app.get("/sse", async (req, res) => {
  const transport = new SSEServerTransport("/messages", res);
  transports[transport.sessionId] = transport;
  res.on("close", () => {
    delete transports[transport.sessionId];
  });
  await server.connect(transport);
});

app.post("/messages", async (req, res) => {
  const sessionId = req.query.sessionId;
  const transport = transports[sessionId];
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).send("No transport found for sessionId");
  }
});

// Clean up MongoDB connection on server shutdown
process.on("SIGINT", async () => {
  try {
    await mongoService.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
});

app.listen(3001, () => {
  console.log("MCP MongoDB server running on port 3001");
});
