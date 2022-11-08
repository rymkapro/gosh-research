const process = require('process')
const fs = require('fs')
const { signerKeys, abiSerialized } = require('@eversdk/core')

const GoshWalletAbi = require('./abis/goshwallet.abi.json')
const client = require('./client')

const WALLET_ADDRESS =
    '0:2497663a679acec5f088ec84378f92809de802fa57810ff8dccc27b85cd8d7a4'
const WALLET_KEYS = {
    public: 'e9565efaf3759e71f1de363104fb24146cc2097acea025ba04062effaa7c8a1a',
    secret: 'a8c7a1a7789c7e2b1356854217f4c202f2cd6d1037bbe2a2343d606d01350804',
}

const _sendMessage = async (filename) => {
    const _sendMessageCallback = async (params, responseType) => {
        const logitem = [
            '[EVENT]',
            `Response\t${responseType}`,
            `Params\t${JSON.stringify(params)}\n`,
        ]
        logitems.push(logitem.join('\n'))
    }

    const _waitForTransactionCallback = (params, responseType) => {
        const logitem = [
            '[EVENT]',
            `Response\t${responseType}`,
            `Params\t${JSON.stringify(params)}\n`,
        ]
        logitems.push(logitem.join('\n'))
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
                repo: '0:11d6bd430519cff2e079c645b970cfeedab67ddf8badb0e4528c5d30cbe13166',
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
        const { shard_block_id } = await client.processing.send_message({
            abi,
            message,
            send_events: false,
            _sendMessageCallback,
        })
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
    const [chunkSize = 1] = process.argv.slice(2)
    await testReplay(+chunkSize)
}

main()
    .then(() => process.exit(0))
    .catch((reason) => {
        console.log('Error', reason.message)
        process.exit(-1)
    })
