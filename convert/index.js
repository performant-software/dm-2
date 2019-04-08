const winston = require('winston')
const rdf = require('rdf')
const fs = require('fs')
const { DOMParser } = require('prosemirror-model')
const dmProseMirror = require('./dm-prose-mirror')
const jsdom = require("jsdom")
const { JSDOM } = jsdom
const fabric = require('fabric').fabric
const MongoClient = require('mongodb').MongoClient

const mongoDatabaseURL = "mongodb://localhost:27017/"
const logFile = 'log/ttl-test.log'

// Global resources
var logger, mongoDB, mongoClient

// Predicates
const nodeType = convertURI("http://www.w3.org/1999/02/22-rdf-syntax-ns#type")
const w3Label = convertURI("http://www.w3.org/2000/01/rdf-schema#label")
const creator = convertURI("http://purl.org/dc/elements/1.1/creator")
const aggregates = convertURI("http://www.openarchives.org/ore/terms/aggregates")

const userNode = convertURI("http://xmlns.com/foaf/0.1/Agent")
const userName = convertURI("http://xmlns.com/foaf/0.1/name")
const userEmail = convertURI("http://xmlns.com/foaf/0.1/mbox")

const projectNode = convertURI("http://dm.drew.edu/ns/Project")
const projectName = w3Label
const projectUserURI = creator
const projectDescription = convertURI("http://purl.org/dc/terms/description")
const projectDocumentList = aggregates

const textDocumentNode = convertURI("http://purl.org/dc/dcmitype/Text")
const textDocumentName = w3Label
const textDocumentContent = convertURI("http://www.w3.org/2011/content#chars")

const imageDocumentNode = convertURI("http://www.shared-canvas.org/ns/Canvas")
const imageDocumentName = w3Label
const imageWidth = convertURI("http://www.w3.org/2003/12/exif/ns#width")
const imageHeight = convertURI("http://www.w3.org/2003/12/exif/ns#height")

const imageNode = convertURI("http://purl.org/dc/dcmitype/Image")

const annotationNode = convertURI("http://www.w3.org/ns/oa#Annotation")
const annotationHasBody = convertURI("http://www.w3.org/ns/oa#hasBody")
const annotationHasTarget = convertURI("http://www.w3.org/ns/oa#hasTarget")

const specificResource = convertURI("http://www.w3.org/ns/oa#SpecificResource")
const resourceSource = convertURI("http://www.w3.org/ns/oa#hasSource")
const resourceSelector = convertURI("http://www.w3.org/ns/oa#hasSelector")

const svgSelector = convertURI("http://www.w3.org/ns/oa#SvgSelector")
const svgContent = convertURI("http://www.w3.org/2011/content#chars")

const textQuoteSelector = convertURI("http://www.w3.org/ns/oa#TextQuoteSelector")
const textQuoteExcerpt = convertURI("http://www.w3.org/ns/oa#exact")

const yellow500 = "#ffeb3b"

// node type can only be one of these values
const typeVocab = [ 
    userNode, 
    projectNode, 
    textDocumentNode, 
    imageDocumentNode, 
    imageNode, 
    annotationNode,
    svgSelector,
    textQuoteSelector,
    specificResource
]

function loadTTL(ttlFile) {
    const ttlRaw = fs.readFileSync( ttlFile, "utf8");
    const ttlData = rdf.TurtleParser.parse(ttlRaw);
    return ttlData.graph.toArray()
}

// mongo doesn't like keys with '.' in them.
function convertURI( uri ) {
    return uri.replace(/\./g,'_')
}

function parseUser( node ) {
    // chop mailto:nick@performantsoftware.com
    const email = node[userEmail] ? node[userEmail].replace( /^mailto:/, '' ) : `${node.uri.replace(':','_')}@digitalmappa.org`
    const obj = {
        uri: node.uri,
        name: node[userName],
        email
    }
    return obj
}

