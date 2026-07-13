export const revokeTokenKey = (userId, jti) => `Users:${userId}:login:${jti}`
export const forgetPassKey = (userId) => `Users:${userId}:forgetPass`



export const confirmEmailOtpKey = (userId) => `Users:${userId}:emailConfirmationOtp`
export const confirmOldEmailOtpKey = (userId) => `Users:${userId}:old:emailConfirmationOtp`

export const newEmailKey = (userId) => `Users:${userId}:newEmail`