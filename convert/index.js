const winston = require('winston');
const { Pool } = require('pg');
const { Schema } = require('prosemirror-model');
const { schema } = require('prosemirror-schema-basic');
const { addListNodes } = require('prosemirror-schema-list');

const logFile = 'log/convert.log';
var logger, postGresDBConnectionPool;

// pg_restore --verbose --clean --no-acl --no-owner -h localhost -U nick -d dm2_staging latest.dump

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

function initDatabase() {
    postGresDBConnectionPool = new Pool({
        user: 'nick',
        password: '',
        host: 'localhost',
        database: 'dm2_staging',
        port: 5432,
    });    

    // note, set ssl: true when connecting to hereoku postgres
}

function query(text, params, callback) {
    const start = Date.now()
    return postGresDBConnectionPool.query(text, params, (err, results) => {
        if( results ) {
            const duration = Date.now() - start
            logger.info(`executed query: ${text} in ${duration}ms returned ${results.rowCount} rows.`);    
            callback(results)
        } else if( err ) {
            logger.error(err)
        }
    })
}

function createDocumentSchema() {

    const toDOM = function(mark) {
      const color = 'black';
      const properties = {
        class: 'dm-highlight', 
        style: `background: ${color};`
      };
      properties['data-highlight-uid'] = mark.attrs.highlightUid;
      properties['data-document-id'] = mark.attrs.documentId;
      return ['span', properties, 0];
    }.bind(this);

    const dmHighlightSpec = {
      attrs: {highlightUid: {default: 'dm_new_highlight'}, documentId: {default: null}, tempColor: {default: null}},
      toDOM: toDOM,
      parseDOM: [{tag: 'span.dm-highlight', getAttrs(dom) {
        return {
          highlightUid: dom.getAttribute('data-highlight-uid'),
          documentId: dom.getAttribute('data-document-id'),
          tempColor: dom.style.background
        };
      }}]
    }

    // create schema based on prosemirror-schema-basic
    return new Schema({
      nodes: addListNodes(schema.spec.nodes, 'paragraph block*', 'block'),
      marks: schema.spec.marks.addBefore('link', 'highlight', dmHighlightSpec)
    });
}

function processDocuments( dmSchema, documentRows ) {
    let updatedDocs = [];
    for( let doc of documentRows ) {
        if( doc.document_kind === 'text' ) {
            const dmDoc = dmSchema.nodeFromJSON(doc.content);
            const searchText = dmDoc.textBetween(0,dmDoc.textContent.length, ' ');
            updatedDocs.push({
                id: doc.id,
                title: doc.title,
                searchText
            });
        }
    }    
    return updatedDocs;
}

function main() {
    setupLogging();
    logger.info("Starting convert tool...")

    initDatabase();
    const dmSchema = createDocumentSchema();

    query('SELECT * FROM documents;', [], (results) => {
        let updatedDocs = processDocuments(dmSchema, results.rows);
        for( let doc of updatedDocs ) {
            query(`update documents set search_text=$1 where id=$2`, [doc.searchText, doc.id], () => {
                logger.info(`updated ${doc.title} ${doc.id}`);
            })
        }
    })
}

///// RUN THE SCRIPT
main();