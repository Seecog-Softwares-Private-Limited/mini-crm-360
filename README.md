# Mini CRM Tool

> **Powerful All-in-One CRM Solution For Your Business Growth**

A comprehensive, full-stack Customer Relationship Management (CRM) system built with Node.js and Express.js. Mini CRM Tool helps businesses manage customers, run marketing campaigns, track tasks, generate invoices, and streamline operations from a single unified platform.

## 🚀 Features

### Core CRM Features
- **Customer Management**: Comprehensive customer database with advanced search, filtering, and segmentation
- **Business Management**: Multi-business support with business profiles and settings
- **Dashboard**: Real-time analytics and insights with key metrics
- **Profile Management**: User profiles with avatar upload, security settings, and activity logs

### Marketing & Communication
- **WhatsApp Campaigns**: Bulk messaging via Meta WhatsApp Cloud API with template support
- **Email Campaigns**: Email marketing campaigns with template management
- **Lead Capture Forms**: Customizable forms with multiple field types and public URLs
- **Message Templates**: Create and manage reusable message templates

### Task & Project Management
- **Task Management**: Create, assign, and track tasks with priorities and due dates
- **Notes & Timeline**: Detailed notes with activity timeline for complete interaction history
- **Reminders**: Birthday and anniversary tracking with automated notifications

### HR & Employee Management
- **Employee Management**: Complete employee database with profiles
- **Department & Designation**: Organizational structure management
- **Leave Management**: Leave types and leave request tracking
- **Document Generation**: Generate professional documents (offer letters, salary slips, etc.)

### Billing & Subscription
- **Plans Management**: Multiple subscription plans (Free, Silver, Gold, Enterprise)
- **Payment Integration**: Razorpay payment gateway integration
- **Billing Management**: Subscription management and billing history
- **Admin Panel**: Admin interface for managing plans, features, and menu items

### Additional Features
- **Email Activation**: Account activation via email verification
- **Password Reset**: Secure password reset functionality
- **Social Login**: Google OAuth integration
- **Session Management**: Active session tracking and management
- **Activity Logs**: Comprehensive activity logging and audit trail
- **Menu Management**: Dynamic menu system with plan-based feature locking

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js 5.x
- **Database**: MySQL 8.0+ with Sequelize ORM
- **Authentication**: JWT (JSON Web Tokens) with refresh tokens
- **Templating**: Handlebars.js (Express Handlebars)
- **File Upload**: Multer
- **Email**: Nodemailer
- **PDF Generation**: PDFKit, Puppeteer
- **Payment Gateway**: Razorpay

### Frontend
- **Templating**: Handlebars.js
- **CSS Framework**: Bootstrap 5
- **Icons**: Font Awesome 6
- **JavaScript**: Vanilla ES6+
- **Image Processing**: Cropper.js (for avatar cropping)

### Integrations
- **WhatsApp**: Meta WhatsApp Cloud API (Graph API v20.0)
- **Email**: SMTP (Gmail/Mailtrap)
- **Payment**: Razorpay
- **Social Auth**: Google OAuth 2.0

### Development Tools
- **API Documentation**: Swagger UI
- **Environment Management**: dotenv, cross-env
- **Process Manager**: nodemon
- **CSV Processing**: csv-parser

## 📋 Prerequisites

- **Node.js**: v14 or higher (ES Modules support required)
- **MySQL**: v8.0 or higher
- **npm** or **yarn**: Package manager
- **WhatsApp Business Account**: For WhatsApp Cloud API (optional)
- **Razorpay Account**: For payment processing (optional)
- **Gmail Account**: For email services (optional)

## 🔧 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd mini-crm-360
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup

Create MySQL database:
```sql
CREATE DATABASE saas_whatsapp_manager;
```

### 4. Environment Configuration

Create `property.env` file in the root directory:

```env
# Environment Configuration
NODE_ENV=development

# Database Configuration - Development/Stage
DB_HOST_STAGE=localhost
DB_PORT_STAGE=3306
DB_NAME_STAGE=saas_whatsapp_manager
DB_USER_STAGE=root
DB_PASSWORD_STAGE=your_password

# Database Configuration - Production
DB_HOST_PROD=your_production_host
DB_PORT_PROD=3306
DB_NAME_PROD=saas_whatsapp_manager
DB_USER_PROD=your_production_user
DB_PASSWORD_PROD=your_production_password

# Server Configuration
PORT=3002
PRODUCTION_URL=https://yourdomain.com
DEVELOPMENT_URL=http://localhost:3002

# JWT Configuration
JWT_ACCESS_SECRET=your_access_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
ACCESS_TOKEN_TTL=1d
REFRESH_TOKEN_TTL=7d

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM="Your Name <your_email@gmail.com>"

# WhatsApp Cloud API Configuration (Optional)
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_GRAPH_VERSION=v20.0
WA_PHONE_NUMBER_ID=your_phone_number_id
WABA_ID=your_waba_id
WHATSAPP_TOKEN=your_whatsapp_token
WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token
APP_URL=https://yourdomain.com

# Razorpay Configuration (Optional)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Token Encryption
TOKEN_ENC_SECRET=your_32_byte_base64_encryption_key

# Database Behavior
CREATE_DB_IF_MISSING=false
SYNC_DB=false
```

### 5. Run Database Migrations

Run the following migration scripts in order:

```bash
# Profile fields
npm run migrate:all-profile-columns

# Activation fields
npm run migrate:activation-fields

# Plans and billing
npm run migrate:plans
npm run migrate:yearly-price

# Menu items
npm run migrate:menu-items
npm run migrate:plan-menu-items

# Tasks and notes
npm run migrate:tasks
npm run migrate:notes

# Reminders
npm run migrate:reminders

# Lead forms
npm run migrate:lead-forms
npm run migrate:enhance-lead-forms

# Create admin user (optional)
npm run create-admin
```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

The server will start on `http://localhost:3002`

### Production Mode
```bash
npm start
```

## 📁 Project Structure

```
mini-crm-360/
├── src/
│   ├── app.js                 # Main Express application
│   ├── index.js              # Application entry point
│   ├── models/               # Sequelize models
│   │   ├── User.js
│   │   ├── Business.js
│   │   ├── Customer.js
│   │   ├── Campaign.js
│   │   ├── Plan.js
│   │   └── ...
│   ├── controllers/          # Route controllers
│   │   ├── user/
│   │   ├── business/
│   │   ├── customer.controllers.js
│   │   ├── dashboard.controller.js
│   │   └── ...
│   ├── routes/               # Express routes
│   │   ├── user.routes.js
│   │   ├── business.routes.js
│   │   ├── dashboard.routes.js
│   │   └── ...
│   ├── middleware/           # Express middleware
│   │   ├── authMiddleware.js
│   │   └── adminMiddleware.js
│   ├── views/                # Handlebars templates
│   │   ├── layouts/
│   │   ├── partials/
│   │   ├── dashboard.hbs
│   │   ├── login.hbs
│   │   └── ...
│   ├── db/                   # Database configuration
│   │   ├── index.js
│   │   └── migrations/
│   ├── utils/                # Utility functions
│   │   ├── token.util.js
│   │   ├── plan.util.js
│   │   ├── emailService.js
│   │   └── ...
│   ├── billing/              # Billing module
│   │   ├── providers/
│   │   ├── services/
│   │   └── ...
│   └── swagger.js            # Swagger configuration
├── public/                   # Static files
│   └── uploads/
│       └── avatars/
├── property.env             # Environment variables
├── package.json
└── README.md
```

## 🌐 API Endpoints

### Authentication
- `POST /api/v1/users/register` - Register new user
- `POST /api/v1/users/login` - User login
- `POST /api/v1/users/refresh` - Refresh access token
- `POST /api/v1/users/logout` - User logout
- `GET /api/v1/users/check-email` - Check if email exists
- `POST /api/v1/users/resend-activation` - Resend activation email
- `GET /activate/:token` - Activate account

### User Profile
- `GET /profile` - Profile page
- `GET /api/v1/profile` - Get user profile
- `PUT /api/v1/profile` - Update profile
- `POST /api/v1/profile/avatar` - Upload avatar
- `DELETE /api/v1/profile/avatar` - Remove avatar
- `POST /api/v1/profile/change-password` - Change password
- `GET /api/v1/profile/sessions` - Get active sessions
- `DELETE /api/v1/profile/sessions/:sessionId` - Logout session
- `GET /api/v1/profile/workspace` - Get workspace info
- `PUT /api/v1/profile/notifications` - Update notification preferences
- `GET /api/v1/profile/activity` - Get activity logs
- `GET /api/v1/profile/billing` - Get billing info

