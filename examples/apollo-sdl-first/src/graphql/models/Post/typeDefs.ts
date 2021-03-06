import gql from 'graphql-tag';

export default gql`
  type Post {
    id: Int!
    published: Boolean!
    title: String!
    author: User
    authorId: Int
    comments(
      where: CommentWhereInput
      orderBy: CommentOrderByInput
      skip: Int
      after: CommentWhereUniqueInput
      before: CommentWhereUniqueInput
      first: Int
      last: Int
    ): [Comment!]!
  }

  type Query {
    findOnePost(where: PostWhereUniqueInput!): Post
    findManyPost(
      where: PostWhereInput
      orderBy: PostOrderByInput
      after: PostWhereUniqueInput
      before: PostWhereUniqueInput
      skip: Int
      first: Int
      last: Int
    ): [Post!]
    findManyPostCount(
      where: PostWhereInput
      orderBy: PostOrderByInput
      after: PostWhereUniqueInput
      before: PostWhereUniqueInput
      skip: Int
      first: Int
      last: Int
    ): Int!
  }
  type Mutation {
    createOnePost(data: PostCreateInput!): Post!
    updateOnePost(where: PostWhereUniqueInput!, data: PostUpdateInput!): Post!
    deleteOnePost(where: PostWhereUniqueInput!): Post
    upsertOnePost(
      where: PostWhereUniqueInput!
      create: PostCreateInput!
      update: PostUpdateInput!
    ): Post
    updateManyPost(
      where: PostWhereInput
      data: PostUpdateManyMutationInput
    ): BatchPayload
  }
`;
