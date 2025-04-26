import {ApiError} from "../utils/ApiError.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import jwt  from "jsonwebtoken"
import {User} from "../models/user.model.js"

export const verifyJWT = asyncHandler(async(req,_,next)=>{
    try {
        let token;
        
        if (req.cookies?.accessToken) {
            token = req.cookies.accessToken;
        } else if (req.header("Authorization")) {
            // Only try to replace if Authorization header exists
            token = req.header("Authorization").replace("Bearer ", "");
        }
            
        if(!token){
            throw new ApiError(401,"Unauthorized request")
        }
    
        const decodedInformation = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedInformation?._id).select("-password")
    
        if(!user){
            throw new ApiError(401,"Invalid Access Token")
        }
    
        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid Access Token")
    }
}) 