import { ethers } from "ethers";
import {justaname, publicClient} from "../clients/index.js";

interface TextContent {
    type: "text";
    text: string;
    [x: string]: unknown;
}

interface ServerResponse {
    content: TextContent[];
    isError: boolean;
    _meta?: { [key: string]: unknown };
    [x: string]: unknown;
}

const normalizeName = (name: string) => name.endsWith('.eth') ? name : `${name}.eth`;

export function handleEnsError(error: unknown, operation: string): string {
    console.error(`Error during ENS ${operation}:`, error);

    
    let errorMessage = "";

    if (error instanceof Error) {
        errorMessage = error.message;

        
        if (
            errorMessage.includes("fetch failed") ||
            errorMessage.includes("timeout") ||
            errorMessage.includes("network") ||
            errorMessage.includes("HTTP request failed")
        ) {
            return `Network error while accessing Ethereum providers. Please check your internet connection or try again later. Technical details: ${errorMessage}`;
        }

        
        if (errorMessage.includes("ENS")) {
            return `ENS error: ${errorMessage}`;
        }

        
        if (
            errorMessage.includes("invalid") ||
            errorMessage.includes("parameter")
        ) {
            return `Invalid input: ${errorMessage}`;
        }
    }

    
    return `Error during ${operation}: ${errorMessage || String(error)}`;
}


export async function withErrorHandling<T>(
    operation: string,
    fn: () => Promise<T>,
    defaultValue: T
): Promise<T> {
    try {
        return await fn();
    } catch (error) {
        console.error(`Error in ${operation}:`, error);
        return defaultValue;
    }
}


export async function resolveName(
    { name }: { name: string }
): Promise<ServerResponse> {
    const normalizedName = normalizeName(name);
    try {
        const result = await publicClient.getAddressRecord({
            name:normalizedName,
            coin: 'ETH'
        });

        if (!result) {
            return {
                content: [{ type: "text", text: `Could not resolve ${normalizedName} to an address.` }],
                isError: false
            };
        }

        return {
            content: [{ type: "text", text: `The address for ${normalizedName} is ${result.value}` }],
            isError: false
        };
    } catch (error) {
        const errorMessage = handleEnsError(error, "name resolution");

        return {
            content: [{ type: "text", text: errorMessage }],
            isError: true
        };
    }
}


export async function reverseLookup({ address }: { address: string }): Promise<ServerResponse> {
    try {
        if (!ethers.isAddress(address)) {
            return {
                content: [{ type: "text", text: `Invalid Ethereum address: ${address}` }],
                isError: true
            };
        }

        const result = await publicClient.getName({ address: address as `0x${string}` })

        if (!result) {
            return {
                content: [{ type: "text", text: `No ENS name found for address ${address}` }],
                isError: false
            };
        }

        
        return {
            content: [{
                type: "text",
                text: `The ENS name for ${address} is ${result.name}${!result.match ? ' (Note: forward resolution does not match this address)' : ''}`
            }],
            isError: false
        };
    } catch (error) {
        const errorMessage = handleEnsError(error, "reverse lookup");

        return {
            content: [{ type: "text", text: errorMessage }],
            isError: true
        };
    }
}


export async function getTextRecord( { name, key }: { name: string, key: string }): Promise<ServerResponse> {
    const normalizedName = normalizeName(name);
    try {
        const value = await publicClient.getTextRecord({ name:normalizedName, key });

        if (!value) {
            return {
                content: [{ type: "text", text: `No '${key}' record found for ${normalizedName}` }],
                isError: false
            };
        }

        return {
            content: [{ type: "text", text: `The '${key}' record for ${normalizedName} is: ${value}` }],
            isError: false
        };
    } catch (error) {
        const errorMessage = handleEnsError(error, "getting records");

        return {
            content: [{ type: "text", text: errorMessage }],
            isError: true
        };
    }
}


export async function checkAvailability( { name }: { name: string }): Promise<ServerResponse> {
    const normalizedName = normalizeName(name);
    try {

        
        const available = await publicClient.getAvailable({ name: normalizedName });

        if (available) {
            return {
                content: [{ type: "text", text: `The name ${normalizedName} is available for registration.` }],
                isError: false
            };
        } else {
            
            const owner = await publicClient.getOwner({ name: normalizedName });

            return {
                content: [{
                    type: "text",
                    text: `The name ${normalizedName} is already registered. ` +
                        (owner ? `Current owner: ${owner.owner}` : "")
                }],
                isError: false
            };
        }
    } catch (error) {
        const errorMessage = handleEnsError(error, "name availability check");

        return {
            content: [{ type: "text", text: errorMessage }],
            isError: true
        };
    }
}


