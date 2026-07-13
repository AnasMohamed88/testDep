import { User } from "../db/models/user.model.js"
import { redisClient } from "../utils/redis/redis.client.js"
import { revokeTokenKey } from "../utils/redis/redis.services.js"
import { BadRequestException, NotFoundException, UnauthorizedException } from "../utils/response/error.response.js"
import { verifyToken } from "../utils/security/token/token.js"

export const TokenType = {
    access: "access",
    refresh: "refresh"
}


export const decodeToken = async (authorization, tokenType = TokenType.access) => {
    if (!authorization.startsWith("Bearer")) {
        return BadRequestException("In-valid authentication")
    }
    const token = authorization.split(" ")[1]
    if (!token) {
        return BadRequestException("In-valid authentication")
    }
    const payload = verifyToken(
        token,
        tokenType == TokenType.access ?
            process.env.SECRET_ACCESS_KEY
            : tokenType == TokenType.refresh ? process.env.SECRET_REFRESH_KEY
                : null
    )
    const userId = payload._id
    const redisTokenKey = revokeTokenKey(payload._id, payload.jti)
    if (!await redisClient.get(redisTokenKey)) {
        BadRequestException("login again")
    }
    const user = await User.findById(userId)
    if (!user) {
        return NotFoundException("user not found")
    }
    return { user, decodedToken: payload }
}


export const auth = async (req, res, next) => {

    const authorization = req.headers.authorization
    const { user, decodedToken } = await decodeToken(authorization, TokenType.access)
    req.user = user
    req.decodedToken = decodedToken
    next()
}


export const authorization = (roles = []) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return UnauthorizedException("You are not authorized to access this api")
        }
        next()
    }
}