import { signUpSchema } from "../modules/auth/auth.validation.js"
import { BadRequestException } from "../utils/response/error.response.js"






export const validation = (schema) => {
    return (req, res, next) => {
        const validationErrors = []
        const data = Object.keys(schema)
       
        
        data.forEach(ele => { // body  , params   , query
                const validationRes = schema[ele].validate(req[ele], { abortEarly: false })
                if (validationRes.error) {
                    validationErrors.push(validationRes.error)
                }
        })

        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "validation Error",
                error: validationErrors,
            });
        }
        next()
    }
}


