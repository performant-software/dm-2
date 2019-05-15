const MongoClient = require('mongodb').MongoClient

const mongoDatabaseName = "dm2_convert"
const mongoDatabaseURL = "mongodb://localhost:27017/"

// Global resources
var mongoDB, mongoClient

async function collectionToArray(collectionName) {
    const coll = await mongoDB.collection(collectionName)
    const cursor = await coll.find({})
    return await cursor.toArray()    
}

async function collectionToHash(collectionName, key) {
    let arr = await collectionToArray(collectionName)  
    let hash = {}
    arr.forEach( obj => { hash[obj[key]] = obj })
    return hash
}

async function resetTarget() {
    const highlights = await mongoDB.collection('highlights')
    const highlightsBuffer = await collectionToArray('highlights')

    for( let i=0; i < highlightsBuffer.length; i++ ) {
        let highlight = highlightsBuffer[i]
        let { target } = highlight        
        if( target[0] === '{' ) {
            // write this value to originalTarget field
            highlight.target = highlight.originalTarget
            await highlights.replaceOne( { uri: highlight.uri }, highlight )
        }
    }
}

async function scaleImages() {
    const highlights = await mongoDB.collection('highlights')
    const highlightsBuffer = await collectionToArray('highlights')
    const documentMap = await collectionToHash('documents','uri')

    for( let i=0; i < highlightsBuffer.length; i++ ) {
        let highlight = highlightsBuffer[i]
        let target = highlight.originalTarget      
        if( target && target[0] === '{' ) {
            const document = documentMap[highlight.documentURI]
            if( document ) {
                const scaleFactor = 2000.0 / document.width 
                    
                let shape = JSON.parse(target)        
                shape.scaleX = shape.scaleX * scaleFactor
                shape.scaleY = shape.scaleY * scaleFactor
                shape.left = shape.left * scaleFactor
                shape.top = shape.top * scaleFactor
    
                // write object back into mongo 
                highlight.target = JSON.stringify(shape) 
                await highlights.replaceOne( { uri: highlight.uri }, highlight )
            }
        }
    }
}

async function runAsync() {
    mongoClient = await MongoClient.connect(mongoDatabaseURL)
    mongoDB = await mongoClient.db(mongoDatabaseName)   
    // await resetTarget()    
    await scaleImages()
    await mongoClient.close()
}

function main() {
    runAsync().then(() => {}, (err) => {
        logger.error(`${err}: ${err.stack}`)  
        mongoClient.close().then() 
    });
}

///// RUN THE SCRIPT
main()