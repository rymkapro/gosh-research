const process = require('process')
const { Account, AccountType } = require('@eversdk/appkit')
const { TonClient, NetworkQueriesProtocol, signerKeys } = require('@eversdk/core')
const { libNode } = require('@eversdk/lib-node')

const WALLET_ABI = {
    'ABI version': 2,
    version: '2.3',
    header: ['pubkey', 'time', 'expire'],
    functions: [
        {
            name: 'constructor',
            inputs: [
                { name: 'rootpubaddr', type: 'address' },
                { name: 'pubaddr', type: 'address' },
                { name: 'nameDao', type: 'string' },
                { name: 'commitCode', type: 'cell' },
                { name: 'repositoryCode', type: 'cell' },
                { name: 'WalletCode', type: 'cell' },
                { name: 'TagCode', type: 'cell' },
                { name: 'SnapshotCode', type: 'cell' },
                { name: 'codeTree', type: 'cell' },
                { name: 'codeDiff', type: 'cell' },
                { name: 'contentSignature', type: 'cell' },
                { name: 'limit_wallets', type: 'uint128' },
                { name: 'access', type: 'optional(uint256)' },
                { name: 'lockerCode', type: 'cell' },
                { name: 'tokenWalletCode', type: 'cell' },
                { name: 'platformCode', type: 'cell' },
                { name: 'clientCode', type: 'cell' },
                { name: 'proposalCode', type: 'cell' },
                { name: '_tip3Root', type: 'address' },
            ],
            outputs: [],
        },
        {
            name: 'turnOnPubkey',
            inputs: [{ name: 'pubkey', type: 'uint256' }],
            outputs: [],
        },
        {
            name: 'turnOffPubkey',
            inputs: [],
            outputs: [],
        },
        {
            name: 'turnOnPubkeyIn',
            inputs: [{ name: 'pubkey', type: 'uint256' }],
            outputs: [],
        },
        {
            name: 'turnOffPubkeyIn',
            inputs: [],
            outputs: [],
        },
        {
            name: 'deployContent',
            inputs: [
                { name: 'repoName', type: 'string' },
                { name: 'commit', type: 'string' },
                { name: 'label', type: 'string' },
                { name: 'content', type: 'string' },
            ],
            outputs: [],
        },
        {
            name: 'setTombstoneWallet',
            inputs: [{ name: 'description', type: 'string' }],
            outputs: [],
        },
        {
            name: 'askForTombstone',
            inputs: [
                { name: 'index', type: 'uint128' },
                { name: 'description', type: 'string' },
            ],
            outputs: [],
        },
        {
            name: 'setTombstoneDao',
            inputs: [{ name: 'description', type: 'string' }],
            outputs: [],
        },
        {
            name: 'deployWalletDao',
            inputs: [{ name: 'pubaddr', type: 'address[]' }],
            outputs: [],
        },
        {
            name: 'deleteWalletDao',
            inputs: [{ name: 'pubaddr', type: 'address[]' }],
            outputs: [],
        },
        {
            name: 'deployWallet',
            inputs: [],
            outputs: [],
        },
        {
            name: 'destroyWallet',
            inputs: [],
            outputs: [],
        },
        {
            name: 'destroyObject',
            inputs: [{ name: 'obj', type: 'address' }],
            outputs: [],
        },
        {
            name: 'deployRepository',
            inputs: [
                { name: 'nameRepo', type: 'string' },
                {
                    components: [
                        { name: 'addr', type: 'address' },
                        { name: 'version', type: 'string' },
                    ],
                    name: 'previous',
                    type: 'optional(tuple)',
                },
            ],
            outputs: [],
        },
        {
            name: 'deployNewSnapshot',
            inputs: [
                { name: 'branch', type: 'string' },
                { name: 'commit', type: 'string' },
                { name: 'repo', type: 'address' },
                { name: 'name', type: 'string' },
                { name: 'snapshotdata', type: 'bytes' },
                { name: 'snapshotipfs', type: 'optional(string)' },
            ],
            outputs: [],
        },
        {
            name: 'deleteSnapshot',
            inputs: [{ name: 'snap', type: 'address' }],
            outputs: [],
        },
        {
            name: 'deployDiff',
            inputs: [
                { name: 'repoName', type: 'string' },
                { name: 'branchName', type: 'string' },
                { name: 'commitName', type: 'string' },
                {
                    components: [
                        { name: 'snap', type: 'address' },
                        { name: 'commit', type: 'string' },
                        { name: 'patch', type: 'optional(bytes)' },
                        { name: 'ipfs', type: 'optional(string)' },
                        { name: 'sha1', type: 'string' },
                        { name: 'sha256', type: 'uint256' },
                    ],
                    name: 'diffs',
                    type: 'tuple[]',
                },
                { name: 'index1', type: 'uint128' },
                { name: 'index2', type: 'uint128' },
                { name: 'last', type: 'bool' },
            ],
            outputs: [],
        },
        {
            name: 'deployCommit',
            inputs: [
                { name: 'repoName', type: 'string' },
                { name: 'branchName', type: 'string' },
                { name: 'commitName', type: 'string' },
                { name: 'fullCommit', type: 'string' },
                { name: 'parents', type: 'address[]' },
                { name: 'tree', type: 'address' },
                { name: 'upgrade', type: 'bool' },
            ],
            outputs: [],
        },
        {
            name: 'setCommit',
            inputs: [
                { name: 'repoName', type: 'string' },
                { name: 'branchName', type: 'string' },
                { name: 'commit', type: 'string' },
                { name: 'numberChangedFiles', type: 'uint128' },
                { name: 'numberCommits', type: 'uint128' },
            ],
            outputs: [],
        },
        {
            name: 'deployBranch',
            inputs: [
                { name: 'repoName', type: 'string' },
                { name: 'newName', type: 'string' },
                { name: 'fromCommit', type: 'string' },
            ],
            outputs: [],
        },
        {
            name: 'deleteBranch',
            inputs: [
                { name: 'repoName', type: 'string' },
                { name: 'Name', type: 'string' },
            ],
            outputs: [],
        },
        {
            name: 'setHEAD',
            inputs: [
                { name: 'repoName', type: 'string' },
                { name: 'branchName', type: 'string' },
            ],
            outputs: [],
        },
        {
            name: 'deployTag',
            inputs: [
                { name: 'repoName', type: 'string' },
                { name: 'nametag', type: 'string' },
                { name: 'nameCommit', type: 'string' },
                { name: 'content', type: 'string' },
                { name: 'commit', type: 'address' },
            ],
            outputs: [],
        },
        {
            name: 'deleteTag',
            inputs: [
                { name: 'repoName', type: 'string' },
                { name: 'nametag', type: 'string' },
            ],
            outputs: [],
        },
        {
            name: 'updateConfig',
            inputs: [],
            outputs: [],
        },
        {
            name: 'setConfig',
            inputs: [{ name: 'limit_wallets', type: 'uint128' }],
            outputs: [],
        },
        {
            name: 'deployTree',
            inputs: [
                { name: 'repoName', type: 'string' },
                { name: 'shaTree', type: 'string' },
                {
                    components: [
                        { name: 'flags', type: 'string' },
                        { name: 'mode', type: 'string' },
                        { name: 'typeObj', type: 'string' },
                        { name: 'name', type: 'string' },
                        { name: 'sha1', type: 'string' },
                        { name: 'sha256', type: 'uint256' },
                    ],
                    name: 'datatree',
                    type: 'map(uint256,tuple)',
                },
                { name: 'ipfs', type: 'optional(string)' },
            ],
            outputs: [],
        },
        {
            name: 'startProposalForSetCommit',
            inputs: [
                { name: 'repoName', type: 'string' },
                { name: 'branchName', type: 'string' },
                { name: 'commit', type: 'string' },
                { name: 'numberChangedFiles', type: 'uint128' },
                { name: 'numberCommits', type: 'uint128' },
                { name: 'num_clients', type: 'uint128' },
            ],
            outputs: [],
        },
        {
            name: 'startProposalForAddProtectedBranch',
            inputs: [
                { name: 'repoName', type: 'string' },
                { name: 'branchName', type: 'string' },
                { name: 'num_clients', type: 'uint128' },
            ],
            outputs: [],
        },
        {
            name: 'startProposalForDeleteProtectedBranch',
            inputs: [
                { name: 'repoName', type: 'string' },
                { name: 'branchName', type: 'string' },
                { name: 'num_clients', type: 'uint128' },
            ],
            outputs: [],
        },
        {
            name: 'tryProposalResult',
            inputs: [{ name: 'proposal', type: 'address' }],
            outputs: [],
        },
        {
            name: 'isCompletedCallback',
            inputs: [
                { name: '_platform_id', type: 'uint256' },
                { name: 'res', type: 'optional(bool)' },
                { name: 'propData', type: 'cell' },
            ],
            outputs: [],
        },
        {
            name: 'destroy',
            inputs: [],
            outputs: [],
        },
        {
            name: 'askForDestroy',
            inputs: [],
            outputs: [],
        },
        {
            name: 'getContentCode',
            inputs: [{ name: 'repoName', type: 'string' }],
            outputs: [{ name: 'value0', type: 'cell' }],
        },
        {
            name: 'getContentAdress',
            inputs: [
                { name: 'repoName', type: 'string' },
                { name: 'commit', type: 'string' },
                { name: 'label', type: 'string' },
            ],
            outputs: [{ name: 'value0', type: 'address' }],
        },
        {
            name: 'getDiffAddr',
            inputs: [
                { name: 'reponame', type: 'string' },
                { name: 'commitName', type: 'string' },
                { name: 'index1', type: 'uint128' },
                { name: 'index2', type: 'uint128' },
            ],
            outputs: [{ name: 'value0', type: 'address' }],
        },
        {
            name: 'getAddrRootGosh',
            inputs: [],
            outputs: [{ name: 'value0', type: 'address' }],
        },
        {
            name: 'getAddrDao',
            inputs: [],
            outputs: [{ name: 'value0', type: 'address' }],
        },
        {
            name: 'getRootAddress',
            inputs: [],
            outputs: [{ name: 'value0', type: 'address' }],
        },
        {
            name: 'getWalletAddress',
            inputs: [],
            outputs: [{ name: 'value0', type: 'address' }],
        },
        {
            name: 'getSnapshotAddr',
            inputs: [
                { name: 'branch', type: 'string' },
                { name: 'repo', type: 'address' },
                { name: 'name', type: 'string' },
            ],
            outputs: [{ name: 'value0', type: 'address' }],
        },
        {
            name: 'getSnapshotCode',
            inputs: [
                { name: 'branch', type: 'string' },
                { name: 'repo', type: 'address' },
            ],
            outputs: [{ name: 'value0', type: 'cell' }],
        },
        {
            name: 'getConfig',
            inputs: [],
            outputs: [{ name: 'value0', type: 'uint128' }],
        },
        {
            name: 'getWalletAddr',
            inputs: [{ name: 'index', type: 'uint128' }],
            outputs: [{ name: 'value0', type: 'address' }],
        },
        {
            name: 'getWalletOwner',
            inputs: [],
            outputs: [{ name: 'value0', type: 'address' }],
        },
        {
            name: 'getWalletsCount',
            inputs: [],
            outputs: [{ name: 'value0', type: 'uint128' }],
        },
        {
            name: 'getVersion',
            inputs: [],
            outputs: [{ name: 'value0', type: 'string' }],
        },
        {
            name: 'getDiffResult',
            inputs: [
                { name: 'state', type: 'bytes' },
                { name: 'diff', type: 'bytes' },
            ],
            outputs: [{ name: 'value0', type: 'optional(bytes)' }],
        },
        {
            name: 'getHash',
            inputs: [{ name: 'state', type: 'bytes' }],
            outputs: [{ name: 'value0', type: 'uint256' }],
        },
        {
            name: 'getAccess',
            inputs: [],
            outputs: [{ name: 'value0', type: 'optional(uint256)' }],
        },
        {
            name: 'getTombstone',
            inputs: [],
            outputs: [{ name: 'value0', type: 'bool' }],
        },
        {
            name: 'onTokenWalletDeployed',
            inputs: [{ name: 'wallet', type: 'address' }],
            outputs: [],
        },
        {
            name: 'proposalIsCompleted',
            inputs: [{ name: 'proposal', type: 'address' }],
            outputs: [],
        },
        {
            name: 'onLockerDeployed',
            inputs: [],
            outputs: [],
        },
        {
            name: 'onLockerTokenWalletDeployed',
            inputs: [{ name: 'wallet', type: 'address' }],
            outputs: [],
        },
        {
            name: 'lockVoting',
            inputs: [{ name: 'amount', type: 'uint128' }],
            outputs: [],
        },
        {
            name: 'unlockVoting',
            inputs: [{ name: 'amount', type: 'uint128' }],
            outputs: [],
        },
        {
            name: 'voteFor',
            inputs: [
                { name: 'platform_id', type: 'uint256' },
                { name: 'choice', type: 'bool' },
                { name: 'amount', type: 'uint128' },
                { name: 'num_clients', type: 'uint128' },
            ],
            outputs: [],
        },
        {
            name: 'getPlatfotmId',
            inputs: [
                { name: 'propId', type: 'uint256' },
                { name: 'platformType', type: 'uint8' },
                { name: '_tip3VotingLocker', type: 'address' },
            ],
            outputs: [{ name: 'value0', type: 'uint256' }],
        },
        {
            name: 'clientAddressForProposal',
            inputs: [
                { name: '_tip3VotingLocker', type: 'address' },
                { name: '_platform_id', type: 'uint256' },
            ],
            outputs: [{ name: 'value0', type: 'address' }],
        },
        {
            name: 'proposalAddressByAccount',
            inputs: [
                { name: 'acc', type: 'address' },
                { name: 'propId', type: 'uint256' },
            ],
            outputs: [{ name: 'value0', type: 'address' }],
        },
        {
            name: 'killAccount',
            inputs: [
                { name: 'address_to', type: 'address' },
                { name: 'value1', type: 'address' },
            ],
            outputs: [],
        },
        {
            name: 'withdrawTokens',
            inputs: [
                { name: 'address_to', type: 'address' },
                { name: 'amount', type: 'uint128' },
            ],
            outputs: [],
        },
        {
            name: 'updateHead',
            inputs: [],
            outputs: [],
        },
        {
            name: 'returnExtraLockerFunds',
            inputs: [],
            outputs: [],
        },
        {
            name: 'onAcceptTokensMint',
            inputs: [
                { name: 'value0', type: 'address' },
                { name: 'amount', type: 'uint128' },
                { name: 'gasTo', type: 'address' },
                { name: 'value3', type: 'cell' },
            ],
            outputs: [],
        },
        {
            name: 'onBounceTokensTransfer',
            inputs: [
                { name: 'value0', type: 'address' },
                { name: 'amount', type: 'uint128' },
                { name: 'value2', type: 'address' },
            ],
            outputs: [],
        },
        {
            name: 'onAcceptTokensTransfer',
            inputs: [
                { name: 'value0', type: 'address' },
                { name: 'amount', type: 'uint128' },
                { name: 'value2', type: 'address' },
                { name: 'value3', type: 'address' },
                { name: 'gasTo', type: 'address' },
                { name: 'value5', type: 'cell' },
            ],
            outputs: [],
        },
        {
            name: 'updateTokenBalance',
            inputs: [],
            outputs: [],
        },
        {
            name: 'onUpdateBalance',
            inputs: [{ name: 'amount', type: 'uint128' }],
            outputs: [],
        },
        {
            name: 'storeValue',
            inputs: [{ name: 'newValue', type: 'uint256' }],
            outputs: [],
        },
        {
            name: 'm_tokenRoot',
            inputs: [],
            outputs: [{ name: 'm_tokenRoot', type: 'address' }],
        },
        {
            name: 'm_tokenWallet',
            inputs: [],
            outputs: [{ name: 'm_tokenWallet', type: 'address' }],
        },
        {
            name: 'm_tokenBalance',
            inputs: [],
            outputs: [{ name: 'm_tokenBalance', type: 'uint128' }],
        },
        {
            name: 'm_tokenWalletCode',
            inputs: [],
            outputs: [{ name: 'm_tokenWalletCode', type: 'cell' }],
        },
        {
            name: 'lockerTip3Wallet',
            inputs: [],
            outputs: [{ name: 'lockerTip3Wallet', type: 'address' }],
        },
        {
            name: 'initialized',
            inputs: [],
            outputs: [{ name: 'initialized', type: 'bool' }],
        },
        {
            name: 'tip3VotingLocker',
            inputs: [],
            outputs: [{ name: 'tip3VotingLocker', type: 'address' }],
        },
        {
            name: 'lastVoteResult',
            inputs: [],
            outputs: [{ name: 'lastVoteResult', type: 'optional(bool)' }],
        },
    ],
    data: [
        { key: 1, name: '_goshdao', type: 'address' },
        { key: 2, name: '_index', type: 'uint128' },
        { key: 3, name: '_goshroot', type: 'address' },
    ],
    events: [],
    fields: [
        { name: '_pubkey', type: 'uint256' },
        { name: '_constructorFlag', type: 'bool' },
        { name: 'messages', type: 'map(uint32,map(uint256,bool))' },
        {
            components: [
                { name: 'messageHash', type: 'uint256' },
                { name: 'expireAt', type: 'uint32' },
            ],
            name: 'lastMessage',
            type: 'tuple',
        },
        { name: '__value', type: 'uint256' },
        { name: 'm_tokenRoot', type: 'address' },
        { name: 'm_tokenWallet', type: 'address' },
        { name: 'm_tokenBalance', type: 'uint128' },
        { name: 'm_tokenWalletCode', type: 'cell' },
        { name: '_pubaddr', type: 'address' },
        { name: '_goshdao', type: 'address' },
        { name: '_index', type: 'uint128' },
        { name: 'nonce', type: 'uint256' },
        { name: 'lockerTip3Wallet', type: 'address' },
        { name: 'initialized', type: 'bool' },
        { name: 'tip3VotingLocker', type: 'address' },
        { name: 'lastVoteResult', type: 'optional(bool)' },
        { name: 'clientCodeHash', type: 'uint256' },
        { name: 'clientCodeDepth', type: 'uint16' },
        { name: 'proposalCodeHash', type: 'uint256' },
        { name: 'proposalCodeDepth', type: 'uint16' },
        { name: 'platformCodeHash', type: 'uint256' },
        { name: 'platformCodeDepth', type: 'uint16' },
        { name: 'lockerCodeHash', type: 'uint256' },
        { name: 'lockerCodeDepth', type: 'uint16' },
        { name: 'm_SMVPlatformCode', type: 'cell' },
        { name: 'm_SMVProposalCode', type: 'cell' },
        { name: 'm_SMVClientCode', type: 'cell' },
        { name: 'm_lockerCode', type: 'cell' },
        { name: '_access', type: 'optional(uint256)' },
        { name: '_goshroot', type: 'address' },
        { name: '_rootpubaddr', type: 'address' },
        { name: '_nameDao', type: 'string' },
        { name: '_flag', type: 'bool' },
        { name: '_code', type: 'map(uint8,cell)' },
        { name: 'counter', type: 'uint128' },
        { name: '_last_time', type: 'uint128' },
        { name: '_walletcounter', type: 'uint128' },
        { name: '_limit_wallets', type: 'uint128' },
        { name: '_tombstone', type: 'bool' },
    ],
}
const WALLET_ADDRESS =
    '0:f0084a1164ab9fec87c023cc443383349ac2cbbae5ab2eac4a83c8a466276371'
