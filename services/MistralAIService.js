// import axios from 'axios';
// import supabase from './supabaseService';

// class MistralAIService {
//   constructor() {
//     this.apiKey = "WuFeKROSquluZjidKtliZy5BecizJ7jw";
//     this.apiUrl = "https://api.mistral.ai/v1/chat/completions";
//   }

//   // Send a message to Mistral AI and get a response
//   async sendMessage(message, conversationHistory = []) {
//     try {
//       const headers = {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${this.apiKey}`,
//       };

//       // Format the conversation history for the Mistral API
//       const messages = [
//         ...conversationHistory,
//         { role: "user", content: message },
//       ];

//       const response = await axios.post(
//         this.apiUrl,
//         {
//           model: "mistral-small-latest", // Using the small model for faster responses
//           messages: messages,
//           temperature: 0.7,
//           max_tokens: 1024,
//         },
//         { headers }
//       );

//       return response.data.choices[0].message;
//     } catch (error) {
//       console.error("Error calling Mistral AI:", error);
//       throw error;
//     }
//   }

//   //   async processMessage(message, conversationHistory = []) {
//   //     try {
//   //       // Fetch all doctors from Supabase
//   //       const { data: doctors, error } = await supabase
//   //         .from("profiles")
//   //         .select("full_name, specialty")
//   //         .eq("user_type", "doctor");

//   //       if (error) {
//   //         console.error("Supabase error:", error);
//   //         return {
//   //           role: "assistant",
//   //           content: "Sorry, there was a problem fetching doctor data.",
//   //         };
//   //       }

//   //       // Format: Dr. XYZ -- (Specialty: fever)
//   //       const formattedDoctors = doctors
//   //         .map((doc) => `Dr. ${doc.full_name} -- (Specialty: ${doc.specialty})`)
//   //         .join("\n");

//   //     console.log("Doctor List:\n" + formattedDoctors);

//   //       // Build context prompt for Mistral AI
//   //       const systemPrompt = {
//   //         role: "system",
//   //         content: `You are a helpful assistant with access to this doctor database:\n\n${formattedDoctors}\n\nUse this information to suggest relevant doctors based on the user's health concern.`,
//   //       };

//   //       // Send to Mistral AI with the real user query
//   //       const response = await this.sendMessage(message, [systemPrompt]);

//   //       return response;
//   //     } catch (error) {
//   //       console.error("Error processing message:", error);
//   //       return {
//   //         role: "assistant",
//   //         content: "Something went wrong while processing your request.",
//   //       };
//   //     }
//   //   }

//   //   async processMessage(message, conversationHistory = []) {
//   //     try {
//   //       const { data: doctors, error } = await supabase
//   //         .from("profiles")
//   //         .select("full_name, specialty")
//   //         .eq("user_type", "doctor");

//   //       if (error) {
//   //         console.error("Supabase error:", error);
//   //         return {
//   //           role: "assistant",
//   //           content: "Sorry, there was a problem fetching doctor data.",
//   //         };
//   //       }

//   //       const formattedDoctors = doctors
//   //         .map((doc) => `Dr. ${doc.full_name} -- (Specialty: ${doc.specialty})`)
//   //         .join("\n");

//   //       const systemPrompt = {
//   //         role: "system",
//   //         content: `You are a helpful assistant with access to this doctor database:\n\n${formattedDoctors}\n\nUse this information to suggest relevant doctors based on the user's health concern.`,
//   //       };

//   //       const response = await this.sendMessage(message, [systemPrompt]);

//   //       // Optional: Filter or match doctors if needed from response.content
//   //     //   return {
//   //     //     responseMessage: response.content,
//   //     //     doctors: doctors, // structured doctor data
//   //     //   };
//   //       return {
//   //         content: response.content,
//   //         doctors: doctors || [],
//   //       };
//   //     } catch (error) {
//   //       console.error("Error processing message:", error);
//   //       return {
//   //         responseMessage: "Something went wrong while processing your request.",
//   //         doctors: [],
//   //       };
//   //     }
//   //   }

//   async processMessage(message, conversationHistory = []) {
//     try {
//       const { data: doctors, error } = await supabase
//         .from("profiles")
//         .select("full_name, specialty")
//         .eq("user_type", "doctor");

//       if (error) {
//         console.error("Supabase error:", error);
//         return { content: "Error fetching doctors", doctors: [] };
//       }

//       const formattedDoctors = doctors
//         .map((doc) => `Dr. ${doc.full_name} -- (Specialty: ${doc.specialty})`)
//         .join("\n");

//       const systemPrompt = {
//         role: "system",
//         content: `You are a helpful assistant with access to this doctor database:\n\n${formattedDoctors}\n\nUse this information to suggest relevant doctors based on the user's health concern.`,
//       };

//       const response = await this.sendMessage(message, [systemPrompt]);
//       const responseText = response.content;

//       // Match recommended doctors
//     //   const matchedDoctors = doctors.filter((doc) =>
//     //     responseText.includes(`Dr. ${doc.full_name}`)
//     //   );

//       const matchedDoctors = doctors.filter((doc) => {
//         const regex = new RegExp(`Dr\\.\\s*${doc.full_name}`, "i");
//         return regex.test(responseText);
//       });



//       // Only consider it a doctor recommendation if the message includes keywords
//       const isDoctorRecommendation =
//         responseText.toLowerCase().includes("suggest") ||
//         responseText.toLowerCase().includes("recommend") ||
//         responseText.toLowerCase().includes("consult");

