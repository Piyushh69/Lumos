from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

class CustomCORSMiddleware(CORSMiddleware):
    def __init__(self, app, **kwargs):
        super().__init__(app, **kwargs)
    
    async def __call__(self, request: Request, call_next):
        if request.method == "OPTIONS":
            response = Response()
            response.headers["Access-Control-Allow-Origin"] = "*"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "*"
            response.headers["Access-Control-Max-Age"] = "3600"
            return response
        
        response = await call_next(request)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        return response