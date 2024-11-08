import { BadRequestException, CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Observable } from "rxjs";

@Injectable()
export class AuthGuard implements CanActivate{

    constructor(private readonly jwtService: JwtService){}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {

        const request = context.switchToHttp().getRequest()
        const token = request.headers['authorization']?.split(' ')[1] ?? ""
        if(!token) throw new BadRequestException('Bearer token not found')

        try {
            const secret = process.env.JWT_SECRET
            
            const payload = this.jwtService.verify(token,{secret})
            
            payload.iat = new Date(payload.iat * 10000)
            payload.exp = new Date(payload.exp * 10000)

            if(payload.isAdmin) payload.roles = ['admin']
            else payload.roles = ['user']

            request.user = payload

            return true

        } catch (error) {
            throw new BadRequestException('Invalid Token')
        }

    }
    
}