// Middleware для сессий (например, хранения состояния опроса)
module.exports = function sessionMiddleware() {
  return async (ctx, next) => {
    // Простая заглушка session
    ctx.session = ctx.session || {};
    await next();
  };
};
