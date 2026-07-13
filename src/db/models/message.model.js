import { model, Schema, Types } from "mongoose";



// {attachments }
const messageSchema = new Schema({
    content: {
        type: String,
        min: 5,
        required: function () {
            return this.attachments?.length ? false : true
        }
    },
    attachments: {
        type: [String]
    },
    receiver: {
        type: Types.ObjectId,
        ref: "users",
        required: true
    }
}, {
    timestamps: true,
    query: false,
    strictQuery: true
})


export const Message = model("Message", messageSchema)



