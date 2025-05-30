import axios from 'axios'; // Import axios

interface AgentRequest {
    conversationId: string
    sprintId: string
    boardId : string
    sprintName: string
    sprintKey: string
}

class AgentService {

    public async sendMessage(data:AgentRequest): Promise<any> { // Added a return type, adjust as needed
        const baseUrl = process.env.AgentURL;

        if (!baseUrl) {
            console.error('Error: AgentURL environment variable is not set.');
            throw new Error('AgentURL environment variable is not set.');
        }

        const url = `${baseUrl}/message`;
        console.log(`Sending GET request to: ${url}`); // Optional: for logging

        try {
            const response = await axios.get(url,{data:data});
            // You can access response data, status, headers etc. from the 'response' object
            // For example, to return the data part of the response:
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                // Handle Axios-specific errors
            } else {
                // Handle non-Axios errors
                console.error('An unexpected error occurred:', error);
            }
            // Re-throw the error or handle it as per your application's needs
            throw error;
        }
    }
}
