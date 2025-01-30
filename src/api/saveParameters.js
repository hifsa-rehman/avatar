import fs from 'fs/promises';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { fileName, data } = req.body;
    const parametersDir = path.join(process.cwd(), 'public', 'parameters');

    // Ensure parameters directory exists
    try {
      await fs.access(parametersDir);
    } catch {
      await fs.mkdir(parametersDir, { recursive: true });
    }

    const filePath = path.join(parametersDir, fileName);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));

    res.status(200).json({ message: 'Parameters saved successfully' });
  } catch (error) {
    console.error('Error saving parameters:', error);
    res.status(500).json({ message: 'Failed to save parameters' });
  }
}
