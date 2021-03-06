# Introduction

This tool built on [Prisma](https://prisma.io) and [graphql-modules](https://graphql-modules.com/) to auto generate graphql schema types and CURD system from Prisma Client

> NOTE: You must be familiar with `Prisma` and `graphql-modules` before use this tool.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Features](#features)
- [Download starter project](#download-starter-project)
  - [Unix (Mac OS, Linux)](#unix-mac-os-linux)
  - [Windows](#windows)
- [Install dependencies](#install-dependencies)
  - [npm](#npm)
  - [yarn](#yarn)
- [Example Usage](#example-usage)
  - [`User/typeDefs.ts`](#usertypedefsts)
  - [`User/resolvers.ts`](#userresolversts)
  - [`User/User.module.ts`](#userusermodulets)
  - [Merge all modules](#merge-all-modules)
  - [create `Prisma.provider.ts`](#create-prismaproviderts)
  - [Add select object to args](#add-select-object-to-args)
- [Tool settings](#tool-settings)
  - [Type definition](#type-definition)
  - [Example](#example)
- [Have questions?](#have-questions)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Features

- Auto generate CRUD system from your `schema.prisma` file.
  - **Every model in `schema.prisma` will have folder contain 3 files**
    - `X.module.ts` contain `GraphQLModule` for this model
    - `typeDefs.ts` contain graphql types for this model
    - `resolvers.ts` contain 3 queries and 6 mutations `'findOne' | 'findMany' | 'findCount' | 'createOne' | 'updateOne' | 'upsertOne' | 'deleteOne' | 'updateMany' | 'deleteMany'`
  - Add to `inputTypes.ts` file list of inputs
    ```
    UserWhereInput
    UserWhereUniqueInput
    UserOrderByInput
    UserCreateInput
    UserUpdateInput
    UserUpdateManyMutationInput
    ```
- Has function to convert `info: GraphQLResolveInfo` to select object accepted by `prisma client` this help in these points :-
  - Good solution for N + 1 issue.
  - Save performance with just query what frontend request from db
- Add onDelete cascade function to workaround missing function in Prisma migrate Cli more information [here](../delete)
- You have options to exclude anything you want.
  - exclude queries or mutations file for all models.
  - exclude queries or mutations from custom models.
  - exclude fields from all models.
  - exclude fields from custom model.
  - For more options [Tool settings](#tool-settings)

# Download starter project

This guide uses a small starter project that has Prisma configured against a SQLite database file.

Open your terminal and download the starter project with the following command:

## Unix (Mac OS, Linux)

```shell script
curl https://codeload.github.com/AhmedElywa/prisma-tools/tar.gz/master | tar -xz --strip=2 prisma-tools-master/examples/graphql-modules
```

## Windows

```shell script
curl https://codeload.github.com/AhmedElywa/prisma-tools/tar.gz/master -o master.tar.gz && tar -zxvf master.tar.gz prisma-tools-master/examples/graphql-modules && move prisma-tools-master/examples/graphql-modules graphql-modules && rmdir /S /Q prisma-tools-master && del /Q master.tar.gz
```

# Install dependencies

The project has downloaded to directory called graphql-modules

## npm

Run this three commands

```shell script
cd graphql-modules
npm i
npm run dev
```

## yarn

Run this three commands

```shell script
cd graphql-modules
yarn
yarn dev
```

# Example Usage

For more information about Prisma look at they [Docs](https://www.prisma.io/docs)

**Example**

`package.json`

```json
{
  "scripts": {
    "start": "node dist/server",
    "clean": "rm -rf dist",
    "build": "npm -s run clean && npm -s run generate && tsc",
    "generate": "npm -s run generate:prisma && npm -s run generate:crud",
    "generate:prisma": "prisma generate",
    "generate:crud": "ts-node --transpile-only src/createTypes",
    "seed": "ts-node --transpile-only prisma/seed",
    "create-migration": "prisma migrate save --experimental",
    "migrate-database": "prisma migrate up --experimental --auto-approve --create-db",
    "dev": "ts-node-dev --no-notify --respawn --transpileOnly src/server"
  }
}
```

`schema.prisma`

```prisma
datasource postgresql {
  url      = env("DATABASE_URL")
  provider = "postgresql"
}
generator client {
  provider = "prisma-client-js"
}
model User {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now())
  email     String   @unique
  name      String?
  role      Role     @default(USER)
  posts     Post[]
}
model Post {
  id         Int        @id @default(autoincrement())
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt
  published  Boolean    @default(false)
  title      String
  author     User?      @relation(fields:  [authorId], references: [id])
  authorId   Int?
}
enum Role {
  USER
  ADMIN
}
```

After build your `schema.prisma` file all you need to run

```
yarn generate
```

This command will run two commands

```json
{
  "generate:prisma": "prisma generate",
  "generate:crud": "ts-node --transpile-only src/createTypes"
}
```

- build prisma client
- use our tool to auto generate your crud system

**Output**

## `User/typeDefs.ts`

```ts
import gql from 'graphql-tag';

export default gql`
  type User {
    id: Int!
    createdAt: DateTime!
    email: String!
    name: String
    password: String!
  }

  type Query {
    findOneUser(where: UserWhereUniqueInput!): User
    findManyUser(
      where: UserWhereInput
      orderBy: UserOrderByInput
      after: UserWhereUniqueInput
      before: UserWhereUniqueInput
      skip: Int
      first: Int
      last: Int
    ): [User!]
    findManyUserCount(
      where: UserWhereInput
      orderBy: UserOrderByInput
      after: UserWhereUniqueInput
      before: UserWhereUniqueInput
      skip: Int
      first: Int
      last: Int
    ): Int!
  }
  type Mutation {
    createOneUser(data: UserCreateInput!): User!
    updateOneUser(where: UserWhereUniqueInput!, data: UserUpdateInput!): User!
    deleteOneUser(where: UserWhereUniqueInput!): User
    upsertOneUser(
      where: UserWhereUniqueInput!
      create: UserCreateInput!
      update: UserUpdateInput!
    ): User
    deleteManyUser(where: UserWhereInput): BatchPayload
    updateManyUser(
      where: UserWhereInput
      data: UserUpdateManyMutationInput
    ): BatchPayload
  }
`;
```

## `User/resolvers.ts`

```ts
import { ModuleContext } from '@graphql-modules/core';
import { PrismaProvider } from '../common/Prisma.provider';

export default {
  Query: {
    findOneUser: (_parent, args, { injector }: ModuleContext) => {
      return injector.get(PrismaProvider).user.findOne(args);
    },
    findManyUser: (_parent, args, { injector }: ModuleContext) => {
      return injector.get(PrismaProvider).user.findMany(args);
    },
    findManyUserCount: (_parent, args, { injector }: ModuleContext) => {
      return injector.get(PrismaProvider).user.count(args);
    },
  },
  Mutation: {
    createOneUser: (_parent, args, { injector }: ModuleContext) => {
      return injector.get(PrismaProvider).user.create(args);
    },
    updateOneUser: (_parent, args, { injector }: ModuleContext) => {
      return injector.get(PrismaProvider).user.update(args);
    },
    deleteOneUser: async (_parent, args, { injector }: ModuleContext) => {
      await injector.get(PrismaProvider).onDelete('User', args.where, false);
      return injector.get(PrismaProvider).user.delete(args);
    },
    upsertOneUser: async (_parent, args, { injector }: ModuleContext) => {
      return injector.get(PrismaProvider).user.upsert(args);
    },
    deleteManyUser: async (_parent, args, { injector }: ModuleContext) => {
      await injector.get(PrismaProvider).onDelete('User', args.where, false);
      return injector.get(PrismaProvider).user.deleteMany(args);
    },
    updateManyUser: (_parent, args, { injector }: ModuleContext) => {
      return injector.get(PrismaProvider).user.updateMany(args);
    },
  },
};
```

## `User/User.module.ts`

```ts
import { GraphQLModule } from '@graphql-modules/core';
import typeDefs from './typeDefs';
import resolvers from './resolvers';
import { addSelect } from '../common/addSelect';
import { CommonModule } from '../common/common.module';

export const UserModule = new GraphQLModule({
  name: 'User',
  typeDefs,
  resolvers,
  imports: [CommonModule],
  resolversComposition: {
    Query: [addSelect],
    Mutation: [addSelect],
  },
});
```

## Merge all modules

`app/app.module.ts`

```ts
import { GraphQLModule } from '@graphql-modules/core';
import { CommonModule } from './common/common.module';
import { PostModule } from './Post/post.module';
import { UserModule } from './User/user.module';

export const AppModule = new GraphQLModule({
  imports: [CommonModule, UserModule, PostModule],
});
```

## create `Prisma.provider.ts`

`Prisma.provider.ts`

```ts
import DeleteCascade from '@prisma-tools/delete';
import { OnRequest, OnResponse } from '@graphql-modules/core';
import { PrismaClient } from '@prisma/client';
import { Injectable } from '@graphql-modules/di';
import onDeleteSchema from './onDeleteSchema';

@Injectable()
export class PrismaProvider extends PrismaClient
  implements OnRequest, OnResponse {
  constructor() {
    super();
  }
  onRequest() {
    this.connect();
  }
  onResponse() {
    this.disconnect();
  }

  async onDelete(
    modelName: string,
    whereInput: object,
    includeParent?: boolean
  ) {
    const prismaDelete = new DeleteCascade(this, onDeleteSchema);
    await prismaDelete.cascade(modelName, whereInput, includeParent);
  }
}
```

## Add select object to args

It's a small tool to convert `info: GraphQLResolveInfo` to select object accepted by `prisma client` this will give you the best performance because you will just query exactly what you want

This middleware is take `info` and convert it to Prisma select object and add to resolve args

`server.ts`

```ts
import { PrismaSelect } from '@prisma-tools/select';

export const addSelect = (next) => async (root, args, context, info) => {
  const result = new PrismaSelect(info).value;
  if (Object.keys(result.select).length > 0) {
    args = {
      ...args,
      ...result,
    };
  }
  return next(root, args, context, info);
};
```

# Tool settings

You can optionally pass some settings to the plugin.

## Type definition

```ts
interface Options {
  // add onDelete.cascade() function on deleteOne and deleteMany mutations
  onDelete?: boolean;
  // exclude common module folder if you need to custom it
  excludeCommon?: boolean;
  // output path for models folders default 'src/graphql/models' you must create this folder
  modelsOutput?: string;
  // exclude fields from all models
  fieldsExclude?: string[];
  // exclude fields from one or more models will merge it with general fieldsExclude
  excludeFieldsByModel?: { [modelName: string]: string[] };
  // exclude queries or mutations for one or more models
  modelsExclude?: { name: string; queries?: boolean; mutations?: boolean }[];
  // disable all queries for all models
  disableQueries?: boolean;
  // disable all mutations for all models
  disableMutations?: boolean;
  // exclude queries and mutations for one or more model it's object with key : model name value array of QueriesAndMutations type
  excludeQueriesAndMutationsByModel?: {
    [modelName: string]: QueriesAndMutations[];
  };
  // exclude queries and mutations for all models array of QueriesAndMutations type
  excludeQueriesAndMutations?: QueriesAndMutations[];
}

type QueriesAndMutations =
  | 'findOne'
  | 'findMany'
  | 'findCount'
  | 'createOne'
  | 'updateOne'
  | 'upsertOne'
  | 'deleteOne'
  | 'updateMany'
  | 'deleteMany';
```

## Example

`src/createTypes.ts`

```ts
import { createTypes } from '@prisma-tools/sdl';

// for include every thing just createTypes() without any args

createTypes({
  // don't include 'createdAt', 'updatedAt' from any model
  fieldsExclude: ['createdAt', 'updatedAt'],
  // don't include 'password' field form 'User' model
  excludeFieldsByModel: {
    User: ['password'],
  },
  // don't include mutations file from 'Group' model
  modelsExclude: [{ name: 'Group', mutations: true }],
  // don't include 'deleteMany' mutation in 'Post' model mutations file
  excludeQueriesAndMutationsByModel: {
    Post: ['deleteMany'],
  },
});
```

# Have questions?

Didn't find something here? Look through the [issues](https://github.com/AhmedElywa/prisma-tools/issues) or simply drop us a line at <ahmed.elywa@icloud.com>.

**Like my tool give me star**
