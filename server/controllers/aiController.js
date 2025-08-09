
// import OpenAI from "openai";
// import sql from "../configs/db.js";
// import { clerkClient } from "@clerk/express";

// const AI = new OpenAI({
//     apiKey: process.env.GEMINI_API_KEY,
//     baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
// });

// export const generateArticle = async(req, res)=>{
//   try{
//     const{ userId } =await req.auth();
//     const {prompt, length} = req.body
//     const plan = req.plan
//     const free_usage = req.free_usage

//     if(plan !== 'premium' && free_usage >= 10){
//       return res.json({success: false, message: "Limit reached. Upgrade to continue."})
//     }

//     const response = await AI.chat.completions.create({
//     model: "gemini-2.0-flash",
//     messages: [
//         {
//             role: "user",
//             content: prompt,
//         },
//     ],
//     temperature: 0.7,
//     max_tokens: length,
//   });

//   const content = response.choices[0].message.content

//   await sql` INSERT INTO creations(user_id, prompt, content, type) VALUES (${userId}, ${prompt}, ${content}, 'article')`;

//   if(plan !== 'premium'){
//     await clerkClient.users.updateUserMetadata(userId, {privateMetadata: {
//       free_usage: free_usage+1
//     }
//     })
//   }

//   res.json({success:true, content})

//   }
//   catch(error){
//     console.log(error.message);
//     res.json({success:false, message:error.message})
    
//   }
// }

import OpenAI from "openai";
import sql from "../configs/db.js";
import { clerkClient } from "@clerk/express";
import axios from "axios";
import {v2 as cloudinary} from "cloudinary";
import FormData from "form-data"; 
import fs from 'fs'
import pdf from 'pdf-parse/lib/pdf-parse.js'

const AI = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