function parseProject( node ) {
    const obj = {
        uri: node.uri,
        name: node[projectName],
        userURI: node[projectUserURI],
        description: node[projectDescription],
        documents: node[projectDocumentList]   // Project table of contents (doesn't include annotations)
    }
    return obj
}

function parseTextDocument( dmSchema, node ) {
    const dm1Content = node[textDocumentContent] 
    const htmlDOM = new JSDOM( dm1Content );
    const htmlDocument = htmlDOM.window.document

    const spans = htmlDocument.getElementsByClassName('atb-editor-textannotation')
    const selectorURIs = []
    const replacements = []

    // port the text annotation spans to DM2 
    for (let i = 0; i < spans.length; i++) {
        let dm2Span = htmlDocument.createElement('span')
        let span = spans[i];
        const selectorURI = span.getAttribute('about');
        dm2Span.setAttribute('class','dm-highlight')
        dm2Span.setAttribute('style','background: #ffeb3b')
        dm2Span.setAttribute('data-highlight-uid', selectorURI )
        dm2Span.innerHTML = span.innerHTML
        replacements.push([dm2Span,span])
    }

    // do this as a seperate step for the DOM's sake
    replacements.forEach( (replacement) => {
        let [ dm2Span, span ] = replacement
        span.parentNode.replaceChild(dm2Span, span);
    })

    // var debugstr = htmlDocument.body.parentElement.innerHTML
    const documentNode = DOMParser.fromSchema(dmSchema).parse(htmlDocument.body.parentElement)
    const searchText = documentNode.textBetween(0,documentNode.textContent.length, ' ');
    const content = JSON.stringify( {type: 'doc', content: documentNode.content} )

    const obj = {
        uri: node.uri,
        name: node[textDocumentName],
        documentKind: 'text',
        content,
        searchText
    }
    return obj
}

function parseImageDocument( node ) {
    const obj = {
        uri: node.uri,
        name: node[imageDocumentName],
        documentKind: 'canvas',
        content: '',
        width: node[imageWidth],
        height: node[imageHeight],
        images: []
    }
    return obj
}

function parseImage( node ) {
    // Examples: image:40615860_10217291030455677_4752239145311535104_n_jpg
    // image:Screen%20Shot%202017-07-29%20at%203_18_51%20PM_png
    const imageFilename = node.uri.replace( /^image:/, '' ).replace( /_(png|PNG)$/, '.png' ).replace( /_(jpg|JPG)$/, '.jpg' ).replace( /_(jpeg|JPEG)$/, '.jpg' ).replace(/%20/g, ' ')
    // TODO get thumbnail images

    const obj = {
        uri: node.uri,
        imageFilename
    }
    return obj
}

function parseAnnotation( node ) {
    const obj = {
        uri: node.uri,
        body: node[annotationHasBody],
        target: node[annotationHasTarget]
    }
    return obj
}

async function parseSVGSelector( node ) {
    let obj = {
        uri: node.uri,
        excerpt: 'Highlight',
        color: yellow500
    }
    // convert SVG object to FabricJS JSON
    const svg = `<svg>${node[svgContent]}</svg>`

    let shape = await new Promise(resolve => {
        fabric.loadSVGFromString(svg, (fabObj) => { 
            let shape = fabObj[0].toJSON()
            shape._highlightUid = node.uri
            shape.fill = "transparent"
            shape.stroke = yellow500
            resolve(shape)
        })    
    });

    obj.target = JSON.stringify(shape)
    return obj  
}

function parseTextQuoteSelector( node ) {
    const obj = {
        uri: node.uri,
        target: node.uri,
        excerpt: node[textQuoteExcerpt],
        color: yellow500
    }
    return obj  
}

function setupLogging() {
    logger = winston.createLogger({
        format: winston.format.printf(info => { return `${info.message}` }),
        transports: [
          new winston.transports.Console(),
          new winston.transports.File({ filename: logFile })
        ]
    });

    process.on('uncaughtException', function(err) {
        logger.log('error', `Fatal exception:\n${err}`, err, function(err, level, msg, meta) {
            process.exit(1);
        });
    });
}

