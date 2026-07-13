import jwt from "jsonwebtoken"

export const generateToken = (payload, secretKey, options = {}) => {
    const token = jwt.sign(payload, secretKey, options)
    return token
}

export const verifyToken = (token, secretKey, options = {}) => {
    const payload = jwt.verify(token, secretKey, options)
    return payload
}