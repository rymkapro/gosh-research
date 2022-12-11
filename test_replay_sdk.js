const process = require('process')
const fs = require('fs')
const { signerKeys, abiSerialized } = require('@eversdk/core')

const GoshWalletAbi = require('./abis/goshwallet.abi.json')
const client = require('./client')

const WALLET_ADDRESS =
    '0:936aaff5fe87b47d63c45972bfb4819915364b8f775ea90a4865dcac6c681fe0'
const WALLET_KEYS = {
    public: '6e62ccb5af238477010c6191f4e2363de013587f80cdf11897c2ee738c8038fe',
    secret: '43c20f8dca6ff37f18fa68af212360b923cfac62739b9ce24cc3d5d03243156c',
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
                repo: '0:1d53f6956a3e794e079a13cafc397a1589d91e019e4af36a39aaa16c35a49201',
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
