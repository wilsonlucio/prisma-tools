import { generateAdmin, Schema } from '@prisma-tools/admin';
import defaultSchema from '../../server/src/graphql/schema/schema.json';
import path from 'path';

generateAdmin(path.resolve(__dirname, '../../server/prisma/schema.prisma'), defaultSchema as Schema, {
  excludeFieldsByModel: {
    User: ['password'],
  },
  excludeQueriesAndMutations: ['updateMany', 'deleteMany'],
  schemaOutput: path.resolve(__dirname, '../../server/src/graphql/schema/schema.json'),
  graphqlOutput: path.resolve(__dirname, '../../admin/src/graphql'),
  pagesOutput: path.resolve(__dirname, '../../admin/src/pages/models'),
});