async function createNodes(dataFile) {
    // Load the test.ttl file and parse it into a JSON object with the following structure:
    const triples = loadTTL(dataFile)

    // turn triples into a hash of subject nodes
    const nodes = []
    triples.forEach( (triple) => {
        const subject = convertURI(triple.subject.value)
        const predicate = convertURI(triple.predicate.value)

        let objectValue
        if( triple.object.termType === "NamedNode" ) {
            // special case for email addresses, which should not be escaped
            if( triple.object.value.startsWith('mailto:') ) {
                objectValue = triple.object.value
            } else {
                // otherwise this is an RDF Node pointer
                objectValue = convertURI(triple.object.value)
            }
        } else {
            // if this is a literal node, record its value
            objectValue = triple.object.value
        }

        if( !nodes[subject] ) nodes[subject] = { uri: subject }

        if( predicate === nodeType ) {
            // only accept node type valus in the vocab
            if( typeVocab.includes( objectValue ) ) {
                nodes[subject][predicate] = objectValue 
            } 
        } else if( predicate === aggregates ) {
            // if this is an aggregate, emit array
            if( !nodes[subject][predicate] ) nodes[subject][predicate] = []
            nodes[subject][predicate].push( objectValue )
        } else {
            nodes[subject][predicate] = objectValue 
        }
    })

    // store the nodes in mongo
    const nodeCollection = await mongoDB.collection('nodes')
    await nodeCollection.insertMany( Object.values(nodes) )
}

async function parseMostThings() {

    const users = await mongoDB.collection('users')
    const projects = await mongoDB.collection('projects')
    const documents = await mongoDB.collection('documents')
    const images = await mongoDB.collection('images')
    const highlights = await mongoDB.collection('highlights')
    let annotations = []

    // document schema for parsing HTML -> ProseMirror JSON
    const dmSchema = dmProseMirror.createDocumentSchema()

    // iterate through all the nodes and parse them into DM2 JSON
    let node
    const nodes = await mongoDB.collection('nodes')
    let nodeCursor = await nodes.find({})
    while( node = await nodeCursor.next() ) {
        switch( node[nodeType] ) {
            case userNode:
                await users.insertOne( parseUser(node) )
                break
            case projectNode:
                await projects.insertOne( parseProject(node) )
                break
            case textDocumentNode:
                await documents.insertOne( parseTextDocument(dmSchema,node) )
                break
            case imageDocumentNode:
                await documents.insertOne( parseImageDocument(node) )
                break
            case imageNode:
                await images.insertOne( parseImage(node) )
                break
            case annotationNode:
                annotations.push( parseAnnotation(node) )
                break
            case svgSelector:
                await highlights.insertOne( await parseSVGSelector(node) )
                break
            case textQuoteSelector:
                await highlights.insertOne( parseTextQuoteSelector(node) )
                break
            default:
                break
        }
    }

    return annotations
}

