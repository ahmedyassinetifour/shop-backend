import 'dotenv/config';
import { connectDatabase } from './config/database.js';
import app from './app.js';

const port = Number(process.env.PORT || 3000);

try {
  await connectDatabase();
  app.listen(port, () => console.log(`Fanuna API listening on http://localhost:${port}`));
} catch (error) {
  console.error('Could not start API:', error.message);
  process.exit(1);
}
