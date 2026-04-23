import Alert from '../models/Alert.js';

export const getAlerts = async (req, res) => {
    try {
        const { patientId, severity, limit = 50 } = req.query;
        const query = {};

        if (patientId) query.patientId = patientId;
        if (severity) query.severity = severity;

        const alerts = await Alert.find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit));

        res.json(alerts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const createAlert = async (req, res) => {
    try {
        const newAlert = new Alert(req.body);
        await newAlert.save();
        res.status(201).json(newAlert);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

export const getRecentAlerts = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const alerts = await Alert.find()
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .populate('patientId', 'name');
        res.json(alerts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
