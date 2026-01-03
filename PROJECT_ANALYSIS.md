# Mini CRM Tool - Deep Project Analysis

## 📋 Executive Summary

**Mini CRM Tool** is a comprehensive, full-stack Customer Relationship Management (CRM) system built with Node.js and Express.js. It provides businesses with a unified platform to manage customers, run marketing campaigns, track tasks, generate invoices, and streamline operations.

---

## 🏗️ Project Architecture

### Technology Stack

#### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js 5.x
- **Database**: MySQL 8.0+ with Sequelize ORM
- **Authentication**: JWT (JSON Web Tokens) with refresh tokens
- **Templating**: Handlebars.js (Express Handlebars)
- **File Upload**: Multer
- **Email**: Nodemailer
- **PDF Generation**: PDFKit, Puppeteer
- **Payment Gateway**: Razorpay
- **Job Queue**: BullMQ + Redis (for social media scheduling)

#### Frontend
- **Templating**: Handlebars.js
- **CSS Framework**: Bootstrap 5
- **Icons**: Font Awesome 6
- **JavaScript**: Vanilla ES6+
- **Image Processing**: Cropper.js (for avatar cropping)
- **Date Picker**: Flatpickr
- **Animations**: HTML5 Canvas

#### Integrations
- **WhatsApp**: Meta WhatsApp Cloud API (Graph API v20.0)
- **Email**: SMTP (Gmail/Mailtrap)
- **Payment**: Razorpay
- **Social Auth**: Google OAuth 2.0
- **Social Media**: LinkedIn, Facebook, X (Twitter), Instagram (mock adapters)

---

## 📁 Project Structure

```
mini-crm-360/
├── src/
│   ├── controllers/          # Request handlers
│   │   ├── customer.controllers.js
│   │   ├── business/
│   │   ├── campaign.controllers.js
│   │   ├── dashboard.controller.js
│   │   ├── profile.controller.js
│   │   ├── socialPublisher.controller.js
│   │   └── ...
│   ├── models/               # Sequelize ORM models
│   │   ├── User.js
│   │   ├── Customer.js
│   │   ├── Business.js
│   │   ├── Campaign.js
│   │   ├── SocialAccount.js
│   │   ├── SocialPost.js
│   │   └── ...
│   ├── routes/               # Express routes
│   │   ├── customer.routes.js
│   │   ├── business.routes.js
│   │   ├── dashboard.routes.js
│   │   ├── socialPublisher.routes.js
│   │   └── ...
│   ├── services/             # Business logic layer
│   │   ├── socialPublisher.service.js
│   │   └── ...
│   ├── middleware/           # Express middleware
│   │   ├── authMiddleware.js
│   │   └── ...
│   ├── utils/                # Utility functions
│   │   ├── asyncHandler.js
│   │   ├── ApiError.js
│   │   ├── ApiResponse.js
│   │   ├── emailService.js
│   │   └── ...
│   ├── views/                # Handlebars templates
│   │   ├── layouts/
│   │   │   └── main.hbs
│   │   ├── partials/
│   │   │   └── sidebar.hbs
│   │   ├── customers.hbs
│   │   ├── business.hbs
│   │   ├── dashboard.hbs
│   │   ├── profile.hbs
│   │   ├── social-publisher.hbs
│   │   └── ...
│   ├── db/
│   │   ├── index.js          # Database connection
│   │   └── migrations/       # Database migrations
│   ├── workers/              # Background job workers
│   │   └── socialPublisher.worker.js
│   ├── providers/            # External service adapters
│   │   └── socialProviders.js
│   └── app.js                # Express app entry point
├── public/                   # Static assets
│   ├── uploads/
│   │   ├── avatars/
│   │   └── media/
│   └── images/
├── database/                 # Database dumps
├── property.env              # Environment variables
├── package.json
└── README.md
```

---

## 🎯 Core Features & Modules

### 1. Customer Management
- **CRUD Operations**: Create, read, update, delete customers
- **Bulk Upload**: CSV/Excel file import with validation
- **Advanced Search**: Filter by name, email, phone, tags, business
- **Segmentation**: Tag-based customer categorization
- **Contact Details**: Phone (E.164 format), WhatsApp, email
- **Customer Timeline**: Activity history and notes
- **Birthday & Anniversary Tracking**: Automated reminders

