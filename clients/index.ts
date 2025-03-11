import { createEnsPublicClient, EnsPublicClient } from "@ensdomains/ensjs";
import { mainnet } from "viem/chains";
import { http, fallback, FallbackTransport } from "viem";
import { JustaName } from "@justaname.id/sdk";

const DEFAULT_PROVIDERS = [
    "https://eth.drpc.org",
    "https://eth.llamarpc.com",
    "https://ethereum.publicnode.com",
    "https://rpc.ankr.com/eth"
];

const getProviderUrls = (): string[] => {
    const envProvider = process.env.PROVIDER_URL;

    if (envProvider && envProvider.includes(',')) {
        return envProvider.split(',').map(url => url.trim());
    }

    if (envProvider) {
        return [envProvider, ...DEFAULT_PROVIDERS.filter(url => url !== envProvider)];
    }

    return DEFAULT_PROVIDERS;
};

const configureTransport = (): FallbackTransport => {
    const providerUrls = getProviderUrls();

    const transports = providerUrls.map(url =>
        http(url, {
            timeout: 10000,
            fetchOptions: {
                headers: {
                    'Content-Type': 'application/json',
                },
            },
            retryCount: 3,
            retryDelay: 1000,
        })
    );

    return fallback(transports);
};

// @ts-ignore
export const publicClient: EnsPublicClient = createEnsPublicClient({
    chain: mainnet,
    transport: configureTransport()
});

export const createJustaNameClient = () => {
    const providerUrls = getProviderUrls();

    let client = JustaName.init({
        networks: [{
            chainId: 1,
            providerUrl: providerUrls[0]
        }]
    });

    return {
        client,
        retry: async (currentIndex = 0) => {
            if (currentIndex >= providerUrls.length - 1) {
                throw new Error("All providers failed");
            }

            client = JustaName.init({
                networks: [{
                    chainId: 1,
                    providerUrl: providerUrls[currentIndex + 1]
                }]
            });

            return client;
        }
    };
};

export const justaname = createJustaNameClient().client;