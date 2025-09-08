import { ProcessClientRequest, ProcessClientResponse } from '@/types/sales';

const API_ENDPOINT = 'https://pristinepro.app.n8n.cloud/webhook/447595ea-ce51-4eb6-ae2b-c4993a381dc5';

export const processClient = async (payload: ProcessClientRequest): Promise<ProcessClientResponse> => {
  try {
    console.log('processClient called with:', payload);
    const requestBody = payload;
    console.log('Request body to be sent:', requestBody);
    
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error processing client:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};