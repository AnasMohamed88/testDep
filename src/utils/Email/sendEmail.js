import nodemailer from 'nodemailer';


export const sendEmail = async ({ to, subject, html }) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.example.com",
        port: 587,
        service: "gmail",
        auth: {
            user: "anas.route@gmail.com",
            pass: "xyqxucrnnecowzbu"
        }
    })
    const info = await transporter.sendMail({
        from: '"Example Team" <team@example.com>', // sender address
        to,
        subject,
        html
    })
    console.log(info.accepted);
}