import gql from 'graphql-tag';

export default gql`
  type Group {
    id: Int!
    users(
      where: UserWhereInput
      orderBy: UserOrderByInput
      skip: Int
      after: UserWhereUniqueInput
      before: UserWhereUniqueInput
      first: Int
      last: Int
    ): [User!]!
  }

  type Query {
    findOneGroup(where: GroupWhereUniqueInput!): Group
    findManyGroup(
      where: GroupWhereInput
      orderBy: GroupOrderByInput
      after: GroupWhereUniqueInput
      before: GroupWhereUniqueInput
      skip: Int
      first: Int
      last: Int
    ): [Group!]
    findManyGroupCount(
      where: GroupWhereInput
      orderBy: GroupOrderByInput
      after: GroupWhereUniqueInput
      before: GroupWhereUniqueInput
      skip: Int
      first: Int
      last: Int
    ): Int!
  }
`;
