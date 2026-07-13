import { nanoid } from "nanoid";
import { User } from "../../db/models/user.model.js";
import { decodeToken, TokenType } from "../../middlewares/auth.middlware.js";
import { generateHtml } from "../../utils/Email/html.tmplate.js";
import { createOtp } from "../../utils/Email/otp.js";
import { sendEmail } from "../../utils/Email/sendEmail.js";
import { providersEnum } from "../../utils/enums/user.enum.js";
import { redisClient } from "../../utils/redis/redis.client.js";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "../../utils/response/error.response.js";
import { successResponse } from "../../utils/response/success.response.js";
import { encrypt } from "../../utils/security/encryption/encrypt.js";
import { compare } from "../../utils/security/hashing/compare.js";
import { hash } from "../../utils/security/hashing/hash.js";
import { generateToken, verifyToken } from "../../utils/security/token/token.js";
import { OAuth2Client } from "google-auth-library"
import { confirmEmailOtpKey, confirmOldEmailOtpKey, forgetPassKey, newEmailKey, revokeTokenKey } from "../../utils/redis/redis.services.js";
const client = new OAuth2Client();
export const signUp = async (req, res, next) => {

  const { firstName, lastName, username, email, password, gender, phone } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    return ConflictException("User Already Exists");
  }

  const otp = createOtp()
  const userCreated = await User.create({
    firstName,
    lastName,
    username,
    email,
    password: await hash(password),
    gender,
    phone: encrypt(phone),
  });
  await redisClient.set(`Users:${userCreated._id}:emailConfirmationOtp`, otp, {
    expiration: {
      type: "EX",
      value: 5 * 60
    }
  })
  sendEmail({
    to: userCreated.email,
    subject: "confirm your email",
    html: generateHtml(otp)// /localhost:3000/api/v1/confirmEmail/token
  })

  return successResponse({
    res,
    message: "User Created Successfully",
    data: userCreated,
  });
};

export const confirmEmail = async (req, res) => {
  const { otp, email } = req.body
  const { token } = req.params
  const user = await User.findOne({ email })

  if (user.emailConfirmed) {
    return BadRequestException("Already confirmed")
  }



  const userOTP = await redisClient.get(`Users:${user._id}:emailConfirmationOtp`)
  if (!userOTP) {
    return BadRequestException("invalid or expired otp")
  }
  if (userOTP != otp) {
    return BadRequestException("invalid or expired otp")
  }
  await redisClient.del(`Users:${user._id}:emailConfirmationOtp`)
  user.emailConfirmed = true
  await user.save()


  return successResponse({
    res,
    message: "Confirmed",
  })
}

export const resendOtp = async (req, res) => {
  const { email } = req.body
  const user = await User.findOne({ email })
  if (!user) {
    return NotFoundException("user not found")
  }
  if (user.emailConfirmed) {
    return BadRequestException("already confirmed")
  }
  const isOtpExist = await redisClient.get(`Users:${user._id}:emailConfirmationOtp`)
  if (isOtpExist) {
    const ttl = await redisClient.TTL(`Users:${user._id}:emailConfirmationOtp`)
    return BadRequestException(`wait ${ttl} seconds to resend otp`)
  }
  const otp = createOtp()
  await redisClient.set(`Users:${user._id}:emailConfirmationOtp`, otp, {
    expiration: {
      type: "EX",
      value: 5 * 60
    }
  })
  sendEmail({
    to: user.email,
    subject: "confirm your email",
    html: generateHtml(otp)
  })
  return successResponse({
    res,
    message: "Done"
  })

}

export const login = async (req, res, next) => {
  const { email, password } = req.body;


  const user = await User.findOne({ email });
  if (!user) {
    return BadRequestException("Invalid password or email");
  }
  if (user.provider > providersEnum.SYSTEM) {
    return BadRequestException("use social login")
  }

  const matchedPassword = await compare(password, user.password);
  if (!matchedPassword) {
    return BadRequestException("Invalid password or email");
  }
  const jti = nanoid()
  const accessToken = generateToken({
    _id: user._id,
    email: user.email
  },
    process.env.SECRET_ACCESS_KEY,
    {
      expiresIn: "10m",
      jwtid: jti
    }
  )
  const refreshToken = generateToken({
    _id: user._id,
    email: user.email
  },
    process.env.SECRET_REFRESH_KEY,
    {
      expiresIn: "7D",
      jwtid: jti
    }
  )
  await redisClient.set(revokeTokenKey(user._id, jti), jti, {
    expiration: {
      type: "EX",
      value: 7 * 24 * 60 * 60
    }
  })
  return successResponse({
    res,
    message: "User Login Successfully",
    data: {
      accessToken,
      refreshToken
    },
  });
};


export const profile = async (req, res, next) => {

  return successResponse({
    res,
    message: "Done",
    data: {
      user: req.user
    }
  })
}


export const refreshToken = async (req, res, next) => {
  const authorization = req.headers.authorization

  const { user, decodedToken } = await decodeToken(authorization, TokenType.refresh)


  const accessToken = generateToken({
    _id: user._id,
    email: user.email
  },
    process.env.SECRET_ACCESS_KEY,
    {
      expiresIn: "10m",
      jwtid: decodedToken.jti
    }
  )

  return successResponse({
    res,
    data: {
      accessToken
    }
  })
}



