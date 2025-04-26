import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import CryptoJS from "crypto-js";

const generateAccessToken = async (userID) => {
    try {
        const user = await User.findOne(userID)
        const accessToken = user.generateAccessToken();
        return { accessToken };
    } catch (error) {
        throw new ApiError(500, "SOmwthing went wrong while generating AT.");
    }
}

const signUpUser = asyncHandler(async (req, res) => {
    const { uname, uemail, upassword, keyword } = req.body;

    // decrypt this which is encrypted in frontend using
    const username = CryptoJS.AES.decrypt(uname, keyword).toString(CryptoJS.enc.Utf8);
    console.log("username hai : ", username)
    const email = CryptoJS.AES.decrypt(uemail, keyword).toString(CryptoJS.enc.Utf8);
    console.log("email hai : ", email)
    const password = CryptoJS.AES.decrypt(upassword, keyword).toString(CryptoJS.enc.Utf8);
    console.log("password hai : ", password)

    if ([email, password, username, keyword].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required.") // message to be changed in english
    }
    // if(!validateEmail(email)){
    //     throw new ApiError(400,"Please enter a valid email.") // message to be changed in english
    // }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        // Check which field already exists to provide more specific message
        if (existedUser.username === username && existedUser.email === email) {
            throw new ApiError(409, "Both username and email are already registered");
        } else if (existedUser.username === username) {
            throw new ApiError(409, "Username already taken");
        } else {
            throw new ApiError(409, "Email already registered");
        }
    }

    const user = await User.create({
        username: username.toLowerCase(),
        email,
        password,
        keyword
    })

    const createdUser = await User.findById(user._id).select(
        "-password"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while signing. Please try again.")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User created successfully.")
    )
});

const signInUser = asyncHandler(async (req, res) => {
    if (!req.body) {
        throw new ApiError(400, "Request body is missing");
    }
    console.log(req.body);
    const { uname, upassword, keyword } = req.body

    const username = CryptoJS.AES.decrypt(uname, keyword).toString(CryptoJS.enc.Utf8);
    console.log("yahi hai username : ", username);
    const password = CryptoJS.AES.decrypt(upassword, keyword).toString(CryptoJS.enc.Utf8);
    console.log("yahi hai password : ", password);
    console.log("what is password : ", password)

    if (!username) {
        throw new ApiError(400, "User doesnot exist on our systems.")
    }

    const user = await User.findOne({
        $or: [{ username }]
    })

    const passwordValid = await user.isPasswordCorrect(password)
    console.log("Hashed password : ", passwordValid)
    if (!passwordValid) {
        throw new ApiError(401, "Invalid credentials. Try with different (you have only 3 attempts and you will temporary blocked.)")
    }
    const { accessToken } = await generateAccessToken(user._id);

    const options = {
        httpOnly: true,
        secure: true
    }
    res.setHeader('Authorization', `Bearer ${accessToken}`);
    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    username: user.username,
                    email: user.email,
                    accessToken
                },
                "User logged in successfully"
            )
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    const options = {
        httpOnly: true,
        secure: true
    }
    res.removeHeader("Authorization");
    return res.status(200)
        .clearCookie("accessToken", options)
        .json(new ApiResponse(200, {}, "Logout successfully"));
})

const getCurrentUser = asyncHandler(async (req, res) => {

    console.log("Get user : ", req.user)
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "User fetched successfully."))
})

export {
    signUpUser,
    signInUser,
    logoutUser,
    getCurrentUser
    // seePassword
}