//       return {
//         content: !isDoctorRecommendation ? responseText : null,
//         doctors: isDoctorRecommendation ? matchedDoctors : [],
//       };


//       return {
//         content: matchedDoctors.length > 0 ? null : responseText,
//         doctors: matchedDoctors,
//       };
//     } catch (error) {
//       console.error("Error processing message:", error);
//       return {
//         content: "Something went wrong while processing your request.",
//         doctors: [],
//       };
//     }
//   }

//   formatDoctorResponse(doctors) {
//     let response = {
//       role: "assistant",
//       content: "Here are some doctors who can help you:\n\n",
//     };

//     doctors.forEach((doctor) => {
//       response.content += `- Dr. ${doctor.full_name} (${doctor.specialty})\n`;
//     });

//     response.content += "\nYou can book an appointment through our app.";
//     return response;
//   }

//   // Format doctor information for display
//   formatDoctorInfo(doctors, specialties) {
//     if (doctors.length === 0) return "";

//     let result = "**Here are some doctors who might help you:**\n\n";

//     doctors.forEach((doctor) => {
//       result += `- **Dr. ${doctor.full_name}** - ${
//         doctor.specialty || "General Practitioner"
//       }\n`;
//     });

//     result +=
//       "\nYou can book an appointment with any of these doctors through our app.";

//     return result;
//   }
// }

// export default new MistralAIService();



import axios from "axios";
import supabase from "./supabaseService";

class MistralAIService {
  constructor() {
    this.apiKey = "WuFeKROSquluZjidKtliZy5BecizJ7jw";
    this.apiUrl = "https://api.mistral.ai/v1/chat/completions";
  }

  // Send a message to Mistral AI and get a response
  async sendMessage(message, conversationHistory = []) {
    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      };

      // Format the conversation history for the Mistral API
      const messages = [
        ...conversationHistory,
        { role: "user", content: message },
      ];

      const response = await axios.post(
        this.apiUrl,
        {
          model: "mistral-small-latest", // Using the small model for faster responses
          messages: messages,
          temperature: 0.7,
          max_tokens: 1024,
        },
        { headers }
      );

      return response.data.choices[0].message;
    } catch (error) {
      console.error("Error calling Mistral AI:", error);
      throw error;
    }
  }

  async processMessage(message, conversationHistory = []) {
    try {
      // Simple keyword detection for medical queries
      const doctorKeywords = [
        "fever",
        "diabetes",
        "cardiology",
        "pain",
        "injury",
        "cancer",
        "doctor",
        "specialist",
      ];
      const generalHealthKeywords = [
        "skin",
        "care",
        "diet",
        "exercise",
        "fitness",
        "sleep",
        "healthy",
        "remedy",
        "medicine",
      ];

      const lowerMsg = message.toLowerCase();
      const isDoctorQuery = doctorKeywords.some((kw) => lowerMsg.includes(kw));
      const isGeneralHealthQuery = generalHealthKeywords.some((kw) =>
        lowerMsg.includes(kw)
      );

      let systemPrompt;

      if (isDoctorQuery) {
        // Fetch all doctors from Supabase
        const { data: doctors, error } = await supabase
          .from("profiles")
          .select("full_name, specialty")
          .eq("user_type", "doctor");

        if (error) {
          console.error("Supabase error:", error);
          return {
            role: "assistant",
            content: "Sorry, there was a problem fetching doctor data.",
          };
        }

        const formattedDoctors = doctors
          .map((doc) => `Dr. ${doc.full_name} -- (Specialty: ${doc.specialty})`)
          .join("\n");

        systemPrompt = {
          role: "system",
          content: `You are a helpful assistant with access to this doctor database:\n\n${formattedDoctors}\n\nUse this information to suggest relevant doctors based on the user's health concern.`,
        };
      } else if (isGeneralHealthQuery) {
        systemPrompt = {
          role: "system",
          content: `You are a friendly and knowledgeable health assistant. You can provide general health advice, home remedies, wellness tips, and over-the-counter medicine suggestions. You are **not** a licensed doctor, so do not diagnose or prescribe anything.`,
        };
      } else {
        systemPrompt = {
          role: "system",
          content: `You are a helpful conversational assistant. Respond to the user's message in a helpful and friendly way. If their query is health-related and seems serious, suggest consulting a medical professional.`,
        };
      }

      const response = await this.sendMessage(message, [systemPrompt]);

      return response;
    } catch (error) {
      console.error("Error processing message:", error);
      return {
        role: "assistant",
        content: "Something went wrong while processing your request.",
      };
    }
  }

  formatDoctorResponse(doctors) {
    let response = {
      role: "assistant",
      content: "Here are some doctors who can help you:\n\n",
    };

    doctors.forEach((doctor) => {
      response.content += `- Dr. ${doctor.full_name} (${doctor.specialty})\n`;
    });

    response.content += "\nYou can book an appointment through our app.";
    return response;
  }

  // Format doctor information for display
  formatDoctorInfo(doctors, specialties) {
    if (doctors.length === 0) return "";

    let result = "**Here are some doctors who might help you:**\n\n";

    doctors.forEach((doctor) => {
      result += `- **Dr. ${doctor.full_name}** - ${
        doctor.specialty || "General Practitioner"
      }\n`;
    });

    result +=
      "\nYou can book an appointment with any of these doctors through our app.";

    return result;
  }
}

export default new MistralAIService();