export const socialLogin = async (req, res, next) => {
  const { idToken } = req.body
  const ticket = await client.verifyIdToken({
    idToken,
    audience: "610445491034-ptue9fm453aa80h0aprsomfu1q65vfd8.apps.googleusercontent.com"
  })
  const { email, family_name: lastName, given_name: firstName } = ticket.getPayload()

  let user = await User.findOne({ email })

  if (user) {
    if (user.provider == providersEnum.SYSTEM) {
      BadRequestException("use system login")
    }

  } else {
    user = await User.create({
      firstName,
      lastName,
      username: `${firstName}_${lastName}`,
      email,
      emailConfirmed: true,
      provider: providersEnum.GOOGLE
    });
  }


  const accessToken = generateToken({
    _id: user._id,
    email: user.email
  },
    process.env.SECRET_ACCESS_KEY,
    {
      expiresIn: "10m"
    }
  )
  const refreshToken = generateToken({
    _id: user._id,
    email: user.email
  },
    process.env.SECRET_REFRESH_KEY,
    {
      expiresIn: "7D"
    }
  )
  return successResponse({
    res,
    message: "User Login Successfully",
    data: {
      accessToken,
      refreshToken
    },
  });

}

export const logout = async (req, res, next) => {
  const user = req.user
  const payload = req.decodedToken
  const key = revokeTokenKey(user._id, payload.jti)
  await redisClient.del(key)
  return successResponse({
    res,
    message: "Done"
  })
}
export const logoutFromAllDevices = async (req, res, next) => {
  const user = req.user


  let keys = await redisClient.keys(`Users:login:${req.user._id}:*`)
  await redisClient.del(keys)
  return successResponse({
    res,
    message: "Done"
  })
}

export const forgetPass = async (req, res) => { // req otp
  const { email } = req.body
  const user = await User.findOne({ email })
  if (!user) {
    NotFoundException("user not found")
  }
  if (!user.emailConfirmed) {
    BadRequestException("confirm your account first")
  }
  if (await redisClient.get(forgetPassKey(user._id))) {
    const ttl = await redisClient.ttl(forgetPassKey(user._id))
    BadRequestException(`wait ${ttl} seconds to resend otp`)
  }
  const otp = createOtp()
  sendEmail({
    to: email,
    subject: "forget password",
    html: generateHtml(otp)
  })
  await redisClient.set(forgetPassKey(user._id), otp, {
    expiration: {
      type: "EX",
      value: 5 * 60
    }
  })

  return successResponse({
    res,
    message: "Done"
  })
}


export const resetPass = async (req, res) => {
  const { otp, email, newPass } = req.body
  const user = await User.findOne({ email })
  if (!user) {
    NotFoundException("user not found")
  }
  if (!user.emailConfirmed) {
    BadRequestException("confirm your account first")
  }
  const savedOtp = await redisClient.get(forgetPassKey(user._id))

  if (!savedOtp || savedOtp != otp) {
    BadRequestException("in-valid otp")
  }
  user.password = await hash(newPass)
  await user.save()
  await redisClient.del(forgetPassKey(user._id))
  return successResponse({
    res,
    message: "Done"
  })
}


export const updatePass = async (req, res, next) => {
  const user = req.user
  const { oldPass, newPass } = req.body // old != new
  if (!await compare(oldPass, user.password)) {
    BadRequestException("in-valid old password")
  }
  user.password = await hash(newPass)
  await user.save()
  return successResponse({
    res,
    message: "Done"
  })
}




export const updateEmail = async (req, res, next) => {
  const user = req.user
  const { newEmail } = req.body
  if (user.email == newEmail) {
    BadRequestException("new email can't equal to old email")
  }
  const isEmailExist = await User.findOne({
    email: newEmail
  })
  if (isEmailExist) {
    BadRequestException("email already exist")
  }
  const newEmailOtp = createOtp()
  const oldEmailOtp = createOtp()
  const newEmailOtpKey = confirmEmailOtpKey(user._id)
  const oldEmailOtpKey = confirmOldEmailOtpKey(user._id)
  await redisClient.set(newEmailOtpKey, newEmailOtp, {
    expiration: {
      type: "EX",
      value: 60 * 5
    }
  })
  await redisClient.set(oldEmailOtpKey, oldEmailOtp, {
    expiration: {
      type: "EX",
      value: 60 * 5
    }
  })
  await redisClient.set(newEmailKey(user._id), newEmail, {
    expiration: {
      type: "EX",
      value: 60 * 5
    }

  })


  sendEmail({
    to: newEmail,
    subject: "new email confirmation",
    html: generateHtml(newEmailOtp)
  })
  sendEmail({
    to: user.email,
    subject: "old email confirmation",
    html: generateHtml(oldEmailOtp)
  })



  return successResponse({
    res,
    message: "success"
  })
}
// anas.route@gmail.com => old => 123456
// anas423999@gmail.com => new => 789456

export const confirmUpdateEmail = async (req, res, next) => {
  const user = req.user
  const { oldOtp, newOtp } = req.body // 123456   , 789456   , hamada@gmail.com
  const storedOldOtp = await redisClient.get(confirmOldEmailOtpKey(user._id))
  const storedNewOtp = await redisClient.get(confirmEmailOtpKey(user._id))

  if (!storedOldOtp || !storedNewOtp || oldOtp != storedOldOtp || newOtp != storedNewOtp) {
    BadRequestException('in-valid otps')
  }
  const newEmail = await redisClient.get(newEmailKey(user._id))
  if (!newEmail) {
    BadRequestException("in-valid new email please try again")
  }
  user.email = newEmail
  await user.save()
  successResponse({
    res,
    message: "Done"
  })
}