### Business Management
- `POST /api/v1/business/create-business` - Create business
- `GET /api/v1/business/get-my-business` - Get user's businesses
- `PATCH /api/v1/business/update-business/:id` - Update business
- `DELETE /api/v1/business/delete-business/:id` - Delete business

### Customer Management
- `POST /api/v1/customers` - Add/update customer
- `GET /api/v1/customers` - List customers
- `GET /customers` - Customers page

### Campaign Management
- `POST /api/v1/campaigns` - Create campaign
- `GET /api/v1/campaigns` - List campaigns
- `GET /campaigns` - Campaigns page

### Template Management
- `POST /api/v1/templates/meta` - Create Meta template
- `GET /api/v1/templates/meta` - List Meta templates
- `POST /api/v1/templates` - Save template locally
- `GET /api/v1/templates` - List local templates
- `GET /templates` - Templates page

### Task Management
- `GET /api/v1/tasks` - List tasks
- `POST /api/v1/tasks` - Create task
- `PUT /api/v1/tasks/:id` - Update task
- `DELETE /api/v1/tasks/:id` - Delete task
- `GET /tasks` - Tasks page

### Notes & Timeline
- `GET /api/v1/notes` - List notes
- `POST /api/v1/notes` - Create note
- `PUT /api/v1/notes/:id` - Update note
- `DELETE /api/v1/notes/:id` - Delete note
- `GET /notes` - Notes page

### Reminders
- `GET /api/v1/reminders` - List reminders
- `POST /api/v1/reminders` - Create reminder
- `GET /reminders` - Reminders page

### Lead Forms
- `GET /api/v1/lead-forms` - List lead forms
- `POST /api/v1/lead-forms` - Create lead form
- `PUT /api/v1/lead-forms/:id` - Update lead form
- `DELETE /api/v1/lead-forms/:id` - Delete lead form
- `GET /lead-forms` - Lead forms page
- `GET /form/:slug` - Public lead form

### Plans & Billing
- `GET /plans` - Plans page
- `GET /api/v1/plans` - Get all plans
- `POST /api/v1/payment/create-order` - Create payment order
- `POST /api/v1/payment/verify` - Verify payment

### Admin Panel
- `GET /admin` - Admin panel
- `GET /api/v1/admin/plans` - Get all plans (admin)
- `POST /api/v1/admin/plans` - Create plan
- `PUT /api/v1/admin/plans/:id` - Update plan
- `DELETE /api/v1/admin/plans/:id` - Delete plan
- `GET /api/v1/admin/menu-items` - Get menu items
- `PUT /api/v1/admin/menu-items/:menuItemId/plan/:planId/lock` - Toggle menu item lock

### WhatsApp Webhook
- `GET /api/v1/webhook` - Webhook verification
- `POST /api/v1/webhook` - Receive webhook events

### Health Check
- `GET /api/v1/health` - Health check endpoint

## 🗄️ Database Schema

### Core Tables
- `users` - User accounts and authentication
- `businesses` - Business profiles
- `customers` - Customer contacts
- `campaigns` - Marketing campaigns
- `templates` - Message templates
- `message_logs` - Message delivery logs

### CRM Features
- `tasks` - Task management
- `notes` - Notes and timeline
- `lead_forms` - Lead capture forms
- `form_submissions` - Form submissions

### Billing & Plans
- `plans` - Subscription plans
- `user_plans` - User plan assignments
- `menu_items` - Dynamic menu items
- `plan_menu_items` - Plan-menu item relationships

### HR Module
- `employees` - Employee records
- `departments` - Departments
- `designations` - Designations
- `services` - Services catalog
- `leave_types` - Leave types
- `leave_requests` - Leave requests
- `employee_documents` - Employee documents
- `employee_education` - Education records
- `employee_experience` - Experience records

### System Tables
- `user_sessions` - Active user sessions
- `activity_logs` - Activity audit trail
- `countries` - Country data
- `states` - State data
- `business_addresses` - Business addresses
- `email_templates` - Email templates
- `document_types` - Document types

