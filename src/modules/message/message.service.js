


// 1- data=>{content,attachments}
// 2- check receiver
// 3- create message
// 4- return res

import { Message } from "../../db/models/message.model.js"
import { User } from "../../db/models/user.model.js"
import { NotFoundException, UnauthorizedException } from "../../utils/response/error.response.js"
import { successResponse } from "../../utils/response/success.response.js"


export const sendMessage = async (req, res) => {
    const { content, to } = req.body
    const { files } = req

    const receiver = await User.findById(to)
    if (!receiver) {
        NotFoundException("invalid receiver id")
    }
    let attachments = []
    if (req.files?.length) {
        attachments = req.files.map((ele) => ele.path)
    }
    const message = await Message.create({
        content,
        attachments,
        receiver: receiver._id
    })
    successResponse({
        res,
        data: message
    })
}


export const getMessages = async (req, res) => {
    const user = req.user
    const messages = await Message.find({
        receiver: user._id
    }).select('-receiver -__v -updatedAt')
    successResponse({
        res,
        data: {
            user: {
                _id: user._id,
                fullName: user.firstName + " " + user.lastName,
                messages
            },
        }
    })
}



export const deleteMessage = async (req, res) => {
    const user = req.user
    const { id } = req.params
    const message = await Message.findById(id)
    if (!message) {
        NotFoundException("message not found")
    }

    if (message.receiver.toString() != user._id.toString()) {
        UnauthorizedException("not authorized to delete this message")
    }
    await message.deleteOne()
    return successResponse({
        res,
        message: "Done"
    })
}

