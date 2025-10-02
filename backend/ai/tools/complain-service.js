// backend/ai/tools/complain-service.js
const Service = require('../../models/Service');

async function complainService(args) {
  try {
    const { serviceName, problemDescription } = args;

    if (!serviceName || !problemDescription) {
      return {
        success: false,
        message: 'Both serviceName and problemDescription are required to file a complaint.',
      };
    }

    const newService = new Service({
      // Use the serviceName for the name field
      name: `Complaint: ${serviceName}`, 
      description: `User complained about: ${problemDescription}`,
      // ADDED: Default keywords to satisfy the model requirement and add context
      keywords: ["complaint", "filed", serviceName.toLowerCase()], 
      // ADDED: A default response, although the AI should overwrite this with its final response, 
      // it satisfies the Mongoose schema requirement.
      response: `Complaint regarding ${serviceName} received and logged.`, 
    });
    
    // Save the complaint as a new service entry
    await newService.save();

    // The tool returns a simple status, which the Gemini model uses to formulate the final, 
    // user-friendly response in Hindi.
    return {
      success: true,
      message: `Complaint about ${serviceName} has been filed successfully. The problem description saved is: "${problemDescription}".`,
      referenceId: newService._id,
    };
  } catch (error) {
    console.error('Error in complainService tool:', error);
    return {
      success: false,
      message: `An error occurred while filing the complaint. Error details: ${error.message}`,
    };
  }
}

// Tool definition for the AI
const complainServiceToolDefinition = {
  name: "complainService",
  description: "Files a service complaint on behalf of the user.",
  parameters: {
    type: "object",
    properties: {
      serviceName: {
        type: "string",
        description: "The name of the service the user is complaining about (e.g., 'electricity', 'water', 'medical').",
      },
      problemDescription: {
        type: "string",
        description: "A detailed description of the problem provided by the user.",
      },
    },
    required: ["serviceName", "problemDescription"],
  },
};

module.exports = { complainService, complainServiceToolDefinition };