// Environment variables below are set in .aws/src/main.ts
export default {
  app: {
    environment: process.env.NODE_ENV || 'development',
    defaultMaxAge: 86400,
    port: 4028,
    clientName: 'firefox-api-proxy',
    graphGatewayUrl:
      process.env.GRAPH_GATEWAY_URL || 'https://getpocket.com/graphql',
    clientApiGraphGatewayUrl:
      process.env.CLIENT_API_GRAPH_GATEWAY_URL ||
      'https://client-api.getpocket.com',
  },
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    release: process.env.GIT_SHA || '',
    environment: process.env.NODE_ENV || 'development',
  },
};
