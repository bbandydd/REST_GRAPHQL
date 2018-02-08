const Koa = require('koa');
const Router = require('koa-router');
const mount = require('koa-mount');
const convert = require('koa-convert');
const graphqlHTTP = require('koa-graphql');
const { Pool } = require('pg');
const DataLoader = require('dataloader');
const schema = require('./schema');
const buildDataloaders = require('./dataloaders');
const setting = require('./setting');

const app = new Koa();
const router = new Router();
const pool = new Pool(Object.assign({}, setting));

router.get('/rest', async (ctx) => {
    const sql = `
        select *
        from content_statistic
        left join content on content.content_id = content_statistic.content_id
        limit 1000
    `;
    const result = await pool.query(sql);

    ctx.body = result.rows.map(obj => ({
        content_id: obj.content_id,
        content_name: obj.content_name,
    }))
});

const contentLoader = new DataLoader(
    async (ids) => {
        const sql = `
            select *
            from content
            where content_id in (${ids.join(',')})
        `;
        const result = await pool.query(sql);

        return result.rows;
    }
);

router.get('/dataloader', async (ctx) => {
    const sql = `
        select *
        from content_statistic
        limit 1000
    `;

    const result = await pool.query(sql);

    const list = await Promise.all(result.rows.map(object =>contentLoader.load(object.content_id)));

    ctx.body = result.rows.map((obj, index) => ({
        content_id: obj.content_id,
        content_name: list[index].content_name
    }));
});

app.use(mount('/graphql', convert(graphqlHTTP({
    schema,
    graphiql: true,
    context: {
        pool,
        dataloaders: buildDataloaders(pool),
    }
}))));
app.use(router.routes()).use(router.allowedMethods());

app.listen(5487, () => {
    console.log('Server starts');
});