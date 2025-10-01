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
      name: serviceName,
      description: `User complained about: ${problemDescription}`,
    });
    await newService.save();

    return {
      success: true,
      message: `Complaint about ${serviceName} has been filed successfully. Your reference number is ${newService._id}.`,
      referenceId: newService._id,
    };
  } catch (error) {
    console.error('Error in complainService tool:', error);
    return {
      success: false,
      message: `An error occurred while filing the complaint. Please try again.`,
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
        description: "The name of the service the user is complaining about (e.g., 'electricity', 'water').",
      },
      problemDescription: {
        type: "string",
        description: "A detailed description of the problem.",
      },
    },
    required: ["serviceName", "problemDescription"],
  },
};

module.exports = { complainService, complainServiceToolDefinition };