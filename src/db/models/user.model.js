import { model, Schema } from "mongoose";
import { GenderEnum, providersEnum, RoleEnum } from "../../utils/enums/user.enum.js";
import { decrypt } from "../../utils/security/encryption/encrypt.js";

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
    },
    username: {
      type: String,
      required: true,
    },
    emailConfirmed: {
      type: Boolean,
      default: false,
    },
    gender: {
      type: String,
      enum: Object.values(GenderEnum),
    },
    role: {
      type: Number,
      enum: Object.values(RoleEnum),
      default: RoleEnum.USER,
    },
    phone: {
      type: String,
    },
    provider: {
      type: Number,
      enum: Object.values(providersEnum),
      default: providersEnum.SYSTEM
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

userSchema.virtual("mobile").get(function () {
  return decrypt(this.phone);
});

export const User = model("User", userSchema);
