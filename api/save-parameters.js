
const fs = require('fs').promises;
const path = require('path');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const parameters = req.body;
    const filePath = path.join(process.cwd(), 'public', 'parameters.json');
    
    await fs.writeFile(filePath, JSON.stringify(parameters, null, 2));
    
    res.status(200).json({ message: 'Parameters saved successfully' });
  } catch (error) {
    console.error('Error saving parameters:', error);
    res.status(500).json({ message: 'Failed to save parameters' });
  }
}