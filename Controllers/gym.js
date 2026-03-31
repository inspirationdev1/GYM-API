const Gym = require('../Modals/gym');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.register = async (req, res) => {
    try {
        const { userName, password, gymName, profilePic, email } = req.body;
        const isExist = await Gym.findOne({
            $or: [
                { userName },
                { email }
            ]
        });

        if (isExist) {
            return res.status(400).json({
                message: 'Username or Email already exists'
            });
        } else {
            const hashedPassword = await bcrypt.hash(password, 10);
            console.log(hashedPassword);
            const newGym = Gym({ userName, password: hashedPassword, gymName, profilePic, email });
            await newGym.save();
            res.status(201).json({ message: "User registed successfully", success: "yes", data: newGym })
        }

    } catch (error) {
        res.status(500).json({
            error: "Server Error"
        })
    }
}
// process.env.VITE_FRONTEND_URL
// const cookieOptions = {
//     httpOnly: true,
//     secure: false, // Set to true in production
//     sameSite: 'Lax'
// }
const cookieOptions = {
    httpOnly: true,
    secure: process.env.secure||false, // Set to true in production
    sameSite: process.env.sameSite||'Lax'
}

exports.login = async (req, res) => {
    try {
        const { userName, password, email } = req.body;
        const gym = await Gym.findOne({
            $or: [
                { userName },
                { email }
            ]
        });

        if (gym) {
            const isPasswordValid = await bcrypt.compare(password, gym.password);
            if (isPasswordValid) {
                const token = jwt.sign({ gym_id: gym._id }, process.env.JWT_SecretKey);
                res.cookie("cookie_token", token, cookieOptions);
                

                res.json({ message: 'Logged in successfully', success: "true", gym, token });
            } else {
                res.status(400).json({ error: 'Invalid credentials' });
            }
        } else {
            res.status(400).json({ error: 'Username or Email not correct' });
        }
    } catch (error) {
        res.status(500).json({
            error: "Server Error"
        });
    }
}


exports.logineclaims = async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log("username:" + username);
        console.log("password:" + password);

        const response = await fetch("https://api.eclaims.waseel.com/oauth/authenticate", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                grant_type: "client_credentials",
                username: username,
                password: password
            })
        });

        const json = await response.json();

        const { access_token, refresh_token } = json;
        console.log("access_token:" + access_token);

        const response_2 = await fetch(
            "https://api.eclaims.waseel.com/beneficiaries/providers/2158/patientKey/1093772497/systemType/1",
            {
                method: "GET", // or POST
                headers: {
                    "Authorization": `Bearer ${access_token}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const data = await response_2.json();
        console.log(data);



        res.json(json);
        // return json; // { access_token, token_type, expires_in }
    } catch (error) {
        res.status(500).json({
            error: "Server Error"
        });
    }
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.EMAIL_PASSWORD
    }
});

exports.sendOtp = async (req, res) => {
    try {
        const { email, userName } = req.body;
        const gym = await Gym.findOne({
            $or: [
                { userName },
                { email }
            ]
        });
        if (gym) {
            const buffer = crypto.randomBytes(4); //get random bytes
            const token = buffer.readUInt32BE(0) % 900000 + 100000; //Modulo to get a 6-digit number
            gym.resetPasswordToken = token;
            gym.resetPasswordExpires = Date.now() + 3600000; //1 hour expiry date
            await gym.save();

            //for email sending
            const mailOptions = {
                from: 'inspirationdev1@gmail.com',
                to: gym.email,
                subject: 'Password Reset',
                text: `You requested a password reset. Your OTP is : ${token}`
            }

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    res.status(500).json({ error: 'Server error', errorMsg: error });
                } else {
                    res.status(200).json({ message: "OTP sent to your email" });
                }
            });

        } else {
            res.status(400).json({ error: 'Username or Email not correct' });
        }
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
}

exports.checkOtp = async (req, res) => {
    try {
        const { userName, email, otp } = req.body;
        const gym = await Gym.findOne({
            email,
            resetPasswordToken: otp,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!gym) {
            return res.status(400).json({ error: 'OTP is not Valid or Expired or Email is not correct' });
        }

        res.status(200).json({ message: "OTP is successfully verified" });


    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
}

exports.resetPassword = async (req, res) => {
    try {
        console.log("Test-1");
        const { email, userName, newPassword } = req.body;
        const gym = await Gym.findOne({
            $or: [
                { userName },
                { email }
            ]
        });
        console.log("Test-1");
        if (!gym) {
            return res.status(400).json({ error: 'Username or Email is not correct' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        gym.password = hashedPassword;
        gym.resetPasswordToken = undefined;
        gym.resetPasswordExpires = undefined;
        await gym.save();
        res.status(200).json({ message: "Password Reset Successfully" });

    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
}

exports.logout = async (req, res) => {
    res.clearCookie('cookie_token', cookieOptions).json({ message: 'Logged out successfully' });
}



