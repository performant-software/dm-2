const Sequelize = require('sequelize');

// based on math in this sheet
// https://docs.google.com/spreadsheets/d/1499c-8yeIft-qq9Qya4q-Alj_XxJg37GE91uUmG429Y/edit?usp=sharing
const imageScaleFactor = 2.065
const imageOffset = 5
const imageToSVGScaleFactor = 0.5693
const postgresConnectionURL = 'postgres://XXXX' // don't check in credentials.

function createHightlightsTable(sequelize) {
    class Highlights extends Sequelize.Model {}

    Highlights.init({
      id: {
          type: Sequelize.INTEGER, 
          primaryKey: true
      },
      document_id: {
        type: Sequelize.INTEGER
      },
      target: {
        type: Sequelize.STRING,
        allowNull: false
      }
  }, {
    // options
    modelName: 'highlights',
    sequelize
  });      

  return Highlights
}

// transform the highlights for document 731
async function transformAllHighlights(sequelize) {
    const hightlightsTable = createHightlightsTable(sequelize)
    const highlights = await hightlightsTable.findAll( { where: { document_id: 731 } })
    for( const highlight of highlights ) {
      const shape = JSON.parse(highlight.target)
      shape.top = ((shape.top * imageScaleFactor ) + imageOffset) * imageToSVGScaleFactor
      await hightlightsTable.update( { target: JSON.stringify(shape) }, {
        where: {
            id: highlight.id
        }
      })
    }
}

// for debugging transform math
async function testTransform(sequelize) {
  const highlightID = 13789 
  const hightlightsTable = createHightlightsTable(sequelize)
  let testHighlight = await hightlightsTable.findByPk(highlightID)
  const shape = JSON.parse(testHighlight.target)
  // shape.top = ((shape.top * imageScaleFactor ) + imageOffset) * imageToSVGScaleFactor
  shape.top = 5260.81
  await hightlightsTable.update( { target: JSON.stringify(shape) }, {
    where: {
        id: highlightID
    }
  })
}

async function main() {

    // for local debugging
    // const sequelize = new Sequelize('dm2_staging', 'nick', '', {
    //     host: 'localhost',
    //     dialect: 'postgres',
    //     define: {
    //       timestamps: false
    //     }
    // })

    const sequelize = new Sequelize( 
      postgresConnectionURL,
      {
        native: true,
        ssl: true,
        define: {
          timestamps: false
        }
      }
    )

    // await testTransform(sequelize)
    await transformAllHighlights(sequelize)
    
    await sequelize.close()
}

// RUN
main().then()