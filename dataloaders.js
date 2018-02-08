const DataLoader = require('dataloader');

const batchContents = async (pool, ids) => {
    console.log('ids', ids.length);
    const sql = `
        select *
        from content
        where content_id in (${ids.join(',')})
    `;
    const result = await pool.query(sql);
    return result.rows;
}

module.exports = (pool) => ({
    contentLoader: new DataLoader(
        ids => batchContents(pool, ids),
        {cacheKeyFn: key => key.toString()}
    ),
});