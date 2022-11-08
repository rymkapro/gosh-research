const { TonClient, NetworkQueriesProtocol } = require('@eversdk/core')
const { libNode } = require('@eversdk/lib-node')

TonClient.useBinaryLibrary(libNode)

const ENDPOINTS = [
    'https://n01.fld.dapp.tonlabs.io/graphql',
    'https://n02.fld.dapp.tonlabs.io/graphql',
    'https://n03.fld.dapp.tonlabs.io/graphql',
    'https://n04.fld.dapp.tonlabs.io/graphql',
]

const client = new TonClient({
    network: {
        endpoints: ENDPOINTS,
        queries_protocol: NetworkQueriesProtocol.HTTP,
        sending_endpoint_count: ENDPOINTS.length,
        message_retries_count: 0,
    },
    // abi: {
    //     message_expiration_timeout: 120000,
    // },
})

module.exports = client
