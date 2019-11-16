const Sequelize = require('sequelize');

// based on math in this sheet
// https://docs.google.com/spreadsheets/d/1499c-8yeIft-qq9Qya4q-Alj_XxJg37GE91uUmG429Y/edit?usp=sharing
const imageScaleFactor = 2.065
const imageOffset = 5

function createHightlightsTable(sequelize) {
    class Highlights extends Sequelize.Model {}

    Highlights.init({
      id: {
          type: Sequelize.INTEGER, 
          primaryKey: true
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


async function main() {

    const sequelize = new Sequelize('dm2_staging', 'nick', '', {
        host: 'localhost',
        dialect: 'postgres',
        define: {
          timestamps: false
        }
    })

    // TODO grab all of the highlights for document 731

    const hightlightsTable = createHightlightsTable(sequelize)
    let testHighlight = await hightlightsTable.findByPk(11672)
    const shape = JSON.parse(testHighlight.target)
    shape.top = (shape.top * imageScaleFactor ) + imageOffset
    // shape.top = 283.625
    shape.top = 255.294
    
    await hightlightsTable.update( { target: JSON.stringify(shape) }, {
        where: {
            id: 11672
        }
    })
}

// RUN
main().then()