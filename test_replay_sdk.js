const process = require('process')
const fs = require('fs')
const { signerKeys, abiSerialized } = require('@eversdk/core')

const GoshWalletAbi = require('./abis/goshwallet.abi.json')
const client = require('./client')

const WALLET_ADDRESS =
    '0:90dab6198f00f58a16983cc50dd456121a1d8ceb8bb0296d1da0f8f31a20344f'
const WALLET_KEYS = {
    public: '7389d5f8218667cddeef649b38ad34404b615324a49b3a8872287e38f93db5e8',
    secret: '9617dc9b97d03d81cbfb84cde7c399f1059b94a06cd0d530e8e31a0dd9d87df1',
}

const _sendMessage = async (filename) => {
    const _sendMessageCallback = async (params) => {
        const error = params.error ? JSON.stringify(params.error) : null
        const msgid = params.message_id ? `MsgID: ${params.message_id}` : null
        const shblockid = params.shard_block_id
            ? `ShardBlockID: ${params.shard_block_id}`
            : null

        const logitem = [`[${params.type}]`, error, msgid, shblockid]
        logitems.push(logitem.filter((item) => !!item).join('\t'))
    }

    const _waitForTransactionCallback = (params) => {
        const kind = params.json?.kind ? `Kind: ${params.json.kind}` : null
        const error = params.error ? JSON.stringify(params.error) : null
        const msgid = params.message_id ? `MsgID: ${params.message_id}` : null
        const blockid = params.json?.block_id ? `BlockID: ${params.json.block_id}` : null
        const shblockid = params.shard_block_id
            ? `ShardBlockID: ${params.shard_block_id}`
            : null
        const json =
            kind && kind.search('RejectedByCollator') >= 0
                ? JSON.stringify(params.json)
                : null

        const logitem = [`[${params.type}]`, kind, json, error, msgid, blockid, shblockid]
        logitems.push(logitem.filter((item) => !!item).join('\t'))
    }

    const logitems = []
    const abi = abiSerialized(GoshWalletAbi)
    const { message, message_id } = await client.abi.encode_message({
        abi,
        address: WALLET_ADDRESS,
        call_set: {
            function_name: 'deployNewSnapshot',
            input: {
                branch: 'main',
                commit: '',
                repo: '0:4c92057e96e0abe9020b57339dc2cbe6ec0e4f29e0896738f78ec64d53baea30',
                name: filename,
                snapshotdata: '',
                snapshotipfs: null,
            },
        },
        signer: signerKeys(WALLET_KEYS),
    })

    const rqTime = new Date()
    try {
        const start = Math.round(Date.now() / 1000)
        const { shard_block_id } = await client.processing.send_message(
            {
                abi,
                message,
                send_events: true,
            },
            _sendMessageCallback,
        )
        const { transaction } = await client.processing.wait_for_transaction(
            {
                abi,
                message,
                shard_block_id,
                send_events: true,
            },
            _waitForTransactionCallback,
        )
        const rsTime = new Date()
        const end = Math.round(Date.now() / 1000)

        const logitem = [
            '[OK]',
            `Snapshot ${filename}`,
            `RqTime: ${rqTime.toLocaleTimeString()}`,
            `RsTime: ${rsTime.toLocaleTimeString()}`,
            `TxTime: ${transaction.now}`,
            `Duration: ${end - start}s`,
        ]
        console.log(logitem.join('\t'))
    } catch (e) {
        const logitem = [
            '[ERR]',
            `Snapshot ${filename}`,
            `RqTime: ${rqTime.toLocaleTimeString()}`,
            `RsTime: EXPIRED`,
            `MsgID: ${message_id}`,
            `Error: ${e.message}`,
            `SDK error: ${JSON.stringify(e)}`,
        ]
        console.log(logitem.join('\t'))
        logitems.push(logitem.join('\t'))

        fs.writeFileSync(`./output/${filename}.log`, logitems.join('\n'))
    }
}

const testReplay = async (chunkSize) => {
    const chunk = Array.from(new Array(chunkSize)).map(
        (_, index) => `filename-${Date.now()}-${index}`,
    )
    await Promise.all(
        chunk.map(async (treepath) => {
            await _sendMessage(treepath)
        }),
    )
}

const main = async () => {
    const [chunkSize = 1, intervalMs = 0] = process.argv.slice(2)

    if (+intervalMs === 0) {
        await testReplay(+chunkSize)
        return
    }

    while (true) {
        testReplay(+chunkSize)
        await new Promise((resolve) => setTimeout(resolve, +intervalMs))
    }
}

main()
    .then(() => process.exit(0))
    .catch((reason) => {
        console.log('Error', reason.message)
        process.exit(-1)
    })
