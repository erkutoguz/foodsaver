export function validate(schema) {
  return async function validateRequest(request, _response, next) {
    try {
      request.body = await schema.parseAsync(request.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}
