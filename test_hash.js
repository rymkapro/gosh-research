const { TonClient, NetworkQueriesProtocol } = require('@eversdk/core')
const { libNode } = require('@eversdk/lib-node')
const { Account } = require('@eversdk/appkit')
const GoshABI = require('./abis/gosh.abi.json')

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

const testTvmHash = async () => {
    // Prepare data as bytes
    const data = Buffer.from('Test data').toString('hex')

    // Run contract getter
    const gosh = new Account(
        { abi: GoshABI },
        {
            client,
            address: '0:870d2c26cf3cbfcac7e853e687b1bd6499584184af34a093ac34384b273a7a02',
        },
    )
    const result = await gosh.runLocal('getHash', { state: data })
    console.log(`TMV hash by getter\t${result.decoded.output.value0}`)

    // Get hash by SDK
    const { boc } = await client.abi.encode_boc({
        params: [{ name: 'state', type: 'bytes' }],
        data: { state: data },
    })
    const { hash } = await client.boc.get_boc_hash({ boc })
    console.log(`TVM hash by SDK\t\t0x${hash}`)
}

testTvmHash()
    .then(() => process.exit(0))
    .catch((reason) => {
        console.log('Error', reason.message)
        process.exit(-1)
    })
