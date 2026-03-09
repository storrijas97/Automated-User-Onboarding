require('dotenv').config();
const app = require('./app');
const { startPoller } = require('./scheduler/poller');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`[Server] IT Lifecycle API running on port ${PORT}`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  startPoller();
});
