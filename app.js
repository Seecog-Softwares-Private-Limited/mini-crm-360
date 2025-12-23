// app.js
import cors from 'cors';
import express from 'express';
import cookieParser from 'cookie-parser';
import { engine } from 'express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupSwagger } from './swagger.js';
import { verifyUser } from './middleware/authMiddleware.js';
import { renderDashboard } from "./controllers/dashboard.controller.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Avoid favicon spam
app.get('/favicon.ico', (req, res) => res.status(204).end());

// ---------- Handlebars ----------
app.engine(
    'hbs',
    engine({
        extname: '.hbs',
        defaultLayout: 'main',
        layoutsDir: path.join(__dirname, 'views/layouts'),
        partialsDir: path.join(__dirname, 'views/partials'),
        helpers: {
            // used in tables
            inc(value) {
                if (typeof value === 'string') value = parseInt(value, 10);
                if (Number.isNaN(value)) value = 0;
                return value + 1;
            },
            // safe JSON for inline JS
            json(context) {
                const json = JSON.stringify(context || []);
                // escape so we can embed inside single quotes and then JSON.parse()
                return json
                    .replace(/\\/g, '\\\\')
                    .replace(/'/g, "\\'")
                    .replace(/\n/g, '\\n')
                    .replace(/\r/g, '\\r')
                    .replace(/\u2028/g, '\\u2028')
                    .replace(/\u2029/g, '\\u2029');
            },
            eq: (a, b) => a === b,
        },
        runtimeOptions: {
            allowProtoPropertiesByDefault: true,
            allowProtoMethodsByDefault: true,
        },
    })
);

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// ---------- Middleware ----------
// Middleware to pass environment variables to all views
app.use((req, res, next) => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const port = process.env.PORT || 3002;
  
  // Make environment variables available to all views
  res.locals.nodeEnv = nodeEnv;
  res.locals.port = port;
  res.locals.apiBase = (nodeEnv === 'prod' || nodeEnv === 'production') 
    ? `https://petserviceinhome.com:${port}/api/v1`
    : `http://localhost:${port}/api/v1`;
  next();
});
app.use(
    cors({
        origin: [
            'https://petserviceinhome.com:3002',
            'http://localhost:5173',
            'https://bulk-whatsapp-manager-backend.onrender.com',
        ],
        credentials: true,
    })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Debug log
app.use((req, res, next) => {
    console.log(`Received ${req.method} request with body:`, req.body);
    console.log(`Received ${req.method} request with params:`, req.params);
    next();
});

// ---------- Route imports ----------
import userRoutes from './routes/user.routes.js';
import authRoutes from './routes/auth.routes.js';
import { waRouter } from './routes/wa.routes.js';
import businessRouter from './routes/business.routes.js';
import { customerRouter } from './routes/customer.routes.js';
import { templateRouter } from './routes/template.routes.js';
import { campaignRouter } from './routes/campaign.routes.js';
import { testRouter } from './routes/test.routes.js';
import { departmentRouter } from './routes/department.routes.js';
import { servicesRouter } from './routes/services.routes.js';
import { designationsRoutes } from './routes/designations.routes.js';
import { leaveTypesRoutes } from './routes/leaveTypes.routes.js';
import { leaveRequestsRoutes } from './routes/leaveRequests.routes.js';
import employeeRoutes from './routes/employee.routes.js';
import documentRoutes from './routes/document.routes.js';
import documentTypesRoutes from './routes/documentTypes.routes.js';
import stateRoutes from './routes/state.routes.js';
import countryRoutes from './routes/country.routes.js';
import businessAddressRoutes from './routes/businessAddress.routes.js';
import emailTemplateRoutes from './routes/emailTemplate.routes.js';
import { renderEmailTemplatesPage } from './controllers/emailTemplate.controller.js';
import dashboardRoutes from "./routes/dashboard.routes.js";

// ---------- Frontend pages ----------
// Helper function to get API_BASE based on environment
const getApiBase = () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const port = process.env.PORT || 3002;
  
  if (nodeEnv === 'prod' || nodeEnv === 'production') {
    return `https://petserviceinhome.com:${port}/api/v1`;
  }
  return `http://localhost:${port}/api/v1`;
};

