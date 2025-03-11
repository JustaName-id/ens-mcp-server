#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import dotenv from "dotenv";

import {
    resolveName,
    reverseLookup,
    getTextRecord,
    checkAvailability,
    getAllRecords,
    getSubdomains,
    getNameHistory,
    getRegistrationPrice
} from './utils/index.js';

dotenv.config();

const server = new McpServer({
    name: "ens-server",
    version: "1.0.0",
});


server.tool(
    "resolve-name",
    "Resolve an ENS name to an Ethereum address",
    {
        name: z.string().describe("The ENS name to resolve (e.g., 'vitalik.eth')"),
    },
    async (params) => {
        return await resolveName(params);
    }
);


server.tool(
    "reverse-lookup",
    "Get the ENS name for an Ethereum address",
    {
        address: z.string().describe("The Ethereum address to look up"),
    },
    async (params) => reverseLookup( params)
);


server.tool(
    "get-text-record",
    "Get a text record for an ENS name",
    {
        name: z.string().describe("The ENS name to query"),
        key: z.string().describe("The record key to look up (e.g., 'email', 'url', 'avatar', 'description', 'twitter', etc.)"),
    },
    async (params) => getTextRecord( params)
);


server.tool(
    "check-availability",
    "Check if an ENS name is available for registration",
    {
        name: z.string().describe("The ENS name to check (without .eth suffix)"),
    },
    async (params) => checkAvailability( params)
);


server.tool(
    "get-all-records",
    "Get all available information for an ENS name",
    {
        name: z.string().describe("The ENS name to query"),
    },
    async (params) => getAllRecords( params)
);


server.tool(
    "get-subdomains",
    "Get subdomains for an ENS name",
    {
        name: z.string().describe("The ENS name to query for subdomains"),
    },
    async (params) => getSubdomains( params)
);


server.tool(
    "get-name-history",
    "Get the history of an ENS name",
    {
        name: z.string().describe("The ENS name to check history for"),
    },
    async (params) => getNameHistory( params)
);


server.tool(
    "get-registration-price",
    "Get the price to register an ENS name",
    {
        name: z.string().describe("The ENS name to check price for (without .eth suffix)"),
        duration: z.number().int().min(1).describe("Registration duration in years").default(1) ,
    },
    async (params) => getRegistrationPrice( params)
);


async function main() {
    console.error("ENS MCP Server starting...");
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("ENS MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});