// Traverse the annotations and link up all the references
async function parseLinks(annotationBuffer) {
    const nodes = await mongoDB.collection('nodes')
    const links = await mongoDB.collection('links')
    const images = await mongoDB.collection('images')
    const documents = await mongoDB.collection('documents')
    const highlights = await mongoDB.collection('highlights')
    const annotations = await mongoDB.collection('annotations')
    const linkBuffer = []

    // keep a list of annotations for deletion
    const doomedAnnotations = []

    for( let i=0; i < annotationBuffer.length; i++ ) {
        let annotation = annotationBuffer[i]
        const bodyNode = await nodes.findOne({ uri: annotation.body })
        const targetNode = await nodes.findOne({ uri: annotation.target })

        if( bodyNode && targetNode ) {
            // Is this a canvas/image association or a link?
            if( bodyNode[nodeType] === imageNode ) {
                // associate the image with the imageDocument
                const bodyQ = { uri: bodyNode.uri }
                const targetQ = { uri: targetNode.uri }
                const image = await images.findOne(bodyQ)
                const imageDocument = await documents.findOne(targetQ)
                if( image && imageDocument ) {
                    const imageSet = [ ...imageDocument.images, image.uri ]
                    await documents.updateOne( targetQ, { $set: { images: imageSet }} )
                } 
                // once we have this information, no longer need to keep this annotation
                doomedAnnotations.push(annotation)
            } else {
                // these two together make a link
                const linkA = await parseAnnotationLink( bodyNode, highlights, nodes ) 
                const linkB = await parseAnnotationLink( targetNode, highlights, nodes )
                if( linkA && linkB ) {
                    linkBuffer.push( {
                        linkUriA: linkA.uri, 
                        linkTypeA: linkA.linkType, 
                        linkUriB: linkB.uri, 
                        linkTypeB: linkB.linkType
                    })
                } else {
                    doomedAnnotations.push(annotation)
                }
            }
        } else {
            doomedAnnotations.push(annotation)
        }
    }

    // write links
    await links.insertMany( linkBuffer )    

    // scrub malformed annotations and image document annotations
    annotationBuffer = annotationBuffer.filter( annotation => !doomedAnnotations.includes(annotation) )
    await annotations.insertMany( annotationBuffer )
}

async function createNodeIndex() {
    const nodes = await mongoDB.collection('nodes')
    const nodeCursor = await nodes.find({})
    const nodeBuffer = await nodeCursor.toArray()
    const nodeIndex = {} 
    nodeBuffer.forEach( node => nodeIndex[node.uri] = node )
    return nodeIndex
}

// Go through all the projects and link up the documents 
async function addDocumentsToProjects() {
    const projects = await mongoDB.collection('projects')
    const documents = await mongoDB.collection('documents')
    const annotations = await mongoDB.collection('annotations')
    const nodeIndex = await createNodeIndex()

    const getDocumentURI = function( node ) {
        return node[nodeType] === specificResource ? node[ resourceSource ] : node.uri
    }

    let projectCursor = await projects.find({})
    while( project = await projectCursor.next() ) {
        logger.info(`Scanning annotations for documents in project ${project.uri}`)
        let projectDocs = []

        // first, mark all of the documents from the table of contents
        if( project.documents ) {
            for( let i=0; i< project.documents.length; i++ ) {
                const documentURI = project.documents[i]
                await documents.updateOne( 
                    { uri: documentURI },
                    {
                        $set: {
                            projectURI: project.uri,
                            parentURI: project.uri,
                            parentType: 'Project'
                        }
                    }
                )
                projectDocs.push(documentURI)
            }    
        }

        // keep going as long as we are finding new documents 
        let prevCount = 0
        while(prevCount < projectDocs.length) {
            logger.info(`Found ${projectDocs.length - prevCount} new documents...`)
            prevCount = projectDocs.length

            let annotationCursor = await annotations.find({})
            while( annotation = await annotationCursor.next() ) {
                const bodyDocURI = getDocumentURI( nodeIndex[annotation.body] )
                const targetDocURI = getDocumentURI( nodeIndex[annotation.target] )
                if( bodyDocURI && targetDocURI ) {
                    // if two documents are linked by an annotation, they are in the same project.
                    if( projectDocs.includes( bodyDocURI ) && !projectDocs.includes( targetDocURI ) ) {
                        await documents.updateOne( { uri: targetDocURI }, { $set: { projectURI: project.uri }} )
                        projectDocs.push(targetDocURI)            
                    } else if( projectDocs.includes( targetDocURI ) && !projectDocs.includes( bodyDocURI ) ) {
                        await documents.updateOne( { uri: bodyDocURI }, { $set: { projectURI: project.uri }} )
                        projectDocs.push(bodyDocURI)            
                    }   
                    // if target doesn't have a parent, assign target  
                    const bodyDoc = await documents.findOne({uri: bodyDocURI})
                    if( bodyDoc && !bodyDoc.parentURI ) {
                        await documents.updateOne( 
                            { uri: bodyDocURI }, 
                            { 
                                $set: { 
                                    parentURI: targetDocURI,
                                    parentType: 'Document'
                                }
                            } 
                        )
                    }
                }
            }
        } 
        logger.info(`Done scanning project ${project.uri}`)   
    }

    // filter out documents that have no project association or no parent
    const docResult = await documents.deleteMany( { $or: [ { projectURI: null }, { parentURI: null }] } )
    logger.info(`Found ${docResult.deletedCount} unlinked documents.`)

    // filter out highlights that have no document association
    const highlights = await mongoDB.collection('highlights')
    const highlightResult = await highlights.deleteMany( { documentURI: null } )
    logger.info(`Found ${highlightResult.deletedCount} unlinked highlights.`)
}