app.get('/', (req, res) => res.redirect('/login'));

app.get('/login', (req, res) => {
  res.render('login', { 
    title: 'Login',
    apiBase: getApiBase()
  });
});

app.get('/register', (req, res) => {
  res.render('register', { 
    title: 'Register',
    apiBase: getApiBase()
  });
});

app.get('/dashboard', verifyUser, renderDashboard);

app.get('/customers', verifyUser, (req, res) => {
  res.render('customers');
});


app.get('/business', verifyUser, (req, res) => {
    const user = { firstName: req.user.firstName, lastName: req.user.lastName };
    res.render('business', { title: 'Business', user, activePage: 'business' });
});

app.get('/templates', verifyUser, (req, res) => {
    const user = { firstName: req.user.firstName, lastName: req.user.lastName };
    res.render('templates', { title: 'Templates', user, activePage: 'templates' });
});

app.get('/campaigns', verifyUser, (req, res) => {
    const user = { firstName: req.user.firstName, lastName: req.user.lastName };
    res.render('campaigns', { title: 'Campaigns', user, activePage: 'campaigns' });
});

app.get('/documents', verifyUser, (req, res) => {
    const user = { firstName: req.user.firstName, lastName: req.user.lastName };
    res.render('documents', { title: 'documents', user, activePage: 'documents' });
});

app.get('/document-types', verifyUser, (req, res) => {
    const user = { firstName: req.user.firstName, lastName: req.user.lastName };
    res.render('documentTypes', { title: 'document-types', user, activePage: 'documentTypes' });
});

app.get('/employees', verifyUser, (req, res) => {
    const user = { firstName: req.user.firstName, lastName: req.user.lastName };
    res.render('employees', { title: 'employees', user, activePage: 'employees' });
});


app.get('/clear-storage', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Clearing Storage...</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .message { color: #28a745; font-size: 18px; }
      </style>
    </head>
    <body>
      <div class="message">Clearing localStorage and redirecting to login...</div>
      <script>
        localStorage.clear();
        sessionStorage.clear();
        setTimeout(() => {
          window.location.replace('/login');
        }, 1000);
      </script>
    </body>
    </html>
  `);
});

// Static
app.use(express.static('public'));
// Serve assets from src/assets
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// ---------- API routes ----------
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/business', businessRouter);

app.get('/api/v1/health', (req, res) =>
    res.json({ ok: true, message: 'hello world 2' })
);
app.get('/api/v1/hello', (req, res) => res.json({ message: 'Hello, world!' }));

setupSwagger(app);

app.use('/api/v1', waRouter);
app.use("/", dashboardRoutes)
app.use('/api/v1/customers', customerRouter);
app.use('/api/v1/templates', templateRouter);
app.use('/api/v1/campaigns', campaignRouter);
app.use('/api/v1', testRouter);

app.use('/api/v1/departments', departmentRouter);
app.use('/api/v1/services', servicesRouter);
app.use('/api/v1/designations', designationsRoutes);

app.use('/api/leave-types', leaveTypesRoutes);
app.use('/api/leave-requests', leaveRequestsRoutes);
app.use("/", dashboardRoutes);


// HR & Docs
app.use(employeeRoutes);
app.use(documentRoutes);
app.use(documentTypesRoutes);
app.use('/api/v1/countries', countryRoutes);
app.use('/api/v1/states', stateRoutes);
app.use('/api/v1/business-addresses', businessAddressRoutes);
app.get('/email-templates', verifyUser, renderEmailTemplatesPage);

// API routes under /api/v1/email-templates
app.use('/', emailTemplateRoutes);

export { app };
