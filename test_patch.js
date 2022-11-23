const { TonClient } = require('@eversdk/core')
const { libNode } = require('@eversdk/lib-node')

TonClient.useBinaryLibrary(libNode)
const client = new TonClient()

const decompressPatch = async (compressed) => {
    const { decompressed } = await client.utils.decompress_zstd({
        compressed: Buffer.from(compressed, 'hex').toString('base64'),
    })
    return Buffer.from(decompressed, 'base64').toString('utf8')
}

const main = async () => {
    const [patch] = process.argv.splice(2)

    if (!patch) throw Error(`Argument 'patch' is undefined`)
    const parsed = await decompressPatch(patch)

    console.log(
        ['=================', 'Parsed patch', '=================', parsed].join('\n'),
    )
}

main()
    .then(() => process.exit(0))
    .catch((reason) => {
        console.log('Error', reason.message)
        process.exit(-1)
    })
