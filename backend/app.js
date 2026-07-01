const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const routes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const { handleMulterError } = require('./middleware/upload');
const { clientUrl, nodeEnv } = require('./config/env');

const app = express();

app.set('trust proxy', 1);

app.use(helmet());

app.use(
  cors({
    origin: clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: nodeEnv === 'production' ? 100 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});

app.use('/api', limiter);

if (nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    maxAge: nodeEnv === 'production' ? '1d' : 0,
  })
);

app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Book a Doctor API',
    version: '1.0.0',
    docs: '/api/health',
  });
});

app.use(notFound);
app.use(handleMulterError);
app.use(errorHandler);

module.exports = app;
