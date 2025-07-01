# MCP-Based MongoDB Chatbot

## OVERVIEW

This project integrates MongoDB functionality with the Model Context Protocol (MCP) to support intelligent agent-based interactions with live databases. It features two key components:

- **MCP Server**: Provides a set of MongoDB tools exposed through the MCP interface.
- **Client Interface**: A terminal-based AI assistant that interacts with the MCP server using Google's Gemini API.

This setup enables dynamic, context-aware access to database operations, allowing developers and AI agents to perform CRUD operations and fetch data insights conversationally.

### Technologies Used

- Node.js
- MongoDB
- MCP Protocol
- Gemini API (Google)
- JavaScript (client + server)
- Express.js

---

## PROJECT STRUCTURE

```plaintext
.
├── client-side/                # Gemini-powered AI client interface
│   ├── index.js                # Entry point for the AI assistant
│   └── package.json            # Dependencies and scripts for the client
└── mcp-mongo-project/          # MCP server exposing MongoDB tools
    ├── src/
    │   ├── index.js            # Server entry point and MCP tool registration
    │   └── services/
    │       └── mcp-service.js  # MongoDB service logic
    └── package.json            # Dependencies and configuration for the server
```

## HOW TO RUN
- Follow these steps to set up and run the project locally:

1. Prerequisites
Ensure the following are installed:

- Node.js (v16 or above)
- MongoDB

2. Start MongoDB
Launch MongoDB locally (default port 27017):
``` mongod ```
Tip: Use a MongoDB GUI like MongoDB Compass to visualize and inspect the data.

3. Set Up and Run the MCP MongoDB Server
```
cd mcp-mongo-project
npm install
node src/index.js
```
This starts the MCP-compatible server exposing MongoDB operations.

4. Set Up and Run the Client (Gemini AI Agent)
In a new terminal tab:
```
cd client-side
npm install
node index.js
```
You can now interact with the AI agent via terminal, which queries the MCP MongoDB server in real-time.

## CONTRIBUTING
Contributions are welcome!

- Fork the repository
- Create a new branch: git checkout -b feature-name
- Commit your changes: git commit -m "Add feature"
- Push to the branch: git push origin feature-name
- Open a Pull Request

We appreciate feedback, bug reports, and feature enhancements.