## 🔐 Authentication & Security

- **JWT Authentication**: Access tokens (1 day) and refresh tokens (7 days)
- **Email Activation**: Account activation required before login
- **Password Hashing**: bcrypt with salt rounds
- **Session Management**: Track and manage active sessions
- **Password Reset**: Secure token-based password reset
- **Social Login**: Google OAuth 2.0 integration
- **Role-Based Access**: Admin and user roles
- **Plan-Based Features**: Feature access based on subscription plan

## 📊 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment (development/production) | Yes | development |
| `PORT` | Server port | No | 3002 |
| `DB_HOST_STAGE` | Development DB host | Yes | localhost |
| `DB_PORT_STAGE` | Development DB port | No | 3306 |
| `DB_NAME_STAGE` | Development DB name | Yes | saas_whatsapp_manager |
| `DB_USER_STAGE` | Development DB user | Yes | root |
| `DB_PASSWORD_STAGE` | Development DB password | Yes | - |
| `DB_HOST_PROD` | Production DB host | Yes (prod) | - |
| `DB_NAME_PROD` | Production DB name | Yes (prod) | - |
| `DB_USER_PROD` | Production DB user | Yes (prod) | - |
| `DB_PASSWORD_PROD` | Production DB password | Yes (prod) | - |
| `JWT_ACCESS_SECRET` | JWT access token secret | Yes | - |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | Yes | - |
| `SMTP_HOST` | SMTP server host | Yes | - |
| `SMTP_USER` | SMTP username | Yes | - |
| `SMTP_PASS` | SMTP password | Yes | - |
| `WHATSAPP_TOKEN` | WhatsApp Cloud API token | No | - |
| `RAZORPAY_KEY_ID` | Razorpay key ID | No | - |
| `RAZORPAY_KEY_SECRET` | Razorpay key secret | No | - |

## 🎨 Frontend Pages

- `/` - Landing page
- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - Main dashboard
- `/profile` - User profile settings
- `/customers` - Customer management
- `/business` - Business management
- `/campaigns` - Campaign management
- `/templates` - Template management
- `/tasks` - Task management
- `/notes` - Notes and timeline
- `/reminders` - Reminders
- `/lead-forms` - Lead forms management
- `/plans` - Subscription plans
- `/admin` - Admin panel
- `/employees` - Employee management
- `/documents` - Document generation
- `/email-templates` - Email templates

## 📚 API Documentation

Swagger UI is available at:
```
http://localhost:3002/api-docs
```

## 🧪 Testing

### Health Check
```bash
curl http://localhost:3002/api/v1/health
```

### Test Endpoints
- `GET /api/v1/hello` - Hello world endpoint
- `GET /api/v1/test/*` - Various test endpoints

## 🔄 Database Migrations

The project uses custom migration scripts. Run migrations in this order:

1. Profile fields: `npm run migrate:all-profile-columns`
2. Activation: `npm run migrate:activation-fields`
3. Plans: `npm run migrate:plans`
4. Menu items: `npm run migrate:menu-items`
5. Tasks: `npm run migrate:tasks`
6. Notes: `npm run migrate:notes`
7. Reminders: `npm run migrate:reminders`
8. Lead forms: `npm run migrate:lead-forms`

## 🚀 Deployment

### Production Checklist

1. Set `NODE_ENV=production` in `property.env`
2. Configure production database credentials
3. Set production URLs (`PRODUCTION_URL`)
4. Configure SMTP for production email
5. Set secure JWT secrets
6. Configure Razorpay production keys
7. Set up WhatsApp production credentials
8. Configure webhook URLs
9. Set up SSL/HTTPS
10. Configure CORS for production domain

### Environment-Specific Configuration

The application automatically selects database configuration based on `NODE_ENV`:
- **Development**: Uses `*_STAGE` variables
- **Production**: Uses `*_PROD` variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

ISC License

## 👥 Authors

- **Nilesh Kumar** - Initial work

## 🙏 Acknowledgments

- Express.js community
- Sequelize ORM
- Meta WhatsApp Cloud API
- Razorpay
- Bootstrap & Font Awesome

## 📞 Support

For support, email support@minicrmtool.com or create an issue in the repository.

---

**Built with ❤️ using Node.js, Express.js, and MySQL**
