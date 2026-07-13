import multer, { diskStorage, memoryStorage } from "multer"
import fs from 'fs/promises';
// memory => Ram
// disk => HDD,SSD

const imageMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "image/bmp",
    "image/x-icon",
    "image/tiff",
    "image/heic",
    "image/avif",
];
const extendedPdfMimeTypes = [
    'application/pdf',
    'application/x-pdf',
    'application/acrobat',
    'applications/vnd.pdf',
    'text/pdf'
];
const videoMimeTypes = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-ms-wmv',
    'video/x-flv'
];


export const allowedMimeTypes = {
    imageMimeTypes: [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
        "image/bmp",
        "image/x-icon",
        "image/tiff",
        "image/heic",
        "image/avif",
    ],
    extendedPdfMimeTypes: [
        'application/pdf',
        'application/x-pdf',
        'application/acrobat',
        'applications/vnd.pdf',
        'text/pdf'
    ],
    videoMimeTypes: [
        'video/mp4',
        'video/webm',
        'video/ogg',
        'video/quicktime',
        'video/x-msvideo',
        'video/x-ms-wmv',
        'video/x-flv'
    ]
}
export const uploadFile = ({
    destination = "general",
    fileSize = 30 * 1024,
    fileValidation = allowedMimeTypes.imageMimeTypes
}) => {



    const storage = diskStorage({
        destination: async (req, file, cb) => {

            const folderName = "./uploads/" + destination //./uploads/users/profile


            try {
                await fs.access(folderName)

            } catch (error) {
                await fs.mkdir(folderName, {
                    recursive: true
                })
            }

            cb(null, folderName)
        },
        filename: (req, file, cb) => {
            return cb(null, `${Date.now()}_${file.originalname}`)
        }
    })


    const fileFilter = (req, file, cb) => {

        if (!fileValidation.includes(file.mimetype)) {
            cb(new Error("not allowed file", false))
        }
        else (
            cb(null, true)
        )
    }







    return multer({
        storage,
        limits: {
            fileSize
        },
        fileFilter
    })


}





