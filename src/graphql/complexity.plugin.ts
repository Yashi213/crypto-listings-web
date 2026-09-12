import {
  ApolloServerPlugin,
  BaseContext,
  GraphQLRequestListener,
} from '@apollo/server';
import { Plugin } from '@nestjs/apollo';
import { GraphQLSchemaHost } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import {
  fieldExtensionsEstimator,
  getComplexity,
  simpleEstimator,
} from 'graphql-query-complexity';
import { MAX_QUERY_COMPLEXITY } from './complexity.util';

@Plugin()
export class ComplexityPlugin implements ApolloServerPlugin {
  constructor(private readonly gqlSchemaHost: GraphQLSchemaHost) {}

  async requestDidStart(): Promise<GraphQLRequestListener<BaseContext>> {
    const { schema } = this.gqlSchemaHost;
    return {
      async didResolveOperation({ request, document }) {
        const complexity = getComplexity({
          schema,
          operationName: request.operationName,
          query: document,
          variables: request.variables,
          estimators: [
            fieldExtensionsEstimator(),
            simpleEstimator({ defaultComplexity: 1 }),
          ],
        });
        if (complexity > MAX_QUERY_COMPLEXITY) {
          throw new GraphQLError(
            `Запрос слишком сложный: ${complexity}. Максимум: ${MAX_QUERY_COMPLEXITY}`,
          );
        }
      },
    };
  }
}