export async function getAllRecords( { name }: { name: string }): Promise<ServerResponse> {
    const normalizedName = normalizeName(name);
    try {
        
        const records =( await justaname.subnames.getRecords({ens:normalizedName})).records

        let output = `Information for ${normalizedName}:\n\n`;
        output += `Resolver Address: ${records.resolverAddress}\n`;

        if (records.texts && records.texts.length > 0) {
            output += "\nText Records:\n";
            for (const record of records.texts) {
                output += `- ${record.key}: ${record.value}\n`;
            }
        } else {
            output += "\nNo text records found.";
        }

        if (records.coins && records.coins.length > 0) {
            output += "\nAddresses:\n";
            for (const coin of records.coins) {
                output += `- ${coin.name} (${coin.id}): ${coin.value}\n`;
            }
        } else {
            output += "\nNo cryptocurrency addresses found.";
        }

        if (records.contentHash) {
            output += `\nContent Hash: ${records.contentHash.decoded} (Protocol: ${records.contentHash.protocolType})`;
        }

        
        const owner = await publicClient.getOwner({ name: normalizedName });
        if (owner) {
            output += "\n\nOwnership Information:";
            output += `\n- Owner: ${owner.owner}`;
            if (owner.registrant) output += `\n- Registrant: ${owner.registrant}`;
            output += `\n- Level: ${owner.ownershipLevel}`;
        }

        
        const expiry = await publicClient.getExpiry({ name });
        if (expiry) {
            output += "\n\nExpiration Information:";
            output += `\n- Expires: ${expiry.expiry.date.toLocaleString()}`;
            output += `\n- Status: ${expiry.status}`;
            if (expiry.status === 'gracePeriod') {
                output += `\n- Grace Period: ${expiry.gracePeriod / 86400} days`;
            }
        }

        return {
            content: [{ type: "text", text: output }],
            isError: false
        };
    } catch (error) {
        const errorMessage = handleEnsError(error, "ens information");

        return {
            content: [{ type: "text", text: errorMessage }],
            isError: true
        };
    }
}


export async function getSubdomains( { name }: { name: string }): Promise<ServerResponse> {
    const normalizedName = normalizeName(name);
    try {
        const subdomains = await publicClient.getSubnames({ name: normalizedName });

        if (!subdomains || subdomains.length === 0) {
            return {
                content: [{ type: "text", text: `No subdomains found for ${name}` }],
                isError: false
            };
        }

        let output = `Subdomains for ${name}:\n\n`;
        for (const subdomain of subdomains) {
            output += `- ${subdomain.name}`;
            if (subdomain.owner) {
                output += ` (Owner: ${subdomain.owner})`;
            }
            output += '\n';
        }

        return {
            content: [{ type: "text", text: output }],
            isError: false
        };
    } catch (error) {
        const errorMessage = handleEnsError(error, "getting subdomains");

        return {
            content: [{ type: "text", text: errorMessage }],
            isError: true
        };
    }
}


export async function getNameHistory( { name }: { name: string }): Promise<ServerResponse> {
    const normalizedName = normalizeName(name);
    try {
        const history = await publicClient.getNameHistory({ name: normalizedName });

        if (!history) {
            return {
                content: [{ type: "text", text: `No history found for ${name}` }],
                isError: false
            };
        }

        let output = `History for ${name}:\n\n`;

        if (history.domainEvents.length > 0) {
            output += "Domain Events:\n";
            for (const event of history.domainEvents) {
                output += `- ${event.type} at block ${event.blockNumber}\n`;

                
                if (event.type === 'Transfer' || event.type === 'NewOwner') {
                    output += `  New owner: ${event.owner}\n`;
                } else if (event.type === 'NewResolver') {
                    output += `  New resolver: ${event.resolver}\n`;
                }
            }
        }

        if (history.registrationEvents && history.registrationEvents.length > 0) {
            output += "\nRegistration Events:\n";
            for (const event of history.registrationEvents) {
                output += `- ${event.type} at block ${event.blockNumber}\n`;

                
                if (event.type === 'NameRegistered') {
                    output += `  Registrant: ${event.registrant}\n`;
                    output += `  Expiry Date: ${new Date(Number(event.expiryDate) * 1000).toLocaleString()}\n`;
                } else if (event.type === 'NameRenewed') {
                    output += `  New Expiry Date: ${new Date(Number(event.expiryDate) * 1000).toLocaleString()}\n`;
                }
            }
        }

        if (history.resolverEvents && history.resolverEvents.length > 0) {
            output += "\nResolver Events:\n";
            for (const event of history.resolverEvents) {
                output += `- ${event.type} at block ${event.blockNumber}\n`;

                
                if (event.type === 'AddrChanged') {
                    output += `  New address: ${event.addr}\n`;
                } else if (event.type === 'TextChanged') {
                    output += `  Key: ${event.key}\n`;
                    if (event.value) output += `  Value: ${event.value}\n`;
                }
            }
        }

        return {
            content: [{ type: "text", text: output }],
            isError: false
        };
    } catch (error) {
        const errorMessage = handleEnsError(error, "get name history");

        return {
            content: [{ type: "text", text: errorMessage }],
            isError: true
        };
    }
}


export async function getRegistrationPrice( { name, duration = 1 }: { name: string, duration?: number }): Promise<ServerResponse> {
    const normalizedName = normalizeName(name);
    try {
        
        const durationInSeconds = duration * 365 * 24 * 60 * 60;

        
        const price = await publicClient.getPrice({
            nameOrNames: normalizedName,
            duration: durationInSeconds
        });

        return {
            content: [{
                type: "text",
                text: `Registration price for ${normalizedName} for ${duration} year(s):\n` +
                    `- Base Price: ${ethers.formatEther(price.base)} ETH\n` +
                    `- Premium: ${ethers.formatEther(price.premium)} ETH\n` +
                    `- Total: ${ethers.formatEther(price.base + price.premium)} ETH`
            }],
            isError: false
        };
    } catch (error) {
        const errorMessage = handleEnsError(error, "get registration price");

        return {
            content: [{ type: "text", text: errorMessage }],
            isError: true
        };
    }
}