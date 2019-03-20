const MongoClient = require('mongodb').MongoClient
const databaseURL = "mongodb://localhost:27017/"

const createMongoClient = async () => {
    const mongoClient = await MongoClient.connect(databaseURL)
    // const db = await mongoClient.db("dm2_convert")        
    console.log('connection made')
    return mongoClient
}

createMongoClient().then((mongoClient) => { 
    console.log('connection made') 
    mongoClient.close()
}, (err) => { console.log(err)})

// MongoClient.connect(url, function(err, db) {
//   if (err) throw err;
//   var dbo = db.db("dm2_convert");
//   dbo.createCollection("rdfNodes", function(err, res) {
//     if (err) throw err;

//     db.close();
//   });
// });