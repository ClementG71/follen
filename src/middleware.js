export function onRequest({ locals, request }, next) {
    console.log(`[Middleware] Request received: ${request.method} ${request.url}`);
    return next();
}

