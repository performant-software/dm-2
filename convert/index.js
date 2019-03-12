const winston = require('winston')
const rdf = require('rdf')
const fs = require('fs')
const { DOMParser } = require('prosemirror-model');
const dmProseMirror = require('./dm-prose-mirror')
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const logFile = 'log/ttl-test.log'
var logger;

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
const projectDocumentList = aggregates

const textDocumentNode = "http://purl.org/dc/dcmitype/Text"
const textDocumentName = w3Label
const textDocumentUserURI = creator
const textDocumentContent = "http://www.w3.org/2011/content#chars"

// node type can only be one of these values
const typeVocab = [ userNode, projectNode, textDocumentNode ]

function loadTTL(ttlFile) {
    const ttlRaw = fs.readFileSync( ttlFile, "utf8");
    const ttlData = rdf.TurtleParser.parse(ttlRaw);
    return ttlData.graph.toArray()
}

function parseUser( node ) {
    return {
        uri: node.uri,
        name: node[userName],
        email: parseEmail(node[userEmail])
    }
}

function parseEmail( email ) {
    // TODO chop off mail:to stuff
    // <mailto:nick@performantsoftware.com>
    return email
}

function parseProject( node ) {
    return {
        uri: node.uri,
        name: node[projectName],
        userURI: node[projectUserURI],
        documents: node[projectDocumentList]
    }
}

function parseTextDocument( dmSchema, node ) {
    const htmlDOM = new JSDOM( node[textDocumentContent] );
    const htmlDocument = htmlDOM.window.document

    // TODO extract highlights from DOM

    const documentNode = DOMParser.fromSchema(dmSchema).parse(htmlDocument.body.parentElement)
    const searchText = documentNode.textBetween(0,documentNode.textContent.length, ' ');
    const content = {type: 'doc', content: documentNode.content}

    return {
        uri: node.uri,
        name: node[textDocumentName],
        userURI: node[textDocumentUserURI],
        content,
        searchText
    }
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

function createStructures(nodes) {
    const dmData = {
        users: [],
        projects: [],
        documents: []
    }

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
            default:
                break
        }
    })

    return dmData
}

function createLinkages(nodes,structures) {
    // TODO
    return structures
}

function main() {
    setupLogging();
    logger.info("Start TTL processing...")

    const dataFile = 'ttl/test.ttl'
    // const dataFile = 'ttl/app.digitalmappa.org.ttl'
    const nodes = createNodes(dataFile);
    const structures = createStructures(nodes);
    const dm2Graph = createLinkages(nodes,structures)

    logger.info("TTL Processing completed.")   
}

///// RUN THE SCRIPT
main();