**Database Schema**:
- `id` (Primary Key)
- `userId` (Foreign Key → users)
- `businessId` (Foreign Key → businesses, nullable)
- `name` (String, nullable)
- `email` (String(120), nullable, validated)
- `phoneE164` (String, required, unique per user)
- `whatsappE164` (String(20), nullable)
- `tags` (JSON array, default: [])
- `consentAt` (DateTime, nullable)
- `dateOfBirth` (Date, nullable)
- `anniversaryDate` (Date, nullable)
- `createdAt`, `updatedAt` (Timestamps)

### 2. Business Management
- **Multi-Business Support**: Users can own multiple businesses
- **Business Profiles**: Name, category, description, contact info
- **Business Settings**: Country, timezone, phone numbers
- **Business Selection**: Switch between businesses in UI

**Database Schema**:
- `id` (Primary Key)
- `ownerId` (Foreign Key → users)
- `businessName` (String, required)
- `category` (String, required)
- `description` (Text, nullable)
- `phoneNo` (String, nullable)
- `whatsappNo` (String, nullable)
- `country` (String, required)
- `timezone` (String, nullable)
- `createdAt`, `updatedAt` (Timestamps)

### 3. Marketing & Campaigns
- **WhatsApp Campaigns**: Bulk messaging via Meta WhatsApp Cloud API
- **Email Campaigns**: Email marketing with template support
- **Template Management**: Create and manage reusable templates
- **Campaign Scheduling**: Schedule campaigns for future execution
- **Campaign Analytics**: Track sent, delivered, read, failed messages

### 4. Social Publisher (New Module)
- **Multi-Platform Publishing**: LinkedIn, Facebook, X (Twitter), Instagram
- **Content Scheduling**: Schedule posts for future publication
- **Media Management**: Upload and manage media assets
- **Template Library**: Pre-built templates for festivals and events
- **Account Management**: Connect and manage social media accounts
- **Publish Attempts**: Track publication attempts and retry failures
- **Audit Logging**: Complete audit trail of all actions

**Database Tables**:
- `social_accounts`: Connected social media accounts
- `social_posts`: Post content and metadata
- `social_post_channels`: Post-to-platform mappings
- `media_assets`: Uploaded media files
- `publish_attempts`: Publication attempt logs
- `social_templates`: Reusable post templates
- `social_audit_logs`: Audit trail

### 5. Task Management (Activities)
- **Task Creation**: Create tasks with priorities and due dates
- **Task Assignment**: Assign tasks to customers or users
- **Task Status**: Track task completion status
- **Task Filtering**: Filter by status, priority, assignee

### 6. Notes & Timeline (Activity Timeline)
- **Customer Notes**: Add notes to customer profiles
- **Activity Timeline**: Complete interaction history
- **Event Logging**: Automatic logging of system events
- **Note Types**: Email sent, WhatsApp sent, task created, etc.

### 7. Lead Capture Forms
- **Custom Forms**: Create customizable lead capture forms
- **Field Types**: Text, email, phone, dropdown, checkbox, etc.
- **Public URLs**: Generate public URLs for forms
- **Form Submissions**: Track and manage form submissions
- **Anti-Spam**: Built-in spam protection
- **UTM Tracking**: Track marketing campaigns

### 8. Profile & Account Settings
- **User Profile**: Update personal information
- **Avatar Management**: Upload and manage profile pictures
- **Password Management**: Change password with strength validation
- **Session Management**: View and manage active sessions
- **Notification Preferences**: Configure notification settings
- **Activity Logs**: View user activity history
- **Billing Info**: View subscription and billing information

### 9. Subscription & Billing
- **Plans Management**: Free, Silver, Gold, Enterprise plans
- **Plan Features**: Feature limits per plan
- **Payment Integration**: Razorpay payment gateway
- **Subscription Management**: Upgrade, downgrade, cancel
- **Billing History**: View payment history

