export function notFound(req, res, next) {
  next(
    Object.assign(new Error("API route not found."), {
      statusCode: 404,
      expose: true,
    }),
  );
}
