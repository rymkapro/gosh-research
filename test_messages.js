const { TonClient, NetworkQueriesProtocol, abiSerialized } = require('@eversdk/core')
const { libNode } = require('@eversdk/lib-node')
const fs = require('fs')
const CommitABI = require('./abis/commit.abi.json')

const ENDPOINTS = ['https://bhs01.network.gosh.sh/']

TonClient.useBinaryLibrary(libNode)
const client = new TonClient({
    network: {
        endpoints: ENDPOINTS,
        queries_protocol: NetworkQueriesProtocol.WS,
        sending_endpoint_count: ENDPOINTS.length,
        message_retries_count: 0,
    },
})

const getMessages = async (abi, variables, decode = false, all = false, messages) => {
    const {
        address,
        msgType,
        node = [],
        cursor,
        limit = 50,
        allow_latest_inconsistent_data = false,
    } = variables

    const result = ['id', 'msg_type', 'created_lt', 'body', ...node]
    messages = messages ?? []
    all = all ?? false
    decode = decode ?? false

    const query = `query MessagesQuery(
        $address: String!,
        $msgType: [BlockchainMessageTypeFilterEnum!],
        $cursor: String,
        $limit: Int
        $allow_latest_inconsistent_data: Boolean
    ) {
        blockchain {
            account(address: $address) {
                messages(
                    msg_type: $msgType,
                    last: $limit,
                    before: $cursor,
                    allow_latest_inconsistent_data: $allow_latest_inconsistent_data
                ) {
                    edges {
                        node {${result.join(' ')}}
                    }
                    pageInfo {
                        startCursor
                        hasPreviousPage
                    }
                }
            }
        }
    }`
    const response = await client.net.query({
        query,
        variables: {
            address,
            msgType,
            limit,
            cursor: cursor || null,
            allow_latest_inconsistent_data,
        },
    })
    const { edges, pageInfo } = response.result.data.blockchain.account.messages

    const page = edges
        .map((edge) => ({ message: edge.node, decoded: null }))
        .sort((a, b) => {
            const a_lt = parseInt(a.message.created_lt, 16)
            const b_lt = parseInt(b.message.created_lt, 16)
            return b_lt - a_lt
        })
    if (decode) {
        await Promise.all(
            page.map(async (item) => {
                const { body, msg_type } = item.message
                item.decoded = await decodeMessageBody(abi, body, msg_type)
            }),
        )
    }
    messages.push(...page)

    if (!all || !pageInfo.hasPreviousPage) {
        return { cursor: pageInfo.startCursor, messages }
    }

    await new Promise((resolve) => setTimeout(resolve, 300))
    return await getMessages(
        abi,
        { ...variables, cursor: pageInfo.startCursor },
        decode,
        all,
        messages,
    )
}

const decodeMessageBody = async (abi, body, type) => {
    try {
        return await client.abi.decode_message_body({
            abi,
            body,
            is_internal: type === 0,
            allow_partial: true,
        })
    } catch {
        return null
    }
}

const readMessages = async () => {
    const { messages } = await getMessages(
        abiSerialized(CommitABI),
        {
            address: '0:df57b170232707231af935c46d980116437243c9aa516055afe3f466da7aed23',
            msgType: ['IntIn'],
        },
        true,
        true,
    )
    fs.writeFileSync('./messages.log', JSON.stringify(messages))
}

const processMessages = async () => {
    const data = JSON.parse(fs.readFileSync('./messages.log'))
    const processed = data.filter(
        ({ decoded }) => !!decoded && decoded.name === 'abortDiff',
    )
    fs.writeFileSync('./processed.log', JSON.stringify(processed))
}

processMessages()
    .then(() => process.exit(0))
    .catch((reason) => {
        console.log('Error', reason.message)
        process.exit(-1)
    })