export const generateArticle = async (req, res) => {
  try {
    // Clerk - fetch user ID
    const { userId } = await req.auth(); // ✅ DEPRECATION FIXED

    const { prompt, length } = req.body;

    // Ensure prompt and length are provided
    if (!prompt || !length) {
      return res.status(400).json({ success: false, message: "Prompt and length are required." });
    }

    // Fetch plan and free usage - assumed set earlier via middleware
    const plan = req.plan;
    const free_usage = req.free_usage;

    // Check usage limit for free users
    if (plan !== "premium" && free_usage >= 10) {
      return res.json({ success: false, message: "Limit reached. Upgrade to continue." });
    }

    // Generate content from OpenAI API
    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: length,
    });

    const content = response.choices[0]?.message?.content || "No content generated.";

    // Insert into database
    await sql`
      INSERT INTO creations(user_id, prompt, content, type)
      VALUES (${userId}, ${prompt}, ${content}, 'article')
    `;

    // Update free usage for free users
    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1,
        },
      });
    }

    res.json({ success: true, content });
  } catch (error) {
    console.error("Error in /generate-article:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};



export const generateBlogTitle = async (req, res) => {
  try {
    // Clerk - fetch user ID
    const { userId } = await req.auth(); // ✅ DEPRECATION FIXED

    const { prompt} = req.body;

    // Ensure prompt and length are provided
    if (!prompt) {
      return res.status(400).json({ success: false, message: "Prompt and length are required." });
    }

    // Fetch plan and free usage - assumed set earlier via middleware
    const plan = req.plan;
    const free_usage = req.free_usage;

    // Check usage limit for free users
    if (plan !== "premium" && free_usage >= 10) {
      return res.json({ success: false, message: "Limit reached. Upgrade to continue." });
    }

    // Generate content from OpenAI API
    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 100,
    });

    const content = response.choices[0]?.message?.content || "No content generated.";

    // Insert into database
    await sql`
      INSERT INTO creations(user_id, prompt, content, type)
      VALUES (${userId}, ${prompt}, ${content}, 'blog-title')
    `;

    // Update free usage for free users
    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1,
        },
      });
    }

    res.json({ success: true, content });
  } catch (error) {
    console.error("Error in /generate-blog-title:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};


// export const generateImage = async (req, res) => {
//   try {
//     // Clerk - fetch user ID
//     const { userId } = await req.auth(); // ✅ DEPRECATION FIXED

//     const { prompt, publish} = req.body;

//     // Ensure prompt and length are provided
//     if (!prompt) {
//       return res.status(400).json({ success: false, message: "Prompt and length are required." });
//     }

//     // Fetch plan and free usage - assumed set earlier via middleware
//     const plan = req.plan;

//     // Check usage limit for free users
//     if (plan !== "premium") {
//       return res.json({ success: false, message: "This feature is only available for premium subscriptions." });
//     }

//     // Generate content from OpenAI API
//     const formData = new FormData()
//     formData.append('prompt', prompt)

//     //chatgpt
//     const headers = {
//   ...formData.getHeaders(), // ✅ sets Content-Type with correct boundary
//   'x-api-key': process.env.CLIPDROP_API_KEY,
// };

//     const {data} =  await axios.post("https://clipdrop-api.co/text-to-image/v1", formData, {
//       headers:{'x-api-key': process.env.CLIPDROP_API_KEY,},
//       responseType:"arraybuffer"
//     })

    
//     const base64Image = `data:image/png;base64,${Buffer.from(data,"binary").toString('base64')}`

//     const {secure_url} = await cloudinary.uploader.upload(base64Image)

//     // Insert into database
//     await sql`
//       INSERT INTO creations(user_id, prompt, content, type, publish)
//       VALUES (${userId}, ${prompt}, ${secure_url}, 'image', ${publish ?? false})
//     `;


//     res.json({ success: true, content: secure_url });
//   } 
//    catch(error){
//     console.log(error.message);
//     res.json({success:false, message:error.message})
//    }

// };


export const generateImage = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { prompt, publish } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, message: "Prompt is required." });
    }

    const plan = req.plan;
    if (plan !== "premium") {
      return res.json({ success: false, message: "This feature is only available for premium subscriptions." });
    }

    // ✅ Check API key exists
    if (!process.env.CLIPDROP_API_KEY) {
      return res.status(500).json({ success: false, message: "Clipdrop API key not configured." });
    }

    // Prepare form data
    const formData = new FormData();
    formData.append("prompt", prompt);

    // ✅ Correct header usage
    const headers = {
      ...formData.getHeaders(),
      "x-api-key": process.env.CLIPDROP_API_KEY,
    };

    // Request to Clipdrop
    const { data } = await axios.post(
      "https://clipdrop-api.co/text-to-image/v1",
      formData,
      { headers, responseType: "arraybuffer" }
    );

    // Convert binary → base64
    const base64Image = `data:image/png;base64,${Buffer.from(data, "binary").toString("base64")}`;

    // Upload to Cloudinary
    const { secure_url } = await cloudinary.uploader.upload(base64Image);

    // Save to DB
    await sql`
      INSERT INTO creations(user_id, prompt, content, type, publish)
      VALUES (${userId}, ${prompt}, ${secure_url}, 'image', ${publish ?? false})
    `;

    res.json({ success: true, content: secure_url });

  } catch (error) {
    console.error("Error in generateImage:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};



// export const removeImageBackground = async (req, res) => {
//   try {
//     const { userId } = await req.auth();
//     const image = req.file;


//     const plan = req.plan;
//     if (plan !== "premium") {
//       return res.json({ success: false, message: "This feature is only available for premium subscriptions." });
//     }

//     // ✅ Check API key exists
//     if (!process.env.CLIPDROP_API_KEY) {
//       return res.status(500).json({ success: false, message: "Clipdrop API key not configured." });
//     }

//     // Prepare form data
//     const formData = new FormData();
//     formData.append("prompt", prompt);

   
//     // Upload to Cloudinary
//     const { secure_url } = await cloudinary.uploader.upload(image.path, {
//       transformation: [
//         {
//           effect: 'background-removal',
//           background_removal: 'remove_the_background'
//         }
//       ]
//     });

//     // Save to DB
//     await sql`
//       INSERT INTO creations(user_id, prompt, content, type)
//       VALUES (${userId}, "Remove background from image", ${secure_url}, 'image')
//     `;

//     res.json({ success: true, content: secure_url });

//   } catch (error) {
//     console.error("Error in generateImage:", error.message);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };


//not tested but this is the chatgpt one
// export const removeImageBackground = async (req, res) => {
//   try {
//     const { userId } = await req.auth();
//     const image = req.file;

//     const plan = req.plan;
//     if (plan !== "premium") {
//       return res.json({ success: false, message: "This feature is only available for premium subscriptions." });
//     }

//     if (!image) {
//       return res.status(400).json({ success: false, message: "Image file is required." });
//     }

//     // Upload to Cloudinary with background removal
//     const { secure_url } = await cloudinary.uploader.upload(image.path, {
//       background_removal: "cloudinary_ai" // ✅ correct setting
//     });

//     // Save to DB
//     await sql`
//       INSERT INTO creations(user_id, prompt, content, type)
//       VALUES (${userId}, 'Remove background from image', ${secure_url}, 'image')
//     `;

//     res.json({ success: true, content: secure_url });
//   } catch (error) {
//     console.error("Error in removeImageBackground:", error.message);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };


//using gpt after it was not working
export const removeImageBackground = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const image = req.file;

    const plan = req.plan;
    if (plan !== "premium") {
      return res.json({ success: false, message: "This feature is only available for premium subscriptions." });
    }

    if (!image) {
      return res.status(400).json({ success: false, message: "Image file is required." });
    }

    // ✅ Send image to Clipdrop API
    const formData = new FormData();
    formData.append("image_file", fs.createReadStream(image.path));

    const clipdropRes = await axios.post(
      "https://clipdrop-api.co/remove-background/v1",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          "x-api-key": process.env.CLIPDROP_API_KEY
        },
        responseType: "arraybuffer"
      }
    );

    // Convert processed image to base64
    const base64Image = `data:image/png;base64,${Buffer.from(clipdropRes.data).toString("base64")}`;

    // ✅ Upload processed image to Cloudinary
    const { secure_url } = await cloudinary.uploader.upload(base64Image);

    // Save in DB
    await sql`
      INSERT INTO creations(user_id, prompt, content, type)
      VALUES (${userId}, 'Remove background from image', ${secure_url}, 'image')
    `;

    res.json({ success: true, content: secure_url });

  } catch (error) {
    console.error("Error in removeImageBackground:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};





// export const removeImageObject = async (req, res) => {
//   try {
//     const { userId } = await req.auth();
//     const { object } =  req.body;
//     const image = req.file;

//     const plan = req.plan;
//     if (plan !== "premium") {
//       return res.json({ success: false, message: "This feature is only available for premium subscriptions." });
//     }

//     // ✅ Check API key exists
//     if (!process.env.CLIPDROP_API_KEY) {
//       return res.status(500).json({ success: false, message: "Clipdrop API key not configured." });
//     }

//     // Prepare form data
//     const formData = new FormData();
//     formData.append("prompt", prompt);

   
//     // Upload to Cloudinary
//     const { public_id } = await cloudinary.uploader.upload(image.path)
  
//     const imageUrl = cloudinary.url(public_id, {
//       transformation: [{effect: `gen_remove:${object}`}],
//       resource_type: 'image'
//     })

//     // Save to DB
//     await sql`
//       INSERT INTO creations(user_id, prompt, content, type)
//       VALUES (${userId}, ${`Removed ${object} from image`}, ${imageUrl}, 'image')
//     `;

//     res.json({ success: true, content: imageUrl });

//   } catch (error) {
//     console.error("Error in generateImage:", error.message);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };



//not tested but this is the chatgpt one
export const removeImageObject = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { object } = req.body;
    const image = req.file;

    const plan = req.plan;
    if (plan !== "premium") {
      return res.json({ success: false, message: "This feature is only available for premium subscriptions." });
    }

    if (!image || !object) {
      return res.status(400).json({ success: false, message: "Image file and object name are required." });
    }

    const { public_id } = await cloudinary.uploader.upload(image.path);
    const imageUrl = cloudinary.url(public_id, {
      transformation: [{ effect: `gen_remove:${object}` }],
      resource_type: "image"
    });

    await sql`
      INSERT INTO creations(user_id, prompt, content, type)
      VALUES (${userId}, ${`Removed ${object} from image`}, ${imageUrl}, 'image')
    `;

    res.json({ success: true, content: imageUrl });
  } catch (error) {
    console.error("Error in removeImageObject:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};



// export const resumeReview = async (req, res) => {
//   try {
//     const { userId } = await req.auth();
//     const resume = req.file;

//     const plan = req.plan;
//     if (plan !== "premium") {
//       return res.json({ success: false, message: "This feature is only available for premium subscriptions." });
//     }

//     // ✅ Check API key exists
//     // if (!process.env.CLIPDROP_API_KEY) {
//     //   return res.status(500).json({ success: false, message: "Clipdrop API key not configured." });
//     // }

//     if(resume.size > 5 * 1024 *1024){
//       return res.json({success:false, message:"resume file size exceeds allowed size (5MB)."})
//     }

//     const dataBuffer = fs.readFileSync(resume.path)
//     const pdfData = await pdf(dataBuffer)

//     const prompt = `Review the following resume and provide constructive feedback on its strengths, weaknesses, and areas for improvement. Resume Content:\n\n${pdfData.text}`

//      const response = await AI.chat.completions.create({
//       model: "gemini-2.0-flash",
//       messages: [
//         {
//           role: "user",
//           content: prompt,
//         },
//       ],
//       temperature: 0.7,
//       max_tokens: 1000,
//     });

//     const content = response.choices[0]?.message?.content || "No content generated.";

//     // Save to DB
//     await sql`
//       INSERT INTO creations(user_id, prompt, content, type)
//       VALUES (${userId}, "Review the uploaded resume", ${content}, 'resume-review')
//     `;

//     res.json({ success: true, content});

//   } catch (error) {
//     console.error("Error in resumeReview:", error.message);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };



// resumeReview in aiController.js
export const resumeReview = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const resume = req.file;

    if (!resume) {
      return res.status(400).json({ success: false, message: "No resume uploaded." });
    }

    const plan = req.plan;
    if (plan !== "premium") {
      return res.json({ success: false, message: "This feature is only available for premium subscriptions." });
    }

    if (resume.size > 5 * 1024 * 1024) {
      return res.json({ success: false, message: "Resume file size exceeds 5MB." });
    }

    const dataBuffer = fs.readFileSync(resume.path);
    const pdfData = await pdf(dataBuffer);

    const prompt = `Review the following resume and provide constructive feedback on its strengths, weaknesses, and areas for improvement.\n\n${pdfData.text}`;

    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content || "No content generated.";

    await sql`
      INSERT INTO creations(user_id, prompt, content, type)
      VALUES (${userId}, 'Review the uploaded resume', ${content}, 'resume-review')
    `;

    res.json({ success: true, content });
  } catch (error) {
    console.error("Error in resumeReview:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
