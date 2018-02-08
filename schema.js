const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLSchema,
    GraphQLList,
} = require('graphql');

const StatisticType = new GraphQLObjectType({
    name: 'Statistic',
    fields: {
        content_id: { type: GraphQLInt },
        content_name: {
            type: GraphQLString,
            async resolve(_, args, { pool }, info) {
                const sql = `
                    select *
                    from content
                    where content_id = ${_.content_id}
                `;
                const result = await pool.query(sql);
                return result.rows[0].content_name;
            }
        },
    },
});

const StatisticType2 = new GraphQLObjectType({
    name: 'Statistic2',
    fields: {
        content_id: { type: GraphQLInt },
        content_name: {
            type: GraphQLString,
            async resolve(_, args, { dataloaders: {contentLoader} }, info) {
                const result = await contentLoader.load(_.content_id);
                return result.content_name;
            }
        },
        content_size: {
            type: GraphQLInt,
            async resolve(_, args, { dataloaders: {contentLoader} }, info) {
                const result = await contentLoader.load(_.content_id);
                return result.content_size;
            }
        },
    },
});

// Root Query
const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        statistics_without_dataloader: {
            type: new GraphQLList(StatisticType),
            async resolve(_, args, { pool }, info) {
                const sql = `
                    select *
                    from content_statistic
                    limit 1000
                `;
                const result = await pool.query(sql);

                return result.rows;
            }
        },
        statistics_with_dataloader: {
            type: new GraphQLList(StatisticType2),
            async resolve(_, args, { pool }, info) {
                const sql = `
                    select *
                    from content_statistic
                    limit 1000
                `;
                const result = await pool.query(sql);

                return result.rows;
            }
        }
    }
});

module.exports = new GraphQLSchema({
    query: RootQuery,
});