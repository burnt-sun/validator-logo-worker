export interface ChainInfo {
	$schema: string;
	chain_name: string;
	chain_type: string;
	chain_id: string;
	pretty_name: string;
	website: string;
	status: string;
	network_type: string;
	bech32_prefix: string;
	bech32_config: {
		bech32PrefixAccAddr: string;
		bech32PrefixAccPub: string;
		bech32PrefixValAddr: string;
		bech32PrefixValPub: string;
		bech32PrefixConsAddr: string;
		bech32PrefixConsPub: string;
	};
	daemon_name: string;
	node_home: string;
	key_algos: string[];
	slip44: number;
	fees: {
		fee_tokens: Array<{
			denom: string;
			fixed_min_gas_price: number;
			low_gas_price: number;
			average_gas_price: number;
			high_gas_price: number;
		}>;
	};
	staking: {
		staking_tokens: Array<{
			denom: string;
		}>;
	};
	codebase: {
		git_repo: string;
		tag: string;
		recommended_version: string;
		language: {
			type: string;
			version: string;
		};
		binaries: {
			[key: string]: string;
		};
		sdk: {
			type: string;
			version: string;
		};
		consensus: {
			type: string;
			version: string;
		};
		cosmwasm: {
			version: string;
			enabled: boolean;
		};
		ibc: {
			type: string;
			version: string;
		};
		genesis: {
			genesis_url: string;
		};
	};
	peers: {
		seeds: Array<{
			id: string;
			address: string;
			provider: string;
		}>;
		persistent_peers: Array<{
			id: string;
			address: string;
			provider: string;
		}>;
	};
	apis: {
		rpc: Array<{
			address: string;
			provider: string;
		}>;
		rest: Array<{
			address: string;
			provider: string;
		}>;
		grpc: Array<{
			address: string;
			provider: string;
		}>;
	};
	explorers: Array<{
		kind?: string;
		url: string;
		tx_page: string;
		account_page: string;
	}>;
	images: Array<{
		png: string;
	}>;
	logo_URIs: {
		png: string;
	};
	description: string;
	keywords: string[];
}

export interface Pagination {
	next_key: string | null;
	total: string;
}

export interface Validator {
	operator_address: string;
	consensus_pubkey: { '@type': string; key: string };
	jailed: boolean;
	status: string;
	tokens: string;
	delegator_shares: string;
	description: {
		moniker: string;
		identity: string;
		website: string;
		security_contact: string;
		details: string;
	};
	unbonding_height: string;
	unbonding_time: string;
	commission: {
		commission_rates: {
			rate: string;
			max_rate: string;
			max_change_rate: string;
		};
		update_time: string;
	};
	min_self_delegation: string;
	unbonding_on_hold_ref_count: string;
	unbonding_ids: string[];
}

export interface ValidatorResponse {
	validators: Validator[];
	pagination: Pagination;
}

export interface KeybaseResponse {
	status: {
		code: number;
		name: string;
	};
	them: Array<{
		id: string;
		basics: {
			username: string;
			ctime: number;
			mtime: number;
			id_version: number;
			track_version: number;
			last_id_change: number;
			username_cased: string;
			state: number;
			service_url: string;
			proof_url: string;
			sig_id: string;
			proof_id: string;
			human_url: string;
			presentation_group: string;
			presentation_tag: string;
		};
		proofs_summary: {
			all: Array<{
				proof_type: string;
				nametag: string;
				state: number;
				service_url: string;
				proof_url: string;
				sig_id: string;
				proof_id: string;
				human_url: string;
				presentation_group: string;
				presentation_tag: string;
			}>;
			has_web: boolean;
		};
		cryptocurrency_addresses: Record<string, unknown>;
		pictures: {
			primary: {
				url: string;
				source: string | null;
			};
		};
		sigs: {
			last: {
				sig_id: string;
				seqno: number;
				payload_hash: string;
			};
		};
		devices: Record<string, unknown>;
		stellar: {
			hidden: boolean;
			primary: Record<string, unknown>;
		};
	}>;
}
