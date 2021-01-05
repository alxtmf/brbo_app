const bb = require('./src/brbo_bottender/index')
module.exports = async function App(context){
    await bb(context)
}
