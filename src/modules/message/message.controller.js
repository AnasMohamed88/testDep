import { Router } from "express";
import { allowedMimeTypes, uploadFile } from "../../utils/multer/uploadFiles.js";
import { deleteMessage, getMessages, sendMessage } from "./message.service.js";
import { auth } from "../../middlewares/auth.middlware.js";

const router = Router();




router.post(
    '/',
    uploadFile({
        destination: "messages",
        fileValidation: allowedMimeTypes.imageMimeTypes
    }).array('images', 5),
    sendMessage
)


router.get(
    "/",
    auth,
    getMessages
)


router.delete("/:id", auth, deleteMessage)



export default router;
