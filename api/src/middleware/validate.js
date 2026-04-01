export function validate(schema, target = "body") {
  return async function validateRequest(request, _response, next) {
    try {
      request[target] = await schema.parseAsync(request[target]);
      next();
    } catch (error) {
      next(error);
    }
  };
}