### 10. Dashboard & Analytics
- **Key Metrics**: Customer count, business count, campaign stats
- **Recent Activity**: Latest customers, campaigns, tasks
- **Quick Actions**: Quick access to common actions
- **Real-time Updates**: Live data updates

---

## 🔐 Authentication & Security

### Authentication Flow
1. **Registration**: User registers with email and password
2. **Email Activation**: Account activation via email link
3. **Login**: JWT-based authentication with access and refresh tokens
4. **Token Refresh**: Automatic token refresh mechanism
5. **Session Management**: Track active sessions

### Security Features
- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Email Verification**: Account activation required
- **Password Reset**: Secure password reset via email
- **Session Tracking**: Monitor active sessions
- **CSRF Protection**: Built-in CSRF protection
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Protection**: Sequelize ORM parameterized queries

---

## 📊 Database Schema Overview

### Core Tables
- **users**: User accounts and authentication
- **businesses**: Business profiles
- **customers**: Customer database
- **campaigns**: Marketing campaigns
- **templates**: Message templates
- **email_templates**: Email templates
- **tasks**: Task management
- **notes**: Customer notes and timeline
- **reminders**: Birthday and anniversary reminders
- **lead_forms**: Lead capture forms
- **form_submissions**: Form submission data

### Subscription Tables
- **plans**: Subscription plans
- **user_plans**: User subscription history
- **payments**: Payment transactions

### Social Publisher Tables
- **social_accounts**: Connected social media accounts
- **social_posts**: Post content
- **social_post_channels**: Post-to-platform mappings
- **media_assets**: Media files
- **publish_attempts**: Publication logs
- **social_templates**: Post templates
- **social_audit_logs**: Audit trail

### System Tables
- **user_sessions**: Active user sessions
- **activity_logs**: System activity logs
- **menu_items**: Dynamic menu configuration
- **plan_menu_items**: Plan-based menu access

---

## 🔄 API Architecture

### API Response Format
All API responses follow a consistent format:
```json
{
  "statusCode": 200,
  "data": { ... },
  "message": "Success message"
}
```

### Error Response Format
```json
{
  "statusCode": 400,
  "error": "Error type",
  "message": "Error message",
  "details": { ... }
}
```

### Authentication
- **Header**: `Authorization: Bearer <access_token>`
- **Refresh**: `/api/v1/auth/refresh-token`
- **Logout**: `/api/v1/auth/logout`

---

## 📤 Bulk Upload Feature

### Supported Format
- **File Type**: CSV or Excel (.xlsx)
- **Max Size**: 10MB
- **Required Columns**: `name`, `phoneE164`
- **Optional Columns**: `email`, `whatsappE164`, `tags`, `consentAt`

### Column Specifications

#### Required Columns
1. **name** (String)
   - Customer full name
   - Example: "Rajesh Kumar"

2. **phoneE164** (String, 10 digits)
   - Phone number (10 digits)
   - Automatically converted to E.164 format (+91XXXXXXXXXX)
   - Example: "9876543210" → "+919876543210"

#### Optional Columns
3. **email** (String, validated)
   - Email address
   - Must be valid email format
   - Example: "rajesh.kumar@gmail.com"

4. **whatsappE164** (String, 10 digits)
   - WhatsApp number (10 digits)
   - Defaults to phoneE164 if not provided
   - Example: "9876543210"

5. **tags** (String, comma-separated)
   - Customer tags for segmentation
   - Example: "vip,regular,premium"
   - Common tags: vip, regular, premium, new, trial, loyal, frequent

6. **consentAt** (String, ISO date format)
   - Consent date in YYYY-MM-DD format
   - Example: "2024-01-15"

### Validation Rules
- Phone numbers must be exactly 10 digits
- Email addresses must be valid format
- Tags are comma-separated strings
- Consent dates must be valid ISO dates
- Duplicate phone numbers (per user) are skipped

