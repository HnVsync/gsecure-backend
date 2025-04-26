import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import {Vault} from "../models/vault.model.js";

const addEntry = asyncHandler(async(req,res)=>{
    const {website,username,upassword,notes,keyword} = req.body;
    const ownerId = req.user._id;

    try{
        const owner = await User.findById(ownerId);
        if(!owner){
            throw new ApiError(404,"User not found.")
        }

        // const uname = CryptoJS.AES.decrypt(username, keyword).toString(CryptoJS.enc.Utf8);
        // const upass = CryptoJS.AES.decrypt(upassword, keyword).toString(CryptoJS.enc.Utf8);
     
        const vaultEntry = await Vault.create({
            owner: ownerId,
            website:website,
            username:username,
            upassword:upassword,
            keyword,
            notes
        });

        return res.status(201).json(
            new ApiResponse(201,{
                website:vaultEntry.website,
                username:vaultEntry.username,
                created:vaultEntry.createdAt
            },"Password saved successfully.")
        )
    }catch(error){
        throw new ApiError(500,"Failed to save password, Try again.")
    }
})

const viewEntry = asyncHandler(async(req,res)=>{
    const ownerId = req.user._id;
    try{
        const vaultEntries = await Vault.find({owner:ownerId})
        .sort({updatedAt:-1})
        .select("website username upassword notes createdAt updatedAt");

        const validEntries = vaultEntries.map(entry=>({
            id:entry._id,
            website:entry.website,
            username:entry.username,
            password:entry.upassword,
            notes: entry.notes,
            lastUpdated: entry.updatedAt,
            created: entry.createdAt
        }));

        return res.status(200).json(
            new ApiResponse(200,{
                count:validEntries.length,
                savedPass:validEntries
            },"Password entries fetched successfully.")
        )
    }
    catch(error){
        throw new ApiError(500,"Failed to fetch password.")
    }
})

const deleteEntryById = asyncHandler(async(req,res)=>{
    const { id } = req.params;
    const ownerId = req.user._id;
    const {keyword} = req.body;

    try{
        const vaultEntry = await Vault.findOne({
            _id:id,
            owner:ownerId
        })

        if (!vaultEntry) {
            throw new ApiError(404, "Password entry not found or you don't have permission to delete it");
        }

        const ukeyword = vaultEntry.keyword;
        console.log("keyword : ",keyword);

        if(!(keyword==ukeyword)){
            throw new ApiResponse(409,{},"Keyword not match, Try with another.")
        }
        await Vault.findByIdAndDelete(vaultEntry._id);

        return res.status(200).json(
            new ApiResponse(200,{
                deletedEntryId:id,
            },"Selected entry is deleted.")
        )
    }catch(error){
        throw new ApiError(500,"Failed to delete entry , Try again.")
    }
})
export {
    addEntry,
    viewEntry,
    deleteEntryById    
}