async function createGraph() {
    logger.info("Parsing most of the things...")
    let annotationBuffer = await parseMostThings()
    logger.info("Parsing links...")
    await parseLinks( annotationBuffer )
    logger.info("Add Documents to Projects...")
    await addDocumentsToProjects()
}

async function parseAnnotationLink( node, highlights, nodes ) {
    let uri, linkType
    if( node[nodeType] === specificResource ) {
        const resourceSourceQ = { uri: node[resourceSource] }
        const resourceSelectorQ = { uri: node[resourceSelector] }
        const source = await nodes.findOne(resourceSourceQ)
        const selector = await nodes.findOne(resourceSelectorQ)  
        if( source && selector ) {
            await highlights.updateOne( resourceSelectorQ, { $set: { documentURI: source.uri }})
            uri = selector.uri
            linkType = 'Highlight'    
        } else {
            return null
        }
    } else {
        uri = node.uri
        linkType = 'Document'
    }
    return { uri, linkType }
}

async function dropCollections() {
    const collections = await mongoDB.collections()
    collections.forEach( async collection => {
        await collection.drop()
    })
}


async function serializeGraph(outputJSONFile) {
    async function collectionToArray(collectionName) {
        const coll = await mongoDB.collection(collectionName)
        const cursor = await coll.find({})
        return await cursor.toArray()    
    }

    const dm2Graph = {
        users: await collectionToArray('users'),
        documents: await collectionToArray('documents'),
        images: await collectionToArray('images'),
        projects: await collectionToArray('projects'),
        highlights: await collectionToArray('highlights'),
        links: await collectionToArray('links')
    }

    fs.writeFileSync(outputJSONFile, JSON.stringify(dm2Graph))  
}

async function runExport() {
    const outputJSONFile = 'ttl/test.json'
    const mongoDatabaseName = "dm2_convert_test"
    mongoClient = await MongoClient.connect(mongoDatabaseURL)
    mongoDB = await mongoClient.db(mongoDatabaseName)   
    await serializeGraph(outputJSONFile)
    await mongoClient.close()
}

async function runAsync() {

    // process test TTL
    // const inputTTLFile = 'ttl/test-image.ttl'
    // const outputJSONFile = 'ttl/test.json'
    // const mongoDatabaseName = "dm2_convert_test"

    // process production TTL
    const inputTTLFile = 'ttl/app.digitalmappa.org.ttl'
    const outputJSONFile = 'ttl/test-mappa.json'
    const mongoDatabaseName = "dm2_convert"

    mongoClient = await MongoClient.connect(mongoDatabaseURL)
    mongoDB = await mongoClient.db(mongoDatabaseName)   
    
    // clear object cache
    await dropCollections()

    logger.info("Loading RDF Nodes...")
    await createNodes(inputTTLFile)

    logger.info("Creating DM2 Graph...")
    await createGraph()

    await serializeGraph(outputJSONFile)
    await mongoClient.close()
}

function main() {
    setupLogging();
    logger.info("Starting TTL processing...")

    // runExport().then( () => {
    runAsync().then(() => {
        logger.info("TTL Processing completed.")   
    }, (err) => {
        logger.error(`${err}: ${err.stack}`)  
        mongoClient.close().then() 
    });
}

///// RUN THE SCRIPT
main()