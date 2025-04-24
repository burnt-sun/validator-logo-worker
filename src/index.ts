import type { Validator, ChainInfo, ValidatorResponse, KeybaseResponse } from './types';

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
	return response.json() as Promise<ChainInfo>;
};

/**
 * Fetch validator list from lcd
 * @param lcdUrl - The lcd url to fetch validator list from
 * @returns The validator list
 */
const fetchValidatorList = async (lcdUrl: string) => {
	// initialize validators array
	const validators: Validator[] = [];

	// initialize next key
	let nextKey: string | null = null;

	// fetch validators - use paging to ensure all validators are fetched
	// pagination key must be encoded and come before the limit
	do {
		try {
			const url = `${lcdUrl}${VALIDATOR_LIST_ENDPOINT}${nextKey ? `?pagination.key=${encodeURIComponent(nextKey)}` : ''}${
				VALIDATOR_LIST_PAGE_SIZE ? `${nextKey ? '&' : '?'}pagination.limit=${VALIDATOR_LIST_PAGE_SIZE}` : ''
			}`;
			const response = await fetch(url);
			const data = (await response.json()) as ValidatorResponse;
			if (!data.validators) {
				break;
			}
			validators.push(...data.validators);
			nextKey = data.pagination.next_key;
		} catch (error) {
			console.error(error);
			break;
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
	const url = `https://keybase.io/_/api/1.0/user/lookup.json?key_suffix=${keybaseUsername}`;
	const response = await fetch(url);
	const data = (await response.json()) as KeybaseResponse;
	return data?.them?.[0]?.pictures?.primary?.url;
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
		// fetch chain id from params
		const url = new URL(request.url);
		const chainId = url.searchParams.get('chain-id');

		// return bad request if no chain id
		if (!chainId) {
			return new Response('Bad Request - Missing chain-id', { status: 400 });
		}

		// return bad request if chain id is not valid
		if (!Object.values(ValidChainIds).includes(chainId as ValidChainIds)) {
			return new Response('Bad Request - Invalid chain-id', { status: 400 });
		}

		// fetch chain info using chain id from xion assets repo
		const chainInfo = await fetchChainInfo(chainId as ValidChainIds);

		// if no chain id, return bad request
		if (!chainInfo) {
			return new Response('Bad Request - No chain info', { status: 400 });
		}

		// query validator list from lcd
		const validatorList = await fetchValidatorList(chainInfo.apis.rest[0].address);

		// if no validator list, return bad request
		if (!validatorList) {
			return new Response('Bad Request - No validator list', { status: 400 });
		}

		// for each validator, fetch logo from keybase based on identity
		const validatorImages = await fetchValidatorImages(validatorList);

		// convert to a plain object for JSON serialization
		const validatorImagesDict = Object.fromEntries(validatorImages);

		// return a map of validator address to logo
		return new Response(
			JSON.stringify({
				[chainId]: validatorImagesDict,
			}),
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json',
				},
			}
		);
	},
} satisfies ExportedHandler<Env>;
