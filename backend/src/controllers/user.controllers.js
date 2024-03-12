import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.models.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import mongoose from "mongoose";


const generateAccessAndRefreshTokens = async(userId)=>{

    try {
        
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;

        await user.save({ validateBeforeSave: false });
        return {accessToken,refreshToken};

    } catch (error) {

        throw new ApiError(500,"something went wrong while registering user");
        
    }
}



const registerUser =  asyncHandler(async(req,res) => {

    const {fullName,email,username,password} = req.body;

    if([fullName,email,username,password].some((field)=>field?.trim()==="")){
        throw new ApiError(400,"app fileds are required");
    }

    const existedUser = await User.findone({
        $or: [{username},{email}]
    });

    if(existedUser){
        throw new ApiError(400,"user already exist with username or email");;
    }

    const user = await User.create({
        fullName,
        email,
        username,
        password
    });

    const createdUser = await User.findById(user._id).select("-password -refreshtoken")

    if(!createdUser){
        throw new ApiError(500, "something went wrong while registering user");
    }

    return res.status(200).json(
        new ApiResponse(200,createdUser,"user registered succeesfully")
    );
})


const loginUser = asyncHandler(async(req,res)=>{

    const {username,email,password} = req.body;

    if(!username && !email){
        throw new ApiError(400,"username or email required");
    }

    const user = await User.findOne({
        $or: [{username},{email}]
    })

    if(!user)
    throw new ApiError(400,"user does not exist");

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid)
    throw new ApiError(400,"invalid login credentials");

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const option = {
        httpOnly:true,
        secure:true
    }

    return res.status(200).
    cookie("accessToken",accessToken,option)
    .cookie("refreshToken",refreshToken,option)
    .json(
        new ApiResponse(200,
            {
                user:loggedInUser,accessToken,refreshToken
            },
            "user logged in successfully"
            )
    )
})


const logoutUser = asyncHandler(async(req,res)=>{

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset:{
                refreshToken:1
            }
        },
        {
            new:true
        }
    )

    const options = {
        httpOnly:true,
        secure:true,
    }

    return res.status(200).json(
        new ApiResponse(200,{},"user logged out Successfullly")
    )
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(400,"refresh token required");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id);

        if(!user){
            throw new ApiError(401,"invalid refresh token");
        }

        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"refresh token expired or used");
        }

        const options = {
            httpOnly:true,
            secure:true
        }

        const {accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user._id);

        return res.status(200).json(
            new ApiResponse(200,{
                accessToken,
                refreshToken:newRefreshToken,
            },
            "access token refreshed successfully")
        )

    } catch (error) {
        throw new ApiError(401,error?.message || "invalid refresh token");
    }
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{

    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);

    const {isPasswordCorrect} = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
        throw new ApiError(400,"invalid old password");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave:false});

    return res.status(200).json(
        new ApiResponse(200,req,user,"current user fetched successfully")
    )


})



export { registerUser,loginUser,refreshAccessToken,logoutUser,changeCurrentPassword };