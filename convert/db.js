const { Pool } = require('pg');

var postGresDBConnectionPool;

// pg_restore --verbose --clean --no-acl --no-owner -h localhost -U nick -d dm2_staging latest.dump

// note, set ssl: true when connecting to heroku postgres
const defaultConfig = {
    user: 'nick',
    password: '',
    host: 'localhost',
    database: 'dm2_staging',
    port: 5432,
}

function initDatabase(dbConfig=defaultConfig) {
    postGresDBConnectionPool = new Pool(dbConfig);    
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

module.exports.initDatabase = initDatabase;
module.exports.query = query;