const WALLET_KEYS = {
    public: '7389d5f8218667cddeef649b38ad34404b615324a49b3a8872287e38f93db5e8',
    secret: '9617dc9b97d03d81cbfb84cde7c399f1059b94a06cd0d530e8e31a0dd9d87df1',
}
const ENDPOINTS = ['https://vps23.ton.dev']

TonClient.useBinaryLibrary(libNode)
const client = new TonClient({
    network: {
        endpoints: ENDPOINTS,
        queries_protocol: NetworkQueriesProtocol.WS,
        sending_endpoint_count: ENDPOINTS.length,
        message_retries_count: 0,
    },
})

const wallet = new Account(
    { abi: WALLET_ABI },
    { client, address: WALLET_ADDRESS, signer: signerKeys(WALLET_KEYS) },
)

const testMultipleWallets = async () => {
    // Deploy sub wallets
    console.log('PREPARE WALLETS')
    const subwallets = await Promise.all(
        Array.from(new Array(10)).map(async (_, index) => {
            const result = await wallet.runLocal('getWalletAddr', { index })
            const address = result.decoded.output.value0
            const subwallet = new Account(
                { abi: WALLET_ABI },
                { client, address, signer: signerKeys(WALLET_KEYS) },
            )

            const account = await subwallet.getAccount()
            if (account.acc_type !== AccountType.active) {
                await wallet.run('deployWallet', {})
            }
            console.log(
                `  > Wallet deployed`,
                `\tIndex: ${index}`,
                `\tAddress: ${address}`,
            )

            return subwallet
        }),
    )

    // Generate message params chunks
    console.log('\nPREPARE CHUNKS')
    const chunkLength = 20
    const chunks = []
    const date = Date.now()
    for (let i = 0; i < subwallets.length; i++) {
        const chunk = Array.from(new Array(chunkLength)).map((_, index) => ({
            branch: 'main',
            commit: '',
            repo: '0:e804269af056e7eb3cf373310fd6c6cd50833a2920e223a65a970041ea0422c2',
            name: `filename-${date}-${chunks.length}-${index}`,
            snapshotdata: '',
            snapshotipfs: null,
        }))
        chunks.push(chunk)
    }
    console.log('  > Chunks', `\tTotal: ${chunks.length}`, `\tEach: ${chunkLength}`)

    // Send message chunk to each wallet
    console.log('\nSEND CHUNKS')
    const start = Math.round(Date.now() / 1000)
    await Promise.all(
        chunks.map(async (chunk, i) => {
            await _chunkSend(chunk, subwallets[i])
        }),
    )
    const end = Math.round(Date.now() / 1000)
    console.log(`Total time: ${end - start}s`)
}

const _chunkSend = async (chunk, wallet) => {
    await Promise.all(
        chunk.map(async (params) => {
            const rqTime = new Date()
            try {
                const start = Math.round(Date.now() / 1000)
                const { transaction } = await wallet.run('deployNewSnapshot', params)
                const rsTime = new Date()
                const end = Math.round(Date.now() / 1000)
                console.log(
                    `  > ${params.name}:`,
                    `\tRqTime: ${rqTime.toLocaleTimeString()}`,
                    `\tRsTime: ${rsTime.toLocaleTimeString()}`,
                    `\tTxTime: ${transaction.now}`,
                    `\tDuration: ${end - start}s`,
                )
            } catch (e) {
                console.log(e.message)
                console.log(
                    `  > ${params.name}:`,
                    `\tRqTime: ${rqTime.toLocaleTimeString()}`,
                    `\tRsTime: EXPIRED`,
                    `\tMsgID: ${e.data.message_id}`,
                    `(${e.data.local_error.data.exit_code})`,
                )
            }
        }),
    )
}

testMultipleWallets()
    .then(() => process.exit(0))
    .catch((reason) => {
        console.log('Error', reason.message)
        process.exit(-1)
    })