### Processing Flow
1. File upload validation
2. CSV/Excel parsing
3. Column validation
4. Data validation (phone, email format)
5. E.164 format conversion
6. Business association (auto-assign to user's business)
7. Bulk insert with duplicate handling
8. Error reporting

---

## 📄 Sample Data File

### File Details
- **Filename**: `sample_customers_100.xlsx`
- **Format**: Microsoft Excel 2007+ (.xlsx)
- **Records**: 100 customers
- **Size**: ~9.6 KB

### Data Characteristics
- **Names**: Indian names (first + last)
- **Phone Numbers**: Valid 10-digit Indian mobile numbers
- **Emails**: Realistic email addresses with various domains
- **WhatsApp Numbers**: Mostly same as phone, some different
- **Tags**: Mix of vip, regular, premium, new, trial, loyal, frequent
- **Consent Dates**: Dates within the last 6 months

### Sample Data Preview
| name | phoneE164 | email | whatsappE164 | tags | consentAt |
|------|------------|-------|--------------|------|-----------|
| Raj Sharma | 9876543210 | raj.sharma@gmail.com | 9876543210 | vip,regular | 2024-10-15 |
| Priya Patel | 8765432109 | priya.patel@yahoo.com | 8765432109 | premium | 2024-11-20 |

### Usage Instructions
1. Open the Excel file (`sample_customers_100.xlsx`)
2. Review the data format
3. Navigate to Customers page in CRM
4. Click "Bulk Upload" button
5. Select the Excel file
6. Upload and wait for processing
7. Review success/error summary

### Data Generation Script
The file was generated using `generate_customer_sample.py`:
- Python script using pandas and openpyxl
- Generates realistic Indian customer data
- Ensures unique phone numbers
- Randomizes email domains and tags
- Generates consent dates within last 6 months

---

## 🚀 Deployment Considerations

### Environment Variables
- Database configuration (development/production)
- JWT secrets
- SMTP configuration
- Payment gateway credentials
- Social media API keys
- Redis configuration (for BullMQ)

### Database Migrations
- Run migrations before deployment
- Ensure all tables are created
- Seed initial data (plans, menu items, templates)

### File Storage
- Configure upload directories
- Set up media storage (local or cloud)
- Configure static file serving

### Background Workers
- Start BullMQ worker for scheduled jobs
- Configure Redis connection
- Monitor worker health

---

## 📈 Performance Considerations

### Database Optimization
- Indexes on frequently queried columns
- Foreign key constraints for data integrity
- Connection pooling
- Query optimization

### Caching Strategy
- Redis for session storage
- Cache frequently accessed data
- Cache menu items and plans

### File Upload Optimization
- File size limits
- File type validation
- Async processing for large files

---

## 🔍 Testing Recommendations

### Unit Tests
- Model validations
- Utility functions
- Service layer logic

### Integration Tests
- API endpoints
- Authentication flow
- File upload processing
- Bulk import functionality

### E2E Tests
- User registration and login
- Customer CRUD operations
- Campaign creation and execution
- Bulk upload workflow

### Test Data
- Use `sample_customers_100.xlsx` for bulk upload testing
- Create test users with different roles
- Test with various business configurations

---

## 📝 Future Enhancements

### Potential Features
- Mobile app (React Native)
- Advanced analytics dashboard
- AI-powered customer insights
- Automated email sequences
- SMS integration
- Advanced reporting
- Multi-language support
- White-label customization

---

## 📞 Support & Documentation

### Documentation Files
- `README.md`: Installation and setup guide
- `PROJECT_ANALYSIS.md`: This file (deep project analysis)
- `SOCIAL_PUBLISHER_COMPLETE.md`: Social Publisher module documentation

### Code Comments
- Controllers have detailed comments
- Services include function documentation
- Models have field descriptions

---

## ✅ Conclusion

Mini CRM Tool is a robust, feature-rich CRM system with:
- ✅ Comprehensive customer management
- ✅ Multi-channel marketing capabilities
- ✅ Task and activity tracking
- ✅ Subscription and billing management
- ✅ Social media publishing (new)
- ✅ Bulk data import functionality
- ✅ Secure authentication and authorization
- ✅ Scalable architecture

The sample data file (`sample_customers_100.xlsx`) provides 100 realistic customer records ready for bulk upload testing, ensuring data quality and format compliance.

---

**Generated**: January 2, 2025
**Project Version**: Latest
**Sample Data**: 100 customers in Excel format


## 📋 Executive Summary

**Mini CRM Tool** is a comprehensive, full-stack Customer Relationship Management (CRM) system built with Node.js and Express.js. It provides businesses with a unified platform to manage customers, run marketing campaigns, track tasks, generate invoices, and streamline operations.

---

## 🏗️ Project Architecture

### Technology Stack

#### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js 5.x
- **Database**: MySQL 8.0+ with Sequelize ORM
- **Authentication**: JWT (JSON Web Tokens) with refresh tokens
- **Templating**: Handlebars.js (Express Handlebars)
- **File Upload**: Multer
- **Email**: Nodemailer
- **PDF Generation**: PDFKit, Puppeteer
- **Payment Gateway**: Razorpay
- **Job Queue**: BullMQ + Redis (for social media scheduling)

#### Frontend
- **Templating**: Handlebars.js
- **CSS Framework**: Bootstrap 5
- **Icons**: Font Awesome 6
- **JavaScript**: Vanilla ES6+
- **Image Processing**: Cropper.js (for avatar cropping)
- **Date Picker**: Flatpickr
- **Animations**: HTML5 Canvas

#### Integrations
- **WhatsApp**: Meta WhatsApp Cloud API (Graph API v20.0)
- **Email**: SMTP (Gmail/Mailtrap)
- **Payment**: Razorpay
- **Social Auth**: Google OAuth 2.0
- **Social Media**: LinkedIn, Facebook, X (Twitter), Instagram (mock adapters)

---

## 📁 Project Structure

```
mini-crm-360/
├── src/
│   ├── controllers/          # Request handlers
│   │   ├── customer.controllers.js
│   │   ├── business/
│   │   ├── campaign.controllers.js
│   │   ├── dashboard.controller.js
│   │   ├── profile.controller.js
│   │   ├── socialPublisher.controller.js
│   │   └── ...
│   ├── models/               # Sequelize ORM models
│   │   ├── User.js
│   │   ├── Customer.js
│   │   ├── Business.js
│   │   ├── Campaign.js
│   │   ├── SocialAccount.js
│   │   ├── SocialPost.js
│   │   └── ...
│   ├── routes/               # Express routes
│   │   ├── customer.routes.js
│   │   ├── business.routes.js
│   │   ├── dashboard.routes.js
│   │   ├── socialPublisher.routes.js
│   │   └── ...
│   ├── services/             # Business logic layer
│   │   ├── socialPublisher.service.js
│   │   └── ...
│   ├── middleware/           # Express middleware
│   │   ├── authMiddleware.js
│   │   └── ...
│   ├── utils/                # Utility functions
│   │   ├── asyncHandler.js
│   │   ├── ApiError.js
│   │   ├── ApiResponse.js
│   │   ├── emailService.js
│   │   └── ...
│   ├── views/                # Handlebars templates
│   │   ├── layouts/
│   │   │   └── main.hbs
│   │   ├── partials/
│   │   │   └── sidebar.hbs
│   │   ├── customers.hbs
│   │   ├── business.hbs
│   │   ├── dashboard.hbs
│   │   ├── profile.hbs
│   │   ├── social-publisher.hbs
│   │   └── ...
│   ├── db/
│   │   ├── index.js          # Database connection
│   │   └── migrations/       # Database migrations
│   ├── workers/              # Background job workers
│   │   └── socialPublisher.worker.js
│   ├── providers/            # External service adapters
│   │   └── socialProviders.js
│   └── app.js                # Express app entry point
├── public/                   # Static assets
│   ├── uploads/
│   │   ├── avatars/
│   │   └── media/
│   └── images/
├── database/                 # Database dumps
├── property.env              # Environment variables
├── package.json
└── README.md
```

---

## 🎯 Core Features & Modules

### 1. Customer Management
- **CRUD Operations**: Create, read, update, delete customers
- **Bulk Upload**: CSV/Excel file import with validation
- **Advanced Search**: Filter by name, email, phone, tags, business
- **Segmentation**: Tag-based customer categorization
- **Contact Details**: Phone (E.164 format), WhatsApp, email
- **Customer Timeline**: Activity history and notes
- **Birthday & Anniversary Tracking**: Automated reminders

**Database Schema**:
- `id` (Primary Key)
- `userId` (Foreign Key → users)
- `businessId` (Foreign Key → businesses, nullable)
- `name` (String, nullable)
- `email` (String(120), nullable, validated)
- `phoneE164` (String, required, unique per user)
- `whatsappE164` (String(20), nullable)
- `tags` (JSON array, default: [])
- `consentAt` (DateTime, nullable)
- `dateOfBirth` (Date, nullable)
- `anniversaryDate` (Date, nullable)
- `createdAt`, `updatedAt` (Timestamps)

### 2. Business Management
- **Multi-Business Support**: Users can own multiple businesses
- **Business Profiles**: Name, category, description, contact info
- **Business Settings**: Country, timezone, phone numbers
- **Business Selection**: Switch between businesses in UI

**Database Schema**:
- `id` (Primary Key)
- `ownerId` (Foreign Key → users)
- `businessName` (String, required)
- `category` (String, required)
- `description` (Text, nullable)
- `phoneNo` (String, nullable)
- `whatsappNo` (String, nullable)
- `country` (String, required)
- `timezone` (String, nullable)
- `createdAt`, `updatedAt` (Timestamps)

### 3. Marketing & Campaigns
- **WhatsApp Campaigns**: Bulk messaging via Meta WhatsApp Cloud API
- **Email Campaigns**: Email marketing with template support
- **Template Management**: Create and manage reusable templates
- **Campaign Scheduling**: Schedule campaigns for future execution
- **Campaign Analytics**: Track sent, delivered, read, failed messages

### 4. Social Publisher (New Module)
- **Multi-Platform Publishing**: LinkedIn, Facebook, X (Twitter), Instagram
- **Content Scheduling**: Schedule posts for future publication
- **Media Management**: Upload and manage media assets
- **Template Library**: Pre-built templates for festivals and events
- **Account Management**: Connect and manage social media accounts
- **Publish Attempts**: Track publication attempts and retry failures
- **Audit Logging**: Complete audit trail of all actions

**Database Tables**:
- `social_accounts`: Connected social media accounts
- `social_posts`: Post content and metadata
- `social_post_channels`: Post-to-platform mappings
- `media_assets`: Uploaded media files
- `publish_attempts`: Publication attempt logs
- `social_templates`: Reusable post templates
- `social_audit_logs`: Audit trail

### 5. Task Management (Activities)
- **Task Creation**: Create tasks with priorities and due dates
- **Task Assignment**: Assign tasks to customers or users
- **Task Status**: Track task completion status
- **Task Filtering**: Filter by status, priority, assignee

### 6. Notes & Timeline (Activity Timeline)
- **Customer Notes**: Add notes to customer profiles
- **Activity Timeline**: Complete interaction history
- **Event Logging**: Automatic logging of system events
- **Note Types**: Email sent, WhatsApp sent, task created, etc.

### 7. Lead Capture Forms
- **Custom Forms**: Create customizable lead capture forms
- **Field Types**: Text, email, phone, dropdown, checkbox, etc.
- **Public URLs**: Generate public URLs for forms
- **Form Submissions**: Track and manage form submissions
- **Anti-Spam**: Built-in spam protection
- **UTM Tracking**: Track marketing campaigns

### 8. Profile & Account Settings
- **User Profile**: Update personal information
- **Avatar Management**: Upload and manage profile pictures
- **Password Management**: Change password with strength validation
- **Session Management**: View and manage active sessions
- **Notification Preferences**: Configure notification settings
- **Activity Logs**: View user activity history
- **Billing Info**: View subscription and billing information

### 9. Subscription & Billing
- **Plans Management**: Free, Silver, Gold, Enterprise plans
- **Plan Features**: Feature limits per plan
- **Payment Integration**: Razorpay payment gateway
- **Subscription Management**: Upgrade, downgrade, cancel
- **Billing History**: View payment history

### 10. Dashboard & Analytics
- **Key Metrics**: Customer count, business count, campaign stats
- **Recent Activity**: Latest customers, campaigns, tasks
- **Quick Actions**: Quick access to common actions
- **Real-time Updates**: Live data updates

---

## 🔐 Authentication & Security

### Authentication Flow
1. **Registration**: User registers with email and password
2. **Email Activation**: Account activation via email link
3. **Login**: JWT-based authentication with access and refresh tokens
4. **Token Refresh**: Automatic token refresh mechanism
5. **Session Management**: Track active sessions

### Security Features
- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Email Verification**: Account activation required
- **Password Reset**: Secure password reset via email
- **Session Tracking**: Monitor active sessions
- **CSRF Protection**: Built-in CSRF protection
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Protection**: Sequelize ORM parameterized queries

---

## 📊 Database Schema Overview

### Core Tables
- **users**: User accounts and authentication
- **businesses**: Business profiles
- **customers**: Customer database
- **campaigns**: Marketing campaigns
- **templates**: Message templates
- **email_templates**: Email templates
- **tasks**: Task management
- **notes**: Customer notes and timeline
- **reminders**: Birthday and anniversary reminders
- **lead_forms**: Lead capture forms
- **form_submissions**: Form submission data

### Subscription Tables
- **plans**: Subscription plans
- **user_plans**: User subscription history
- **payments**: Payment transactions

### Social Publisher Tables
- **social_accounts**: Connected social media accounts
- **social_posts**: Post content
- **social_post_channels**: Post-to-platform mappings
- **media_assets**: Media files
- **publish_attempts**: Publication logs
- **social_templates**: Post templates
- **social_audit_logs**: Audit trail

### System Tables
- **user_sessions**: Active user sessions
- **activity_logs**: System activity logs
- **menu_items**: Dynamic menu configuration
- **plan_menu_items**: Plan-based menu access

---

## 🔄 API Architecture

### API Response Format
All API responses follow a consistent format:
```json
{
  "statusCode": 200,
  "data": { ... },
  "message": "Success message"
}
```

### Error Response Format
```json
{
  "statusCode": 400,
  "error": "Error type",
  "message": "Error message",
  "details": { ... }
}
```

### Authentication
- **Header**: `Authorization: Bearer <access_token>`
- **Refresh**: `/api/v1/auth/refresh-token`
- **Logout**: `/api/v1/auth/logout`

---

## 📤 Bulk Upload Feature

### Supported Format
- **File Type**: CSV or Excel (.xlsx)
- **Max Size**: 10MB
- **Required Columns**: `name`, `phoneE164`
- **Optional Columns**: `email`, `whatsappE164`, `tags`, `consentAt`

### Column Specifications

#### Required Columns
1. **name** (String)
   - Customer full name
   - Example: "Rajesh Kumar"

2. **phoneE164** (String, 10 digits)
   - Phone number (10 digits)
   - Automatically converted to E.164 format (+91XXXXXXXXXX)
   - Example: "9876543210" → "+919876543210"

#### Optional Columns
3. **email** (String, validated)
   - Email address
   - Must be valid email format
   - Example: "rajesh.kumar@gmail.com"

4. **whatsappE164** (String, 10 digits)
   - WhatsApp number (10 digits)
   - Defaults to phoneE164 if not provided
   - Example: "9876543210"

5. **tags** (String, comma-separated)
   - Customer tags for segmentation
   - Example: "vip,regular,premium"
   - Common tags: vip, regular, premium, new, trial, loyal, frequent

6. **consentAt** (String, ISO date format)
   - Consent date in YYYY-MM-DD format
   - Example: "2024-01-15"

### Validation Rules
- Phone numbers must be exactly 10 digits
- Email addresses must be valid format
- Tags are comma-separated strings
- Consent dates must be valid ISO dates
- Duplicate phone numbers (per user) are skipped

### Processing Flow
1. File upload validation
2. CSV/Excel parsing
3. Column validation
4. Data validation (phone, email format)
5. E.164 format conversion
6. Business association (auto-assign to user's business)
7. Bulk insert with duplicate handling
8. Error reporting

---

## 📄 Sample Data File

### File Details
- **Filename**: `sample_customers_100.xlsx`
- **Format**: Microsoft Excel 2007+ (.xlsx)
- **Records**: 100 customers
- **Size**: ~9.6 KB

### Data Characteristics
- **Names**: Indian names (first + last)
- **Phone Numbers**: Valid 10-digit Indian mobile numbers
- **Emails**: Realistic email addresses with various domains
- **WhatsApp Numbers**: Mostly same as phone, some different
- **Tags**: Mix of vip, regular, premium, new, trial, loyal, frequent
- **Consent Dates**: Dates within the last 6 months

### Sample Data Preview
| name | phoneE164 | email | whatsappE164 | tags | consentAt |
|------|------------|-------|--------------|------|-----------|
| Raj Sharma | 9876543210 | raj.sharma@gmail.com | 9876543210 | vip,regular | 2024-10-15 |
| Priya Patel | 8765432109 | priya.patel@yahoo.com | 8765432109 | premium | 2024-11-20 |

### Usage Instructions
1. Open the Excel file (`sample_customers_100.xlsx`)
2. Review the data format
3. Navigate to Customers page in CRM
4. Click "Bulk Upload" button
5. Select the Excel file
6. Upload and wait for processing
7. Review success/error summary

### Data Generation Script
The file was generated using `generate_customer_sample.py`:
- Python script using pandas and openpyxl
- Generates realistic Indian customer data
- Ensures unique phone numbers
- Randomizes email domains and tags
- Generates consent dates within last 6 months

---

## 🚀 Deployment Considerations

### Environment Variables
- Database configuration (development/production)
- JWT secrets
- SMTP configuration
- Payment gateway credentials
- Social media API keys
- Redis configuration (for BullMQ)

### Database Migrations
- Run migrations before deployment
- Ensure all tables are created
- Seed initial data (plans, menu items, templates)

### File Storage
- Configure upload directories
- Set up media storage (local or cloud)
- Configure static file serving

### Background Workers
- Start BullMQ worker for scheduled jobs
- Configure Redis connection
- Monitor worker health

---

## 📈 Performance Considerations

### Database Optimization
- Indexes on frequently queried columns
- Foreign key constraints for data integrity
- Connection pooling
- Query optimization

### Caching Strategy
- Redis for session storage
- Cache frequently accessed data
- Cache menu items and plans

### File Upload Optimization
- File size limits
- File type validation
- Async processing for large files

---

## 🔍 Testing Recommendations

### Unit Tests
- Model validations
- Utility functions
- Service layer logic

### Integration Tests
- API endpoints
- Authentication flow
- File upload processing
- Bulk import functionality

### E2E Tests
- User registration and login
- Customer CRUD operations
- Campaign creation and execution
- Bulk upload workflow

### Test Data
- Use `sample_customers_100.xlsx` for bulk upload testing
- Create test users with different roles
- Test with various business configurations

---

## 📝 Future Enhancements

### Potential Features
- Mobile app (React Native)
- Advanced analytics dashboard
- AI-powered customer insights
- Automated email sequences
- SMS integration
- Advanced reporting
- Multi-language support
- White-label customization

---

## 📞 Support & Documentation

### Documentation Files
- `README.md`: Installation and setup guide
- `PROJECT_ANALYSIS.md`: This file (deep project analysis)
- `SOCIAL_PUBLISHER_COMPLETE.md`: Social Publisher module documentation

### Code Comments
- Controllers have detailed comments
- Services include function documentation
- Models have field descriptions

---

## ✅ Conclusion

Mini CRM Tool is a robust, feature-rich CRM system with:
- ✅ Comprehensive customer management
- ✅ Multi-channel marketing capabilities
- ✅ Task and activity tracking
- ✅ Subscription and billing management
- ✅ Social media publishing (new)
- ✅ Bulk data import functionality
- ✅ Secure authentication and authorization
- ✅ Scalable architecture

The sample data file (`sample_customers_100.xlsx`) provides 100 realistic customer records ready for bulk upload testing, ensuring data quality and format compliance.

---

**Generated**: January 2, 2025
**Project Version**: Latest
**Sample Data**: 100 customers in Excel format

