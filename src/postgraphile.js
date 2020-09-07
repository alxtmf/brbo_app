const { postgraphile } = require('postgraphile')

const { DATABASE, PG_USER, PASSWORD, HOST, PG_PORT } = process.env

const dbUrl = `postgres://${PG_USER}:${PASSWORD}@${HOST}:${PG_PORT}/${DATABASE}`

console.log(dbUrl)
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

module.exports = postgraphile(
/*
    {
        database: DATABASE,
        user: PG_USER,
        password: PASSWORD,
        host: HOST,
        port: PG_PORT
    },
*/
    dbUrl,
    'public',
    {
        watchPg: true,
        graphiql: true,
        enhanceGraphiql: true
    }
)
