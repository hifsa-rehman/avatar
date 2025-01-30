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

app.post('/saveParameters', async (req, res) => {
  try {
    const { fileName, data } = req.body;
    const parametersDir = join(__dirname, 'public', 'parameters');

    // Ensure parameters directory exists
    try {
      await fs.access(parametersDir);
    } catch {
      await fs.mkdir(parametersDir, { recursive: true });
    }

    const filePath = join(parametersDir, fileName);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));

    res.json({ message: 'Parameters saved successfully' });
  } catch (error) {
    console.error('Error saving parameters:', error);
    res.status(500).json({ message: 'Failed to save parameters' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
