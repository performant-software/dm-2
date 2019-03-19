const winston = require('winston')
const rdf = require('rdf')
const fs = require('fs')
const { DOMParser } = require('prosemirror-model')
const dmProseMirror = require('./dm-prose-mirror')
const jsdom = require("jsdom")
const { JSDOM } = jsdom
const fabric = require('fabric').fabric

const logFile = 'log/ttl-test.log'
var logger

// Predicates
const nodeType = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
const w3Label = "http://www.w3.org/2000/01/rdf-schema#label"
const creator = "http://purl.org/dc/elements/1.1/creator"
const aggregates = "http://www.openarchives.org/ore/terms/aggregates"

const userNode = "http://xmlns.com/foaf/0.1/Agent"
const userName = "http://xmlns.com/foaf/0.1/name"
const userEmail = "http://xmlns.com/foaf/0.1/mbox"

const projectNode = "http://dm.drew.edu/ns/Project"
const projectName = w3Label
const projectUserURI = creator
const projectDescription = "http://purl.org/dc/terms/description"
const projectDocumentList = aggregates

const textDocumentNode = "http://purl.org/dc/dcmitype/Text"
const textDocumentName = w3Label
const textDocumentContent = "http://www.w3.org/2011/content#chars"

const imageDocumentNode = "http://www.shared-canvas.org/ns/Canvas"
const imageDocumentName = w3Label
const imageWidth = "http://www.w3.org/2003/12/exif/ns#width"
const imageHeight = "http://www.w3.org/2003/12/exif/ns#height"

const imageNode = "http://purl.org/dc/dcmitype/Image"

const annotationNode = "http://www.w3.org/ns/oa#Annotation"
const annotationHasBody = "http://www.w3.org/ns/oa#hasBody"
const annotationHasTarget = "http://www.w3.org/ns/oa#hasTarget"

const specificResource = "http://www.w3.org/ns/oa#SpecificResource"
const resourceSource = "http://www.w3.org/ns/oa#hasSource"
const resourceSelector = "http://www.w3.org/ns/oa#hasSelector"

const svgSelector = "http://www.w3.org/ns/oa#SvgSelector"
const svgContent = "http://www.w3.org/2011/content#chars"

const textQuoteSelector = "http://www.w3.org/ns/oa#TextQuoteSelector"
const textQuoteExcerpt = "http://www.w3.org/ns/oa#exact"

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

function parseUser( node ) {
    // chop mailto:nick@performantsoftware.com
    const email = node[userEmail].replace( /^mailto:/, '' )
    const obj = {
        uri: node.uri,
        name: node[userName],
        email
    }
    node.obj = obj
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
    node.obj = obj
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
        selectorURIs.push(selectorURI)
    }

    // do this as a seperate step for the DOM's sake
    replacements.forEach( (replacement) => {
        let [ dm2Span, span ] = replacement
        span.parentNode.replaceChild(dm2Span, span);
    })

    // var debugstr = htmlDocument.body.parentElement.innerHTML
    const documentNode = DOMParser.fromSchema(dmSchema).parse(htmlDocument.body.parentElement)
    const searchText = documentNode.textBetween(0,documentNode.textContent.length, ' ');
    const content = {type: 'doc', content: documentNode.content}

    const obj = {
        uri: node.uri,
        name: node[textDocumentName],
        documentKind: 'text',
        content,
        searchText,
        selectorURIs
    }
    node.obj = obj
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
    node.obj = obj
    return obj
}

function parseImage( node ) {
    // Example: <image:40615860_10217291030455677_4752239145311535104_n.jpg>
    const imageFilename = node.uri.replace( /^image:/, '' )

    const obj = {
        uri: node.uri,
        imageFilename
    }
    node.obj = obj
    return obj
}

function parseAnnotation( node ) {
    const obj = {
        uri: node.uri,
        body: node[annotationHasBody],
        target: node[annotationHasTarget]
    }
    node.obj = obj
    return obj
}

function parseSVGSelector( node ) {
    let obj = {
        uri: node.uri,
        excerpt: 'Highlight',
        color: yellow500
    }
    // convert SVG object to FabricJS JSON
    const svg = `<svg>${node[svgContent]}</svg>`
    fabric.loadSVGFromString(svg, (fabObj) => { 
        let shape = fabObj[0].toJSON()
        shape._highlightUid = node.uri
        shape.fill = "transparent"
        shape.stroke = yellow500
        obj.target = JSON.stringify(shape)
    })

    node.obj = obj
    return obj  
}

