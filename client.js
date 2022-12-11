const { TonClient, NetworkQueriesProtocol } = require('@eversdk/core')
const { libNode } = require('@eversdk/lib-node')

TonClient.useBinaryLibrary(libNode)

const ENDPOINTS = [
    'https://bhs01.network.gosh.sh',
    'https://eri01.network.gosh.sh',
    'https://gra01.network.gosh.sh',
]

const client = new TonClient({
    network: {
        endpoints: ENDPOINTS,
        queries_protocol: NetworkQueriesProtocol.WS,
        sending_endpoint_count: ENDPOINTS.length,
        message_retries_count: 0,
    },
    // abi: {
    //     message_expiration_timeout: 120000,
    // },
})

module.exports = client
