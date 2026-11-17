import 'dotenv/config';
import app from './app.js';

const port = Number(process.env.PORT || 3005);

app.listen(port, () => {
  console.log(`SMB API listening on http://localhost:${port}`);
});
