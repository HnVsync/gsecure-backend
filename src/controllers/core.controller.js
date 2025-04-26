import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { PasswordCheck } from "../utils/PasswordCheck.js";
import { generateFeedback, getRating, PasswordStrength } from "../utils/PasswordStrength.js";
import { GeneratePassword } from "../utils/GeneratePassword.js";

/**
 * Gets the client's IP address from the request
 * 
 * @async
 * @function getIP
 * @param {Express.Request} req - Express request object
 * @param {Express.Response} res - Express response object
 * @returns {Promise<Express.Response>} Response containing the client's IP address
 * @throws {ApiError} If IP address cannot be determined
 */

const getIP = asyncHandler(async (req, res) => {
    let ipAddress = req.headers['x-forwarded-for'] || 
                   req.headers['x-real-ip'] ||
                   req.connection.remoteAddress ||
                   req.socket.remoteAddress;
    
    // If x-forwarded-for contains multiple IPs, get the first one (client IP)
    if (ipAddress && ipAddress.includes(',')) {
        ipAddress = ipAddress.split(',')[0].trim();
    }
    
    // Remove the IPv6 prefix if present (common in Node.js environments)
    if (ipAddress && ipAddress.startsWith('::ffff:')) {
        ipAddress = ipAddress.substring(7);
    }
    // Handle the IPv6 loopback address
    if (ipAddress === '::1') {
        ipAddress = '127.0.0.1';  // Convert IPv6 localhost to IPv4 format
    }

    if (!ipAddress) {
        throw new ApiError(500, "Some error occured for accessing ip")
    }
    console.log(ipAddress)
    return res.status(200).json(
        new ApiResponse(200, ipAddress, "IP address fetched")
    )
})

/**
 * Checks if a password has been compromised in known data breaches
 * using the HaveIBeenPwned API service
 * 
 * @async
 * @function breachPassword
 * @param {Express.Request} req - Express request object containing password in body
 * @param {Express.Response} res - Express response object
 * @returns {Promise<Express.Response>} Response containing breach status and count
 * @throws {ApiError} If password is missing or if there is an error checking breach status
 */
const breachPassword = asyncHandler(async(req,res)=>{
    const {password} = req.body;

    if (!password) {
        throw new ApiError(400, "Password is required");
    }

    const pwnedCount = await PasswordCheck(password);
    console.log(pwnedCount)
    if (pwnedCount === -1) {
        throw new ApiError(500, "Error checking password breach status");
    } else if (pwnedCount > 0) {
        return res.status(200).json(
            new ApiResponse(200, { compromised: true, count: pwnedCount }, 
              "Your password was found in data breaches. Please change your password.")
        );
    } else {
        return res.status(200).json(
            new ApiResponse(200, { compromised: false }, "Password not found in any known data breaches")
        );
    }
})

/**
 * Evaluates password strength based on multiple security criteria
 * including length, character variety, and complexity patterns.
 * 
 * @async
 * @function passwordStrength
 * @param {Express.Request} req - Express request object containing password in body
 * @param {Express.Response} res - Express response object
 * @returns {Promise<Express.Response>} Response containing:
 *   - score: Numeric strength score (0-100)
 *   - rating: Text rating (Weak, Medium, Strong, Very Strong)
 *   - feedback: Array of specific improvement suggestions
 * @throws {ApiError} If password is missing or invalid
 */
const passwordStrength = asyncHandler(async(req,res)=>{
    const {password} = req.body;
    if (!password) {
        throw new ApiError(400, "Password is required");
    }
    const strengthResult = PasswordStrength(password);

    return res.status(200).json(
        new ApiResponse(200,{
            score: strengthResult.score,
            rating: strengthResult.rating || getRating(strengthResult.score),
            feedback: strengthResult.feedback || generateFeedback(password, strengthResult.score)
        },"Password strength evaluation completed")
    )
})

const generatePassword = asyncHandler(async(req,res)=>{
    try{
        const options = {
            length:req.body.plength,
            keyword:req.body.keyword || '',
        };
        const gpassword = GeneratePassword(options)

        // Analyze the generated password's strength
        const strengthAnalysis = PasswordStrength(gpassword.password);
        
        return res.status(200).json(
            new ApiResponse(200,{
                gresponse:gpassword,
                strength:{
                    score: strengthAnalysis.score,
                    rating: strengthAnalysis.rating,
                    feedback: strengthAnalysis.feedback
                }
            },"Strong password generated successfully")
        )
    }catch(error){
        throw new ApiError(400,error.message)
    }
})

export {
    getIP,
    breachPassword,
    passwordStrength,
    generatePassword
}