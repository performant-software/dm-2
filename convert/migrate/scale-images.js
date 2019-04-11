const fabric = require('fabric').fabric
const MongoClient = require('mongodb').MongoClient

const mongoDatabaseName = "dm2_convert_test"
const mongoDatabaseURL = "mongodb://localhost:27017/"

// Global resources
var mongoDB, mongoClient

async function scaleImages() {
    const highlights = await mongoDB.collection('highlights')

    const scaleX = 0.64
    const scaleY = 0.33

    let highlightsCursor = await highlights.find({})
    while( highlight = await highlightsCursor.next() ) {
        let { target } = highlight        
        if( target[0] === '{' ) {
            // load target into fabric js
            const canvas = new fabric.StaticCanvas(null, { width: 2000, height: 2000 })
            await canvas.loadFromJSON(`{ "objects": [ ${target} ]}`)

            // transform object
            const shape = canvas.item(0)
            shape.scaleX = shape.scaleX * scaleX
            shape.scaleY = shape.scaleY * scaleY
            shape.left = shape.left * scaleX
            shape.top = shape.top * scaleY
            shape.setCoords()

            // write object back into mongo
            let shapeObj = shape.toObject(['_highlightUid'])
        }
    }
}

async function runAsync() {
    mongoClient = await MongoClient.connect(mongoDatabaseURL)
    mongoDB = await mongoClient.db(mongoDatabaseName)       
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