function parseTextQuoteSelector( node ) {
    const obj = {
        uri: node.uri,
        target: node.uri,
        excerpt: node[textQuoteExcerpt],
        color: yellow500
    }
    node.obj = obj
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

function createNodes(dataFile) {
    // Load the test.ttl file and parse it into a JSON object with the following structure:
    const triples = loadTTL(dataFile)

    // turn triples into a hash of subject nodes
    const nodes = []
    triples.forEach( (triple) => {
        const subject = triple.subject.value
        const predicate = triple.predicate.value
        const objectValue = triple.object.value

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

    return nodes
}

function parseMostThings(nodes) {
    // JSON export object structure
    let dmData = {
        users: [],
        projects: [],
        documents: [],
        images: [],
        highlights: [],
        links: []
    }

    // OA Annotation objects
    let annotations = []

    // document schema for parsing HTML -> ProseMirror JSON
    const dmSchema = dmProseMirror.createDocumentSchema()

    // iterate through the nodes and parse them into DM2 JSON
    Object.values(nodes).forEach( (node) => {
        switch( node[nodeType] ) {
            case userNode:
                dmData.users.push( parseUser(node) )
                break
            case projectNode:
                dmData.projects.push( parseProject(node) )
                break
            case textDocumentNode:
                dmData.documents.push( parseTextDocument(dmSchema,node) )
                break
            case imageDocumentNode:
                dmData.documents.push( parseImageDocument(node) )
                break
            case imageNode:
                dmData.images.push( parseImage(node) )
                break
            case annotationNode:
                annotations.push( parseAnnotation(node) )
                break
            case svgSelector:
                dmData.highlights.push( parseSVGSelector(node) )
                break
            case textQuoteSelector:
                dmData.highlights.push( parseTextQuoteSelector(node) )
                break
            default:
                break
        }
    })

    return { annotations, dmData }
}

// Traverse the annotations and link up all the references
function parseLinks(annotations,nodes) {
    let links = []
    annotations.forEach( (annotation) => {
        const bodyNode = nodes[annotation.body]
        const targetNode = nodes[annotation.target]
        // Is this a canvas/image association or a link?
        if( bodyNode[nodeType] === imageNode ) {
            // associate the image with the imageDocument
            const image = bodyNode.obj
            const imageDocument = targetNode.obj
            imageDocument.images.push(image.uri)
        } else {
            // these two together make a link
            const linkA = parseAnnotationLink( bodyNode, nodes ) 
            const linkB = parseAnnotationLink( targetNode, nodes )
            links.push( { 
                linkUriA: linkA.uri, 
                linkTypeA: linkA.linkType, 
                linkUriB: linkB.uri, 
                linkTypeB: linkB.linkType
            })
        }
    })

    return links
}

// Go through all the projects and link up the documents 
function addDocumentsToProjects(dmData, annotations, nodes) {
    const { projects } = dmData

    const getDocumentURI = function( node ) {
        if( node[nodeType] !== imageNode ) {
            return node[nodeType] === specificResource ? node[ resourceSource ] : node.uri
        } else {
            return null
        }
    }

    projects.forEach( (project) => {
        logger.info(`Scanning annotations for documents in project ${project.uri}`)
        let projectDocs = []

        // first, mark all of the documents from the table of contents
        project.documents.forEach( documentURI => {
            let document = nodes[ documentURI ].obj
            document.projectURI = project.uri
            document.parentURI = project.uri
            document.parentType = 'Project'
            projectDocs.push(documentURI)
        })    

        // keep going as long as we are finding new documents 
        let prevCount = 0
        while(prevCount < projectDocs.length) {
            logger.info(`Found ${projectDocs.length - prevCount} new documents...`)
            prevCount = projectDocs.length
            annotations.forEach( annotation => {
                const bodyDocURI = getDocumentURI( nodes[annotation.body] )
                const targetDocURI = getDocumentURI( nodes[annotation.target] )
                if( bodyDocURI && targetDocURI ) {
                    let bodyDoc = nodes[bodyDocURI].obj
                    let targetDoc = nodes[targetDocURI].obj
                    // if two documents are linked by an annotation, they are in the same project.
                    if( projectDocs.includes( bodyDocURI ) && !projectDocs.includes( targetDocURI ) ) {
                        targetDoc.projectURI = project.uri
                        projectDocs.push(targetDocURI)            
                    } else if( projectDocs.includes( targetDocURI ) && !projectDocs.includes( bodyDocURI ) ) {
                        bodyDoc.projectURI = project.uri
                        projectDocs.push(bodyDocURI)            
                    }   
                    // if target doesn't have a parent, assign body  
                    if( !targetDoc.parentURI ) {
                        targetDoc.parentURI = bodyDocURI
                        targetDoc.parentType = 'Document'
                    }
                }
            })
        } 
        logger.info(`Done scanning project ${project.uri}`)   
    })

    // filter out documents that have no project association
    let unlinkedDocuments = 0
    dmData.documents = dmData.documents.filter( document => {
        if( !document.projectURI ) {
            logger.info(`Document not included: ${document.uri}`)
            unlinkedDocuments++
            return false
        } else {
            return true
        }
    })
    logger.info(`Found ${unlinkedDocuments} unlinked documents.`)

    // filter out highlights that have no document association
    let unlinkedHighlights = 0
    dmData.highlights = dmData.highlights.filter( highlight => {
        if( !highlight.documentURI ) {
            logger.info(`Highlight not included: ${highlight.uri}`)
            unlinkedHighlights++
            return false
        } else {
            return true
        }
    })
    logger.info(`Found ${unlinkedHighlights} unlinked highlights.`)
}

function createGraph(nodes) {
    let { annotations, dmData } = parseMostThings(nodes)
    dmData.links = parseLinks( annotations, nodes )
    addDocumentsToProjects( dmData, annotations, nodes )
    return dmData
}

function parseAnnotationLink( node, nodes ) {
    let uri, linkType
    if( node[nodeType] === specificResource ) {
        const source = nodes[ node[ resourceSource ] ]
        const selector = nodes[ node[ resourceSelector ] ]    
        selector.obj.documentURI = source.uri
        uri = selector.uri
        linkType = 'Highlight'
    } else {
        uri = node.uri
        linkType = 'Document'
    }
    return { uri, linkType }
}

function main() {
    setupLogging();
    logger.info("Start TTL processing...")

    const dataFile = 'ttl/test-image.ttl'
    // const dataFile = 'ttl/app.digitalmappa.org.ttl'
    const nodes = createNodes(dataFile);
    const dm2Graph = createGraph(nodes);

    fs.writeFileSync('ttl/test.json', JSON.stringify(dm2Graph));
    logger.info("TTL Processing completed.")   
}

///// RUN THE SCRIPT
main();