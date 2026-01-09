const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdf = require('pdf-parse');
const { analyzeResume } = require('./services/aiService');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configure Multer for PDF Uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// API Endpoint
app.post('/api/analyze', upload.single('cvFile'), async (req, res) => {
    try {
        let cvText = req.body.cvText;
        const jobDescription = req.body.jobDescription;

        // Handle File Upload
        if (req.file) {
            try {
                const pdfData = await pdf(req.file.buffer);
                cvText = pdfData.text;
            } catch (err) {
                console.error("PDF Parsing Error:", err);
                return res.status(400).json({ error: "Failed to read PDF file." });
            }
        }

        if (!cvText || !jobDescription) {
            return res.status(400).json({ error: "CV (File or Text) and Job Description are required." });
        }

        if (!process.env.OPENROUTER_API_KEY) {
            return res.status(500).json({ error: "Server Configuration Error: API Key missing." });
        }


        const analysisResult = await analyzeResume(cvText, jobDescription);
        res.json(analysisResult);

    } catch (error) {
        console.error("Analysis Error:", error);
        res.status(500).json({ error: "Failed to analyze resume. Please try again." });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
