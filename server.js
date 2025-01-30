import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promises as fs } from 'fs';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files from public directory

// Explicitly serve the parameters directory
app.use('/parameters', express.static(join(__dirname, 'public', 'parameters')));

// Add an endpoint to list available parameter files (helpful for debugging)
app.get('/listParameters', async (req, res) => {
  try {
    const parametersDir = join(__dirname, 'public', 'parameters');
    const files = await fs.readdir(parametersDir);
    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list parameters' });
  }
});

// Single endpoint for saving parameters
app.post('/saveParameters', async (req, res) => {
  try {
    const { fileName, data } = req.body;
    const parametersDir = join(__dirname, 'public', 'parameters');
    
    console.log('Saving parameters:', {
      directory: parametersDir,
      fileName,
      data
    });

    // Create parameters directory if needed
    await fs.mkdir(parametersDir, { recursive: true });

    const filePath = join(parametersDir, fileName);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));

    console.log('Parameters saved successfully to:', filePath);
    res.json({ message: 'Parameters saved successfully' });
  } catch (error) {
    console.error('Error saving parameters:', error);
    res.status(500).json({ message: 'Failed to save parameters' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
