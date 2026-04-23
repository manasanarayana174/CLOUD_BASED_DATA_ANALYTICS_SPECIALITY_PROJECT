import Patient from '../models/Patient.js';
import { generateAIResponse } from '../ai/engine.js';

export const chatWithAI = async (req, res) => {
    const { query, patientId } = req.body;

    try {
        let context = null;
        if (patientId) {
            context = await Patient.findById(patientId)
                .populate('activeMedications');
        }

        // Simulate "Processing" time for realism
        setTimeout(async () => {
            const response = await generateAIResponse(query, context);
            res.json({ answer: response });
        }, 500);

    } catch (err) {
        res.status(500).json({ message: 'AI Engine Error' });
    }
};
