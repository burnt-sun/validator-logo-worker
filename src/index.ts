import type { Validator, ChainInfo, ValidatorResponse, KeybaseResponse } from './types';

/* Headers */
const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, OPTIONS',
	'Access-Control-Allow-Headers': '*',
};

/* Constants */
enum ValidChainIds {
	MAINNET = 'xion-mainnet-1',
	TESTNET = 'xion-testnet-2',
}
const CHAIN_INFO_BASE = 'https://assets.xion.burnt.com/chain-registry/{slug}/chain.json';
const chainInfoURLMap = {
	[ValidChainIds.MAINNET]: CHAIN_INFO_BASE.replace('{slug}', 'xion'),
	[ValidChainIds.TESTNET]: CHAIN_INFO_BASE.replace('{slug}', 'testnets/xiontestnet2'),
};

const VALIDATOR_LIST_ENDPOINT = '/cosmos/staking/v1beta1/validators';
const VALIDATOR_LIST_PAGE_SIZE = 50;

/* Helpers */

/**
 * Fetch chain info from xion assets repo
 * @param chainId - The chain id to fetch info for
 * @returns The chain info
 */
const fetchChainInfo = async (chainId: ValidChainIds) => {
	const url = chainInfoURLMap[chainId];
	const response = await fetch(url);
	const data = (await response.json()) as ChainInfo;

	// Validate required fields
	if (!data.apis?.rest?.[0]?.address) {
		throw new Error('Invalid chain info: missing REST API endpoint');
	}

	return data;
};

/**
 * Fetch validator list from lcd
 * @param lcdUrl - The lcd url to fetch validator list from
 * @returns The validator list
 */
const fetchValidatorList = async (lcdUrl: string) => {
	const validators: Validator[] = [];
	let nextKey: string | null = null;

	do {
		try {
			const url = `${lcdUrl}${VALIDATOR_LIST_ENDPOINT}${nextKey ? `?pagination.key=${encodeURIComponent(nextKey)}` : ''}${
				VALIDATOR_LIST_PAGE_SIZE ? `${nextKey ? '&' : '?'}pagination.limit=${VALIDATOR_LIST_PAGE_SIZE}` : ''
			}`;
			const response = await fetch(url);

			if (!response.ok) {
				throw new Error(`Failed to fetch validators: ${response.status} ${response.statusText}`);
			}

			const data = (await response.json()) as ValidatorResponse;

			if (!data.validators || !Array.isArray(data.validators)) {
				throw new Error('Invalid validator response: missing validators array');
			}

			validators.push(...data.validators);
			nextKey = data.pagination.next_key;
		} catch (error) {
			console.error('Error fetching validators:', error);
			throw error; // Re-throw to be handled by the caller
		}
	} while (nextKey);

	return validators;
};

/**
 * Fetch logo from keybase
 * @param keybaseUsername - The keybase key suffix to fetch logo for
 * @returns The logo url
 */
async function fetchLogoFromKeybase(keybaseUsername: string) {
	try {
		const url = `https://keybase.io/_/api/1.0/user/lookup.json?key_suffix=${keybaseUsername}`;
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`Failed to fetch Keybase data: ${response.status} ${response.statusText}`);
		}

		const data = (await response.json()) as KeybaseResponse;

		// Validate response structure
		if (!data.them?.[0]?.pictures?.primary?.url) {
			return null;
		}

		return data.them[0].pictures.primary.url;
	} catch (error) {
		console.error(`Error fetching Keybase data for ${keybaseUsername}:`, error);
		return null;
	}
}

/**
 * Fetch validator images
 * @param validators - The validator list to fetch images for
 * @returns The validator images
 */
async function fetchValidatorImages(validators: Validator[]) {
	const validatorImages = new Map<string, string>();
	for (const validator of validators) {
		if (validator.description.identity) {
			const logoUrl = await fetchLogoFromKeybase(validator.description.identity);
			if (logoUrl) {
				validatorImages.set(validator.operator_address, logoUrl);
			}
		}
	}
	return validatorImages;
}

/* Main */
export default {
	async fetch(request, env, ctx): Promise<Response> {
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 204,
				headers: corsHeaders,
			});
		}

		try {
			// fetch chain id from params
			const url = new URL(request.url);
			const chainId = url.searchParams.get('chain-id');

			// return bad request if no chain id
			if (!chainId) {
				return new Response(JSON.stringify({ error: 'Missing chain-id parameter' }), {
					status: 400,
					headers: {
						...corsHeaders,
						'Content-Type': 'application/json',
					},
				});
			}

			// return bad request if chain id is not valid
			if (!Object.values(ValidChainIds).includes(chainId as ValidChainIds)) {
				return new Response(JSON.stringify({ error: 'Invalid chain-id' }), {
					status: 400,
					headers: {
						...corsHeaders,
						'Content-Type': 'application/json',
					},
				});
			}

			// fetch chain info using chain id from xion assets repo
			const chainInfo = await fetchChainInfo(chainId as ValidChainIds);

			// query validator list from lcd
			const validatorList = await fetchValidatorList(chainInfo.apis.rest[0].address);

			// for each validator, fetch logo from keybase based on identity
			const validatorImages = await fetchValidatorImages(validatorList);

			// convert to a plain object for JSON serialization
			const validatorImagesDict = Object.fromEntries(validatorImages);

			// return a map of validator address to logo
			return new Response(
				JSON.stringify({
					chainId,
					validators: validatorImagesDict,
					timestamp: new Date().toISOString(),
				}),
				{
					status: 200,
					headers: {
						...corsHeaders,
						'Content-Type': 'application/json',
						'Cache-Control': 'public, max-age=3600',
					},
				}
			);
		} catch (error) {
			console.error('Error processing request:', error);
			return new Response(
				JSON.stringify({
					error: 'Internal server error',
					message: error instanceof Error ? error.message : 'Unknown error',
				}),
				{
					status: 500,
					headers: {
						...corsHeaders,
						'Content-Type': 'application/json',
					},
				}
			);
		}
	},
} satisfies ExportedHandler<Env>;
